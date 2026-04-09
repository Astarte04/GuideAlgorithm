import sqlite3
import json
import os
import uuid
import random
import hashlib
import base64
import binascii
import re
from typing import Optional, List
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'trip.db')
IMAGE_DATA_URL_PATTERN = re.compile(r'^data:(image\/[a-zA-Z0-9.+-]+);base64,', re.IGNORECASE)
MAX_AVATAR_BYTES = 2 * 1024 * 1024
MAX_POST_IMAGE_BYTES = 4 * 1024 * 1024

class Transport(BaseModel):
    start: str
    end: str
    mode: str
    start_time: str
    end_time: str
    cost: float
    distance: float
    price: float
    tickets: Optional[int] = None
    cars: Optional[int] = None

class Activity(BaseModel):
    type: str
    position: Optional[str] = None
    start_time: str
    end_time: str
    price: float = 0.0
    cost: float = 0.0
    tickets: Optional[int] = None
    transports: List[Transport] = []
    start: Optional[str] = None
    end: Optional[str] = None
    FlightID: Optional[str] = None
    room_type: Optional[int] = None
    rooms: Optional[int] = None

class DayItinerary(BaseModel):
    day: int
    activities: List[Activity]

class ItineraryResponse(BaseModel):
    people_number: int
    start_city: str
    target_city: str
    itinerary: List[DayItinerary]
    elapsed_time_sec: Optional[float] = None

class TravelPlanRequest(BaseModel):
    start_city: Optional[str] = None
    target_city: Optional[str] = None
    days: Optional[int] = None
    people: Optional[int] = None
    budget: Optional[float] = None
    mode: Optional[str] = None
    preferences: Optional[List[str]] = None
    natural_query: Optional[str] = None

class TravelPlanRecord(BaseModel):
    id: int
    start_city: str
    target_city: str
    days: int
    people: int
    budget: Optional[float] = None
    mode: Optional[str] = None
    preferences: Optional[str] = None
    itinerary: Optional[str] = None
    created_at: str
    plan_generated: bool = False

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS travel_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_city TEXT NOT NULL,
            target_city TEXT NOT NULL,
            days INTEGER NOT NULL,
            people INTEGER NOT NULL,
            budget REAL,
            mode TEXT,
            preferences TEXT,
            itinerary TEXT,
            plan_generated INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_completion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            day_number INTEGER NOT NULL,
            activity_index INTEGER NOT NULL,
            activity_id TEXT,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY (plan_id) REFERENCES travel_plans(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_code TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nickname TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_code TEXT NOT NULL,
            trip_id INTEGER,
            trip_title TEXT NOT NULL,
            completed_nodes TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_code) REFERENCES users(user_code)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_post_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (post_id) REFERENCES community_posts(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_post_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, user_code),
            FOREIGN KEY (post_id) REFERENCES community_posts(id),
            FOREIGN KEY (user_code) REFERENCES users(user_code)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_post_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_code TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES community_posts(id),
            FOREIGN KEY (user_code) REFERENCES users(user_code)
        )
    ''')

    plan_columns = {row["name"] for row in cursor.execute("PRAGMA table_info(travel_plans)").fetchall()}
    if "updated_at" not in plan_columns:
        cursor.execute("ALTER TABLE travel_plans ADD COLUMN updated_at TIMESTAMP")
        cursor.execute("UPDATE travel_plans SET updated_at = created_at WHERE updated_at IS NULL")
    if "edited" not in plan_columns:
        cursor.execute("ALTER TABLE travel_plans ADD COLUMN edited INTEGER DEFAULT 0")

    completion_columns = {row["name"] for row in cursor.execute("PRAGMA table_info(activity_completion)").fetchall()}
    if "activity_id" not in completion_columns:
        cursor.execute("ALTER TABLE activity_completion ADD COLUMN activity_id TEXT")
    if "user_code" not in completion_columns:
        cursor.execute("ALTER TABLE activity_completion ADD COLUMN user_code TEXT")

    user_columns = {row["name"] for row in cursor.execute("PRAGMA table_info(users)").fetchall()}
    if "avatar_url" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
    if "updated_at" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP")
        cursor.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")

    cursor.execute("DROP INDEX IF EXISTS idx_activity_completion_plan_activity")
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_completion_plan_user_activity
        ON activity_completion(plan_id, user_code, activity_id)
        WHERE activity_id IS NOT NULL
    ''')
    
    conn.commit()
    conn.close()

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def _normalize_data_image_url(value: Optional[str], max_bytes: int, field_name: str) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    match = IMAGE_DATA_URL_PATTERN.match(text)
    if not match:
        raise ValueError(f"{field_name}格式不正确，请重新上传")
    comma_idx = text.find(',')
    if comma_idx < 0:
        raise ValueError(f"{field_name}格式不正确，请重新上传")
    mime_type = match.group(1).lower()
    payload = text[comma_idx + 1:]
    try:
        binary = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError(f"{field_name}内容损坏，请重新上传")
    if not binary:
        raise ValueError(f"{field_name}不能为空")
    if len(binary) > max_bytes:
        raise ValueError(f"{field_name}体积过大，请压缩后再上传")
    normalized_mime = "image/jpeg" if mime_type == "image/jpg" else mime_type
    normalized_payload = base64.b64encode(binary).decode("ascii")
    return f"data:{normalized_mime};base64,{normalized_payload}"

def _generate_user_code(cursor) -> str:
    for _ in range(20):
        user_code = f"{random.randint(0, 999999):06d}"
        exists = cursor.execute(
            "SELECT 1 FROM users WHERE user_code = ?",
            (user_code,)
        ).fetchone()
        if not exists:
            return user_code
    raise ValueError("用户ID生成失败，请重试")

def create_user(username: str, password: str) -> dict:
    username = (username or "").strip()
    password = (password or "").strip()
    if not username:
        raise ValueError("用户名不能为空")
    if len(password) < 6:
        raise ValueError("密码长度至少6位")

    conn = get_db_connection()
    cursor = conn.cursor()
    exists = cursor.execute(
        "SELECT id FROM users WHERE username = ?",
        (username,)
    ).fetchone()
    if exists:
        conn.close()
        raise ValueError("用户名已存在")

    user_code = _generate_user_code(cursor)
    password_hash = _hash_password(password)
    cursor.execute('''
        INSERT INTO users (user_code, username, password_hash, nickname)
        VALUES (?, ?, ?, ?)
    ''', (user_code, username, password_hash, username))
    user_id = cursor.lastrowid
    conn.commit()
    row = cursor.execute(
        "SELECT id, user_code, username, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()
    return dict(row)

def login_user(username: str, password: str) -> dict:
    username = (username or "").strip()
    password = (password or "").strip()
    if not username or not password:
        raise ValueError("用户名和密码不能为空")

    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT id, user_code, username, nickname, avatar_url, created_at, updated_at, password_hash FROM users WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()
    if not row:
        raise ValueError("用户名或密码错误")
    row_data = dict(row)
    if row_data.get("password_hash") != _hash_password(password):
        raise ValueError("用户名或密码错误")
    row_data.pop("password_hash", None)
    return row_data

def get_user_by_code(user_code: str) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT id, user_code, username, nickname, avatar_url, created_at, updated_at FROM users WHERE user_code = ?",
        (user_code,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def update_user_profile(user_code: str, nickname: str, avatar_url: Optional[str] = None) -> dict:
    nickname = (nickname or "").strip()
    if not nickname:
        raise ValueError("昵称不能为空")
    normalized_avatar_url = _normalize_data_image_url(avatar_url, MAX_AVATAR_BYTES, "头像")

    conn = get_db_connection()
    cursor = conn.cursor()
    exists = cursor.execute(
        "SELECT id FROM users WHERE user_code = ?",
        (user_code,)
    ).fetchone()
    if not exists:
        conn.close()
        raise ValueError("用户不存在")

    cursor.execute('''
        UPDATE users
        SET nickname = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_code = ?
    ''', (nickname, normalized_avatar_url, user_code))
    conn.commit()
    row = cursor.execute(
        "SELECT id, user_code, username, nickname, avatar_url, created_at, updated_at FROM users WHERE user_code = ?",
        (user_code,)
    ).fetchone()
    conn.close()
    return dict(row)

def _get_user_brief(cursor, user_code: str) -> Optional[dict]:
    row = cursor.execute(
        "SELECT user_code, username, nickname, avatar_url FROM users WHERE user_code = ?",
        (user_code,)
    ).fetchone()
    return dict(row) if row else None

def create_community_post(
    user_code: str,
    trip_id: Optional[int],
    trip_title: str,
    completed_nodes: Optional[List[str]] = None,
    content: Optional[str] = None,
    images: Optional[List[str]] = None
) -> dict:
    user_code = (user_code or "").strip()
    trip_title = (trip_title or "").strip()
    content = (content or "").strip()
    completed_nodes = completed_nodes or []
    images = images or []

    if not user_code:
        raise ValueError("请先登录后再发布")
    if not trip_title:
        raise ValueError("请选择行程卡")
    if len(images) > 9:
        raise ValueError("最多上传9张图片")
    normalized_images = []
    for image_url in images:
        normalized_image = _normalize_data_image_url(image_url, MAX_POST_IMAGE_BYTES, "分享图片")
        if normalized_image:
            normalized_images.append(normalized_image)

    conn = get_db_connection()
    cursor = conn.cursor()

    user = _get_user_brief(cursor, user_code)
    if not user:
        conn.close()
        raise ValueError("用户不存在")

    cursor.execute('''
        INSERT INTO community_posts (user_code, trip_id, trip_title, completed_nodes, content)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        user_code,
        trip_id,
        trip_title,
        json.dumps(completed_nodes, ensure_ascii=False),
        content
    ))
    post_id = cursor.lastrowid

    for idx, image_url in enumerate(normalized_images):
        cursor.execute('''
            INSERT INTO community_post_images (post_id, image_url, sort_order)
            VALUES (?, ?, ?)
        ''', (post_id, image_url, idx))

    conn.commit()
    conn.close()
    return get_community_post_detail(post_id, user_code)

def _query_post_images(cursor, post_id: int) -> List[str]:
    rows = cursor.execute(
        "SELECT image_url FROM community_post_images WHERE post_id = ? ORDER BY sort_order ASC, id ASC",
        (post_id,)
    ).fetchall()
    return [row["image_url"] for row in rows]

def _query_post_comments(cursor, post_id: int) -> List[dict]:
    rows = cursor.execute('''
        SELECT c.id, c.content, c.created_at, u.user_code, u.username, u.nickname, u.avatar_url
        FROM community_post_comments c
        JOIN users u ON c.user_code = u.user_code
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC, c.id ASC
    ''', (post_id,)).fetchall()
    return [
        {
            "id": row["id"],
            "content": row["content"],
            "created_at": row["created_at"],
            "user": {
                "user_code": row["user_code"],
                "username": row["username"],
                "nickname": row["nickname"],
                "avatar_url": row["avatar_url"]
            }
        }
        for row in rows
    ]

def _build_post_payload(cursor, row: sqlite3.Row, current_user_code: Optional[str] = None) -> dict:
    post_id = row["post_id"] if "post_id" in row.keys() else row["id"]
    completed_nodes = []
    try:
        completed_nodes = json.loads(row["completed_nodes"]) if row["completed_nodes"] else []
    except Exception:
        completed_nodes = []

    liked = False
    if current_user_code:
        liked_row = cursor.execute(
            "SELECT 1 FROM community_post_likes WHERE post_id = ? AND user_code = ?",
            (post_id, current_user_code)
        ).fetchone()
        liked = bool(liked_row)

    like_count_row = cursor.execute(
        "SELECT COUNT(1) AS cnt FROM community_post_likes WHERE post_id = ?",
        (post_id,)
    ).fetchone()
    comment_count_row = cursor.execute(
        "SELECT COUNT(1) AS cnt FROM community_post_comments WHERE post_id = ?",
        (post_id,)
    ).fetchone()

    return {
        "id": post_id,
        "trip_id": row["trip_id"],
        "trip_title": row["trip_title"],
        "completed_nodes": completed_nodes,
        "content": row["content"] or "",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "user": {
            "user_code": row["user_code"],
            "username": row["username"],
            "nickname": row["nickname"],
            "avatar_url": row["avatar_url"]
        },
        "images": _query_post_images(cursor, post_id),
        "like_count": int(like_count_row["cnt"]) if like_count_row else 0,
        "comment_count": int(comment_count_row["cnt"]) if comment_count_row else 0,
        "liked_by_current_user": liked,
        "comments": _query_post_comments(cursor, post_id)
    }

def get_community_post_detail(post_id: int, current_user_code: Optional[str] = None) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute('''
        SELECT p.id AS post_id, p.user_code, p.trip_id, p.trip_title, p.completed_nodes, p.content, p.created_at, p.updated_at,
               u.username, u.nickname, u.avatar_url
        FROM community_posts p
        JOIN users u ON p.user_code = u.user_code
        WHERE p.id = ?
    ''', (post_id,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("动态不存在")
    payload = _build_post_payload(cursor, row, current_user_code)
    conn.close()
    return payload

def list_community_posts(current_user_code: Optional[str] = None) -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute('''
        SELECT p.id AS post_id, p.user_code, p.trip_id, p.trip_title, p.completed_nodes, p.content, p.created_at, p.updated_at,
               u.username, u.nickname, u.avatar_url
        FROM community_posts p
        JOIN users u ON p.user_code = u.user_code
        ORDER BY p.created_at DESC, p.id DESC
    ''').fetchall()
    posts = [_build_post_payload(cursor, row, current_user_code) for row in rows]
    conn.close()
    return posts

def list_user_community_posts(user_code: str) -> List[dict]:
    user_code = (user_code or "").strip()
    if not user_code:
        raise ValueError("请先登录")

    conn = get_db_connection()
    cursor = conn.cursor()
    user = _get_user_brief(cursor, user_code)
    if not user:
        conn.close()
        raise ValueError("用户不存在")

    rows = cursor.execute('''
        SELECT p.id AS post_id, p.user_code, p.trip_id, p.trip_title, p.completed_nodes, p.content, p.created_at, p.updated_at,
               u.username, u.nickname, u.avatar_url
        FROM community_posts p
        JOIN users u ON p.user_code = u.user_code
        WHERE p.user_code = ?
        ORDER BY p.created_at DESC, p.id DESC
    ''', (user_code,)).fetchall()
    posts = [_build_post_payload(cursor, row, user_code) for row in rows]
    conn.close()
    return posts

def delete_community_post(post_id: int, user_code: str) -> None:
    user_code = (user_code or "").strip()
    if not user_code:
        raise ValueError("请先登录后再删除")

    conn = get_db_connection()
    cursor = conn.cursor()
    user = _get_user_brief(cursor, user_code)
    if not user:
        conn.close()
        raise ValueError("用户不存在")

    post_row = cursor.execute(
        "SELECT id, user_code FROM community_posts WHERE id = ?",
        (post_id,)
    ).fetchone()
    if not post_row:
        conn.close()
        raise ValueError("动态不存在")
    if post_row["user_code"] != user_code:
        conn.close()
        raise ValueError("只能删除自己发布的动态")

    cursor.execute("DELETE FROM community_post_images WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM community_post_comments WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM community_post_likes WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM community_posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()

def toggle_community_post_like(post_id: int, user_code: str) -> dict:
    user_code = (user_code or "").strip()
    if not user_code:
        raise ValueError("请先登录后再点赞")

    conn = get_db_connection()
    cursor = conn.cursor()

    user = _get_user_brief(cursor, user_code)
    if not user:
        conn.close()
        raise ValueError("用户不存在")

    post_exists = cursor.execute(
        "SELECT id FROM community_posts WHERE id = ?",
        (post_id,)
    ).fetchone()
    if not post_exists:
        conn.close()
        raise ValueError("动态不存在")

    liked_row = cursor.execute(
        "SELECT id FROM community_post_likes WHERE post_id = ? AND user_code = ?",
        (post_id, user_code)
    ).fetchone()
    liked = False
    if liked_row:
        cursor.execute(
            "DELETE FROM community_post_likes WHERE id = ?",
            (liked_row["id"],)
        )
    else:
        cursor.execute(
            "INSERT INTO community_post_likes (post_id, user_code) VALUES (?, ?)",
            (post_id, user_code)
        )
        liked = True

    conn.commit()
    count_row = cursor.execute(
        "SELECT COUNT(1) AS cnt FROM community_post_likes WHERE post_id = ?",
        (post_id,)
    ).fetchone()
    conn.close()
    return {
        "liked": liked,
        "like_count": int(count_row["cnt"]) if count_row else 0
    }

def add_community_post_comment(post_id: int, user_code: str, content: str) -> dict:
    user_code = (user_code or "").strip()
    content = (content or "").strip()
    if not user_code:
        raise ValueError("请先登录后再评论")
    if not content:
        raise ValueError("评论内容不能为空")

    conn = get_db_connection()
    cursor = conn.cursor()
    user = _get_user_brief(cursor, user_code)
    if not user:
        conn.close()
        raise ValueError("用户不存在")
    post_exists = cursor.execute(
        "SELECT id FROM community_posts WHERE id = ?",
        (post_id,)
    ).fetchone()
    if not post_exists:
        conn.close()
        raise ValueError("动态不存在")

    cursor.execute(
        "INSERT INTO community_post_comments (post_id, user_code, content) VALUES (?, ?, ?)",
        (post_id, user_code, content)
    )
    comment_id = cursor.lastrowid
    conn.commit()

    row = cursor.execute('''
        SELECT c.id, c.content, c.created_at, u.user_code, u.username, u.nickname, u.avatar_url
        FROM community_post_comments c
        JOIN users u ON c.user_code = u.user_code
        WHERE c.id = ?
    ''', (comment_id,)).fetchone()
    count_row = cursor.execute(
        "SELECT COUNT(1) AS cnt FROM community_post_comments WHERE post_id = ?",
        (post_id,)
    ).fetchone()
    conn.close()

    return {
        "comment": {
            "id": row["id"],
            "content": row["content"],
            "created_at": row["created_at"],
            "user": {
                "user_code": row["user_code"],
                "username": row["username"],
                "nickname": row["nickname"],
                "avatar_url": row["avatar_url"]
            }
        },
        "comment_count": int(count_row["cnt"]) if count_row else 0
    }

def save_travel_plan(
    start_city: str,
    target_city: str,
    days: int,
    people: int,
    budget: Optional[float] = None,
    mode: Optional[str] = None,
    preferences: Optional[str] = None,
    itinerary: Optional[str] = None,
    plan_generated: bool = False
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO travel_plans 
        (start_city, target_city, days, people, budget, mode, preferences, itinerary, plan_generated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (start_city, target_city, days, people, budget, mode, preferences, itinerary, int(plan_generated)))
    
    plan_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return plan_id

def update_travel_plan_itinerary(
    plan_id: int,
    itinerary: str,
    plan_generated: bool = True,
    edited: bool = False
):
    conn = get_db_connection()
    cursor = conn.cursor()

    if edited:
        cursor.execute('''
            UPDATE travel_plans
            SET itinerary = ?, plan_generated = ?, edited = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (itinerary, int(plan_generated), plan_id))
    else:
        cursor.execute('''
            UPDATE travel_plans
            SET itinerary = ?, plan_generated = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (itinerary, int(plan_generated), plan_id))
    
    conn.commit()
    conn.close()

def get_travel_plan(plan_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM travel_plans WHERE id = ?', (plan_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def get_all_travel_plans() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM travel_plans ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def delete_travel_plan(plan_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM activity_completion WHERE plan_id = ?', (plan_id,))
    cursor.execute('DELETE FROM travel_plans WHERE id = ?', (plan_id,))
    
    conn.commit()
    conn.close()

def _ensure_activity_ids(itinerary_data: dict) -> bool:
    changed = False
    for day in itinerary_data.get("itinerary", []):
        activities = day.get("activities", [])
        for activity in activities:
            if not activity.get("activity_id"):
                activity["activity_id"] = uuid.uuid4().hex
                changed = True
    return changed

def get_plan_itinerary(plan_id: int) -> Optional[dict]:
    plan = get_travel_plan(plan_id)
    if not plan or not plan.get("itinerary"):
        return None

    itinerary_data = json.loads(plan["itinerary"])
    changed = _ensure_activity_ids(itinerary_data)
    if changed:
        update_travel_plan_itinerary(
            plan_id=plan_id,
            itinerary=json.dumps(itinerary_data, ensure_ascii=False),
            plan_generated=bool(plan.get("plan_generated", 1)),
            edited=bool(plan.get("edited", 0))
        )
    return itinerary_data

def _save_itinerary(plan_id: int, itinerary_data: dict, edited: bool = True):
    update_travel_plan_itinerary(
        plan_id=plan_id,
        itinerary=json.dumps(itinerary_data, ensure_ascii=False),
        plan_generated=True,
        edited=edited
    )

def _get_day_activities(itinerary_data: dict, day_number: int) -> Optional[list]:
    for day in itinerary_data.get("itinerary", []):
        if int(day.get("day", 0)) == int(day_number):
            return day.get("activities", [])
    return None

def _find_activity_position(itinerary_data: dict, activity_id: str):
    for day_idx, day in enumerate(itinerary_data.get("itinerary", [])):
        for act_idx, activity in enumerate(day.get("activities", [])):
            if activity.get("activity_id") == activity_id:
                return day_idx, act_idx
    return None, None

def add_activity_to_plan(plan_id: int, day_number: int, activity: dict, after_activity_id: Optional[str] = None) -> dict:
    itinerary_data = get_plan_itinerary(plan_id)
    if not itinerary_data:
        raise ValueError("旅行计划行程不存在")

    activities = _get_day_activities(itinerary_data, day_number)
    if activities is None:
        raise ValueError("指定的天数不存在")

    new_activity = dict(activity)
    if not new_activity.get("activity_id"):
        new_activity["activity_id"] = uuid.uuid4().hex

    if after_activity_id:
        insert_idx = next(
            (idx for idx, item in enumerate(activities) if item.get("activity_id") == after_activity_id),
            None
        )
        if insert_idx is not None:
            activities.insert(insert_idx + 1, new_activity)
        else:
            activities.append(new_activity)
    else:
        activities.append(new_activity)

    _save_itinerary(plan_id, itinerary_data, edited=True)
    return itinerary_data

def update_activity_in_plan(plan_id: int, activity_id: str, updates: dict) -> dict:
    itinerary_data = get_plan_itinerary(plan_id)
    if not itinerary_data:
        raise ValueError("旅行计划行程不存在")

    day_idx, act_idx = _find_activity_position(itinerary_data, activity_id)
    if day_idx is None or act_idx is None:
        raise ValueError("活动不存在")

    activity = itinerary_data["itinerary"][day_idx]["activities"][act_idx]
    for key, value in updates.items():
        if key == "activity_id":
            continue
        activity[key] = value
    activity["activity_id"] = activity_id

    _save_itinerary(plan_id, itinerary_data, edited=True)
    return itinerary_data

def delete_activity_from_plan(plan_id: int, activity_id: str) -> dict:
    itinerary_data = get_plan_itinerary(plan_id)
    if not itinerary_data:
        raise ValueError("旅行计划行程不存在")

    day_idx, act_idx = _find_activity_position(itinerary_data, activity_id)
    if day_idx is None or act_idx is None:
        raise ValueError("活动不存在")

    day_number = int(itinerary_data["itinerary"][day_idx]["day"])
    del itinerary_data["itinerary"][day_idx]["activities"][act_idx]
    _save_itinerary(plan_id, itinerary_data, edited=True)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM activity_completion WHERE plan_id = ? AND activity_id = ?",
        (plan_id, activity_id)
    )
    cursor.execute(
        "DELETE FROM activity_completion WHERE plan_id = ? AND day_number = ? AND activity_index = ?",
        (plan_id, day_number, act_idx)
    )
    conn.commit()
    conn.close()

    return itinerary_data

def add_day_to_plan(plan_id: int, count: int = 1) -> dict:
    if count < 1:
        raise ValueError("新增天数必须大于0")

    plan = get_travel_plan(plan_id)
    if not plan:
        raise ValueError("旅行计划不存在")

    itinerary_data = get_plan_itinerary(plan_id)
    if not itinerary_data:
        raise ValueError("旅行计划行程不存在")

    itinerary_days = itinerary_data.setdefault("itinerary", [])
    current_max_day = max((int(day.get("day", 0)) for day in itinerary_days), default=0)
    for idx in range(count):
        itinerary_days.append({
            "day": current_max_day + idx + 1,
            "activities": []
        })

    new_total_days = len(itinerary_days)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE travel_plans
        SET itinerary = ?, days = ?, plan_generated = 1, edited = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (json.dumps(itinerary_data, ensure_ascii=False), new_total_days, plan_id))
    conn.commit()
    conn.close()

    return itinerary_data

def delete_day_from_plan(plan_id: int, day_number: int) -> dict:
    if day_number < 1:
        raise ValueError("天数必须大于0")

    itinerary_data = get_plan_itinerary(plan_id)
    if not itinerary_data:
        raise ValueError("旅行计划行程不存在")

    itinerary_days = itinerary_data.get("itinerary", [])
    target_idx = next(
        (idx for idx, day in enumerate(itinerary_days) if int(day.get("day", 0)) == int(day_number)),
        None
    )
    if target_idx is None:
        raise ValueError("指定的天数不存在")
    if len(itinerary_days) <= 1:
        raise ValueError("至少保留一天行程")

    removed_day = itinerary_days.pop(target_idx)
    removed_activity_ids = [
        item.get("activity_id")
        for item in removed_day.get("activities", [])
        if item.get("activity_id")
    ]

    for idx, day in enumerate(itinerary_days):
        day["day"] = idx + 1

    new_total_days = len(itinerary_days)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE travel_plans
        SET itinerary = ?, days = ?, plan_generated = 1, edited = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (json.dumps(itinerary_data, ensure_ascii=False), new_total_days, plan_id))

    if removed_activity_ids:
        placeholders = ",".join("?" for _ in removed_activity_ids)
        cursor.execute(
            f"DELETE FROM activity_completion WHERE plan_id = ? AND activity_id IN ({placeholders})",
            [plan_id, *removed_activity_ids]
        )
    cursor.execute(
        "DELETE FROM activity_completion WHERE plan_id = ? AND day_number = ?",
        (plan_id, day_number)
    )
    cursor.execute(
        "UPDATE activity_completion SET day_number = day_number - 1 WHERE plan_id = ? AND day_number > ?",
        (plan_id, day_number)
    )

    conn.commit()
    conn.close()

    return itinerary_data

def update_activity_completion(
    plan_id: int,
    day_number: int,
    activity_index: int,
    completed: bool,
    activity_id: Optional[str] = None,
    user_code: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    if activity_id:
        if user_code:
            cursor.execute('''
                UPDATE activity_completion
                SET day_number = ?, activity_index = ?, completed = ?
                WHERE plan_id = ? AND activity_id = ? AND user_code = ?
            ''', (day_number, activity_index, int(completed), plan_id, activity_id, user_code))
            if cursor.rowcount == 0:
                cursor.execute('''
                    INSERT INTO activity_completion
                    (plan_id, day_number, activity_index, activity_id, completed, user_code)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (plan_id, day_number, activity_index, activity_id, int(completed), user_code))
        else:
            cursor.execute('''
                UPDATE activity_completion
                SET day_number = ?, activity_index = ?, completed = ?
                WHERE plan_id = ? AND activity_id = ?
            ''', (day_number, activity_index, int(completed), plan_id, activity_id))
            if cursor.rowcount == 0:
                cursor.execute('''
                    INSERT INTO activity_completion
                    (plan_id, day_number, activity_index, activity_id, completed)
                    VALUES (?, ?, ?, ?, ?)
                ''', (plan_id, day_number, activity_index, activity_id, int(completed)))
    else:
        if user_code:
            cursor.execute('''
                UPDATE activity_completion
                SET completed = ?
                WHERE plan_id = ? AND day_number = ? AND activity_index = ? AND user_code = ?
            ''', (int(completed), plan_id, day_number, activity_index, user_code))
            if cursor.rowcount == 0:
                cursor.execute('''
                    INSERT INTO activity_completion
                    (plan_id, day_number, activity_index, completed, user_code)
                    VALUES (?, ?, ?, ?, ?)
                ''', (plan_id, day_number, activity_index, int(completed), user_code))
        else:
            cursor.execute('''
                UPDATE activity_completion
                SET completed = ?
                WHERE plan_id = ? AND day_number = ? AND activity_index = ?
            ''', (int(completed), plan_id, day_number, activity_index))
            if cursor.rowcount == 0:
                cursor.execute('''
                    INSERT INTO activity_completion
                    (plan_id, day_number, activity_index, completed)
                    VALUES (?, ?, ?, ?)
                ''', (plan_id, day_number, activity_index, int(completed)))
    
    conn.commit()
    conn.close()

def get_activity_completions(plan_id: int, user_code: Optional[str] = None) -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_code:
        cursor.execute('''
            SELECT day_number, activity_index, activity_id, completed, user_code
            FROM activity_completion 
            WHERE plan_id = ? AND user_code = ?
        ''', (plan_id, user_code))
    else:
        cursor.execute('''
            SELECT day_number, activity_index, activity_id, completed, user_code
            FROM activity_completion 
            WHERE plan_id = ?
        ''', (plan_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
