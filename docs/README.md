# 云途智游 - 智能旅行规划系统

## 项目简介

云途智游是一个基于 AI 的智能旅行规划系统，能够根据用户的需求自动生成详细的旅行行程。系统支持自然语言输入，可以智能识别用户的出行意图，并生成包含交通、住宿、景点、餐饮等完整信息的行程规划。

## 功能特性

### 核心功能

- **AI 智能行程规划**：基于 DeepSeek 大语言模型，自动生成详细的旅行行程
- **自然语言输入**：支持用户用自然语言描述出行需求，系统自动提取关键信息
- **表单填写模式**：提供结构化的表单输入方式，方便用户精确指定需求
- **行程管理**：支持行程的查看、编辑、删除等操作
- **行程进度追踪**：用户可以标记已完成的行程节点，系统自动记录进度
- **社区分享**：用户可以分享自己的旅行经历到社区

### 用户系统

- 用户注册与登录
- 个人资料管理
- 头像上传

### 管理功能

- 管理员后台数据管理
- 数据库表的可视化操作

## 技术架构

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | 3.13+ | 主要编程语言 |
| FastAPI | 0.115.0 | Web 框架 |
| Uvicorn | 0.32.0 | ASGI 服务器 |
| SQLite | - | 轻量级数据库 |
| Pydantic | 2.9.2 | 数据验证 |
| httpx | 0.27.2 | HTTP 客户端 |

### 前端技术

- HTML5 / CSS3 / JavaScript
- 响应式设计
- 组件化开发

### AI 服务

- DeepSeek API：用于智能行程规划

## 项目结构

```
计算机设计大赛/
├── ai_plan/                    # AI 行程规划模块
│   ├── __init__.py            # 模块初始化
│   ├── model.py               # 数据模型与数据库操作
│   ├── prompt.py              # AI 提示词生成
│   ├── router.py              # API 路由定义
│   └── service.py             # 业务逻辑服务
├── css/                        # 样式文件
│   └── style.css              # 主样式表
├── data/                       # 数据存储
│   └── trip.db                # SQLite 数据库
├── js/                         # JavaScript 文件
│   ├── components/            # 组件
│   │   └── Navbar.js          # 导航栏组件
│   ├── common.js              # 公共函数
│   └── map.js                 # 地图功能
├── tests/                      # 测试文件
├── admin.html                  # 管理员页面
├── app.py                      # 应用入口
├── community.html              # 社区页面
├── index.html                  # 首页
├── map.html                    # 地图页面
├── publish_manage.html         # 发布管理页面
├── requirements.txt            # 依赖清单
├── settings.html               # 设置页面
└── trip.html                   # 行程详情页面
```

## 快速开始

### 环境要求

- Python 3.13 或更高版本
- pip 包管理器

### 安装步骤

1. **克隆项目**

```bash
git clone <项目地址>
cd 计算机设计大赛
```

2. **安装依赖**

```bash
pip install -r requirements.txt
```

3. **配置 API 密钥**

在 `ai_plan/service.py` 中配置 DeepSeek API 密钥：

```python
DEEPSEEK_API_KEY = "your-api-key-here"
```

4. **启动服务**

```bash
python app.py
```

服务将在 `http://localhost:8000` 启动，并自动打开浏览器。

### 端口占用处理

如果端口 8000 被占用，程序会自动检测并终止占用进程。

## API 接口

### 行程规划接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/plan/create` | 创建新行程 |
| GET | `/api/plan/{plan_id}` | 获取行程详情 |
| GET | `/api/plans` | 获取所有行程列表 |
| DELETE | `/api/plan/{plan_id}` | 删除行程 |
| POST | `/api/plan/{plan_id}/regenerate` | 重新生成行程 |

### 行程编辑接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/plan/{plan_id}/activities` | 添加行程活动 |
| PATCH | `/api/plan/{plan_id}/activities/{activity_id}` | 更新活动 |
| DELETE | `/api/plan/{plan_id}/activities/{activity_id}` | 删除活动 |
| POST | `/api/plan/{plan_id}/days/add` | 添加天数 |
| DELETE | `/api/plan/{plan_id}/days/{day_number}` | 删除某天 |

### 用户认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/user/{user_code}` | 获取用户信息 |
| PATCH | `/api/user/{user_code}` | 更新用户资料 |

### 社区接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/community/posts` | 获取社区动态列表 |
| POST | `/api/community/posts` | 发布动态 |
| POST | `/api/community/posts/{post_id}/like` | 点赞/取消点赞 |
| POST | `/api/community/posts/{post_id}/comments` | 评论 |
| DELETE | `/api/community/posts/{post_id}` | 删除动态 |

## 数据库设计

### 主要数据表

#### travel_plans - 旅行计划表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| start_city | TEXT | 出发城市 |
| target_city | TEXT | 目的地城市 |
| days | INTEGER | 出行天数 |
| people | INTEGER | 出行人数 |
| budget | REAL | 预算 |
| mode | TEXT | 出游模式 |
| preferences | TEXT | 出行偏好 |
| itinerary | TEXT | 行程详情（JSON） |
| plan_generated | INTEGER | 是否已生成行程 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| edited | INTEGER | 是否已编辑 |

#### users - 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_code | TEXT | 用户编码（唯一） |
| username | TEXT | 用户名（唯一） |
| password_hash | TEXT | 密码哈希 |
| nickname | TEXT | 昵称 |
| avatar_url | TEXT | 头像 URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### community_posts - 社区动态表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_code | TEXT | 用户编码 |
| trip_id | INTEGER | 关联行程 ID |
| trip_title | TEXT | 行程标题 |
| completed_nodes | TEXT | 已完成节点（JSON） |
| content | TEXT | 动态内容 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 行程数据格式

系统生成的行程数据采用 JSON 格式，包含以下结构：

```json
{
    "people_number": 2,
    "start_city": "杭州",
    "target_city": "成都",
    "budget": 5000,
    "mode": "个人",
    "preferences": ["自然风光", "美食探店"],
    "itinerary": [
        {
            "day": 1,
            "activities": [
                {
                    "type": "airplane",
                    "start_time": "00:50",
                    "end_time": "02:45",
                    "start": "杭州萧山国际机场",
                    "end": "成都天府国际机场",
                    "FlightID": "FL540",
                    "price": 818.75,
                    "cost": 1637.5,
                    "tickets": 2
                },
                {
                    "type": "accommodation",
                    "position": "成都东方美豪丽致酒店",
                    "start_time": "05:35",
                    "end_time": "24:00",
                    "rooms": 1,
                    "room_type": 2,
                    "price": 399,
                    "cost": 399,
                    "transports": [...]
                }
            ]
        }
    ]
}
```

### 活动类型说明

| 类型 | 说明 |
|------|------|
| airplane | 航班 |
| train | 火车/高铁 |
| accommodation | 住宿 |
| attraction | 景点 |
| breakfast | 早餐 |
| lunch | 午餐 |
| dinner | 晚餐 |

### 交通方式说明

| 方式 | 说明 |
|------|------|
| walk | 步行 |
| metro | 地铁 |
| taxi | 出租车 |
| airplane | 飞机 |
| train | 火车/高铁 |

## 管理员功能

管理员后台提供了数据库的可视化管理功能：

- 查看所有数据表
- 浏览表结构和数据
- 新增、编辑、删除记录

访问地址：`http://localhost:8000/__admin?key=<访问密钥>`

访问密钥在服务启动时会在控制台输出。

## 开发指南

### 运行测试

```bash
pytest tests/
```

### 代码风格

- Python 代码遵循 PEP 8 规范
- 使用有意义的变量名和函数名
- 保持代码简洁清晰

### 扩展开发

1. **添加新的 API 接口**：在 `ai_plan/router.py` 中定义新的路由
2. **修改数据模型**：在 `ai_plan/model.py` 中添加新的数据表和操作函数
3. **自定义 AI 提示词**：在 `ai_plan/prompt.py` 中修改提示词模板

## 注意事项

1. **API 密钥安全**：请勿将 API 密钥提交到版本控制系统
2. **数据备份**：定期备份 `data/trip.db` 数据库文件
3. **生产部署**：生产环境建议使用更安全的数据库（如 PostgreSQL）和专业的 WSGI 服务器

## 许可证

本项目仅供学习和研究使用。

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
