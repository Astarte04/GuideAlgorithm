def generate_travel_prompt(
    start_city: str = None,
    target_city: str = None,
    days: int = None,
    people: int = None,
    budget: float = None,
    mode: str = None,
    preferences: list = None,
    natural_query: str = None
) -> str:
    if natural_query:
        user_req_str = f"""
## 用户需求（自然语言）
"{natural_query}"

请根据以上自然语言描述提取出发城市、目的地城市、出行天数、出行人数、预算、出游模式及出行偏好。
如果自然语言中缺失了某些必要信息（如出发地、天数等），请自行合理补充完整，并基于这些信息规划一份详细的旅行行程。
"""
        target_city_display = "目的地城市（请从用户需求中提取或自行补充）"
        start_city_display = "出发城市"
    else:
        budget_str = f"预算为{budget}元" if budget else "预算不限"
        mode_str = f"出游模式为{mode}" if mode else "未指定"
        
        preferences_str = ""
        if preferences and len(preferences) > 0:
            preferences_str = f"出行偏好为：{', '.join(preferences)}"
            
        user_req_str = f"""
## 用户需求
- 出发城市：{start_city}
- 目的地城市：{target_city}
- 出行天数：{days}天
- 出行人数：{people}人
- {budget_str}
- {mode_str}
- {preferences_str}
"""
        target_city_display = target_city
        start_city_display = start_city

    prompt = f"""你是一位专业的旅行规划师，请根据以下用户需求，规划一份详细的旅行行程。
{user_req_str}

## 重要说明
1. **规划主体以目的地为主**：主要游览{target_city_display}的各种景点，行程安排应重点围绕目的地的景点展开
2. 第一天需要安排从{start_city_display}到{target_city_display}的交通（飞机或高铁）
3. 最后一天需要安排从{target_city_display}返回{start_city_display}的交通
4. 中间几天主要在{target_city_display}及其周边游玩景点
5. 每天需要安排住宿、餐饮（早餐、午餐、晚餐）和景点游览
6. 交通方式包括：walk（步行）、metro（地铁）、taxi（出租车）、airplane（飞机）、train（火车/高铁）
7. 活动类型包括：airplane（航班）、train（火车/高铁）、accommodation（住宿）、attraction（景点）、breakfast（早餐）、lunch（午餐）、dinner（晚餐）

## 输出格式要求
请严格按照以下JSON格式输出，不要添加任何其他文字说明。如果你是从自然语言提取的信息，请将提取出的最终城市、天数等填入顶层的字段中：

```json
{{
    "people_number": 人数(整数),
    "start_city": "出发城市",
    "target_city": "目的地城市",
    "budget": 预算(数字，可选),
    "mode": "出游模式",
    "preferences": ["偏好1", "偏好2"],
    "itinerary": [
        {{
            "day": 1,
            "activities": [
                {{
                    "start_time": "HH:MM",
                    "end_time": "HH:MM",
                    "start": "出发地点全称(需带城市名)",
                    "end": "到达地点全称(需带城市名)",
                    "price": 单价,
                    "cost": 总价(单价*人数),
                    "tickets": 票数,
                    "transports": [],
                    "FlightID": "航班号/车次号",
                    "type": "airplane或train"
                }},
                {{
                    "position": "酒店全称(需带城市名，如成都市富力丽思卡尔顿酒店)",
                    "type": "accommodation",
                    "transports": [
                        {{
                            "start": "起点全称(需带城市名)",
                            "end": "终点全称(需带城市名)",
                            "mode": "walk|metro|taxi",
                            "start_time": "HH:MM",
                            "end_time": "HH:MM",
                            "cost": 总费用,
                            "distance": 距离(公里),
                            "price": 单价,
                            "tickets": 票数(地铁时),
                            "cars": 车数(出租车时)
                        }}
                    ],
                    "room_type": 房间类型(1单人间/2双人间),
                    "start_time": "HH:MM",
                    "end_time": "24:00",
                    "rooms": 房间数,
                    "cost": 总费用,
                    "price": 单价
                }}
            ]
        }},
        {{
            "day": 2,
            "activities": [
                {{
                    "position": "酒店全称(需带城市名)",
                    "type": "breakfast",
                    "cost": 0.0,
                    "price": 0.0,
                    "transports": [],
                    "start_time": "HH:MM",
                    "end_time": "HH:MM"
                }},
                {{
                    "position": "景点全称(必须带城市名前缀，如成都市黄龙溪古镇，绝对不能只写古镇)",
                    "type": "attraction",
                    "transports": [...],
                    "price": 门票单价,
                    "cost": 总费用,
                    "tickets": 票数,
                    "start_time": "HH:MM",
                    "end_time": "HH:MM"
                }}
            ]
        }}
    ]
}}
```

## 注意事项
1. **强制位置名称规范**：行程中所有涉及地点的地方（包括`position`, `start`, `end`, 以及`transports`里面的`start`, `end`），**必须输出精确的、带城市前缀的全称地点**（例如：“成都市黄龙溪古镇”而绝对不能只输出“古镇”，“北京首都国际机场”而不能只输出“首都机场”）。避免在地图上出现与其他城市同名而导致定位错误的问题。
2. 所有时间使用24小时制，格式为"HH:MM"
3. 价格使用浮点数，保留两位小数
4. 景点要选择{target_city_display}当地著名的、有代表性的景点
5. 餐厅要选择当地特色美食餐厅，同样必须带城市前缀全称
6. 酒店要选择位置便利、性价比高的酒店，同样必须带城市前缀全称
7. 交通安排要合理，考虑实际可行的时间
8. 确保JSON格式完全正确，可以被解析

请直接输出JSON，不要有任何其他说明文字。"""
    
    return prompt
