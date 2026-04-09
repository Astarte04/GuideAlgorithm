import httpx
import json
import re
import time
from typing import Optional
from .prompt import generate_travel_prompt
from .model import save_travel_plan, update_travel_plan_itinerary, get_travel_plan

DEEPSEEK_API_KEY = "sk-a615801a914e4c58834523e34638e6c5"
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

async def call_deepseek_api(prompt: str) -> dict:
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": "你是一位专业的旅行规划师，擅长根据用户需求制定详细的旅行行程。你的回复必须是严格的JSON格式，不包含任何其他文字。"
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 8000
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            DEEPSEEK_API_URL,
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

def extract_json_from_response(content: str) -> dict:
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            json_str = json_match.group(0)
        else:
            raise ValueError("无法从响应中提取JSON")
    
    return json.loads(json_str)

async def generate_itinerary(
    start_city: Optional[str] = None,
    target_city: Optional[str] = None,
    days: Optional[int] = None,
    people: Optional[int] = None,
    budget: Optional[float] = None,
    mode: Optional[str] = None,
    preferences: Optional[list] = None,
    natural_query: Optional[str] = None
) -> dict:
    prompt = generate_travel_prompt(
        start_city=start_city,
        target_city=target_city,
        days=days,
        people=people,
        budget=budget,
        mode=mode,
        preferences=preferences,
        natural_query=natural_query
    )
    
    start_time = time.time()
    
    try:
        response = await call_deepseek_api(prompt)
        
        content = response["choices"][0]["message"]["content"]
        
        itinerary_data = extract_json_from_response(content)
        
        elapsed_time = time.time() - start_time
        itinerary_data["elapsed_time(sec)"] = round(elapsed_time, 2)
        
        return itinerary_data
        
    except httpx.HTTPStatusError as e:
        raise Exception(f"DeepSeek API调用失败: {e.response.status_code} - {e.response.text}")
    except json.JSONDecodeError as e:
        raise Exception(f"JSON解析失败: {str(e)}")
    except Exception as e:
        raise Exception(f"生成行程时发生错误: {str(e)}")

async def create_travel_plan_with_itinerary(
    start_city: Optional[str] = None,
    target_city: Optional[str] = None,
    days: Optional[int] = None,
    people: Optional[int] = None,
    budget: Optional[float] = None,
    mode: Optional[str] = None,
    preferences: Optional[list] = None,
    natural_query: Optional[str] = None
) -> dict:
    preferences_str = ", ".join(preferences) if preferences else None
    
    try:
        itinerary_data = await generate_itinerary(
            start_city=start_city,
            target_city=target_city,
            days=days,
            people=people,
            budget=budget,
            mode=mode,
            preferences=preferences,
            natural_query=natural_query
        )
        
        # 如果是自然语言输入，可能原来没有这些参数，需要从返回结果中提取
        final_start_city = itinerary_data.get("start_city", start_city) or "未知"
        final_target_city = itinerary_data.get("target_city", target_city) or "未知"
        final_days = len(itinerary_data.get("itinerary", [])) if not days else days
        final_people = itinerary_data.get("people_number", people) or 1
        final_budget = itinerary_data.get("budget", budget)
        final_mode = itinerary_data.get("mode", mode)
        final_preferences = itinerary_data.get("preferences", preferences)
        
        final_preferences_str = ", ".join(final_preferences) if final_preferences and isinstance(final_preferences, list) else (preferences_str or None)

        plan_id = save_travel_plan(
            start_city=final_start_city,
            target_city=final_target_city,
            days=final_days,
            people=final_people,
            budget=final_budget,
            mode=final_mode,
            preferences=final_preferences_str,
            plan_generated=True
        )
        
        itinerary_json = json.dumps(itinerary_data, ensure_ascii=False)
        update_travel_plan_itinerary(plan_id, itinerary_json, plan_generated=True)
        
        # 将补充的字段也回传给前端
        itinerary_data["start_city"] = final_start_city
        itinerary_data["target_city"] = final_target_city
        itinerary_data["days"] = final_days
        itinerary_data["people"] = final_people
        itinerary_data["budget"] = final_budget
        itinerary_data["mode"] = final_mode
        itinerary_data["preferences"] = final_preferences
        
        return {
            "plan_id": plan_id,
            "itinerary": itinerary_data,
            "status": "success",
            "start_city": final_start_city,
            "target_city": final_target_city,
            "days": final_days,
            "people": final_people,
            "budget": final_budget,
            "mode": final_mode,
            "preferences": final_preferences
        }
        
    except Exception as e:
        # 如果生成失败，如果是自然语言由于没有先保存，就不存空记录了；或者抛出异常
        raise e

async def regenerate_itinerary(plan_id: int) -> dict:
    plan = get_travel_plan(plan_id)
    if not plan:
        raise ValueError(f"找不到ID为{plan_id}的旅行计划")
    
    preferences = plan["preferences"].split(", ") if plan["preferences"] else None
    
    itinerary_data = await generate_itinerary(
        start_city=plan["start_city"],
        target_city=plan["target_city"],
        days=plan["days"],
        people=plan["people"],
        budget=plan["budget"],
        mode=plan["mode"],
        preferences=preferences
    )
    
    itinerary_json = json.dumps(itinerary_data, ensure_ascii=False)
    update_travel_plan_itinerary(plan_id, itinerary_json, plan_generated=True)
    
    return {
        "plan_id": plan_id,
        "itinerary": itinerary_data,
        "status": "success"
    }
