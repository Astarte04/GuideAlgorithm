# 云途智游 数据库设计文档

## 概述

云途智游使用 SQLite 作为数据库，存储旅行计划、用户信息、社区动态等数据。数据库文件位于 `data/trip.db`。

## 数据表结构

### 1. travel_plans（旅行计划表）

存储用户创建的旅行计划基本信息。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| start_city | TEXT | NOT NULL | 出发城市 |
| target_city | TEXT | NOT NULL | 目的地城市 |
| days | INTEGER | NOT NULL | 出行天数 |
| people | INTEGER | NOT NULL | 出行人数 |
| budget | REAL | - | 预算（元） |
| mode | TEXT | - | 出游模式（个人/家庭/企业） |
| preferences | TEXT | - | 出行偏好，逗号分隔 |
| itinerary | TEXT | - | 行程详情，JSON 格式 |
| plan_generated | INTEGER | DEFAULT 0 | 是否已生成行程（0/1） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |
| edited | INTEGER | DEFAULT 0 | 是否已编辑（0/1） |

**建表语句**

```sql
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    edited INTEGER DEFAULT 0
);
```

---

### 2. activity_completion（活动完成状态表）

记录用户对行程中各活动的完成状态。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| plan_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的行程 ID |
| day_number | INTEGER | NOT NULL | 天数 |
| activity_index | INTEGER | NOT NULL | 活动索引 |
| activity_id | TEXT | - | 活动唯一标识 |
| completed | INTEGER | DEFAULT 0 | 是否完成（0/1） |
| user_code | TEXT | - | 用户编码 |

**建表语句**

```sql
CREATE TABLE IF NOT EXISTS activity_completion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    activity_index INTEGER NOT NULL,
    activity_id TEXT,
    completed INTEGER DEFAULT 0,
    user_code TEXT,
    FOREIGN KEY (plan_id) REFERENCES travel_plans(id)
);
```

**索引**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_completion_plan_user_activity
ON activity_completion(plan_id, user_code, activity_id)
WHERE activity_id IS NOT NULL;
```

---

### 3. users（用户表）

存储用户账户信息。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_code | TEXT | UNIQUE NOT NULL | 用户编码（6位数字） |
| username | TEXT | UNIQUE NOT NULL | 用户名 |
| password_hash | TEXT | NOT NULL | 密码哈希（SHA256） |
| nickname | TEXT | - | 昵称 |
| avatar_url | TEXT | - | 头像 URL（Base64 Data URL） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**建表语句**

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_code TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. community_posts（社区动态表）

存储用户发布的社区动态。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_code | TEXT | NOT NULL, FOREIGN KEY | 发布者用户编码 |
| trip_id | INTEGER | - | 关联的行程 ID |
| trip_title | TEXT | NOT NULL | 行程标题 |
| completed_nodes | TEXT | - | 已完成节点，JSON 数组 |
| content | TEXT | - | 动态内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**建表语句**

```sql
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
);
```

---

### 5. community_post_images（动态图片表）

存储社区动态的图片。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的动态 ID |
| image_url | TEXT | NOT NULL | 图片 URL（Base64 Data URL） |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**建表语句**

```sql
CREATE TABLE IF NOT EXISTS community_post_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES community_posts(id)
);
```

---

### 6. community_post_likes（动态点赞表）

记录用户对动态的点赞。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 动态 ID |
| user_code | TEXT | NOT NULL, FOREIGN KEY | 用户编码 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 点赞时间 |

**建表语句**

```sql
CREATE TABLE IF NOT EXISTS community_post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_code),
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
    FOREIGN KEY (user_code) REFERENCES users(user_code)
);
```

---

### 7. community_post_comments（动态评论表）

存储动态的评论。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 动态 ID |
| user_code | TEXT | NOT NULL, FOREIGN KEY | 评论者用户编码 |
| content | TEXT | NOT NULL | 评论内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 评论时间 |

**建表语句**

```sql
CREATE TABLE IF NOT EXISTS community_post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_code TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
    FOREIGN KEY (user_code) REFERENCES users(user_code)
);
```

---

## ER 图

```
┌─────────────────┐
│   users         │
├─────────────────┤
│ id (PK)         │
│ user_code (UK)  │◄──────────────────────────────────────┐
│ username (UK)   │                                      │
│ password_hash   │                                      │
│ nickname        │                                      │
│ avatar_url      │                                      │
│ created_at      │                                      │
│ updated_at      │                                      │
└─────────────────┘                                      │
         │                                               │
         │ 1:N                                           │
         ▼                                               │
┌─────────────────┐      ┌─────────────────────────────┐│
│ community_posts │      │ community_post_likes        ││
├─────────────────┤      ├─────────────────────────────┤│
│ id (PK)         │◄────►│ id (PK)                     ││
│ user_code (FK)  │──────┼─►post_id (FK)               ││
│ trip_id         │      │ user_code (FK) ─────────────┘│
│ trip_title      │      │ created_at                  │
│ completed_nodes │      └─────────────────────────────┘
│ content         │                    ▲
│ created_at      │                    │ 1:N
│ updated_at      │      ┌─────────────────────────────┐
└─────────────────┘      │ community_post_comments     │
         │               ├─────────────────────────────┤
         │ 1:N           │ id (PK)                     │
         ▼               │ post_id (FK) ───────────────┘
┌─────────────────────────┤ user_code (FK)              │
│ community_post_images   │ content                     │
├─────────────────────────┤ created_at                  │
│ id (PK)                 └─────────────────────────────┘
│ post_id (FK)            │
│ image_url               │
│ sort_order              │
└─────────────────────────┘

┌─────────────────┐
│  travel_plans   │
├─────────────────┤
│ id (PK)         │
│ start_city      │
│ target_city     │
│ days            │
│ people          │
│ budget          │
│ mode            │
│ preferences     │
│ itinerary       │
│ plan_generated  │
│ created_at      │
│ updated_at      │
│ edited          │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│ activity_completion     │
├─────────────────────────┤
│ id (PK)                 │
│ plan_id (FK)            │
│ day_number              │
│ activity_index          │
│ activity_id             │
│ completed               │
│ user_code               │
└─────────────────────────┘
```

---

## 数据约束与验证

### 用户密码

- 使用 SHA256 哈希存储
- 最小长度：6 个字符

### 用户编码

- 格式：6 位数字字符串
- 自动生成，保证唯一性

### 头像图片

- 格式：Base64 Data URL
- 最大体积：2MB
- 支持格式：image/jpeg, image/png, image/gif 等

### 动态图片

- 格式：Base64 Data URL
- 最大体积：4MB
- 最多数量：9 张

---

## 数据迁移

数据库初始化在 `ai_plan/model.py` 的 `init_db()` 函数中完成。新增字段时，使用 `ALTER TABLE` 语句进行迁移：

```python
# 示例：添加新字段
cursor.execute("ALTER TABLE travel_plans ADD COLUMN updated_at TIMESTAMP")
cursor.execute("ALTER TABLE travel_plans ADD COLUMN edited INTEGER DEFAULT 0")
```

---

## 备份与恢复

### 备份数据库

```bash
# 复制数据库文件
cp data/trip.db data/trip_backup_$(date +%Y%m%d).db
```

### 使用 SQLite 命令备份

```bash
sqlite3 data/trip.db ".backup data/trip_backup.db"
```

### 恢复数据库

```bash
cp data/trip_backup.db data/trip.db
```

---

## 性能优化建议

1. **索引优化**
   - 已为 `activity_completion` 表创建复合索引
   - 可根据查询模式添加更多索引

2. **JSON 字段**
   - `itinerary` 和 `completed_nodes` 使用 JSON 格式存储
   - 如需复杂查询，可考虑拆分为独立表

3. **分页查询**
   - 管理后台已实现分页查询
   - 建议在社区动态列表中也实现分页

4. **缓存策略**
   - 可考虑对热门动态添加缓存
   - 用户信息可缓存到 Redis
