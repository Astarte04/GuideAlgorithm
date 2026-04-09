# 云途智游 API 文档

## 基础信息

- **Base URL**: `http://localhost:8000`
- **API 前缀**: `/api`
- **内容类型**: `application/json`

## 目录

- [行程规划接口](#行程规划接口)
- [行程编辑接口](#行程编辑接口)
- [用户认证接口](#用户认证接口)
- [社区接口](#社区接口)
- [健康检查接口](#健康检查接口)

---

## 行程规划接口

### 创建新行程

创建一个新的旅行计划并自动生成行程。

**请求**

```http
POST /api/plan/create
Content-Type: application/json
```

**请求体**

```json
{
    "start_city": "杭州",
    "target_city": "成都",
    "days": 5,
    "people": 2,
    "budget": 5000,
    "mode": "个人",
    "preferences": ["自然风光", "美食探店"],
    "natural_query": null
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_city | string | 否* | 出发城市 |
| target_city | string | 否* | 目的地城市 |
| days | integer | 否* | 出行天数 |
| people | integer | 否 | 出行人数，默认 1 |
| budget | number | 否 | 预算（元） |
| mode | string | 否 | 出游模式（个人/家庭/企业） |
| preferences | array | 否 | 出行偏好列表 |
| natural_query | string | 否* | 自然语言描述 |

> *注：如果使用 `natural_query`，其他参数可为空，系统会自动提取

**响应**

```json
{
    "plan_id": 1,
    "itinerary": {
        "people_number": 2,
        "start_city": "杭州",
        "target_city": "成都",
        "itinerary": [...]
    },
    "status": "success",
    "start_city": "杭州",
    "target_city": "成都",
    "days": 5,
    "people": 2,
    "budget": 5000,
    "mode": "个人",
    "preferences": ["自然风光", "美食探店"]
}
```

---

### 获取行程详情

获取指定行程的详细信息。

**请求**

```http
GET /api/plan/{plan_id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| plan_id | integer | 行程 ID |

**响应**

```json
{
    "id": 1,
    "start_city": "杭州",
    "target_city": "成都",
    "days": 5,
    "people": 2,
    "budget": 5000,
    "mode": "个人",
    "preferences": "自然风光, 美食探店",
    "itinerary": {...},
    "plan_generated": true,
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00",
    "edited": false
}
```

---

### 获取所有行程

获取所有旅行计划列表。

**请求**

```http
GET /api/plans
```

**响应**

```json
[
    {
        "id": 1,
        "start_city": "杭州",
        "target_city": "成都",
        "days": 5,
        "people": 2,
        "budget": 5000,
        "mode": "个人",
        "preferences": "自然风光, 美食探店",
        "itinerary": {...},
        "plan_generated": true,
        "created_at": "2024-01-01 12:00:00"
    }
]
```

---

### 删除行程

删除指定的旅行计划。

**请求**

```http
DELETE /api/plan/{plan_id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| plan_id | integer | 行程 ID |

**响应**

```json
{
    "status": "success",
    "message": "旅行计划已删除"
}
```

---

### 重新生成行程

重新为指定行程生成行程安排。

**请求**

```http
POST /api/plan/{plan_id}/regenerate
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| plan_id | integer | 行程 ID |

**响应**

```json
{
    "plan_id": 1,
    "itinerary": {...},
    "status": "success"
}
```

---

### 保存基础行程信息

仅保存行程基本信息，不生成行程。

**请求**

```http
POST /api/plan/save-basic
Content-Type: application/json
```

**请求体**

```json
{
    "start_city": "杭州",
    "target_city": "成都",
    "days": 5,
    "people": 2,
    "budget": 5000,
    "mode": "个人",
    "preferences": ["自然风光", "美食探店"]
}
```

**响应**

```json
{
    "plan_id": 1,
    "status": "success"
}
```

---

## 行程编辑接口

### 获取行程详情（含活动 ID）

获取行程的详细信息，包含每个活动的唯一 ID。

**请求**

```http
GET /api/plan/{plan_id}/itinerary
```

**响应**

```json
{
    "plan_id": 1,
    "itinerary": {
        "itinerary": [
            {
                "day": 1,
                "activities": [
                    {
                        "activity_id": "abc123",
                        "type": "airplane",
                        ...
                    }
                ]
            }
        ]
    },
    "edited": false,
    "updated_at": "2024-01-01 12:00:00"
}
```

---

### 添加活动

在某天添加新的活动。

**请求**

```http
POST /api/plan/{plan_id}/activities
Content-Type: application/json
```

**请求体**

```json
{
    "day_number": 1,
    "activity": {
        "type": "attraction",
        "position": "成都市宽窄巷子",
        "start_time": "09:00",
        "end_time": "11:00",
        "price": 0,
        "cost": 0,
        "tickets": 2,
        "transports": []
    },
    "after_activity_id": "abc123"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| day_number | integer | 是 | 天数 |
| activity | object | 是 | 活动详情 |
| after_activity_id | string | 否 | 插入到指定活动之后 |

**响应**

```json
{
    "status": "success",
    "plan_id": 1,
    "itinerary": {...}
}
```

---

### 更新活动

更新指定活动的信息。

**请求**

```http
PATCH /api/plan/{plan_id}/activities/{activity_id}
Content-Type: application/json
```

**请求体**

```json
{
    "updates": {
        "position": "成都市锦里古街",
        "start_time": "14:00",
        "end_time": "16:00"
    }
}
```

**响应**

```json
{
    "status": "success",
    "plan_id": 1,
    "itinerary": {...}
}
```

---

### 删除活动

删除指定的活动。

**请求**

```http
DELETE /api/plan/{plan_id}/activities/{activity_id}
```

**响应**

```json
{
    "status": "success",
    "plan_id": 1,
    "itinerary": {...}
}
```

---

### 添加天数

为行程添加新的天数。

**请求**

```http
POST /api/plan/{plan_id}/days/add
Content-Type: application/json
```

**请求体**

```json
{
    "count": 1
}
```

**响应**

```json
{
    "status": "success",
    "plan_id": 1,
    "days": 6,
    "itinerary": {...}
}
```

---

### 删除天数

删除行程中的某一天。

**请求**

```http
DELETE /api/plan/{plan_id}/days/{day_number}
```

**响应**

```json
{
    "status": "success",
    "plan_id": 1,
    "days": 4,
    "itinerary": {...}
}
```

---

### 更新活动完成状态

标记活动为已完成或未完成。

**请求**

```http
POST /api/plan/completion
Content-Type: application/json
```

**请求体**

```json
{
    "plan_id": 1,
    "day_number": 1,
    "activity_index": 0,
    "activity_id": "abc123",
    "completed": true,
    "user_code": "123456"
}
```

**响应**

```json
{
    "status": "success"
}
```

---

### 获取活动完成状态

获取行程中所有活动的完成状态。

**请求**

```http
GET /api/plan/{plan_id}/completions?user_code={user_code}
```

**响应**

```json
{
    "plan_id": 1,
    "completions": [
        {
            "day_number": 1,
            "activity_index": 0,
            "activity_id": "abc123",
            "completed": true
        }
    ]
}
```

---

## 用户认证接口

### 用户注册

注册新用户。

**请求**

```http
POST /api/auth/register
Content-Type: application/json
```

**请求体**

```json
{
    "username": "testuser",
    "password": "123456"
}
```

**响应**

```json
{
    "status": "success",
    "user": {
        "id": 1,
        "user_code": "123456",
        "username": "testuser",
        "nickname": "testuser",
        "avatar_url": null,
        "created_at": "2024-01-01 12:00:00",
        "updated_at": "2024-01-01 12:00:00"
    }
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 用户名不能为空 / 密码长度至少6位 / 用户名已存在 |

---

### 用户登录

用户登录获取信息。

**请求**

```http
POST /api/auth/login
Content-Type: application/json
```

**请求体**

```json
{
    "username": "testuser",
    "password": "123456"
}
```

**响应**

```json
{
    "status": "success",
    "user": {
        "id": 1,
        "user_code": "123456",
        "username": "testuser",
        "nickname": "testuser",
        "avatar_url": null,
        "created_at": "2024-01-01 12:00:00",
        "updated_at": "2024-01-01 12:00:00"
    }
}
```

---

### 获取用户信息

根据用户编码获取用户信息。

**请求**

```http
GET /api/user/{user_code}
```

**响应**

```json
{
    "status": "success",
    "user": {
        "id": 1,
        "user_code": "123456",
        "username": "testuser",
        "nickname": "testuser",
        "avatar_url": null,
        "created_at": "2024-01-01 12:00:00",
        "updated_at": "2024-01-01 12:00:00"
    }
}
```

---

### 更新用户资料

更新用户的昵称和头像。

**请求**

```http
PATCH /api/user/{user_code}
Content-Type: application/json
```

**请求体**

```json
{
    "nickname": "新昵称",
    "avatar_url": "data:image/jpeg;base64,..."
}
```

**响应**

```json
{
    "status": "success",
    "user": {
        "id": 1,
        "user_code": "123456",
        "username": "testuser",
        "nickname": "新昵称",
        "avatar_url": "data:image/jpeg;base64,...",
        "created_at": "2024-01-01 12:00:00",
        "updated_at": "2024-01-01 13:00:00"
    }
}
```

---

## 社区接口

### 获取社区动态列表

获取所有社区动态。

**请求**

```http
GET /api/community/posts?user_code={user_code}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_code | string | 否 | 当前用户编码，用于判断点赞状态 |

**响应**

```json
{
    "status": "success",
    "posts": [
        {
            "id": 1,
            "user_code": "123456",
            "trip_id": 1,
            "trip_title": "成都五日游",
            "completed_nodes": ["宽窄巷子", "锦里"],
            "content": "旅行很愉快！",
            "created_at": "2024-01-01 12:00:00",
            "updated_at": "2024-01-01 12:00:00",
            "user": {
                "user_code": "123456",
                "username": "testuser",
                "nickname": "旅行者",
                "avatar_url": null
            },
            "images": ["data:image/jpeg;base64,..."],
            "like_count": 10,
            "comment_count": 2,
            "liked_by_current_user": false,
            "comments": [
                {
                    "id": 1,
                    "content": "很棒的分享！",
                    "created_at": "2024-01-01 13:00:00",
                    "user": {
                        "user_code": "654321",
                        "username": "other",
                        "nickname": "其他用户",
                        "avatar_url": null
                    }
                }
            ]
        }
    ]
}
```

---

### 获取我的动态

获取当前用户发布的动态。

**请求**

```http
GET /api/community/posts/mine?user_code={user_code}
```

**响应**

同获取社区动态列表。

---

### 发布动态

发布新的社区动态。

**请求**

```http
POST /api/community/posts
Content-Type: application/json
```

**请求体**

```json
{
    "user_code": "123456",
    "trip_id": 1,
    "trip_title": "成都五日游",
    "completed_nodes": ["宽窄巷子", "锦里"],
    "content": "旅行很愉快！",
    "images": ["data:image/jpeg;base64,..."]
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_code | string | 是 | 用户编码 |
| trip_id | integer | 否 | 关联行程 ID |
| trip_title | string | 是 | 行程标题 |
| completed_nodes | array | 否 | 已完成节点列表 |
| content | string | 否 | 动态内容 |
| images | array | 否 | 图片列表（最多9张，Base64格式） |

**响应**

```json
{
    "status": "success",
    "post": {...}
}
```

---

### 点赞/取消点赞

对动态进行点赞或取消点赞操作。

**请求**

```http
POST /api/community/posts/{post_id}/like
Content-Type: application/json
```

**请求体**

```json
{
    "user_code": "123456"
}
```

**响应**

```json
{
    "status": "success",
    "liked": true,
    "like_count": 11
}
```

---

### 评论动态

对动态发表评论。

**请求**

```http
POST /api/community/posts/{post_id}/comments
Content-Type: application/json
```

**请求体**

```json
{
    "user_code": "123456",
    "content": "很棒的分享！"
}
```

**响应**

```json
{
    "status": "success",
    "comment": {
        "id": 1,
        "content": "很棒的分享！",
        "created_at": "2024-01-01 13:00:00",
        "user": {...}
    }
}
```

---

### 删除动态

删除自己发布的动态。

**请求**

```http
DELETE /api/community/posts/{post_id}?user_code={user_code}
```

**响应**

```json
{
    "status": "success"
}
```

---

## 健康检查接口

### 健康检查

检查服务是否正常运行。

**请求**

```http
GET /health
```

**响应**

```json
{
    "status": "healthy"
}
```

---

## 错误响应

所有接口在发生错误时返回统一的错误格式：

```json
{
    "detail": "错误信息描述"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
