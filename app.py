import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import os
import sys
import webbrowser
import threading
import time
import sqlite3
import json
import hashlib
import re
import subprocess
import platform

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_plan.router import router as ai_plan_router
from ai_plan.model import init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "trip.db")
ADMIN_PATH = "/__admin"
ADMIN_ACCESS_KEY = os.environ.get("APP_ADMIN_KEY") or hashlib.sha256(DB_PATH.encode("utf-8")).hexdigest()[:18]
TABLE_NAME_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

class AdminRowPayload(BaseModel):
    data: dict
    pk: str = "id"

def _check_admin_access(key: str):
    if key != ADMIN_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="无权限访问管理员页面")

def _open_admin_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _list_tables(cursor):
    rows = cursor.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    return [row["name"] for row in rows]

def _ensure_table_name(table_name: str, known_tables):
    if not TABLE_NAME_PATTERN.match(table_name):
        raise HTTPException(status_code=400, detail="非法表名")
    if table_name not in known_tables:
        raise HTTPException(status_code=404, detail="数据表不存在")

def _table_columns(cursor, table_name: str):
    info_rows = cursor.execute(f'PRAGMA table_info("{table_name}")').fetchall()
    return [
        {
            "cid": row["cid"],
            "name": row["name"],
            "type": row["type"],
            "notnull": bool(row["notnull"]),
            "dflt_value": row["dflt_value"],
            "pk": bool(row["pk"])
        }
        for row in info_rows
    ]

def _normalize_sql_value(value):
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return int(value)
    return value

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    admin_url = f"http://127.0.0.1:8000{ADMIN_PATH}?k={ADMIN_ACCESS_KEY}"
    print("\n管理员页面地址：")
    print(admin_url)
    print("")
    yield

app = FastAPI(
    title="云途智游 API",
    description="智能旅行规划后端服务",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_plan_router, prefix="/api", tags=["AI行程规划"])

app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")

@app.get("/")
async def root():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/trip")
async def trip_page():
    return FileResponse(os.path.join(BASE_DIR, "trip.html"))

@app.get("/map")
async def map_page():
    return FileResponse(os.path.join(BASE_DIR, "map.html"))

@app.get("/community")
async def community_page():
    return FileResponse(os.path.join(BASE_DIR, "community.html"))

@app.get("/settings")
async def settings_page():
    return FileResponse(os.path.join(BASE_DIR, "settings.html"))

@app.get("/publish-manage")
async def publish_manage_page():
    return FileResponse(os.path.join(BASE_DIR, "publish_manage.html"))

@app.get(ADMIN_PATH, include_in_schema=False)
async def admin_page(k: str = Query(default="")):
    _check_admin_access(k)
    return FileResponse(os.path.join(BASE_DIR, "admin.html"))

@app.get("/api/admin/meta", include_in_schema=False)
async def admin_meta(k: str = Query(default="")):
    _check_admin_access(k)
    conn = _open_admin_conn()
    cursor = conn.cursor()
    tables = _list_tables(cursor)
    result = []
    for table_name in tables:
        columns = _table_columns(cursor, table_name)
        pk_column = next((col["name"] for col in columns if col["pk"]), "id")
        count = cursor.execute(f'SELECT COUNT(1) AS total FROM "{table_name}"').fetchone()["total"]
        result.append({
            "table_name": table_name,
            "count": count,
            "columns": columns,
            "pk_column": pk_column
        })
    conn.close()
    return {"tables": result}

@app.get("/api/admin/table/{table_name}", include_in_schema=False)
async def admin_table_rows(
    table_name: str,
    k: str = Query(default=""),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):
    _check_admin_access(k)
    conn = _open_admin_conn()
    cursor = conn.cursor()
    tables = _list_tables(cursor)
    _ensure_table_name(table_name, tables)
    columns = _table_columns(cursor, table_name)
    column_names = [col["name"] for col in columns]
    pk_column = next((col["name"] for col in columns if col["pk"]), "id")
    order_sql = f'ORDER BY "{pk_column}" DESC' if pk_column in column_names else ""
    rows = cursor.execute(
        f'SELECT * FROM "{table_name}" {order_sql} LIMIT ? OFFSET ?',
        (limit, offset)
    ).fetchall()
    total = cursor.execute(f'SELECT COUNT(1) AS total FROM "{table_name}"').fetchone()["total"]
    conn.close()
    return {
        "table_name": table_name,
        "columns": columns,
        "pk_column": pk_column,
        "rows": [dict(row) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.post("/api/admin/table/{table_name}", include_in_schema=False)
async def admin_insert_row(table_name: str, payload: AdminRowPayload, k: str = Query(default="")):
    _check_admin_access(k)
    conn = _open_admin_conn()
    cursor = conn.cursor()
    tables = _list_tables(cursor)
    _ensure_table_name(table_name, tables)
    columns = _table_columns(cursor, table_name)
    column_names = [col["name"] for col in columns]
    pk_column = next((col["name"] for col in columns if col["pk"]), "id")
    editable_fields = [name for name in payload.data.keys() if name in column_names and name != pk_column]
    if not editable_fields:
        conn.close()
        raise HTTPException(status_code=400, detail="没有可插入字段")
    values = [_normalize_sql_value(payload.data[name]) for name in editable_fields]
    placeholders = ", ".join(["?"] * len(editable_fields))
    field_sql = ", ".join([f'"{name}"' for name in editable_fields])
    cursor.execute(f'INSERT INTO "{table_name}" ({field_sql}) VALUES ({placeholders})', values)
    row_id = cursor.lastrowid
    conn.commit()
    row = cursor.execute(f'SELECT * FROM "{table_name}" WHERE "{pk_column}" = ?', (row_id,)).fetchone()
    conn.close()
    return {"status": "success", "row": dict(row) if row else None}

@app.patch("/api/admin/table/{table_name}/{row_id}", include_in_schema=False)
async def admin_update_row(table_name: str, row_id: str, payload: AdminRowPayload, k: str = Query(default="")):
    _check_admin_access(k)
    conn = _open_admin_conn()
    cursor = conn.cursor()
    tables = _list_tables(cursor)
    _ensure_table_name(table_name, tables)
    columns = _table_columns(cursor, table_name)
    column_names = [col["name"] for col in columns]
    pk_column = payload.pk if payload.pk in column_names else "id"
    editable_fields = [name for name in payload.data.keys() if name in column_names and name != pk_column]
    if not editable_fields:
        conn.close()
        raise HTTPException(status_code=400, detail="没有可更新字段")
    sets = ", ".join([f'"{name}" = ?' for name in editable_fields])
    values = [_normalize_sql_value(payload.data[name]) for name in editable_fields]
    values.append(row_id)
    cursor.execute(f'UPDATE "{table_name}" SET {sets} WHERE "{pk_column}" = ?', values)
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="目标记录不存在")
    row = cursor.execute(f'SELECT * FROM "{table_name}" WHERE "{pk_column}" = ?', (row_id,)).fetchone()
    conn.close()
    return {"status": "success", "row": dict(row) if row else None}

@app.delete("/api/admin/table/{table_name}/{row_id}", include_in_schema=False)
async def admin_delete_row(
    table_name: str,
    row_id: str,
    k: str = Query(default=""),
    pk: str = Query(default="id")
):
    _check_admin_access(k)
    conn = _open_admin_conn()
    cursor = conn.cursor()
    tables = _list_tables(cursor)
    _ensure_table_name(table_name, tables)
    columns = _table_columns(cursor, table_name)
    column_names = [col["name"] for col in columns]
    pk_column = pk if pk in column_names else "id"
    cursor.execute(f'DELETE FROM "{table_name}" WHERE "{pk_column}" = ?', (row_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="目标记录不存在")
    return {"status": "success"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def open_browser():
    time.sleep(2)
    webbrowser.open("http://localhost:8000")

def kill_process_on_port(port: int):
    """
    自动检测并杀掉占用指定端口的进程
    """
    try:
        system_name = platform.system()
        if system_name == "Windows":
            # Windows 平台下查找并结束占用端口的进程
            command = f'netstat -ano | findstr :{port}'
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            if result.stdout:
                # 解析 netstat 输出以获取 PID
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5 and 'LISTENING' in parts:
                        pid = parts[-1]
                        print(f"检测到端口 {port} 被 PID 为 {pid} 的进程占用，正在尝试终止该进程...")
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
                        print(f"成功终止占用端口 {port} 的进程。")
                        time.sleep(1) # 等待资源释放
                        return
        else:
            # Linux/Mac 平台下使用 lsof 查找并结束进程
            command = f'lsof -i:{port} -t'
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            if result.stdout:
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    print(f"检测到端口 {port} 被 PID 为 {pid} 的进程占用，正在尝试终止该进程...")
                    subprocess.run(f'kill -9 {pid}', shell=True, capture_output=True)
                print(f"成功终止占用端口 {port} 的进程。")
                time.sleep(1)
    except Exception as e:
        print(f"尝试清理占用端口 {port} 的进程时发生错误: {e}")

if __name__ == "__main__":
    PORT = 8000
    kill_process_on_port(PORT)
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=False)
