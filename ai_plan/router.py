from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import json

from .model import (
    TravelPlanRequest,
    save_travel_plan,
    get_travel_plan,
    get_all_travel_plans,
    delete_travel_plan,
    update_activity_completion,
    get_activity_completions,
    update_travel_plan_itinerary,
    get_plan_itinerary,
    add_activity_to_plan,
    update_activity_in_plan,
    delete_activity_from_plan,
    add_day_to_plan,
    delete_day_from_plan,
    create_user,
    login_user,
    get_user_by_code,
    update_user_profile,
    create_community_post,
    list_community_posts,
    list_user_community_posts,
    delete_community_post,
    toggle_community_post_like,
    add_community_post_comment
)
from .service import create_travel_plan_with_itinerary, regenerate_itinerary

router = APIRouter()

class CreatePlanRequest(BaseModel):
    start_city: Optional[str] = None
    target_city: Optional[str] = None
    days: Optional[int] = None
    people: Optional[int] = None
    budget: Optional[float] = None
    mode: Optional[str] = None
    preferences: Optional[List[str]] = None
    natural_query: Optional[str] = None

class UpdateCompletionRequest(BaseModel):
    plan_id: int
    day_number: int
    activity_index: int
    activity_id: Optional[str] = None
    completed: bool
    user_code: Optional[str] = None

class ActivityCreateRequest(BaseModel):
    day_number: int
    activity: dict
    after_activity_id: Optional[str] = None

class ActivityUpdateRequest(BaseModel):
    updates: dict

class AddDayRequest(BaseModel):
    count: int = 1

class DeleteDayRequest(BaseModel):
    day_number: int

class UserAuthRequest(BaseModel):
    username: str
    password: str

class UserProfileUpdateRequest(BaseModel):
    nickname: str
    avatar_url: Optional[str] = None

class CommunityPostCreateRequest(BaseModel):
    user_code: str
    trip_id: Optional[int] = None
    trip_title: str
    completed_nodes: Optional[List[str]] = None
    content: Optional[str] = None
    images: Optional[List[str]] = None

class CommunityLikeRequest(BaseModel):
    user_code: str

class CommunityCommentRequest(BaseModel):
    user_code: str
    content: str

@router.post("/plan/create")
async def create_plan(request: CreatePlanRequest):
    try:
        result = await create_travel_plan_with_itinerary(
            start_city=request.start_city,
            target_city=request.target_city,
            days=request.days,
            people=request.people,
            budget=request.budget,
            mode=request.mode,
            preferences=request.preferences,
            natural_query=request.natural_query
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plan/{plan_id}")
async def get_plan(plan_id: int):
    plan = get_travel_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="旅行计划不存在")
    
    itinerary = None
    if plan["itinerary"]:
        try:
            itinerary = json.loads(plan["itinerary"])
        except:
            pass
    
    return {
        "id": plan["id"],
        "start_city": plan["start_city"],
        "target_city": plan["target_city"],
        "days": plan["days"],
        "people": plan["people"],
        "budget": plan["budget"],
        "mode": plan["mode"],
        "preferences": plan["preferences"],
        "itinerary": itinerary,
        "plan_generated": bool(plan["plan_generated"]),
        "created_at": plan["created_at"],
        "updated_at": plan.get("updated_at"),
        "edited": bool(plan.get("edited", 0))
    }

@router.get("/plans")
async def list_plans():
    plans = get_all_travel_plans()
    result = []
    for plan in plans:
        itinerary = None
        if plan["itinerary"]:
            try:
                itinerary = json.loads(plan["itinerary"])
            except:
                pass
        result.append({
            "id": plan["id"],
            "start_city": plan["start_city"],
            "target_city": plan["target_city"],
            "days": plan["days"],
            "people": plan["people"],
            "budget": plan["budget"],
            "mode": plan["mode"],
            "preferences": plan["preferences"],
            "itinerary": itinerary,
            "plan_generated": bool(plan["plan_generated"]),
            "created_at": plan["created_at"],
            "updated_at": plan.get("updated_at"),
            "edited": bool(plan.get("edited", 0))
        })
    return result

@router.delete("/plan/{plan_id}")
async def delete_plan(plan_id: int):
    delete_travel_plan(plan_id)
    return {"status": "success", "message": "旅行计划已删除"}

@router.post("/plan/completion")
async def update_completion(request: UpdateCompletionRequest):
    update_activity_completion(
        plan_id=request.plan_id,
        day_number=request.day_number,
        activity_index=request.activity_index,
        activity_id=request.activity_id,
        completed=request.completed,
        user_code=request.user_code
    )
    return {"status": "success"}

@router.get("/plan/{plan_id}/completions")
async def get_completions(plan_id: int, user_code: Optional[str] = Query(default=None)):
    completions = get_activity_completions(plan_id, user_code=user_code)
    return completions

@router.get("/plan/{plan_id}/itinerary")
async def get_plan_itinerary_detail(plan_id: int):
    plan = get_travel_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="旅行计划不存在")
    itinerary = get_plan_itinerary(plan_id)
    return {
        "plan_id": plan_id,
        "itinerary": itinerary,
        "edited": bool(plan.get("edited", 0)),
        "updated_at": plan.get("updated_at")
    }

@router.post("/plan/{plan_id}/activities")
async def create_activity(plan_id: int, request: ActivityCreateRequest):
    try:
        itinerary = add_activity_to_plan(
            plan_id=plan_id,
            day_number=request.day_number,
            activity=request.activity,
            after_activity_id=request.after_activity_id
        )
        return {"status": "success", "plan_id": plan_id, "itinerary": itinerary}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/register")
async def register_user(request: UserAuthRequest):
    try:
        user = create_user(
            username=request.username,
            password=request.password
        )
        return {"status": "success", "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
async def user_login(request: UserAuthRequest):
    try:
        user = login_user(
            username=request.username,
            password=request.password
        )
        return {"status": "success", "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_code}")
async def get_user_profile(user_code: str):
    user = get_user_by_code(user_code)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"status": "success", "user": user}

@router.patch("/user/{user_code}")
async def edit_user_profile(user_code: str, request: UserProfileUpdateRequest):
    try:
        user = update_user_profile(
            user_code=user_code,
            nickname=request.nickname,
            avatar_url=request.avatar_url
        )
        return {"status": "success", "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/community/posts")
async def get_community_posts(user_code: Optional[str] = None):
    posts = list_community_posts(current_user_code=user_code)
    return {"status": "success", "posts": posts}

@router.get("/community/posts/mine")
async def get_my_community_posts(user_code: str):
    try:
        posts = list_user_community_posts(user_code=user_code)
        return {"status": "success", "posts": posts}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/community/posts")
async def publish_community_post(request: CommunityPostCreateRequest):
    try:
        post = create_community_post(
            user_code=request.user_code,
            trip_id=request.trip_id,
            trip_title=request.trip_title,
            completed_nodes=request.completed_nodes or [],
            content=request.content,
            images=request.images or []
        )
        return {"status": "success", "post": post}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/community/posts/{post_id}/like")
async def like_community_post(post_id: int, request: CommunityLikeRequest):
    try:
        result = toggle_community_post_like(post_id=post_id, user_code=request.user_code)
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/community/posts/{post_id}/comments")
async def comment_community_post(post_id: int, request: CommunityCommentRequest):
    try:
        result = add_community_post_comment(
            post_id=post_id,
            user_code=request.user_code,
            content=request.content
        )
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/community/posts/{post_id}")
async def remove_community_post(post_id: int, user_code: str):
    try:
        delete_community_post(post_id=post_id, user_code=user_code)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/plan/{plan_id}/activities/{activity_id}")
async def edit_activity(plan_id: int, activity_id: str, request: ActivityUpdateRequest):
    try:
        itinerary = update_activity_in_plan(
            plan_id=plan_id,
            activity_id=activity_id,
            updates=request.updates
        )
        return {"status": "success", "plan_id": plan_id, "itinerary": itinerary}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/plan/{plan_id}/activities/{activity_id}")
async def remove_activity(plan_id: int, activity_id: str):
    try:
        itinerary = delete_activity_from_plan(
            plan_id=plan_id,
            activity_id=activity_id
        )
        return {"status": "success", "plan_id": plan_id, "itinerary": itinerary}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plan/{plan_id}/days/add")
async def add_plan_days(plan_id: int, request: AddDayRequest):
    try:
        itinerary = add_day_to_plan(
            plan_id=plan_id,
            count=request.count
        )
        return {
            "status": "success",
            "plan_id": plan_id,
            "days": len(itinerary.get("itinerary", [])),
            "itinerary": itinerary
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/plan/{plan_id}/days/{day_number}")
async def remove_plan_day(plan_id: int, day_number: int):
    try:
        itinerary = delete_day_from_plan(
            plan_id=plan_id,
            day_number=day_number
        )
        return {
            "status": "success",
            "plan_id": plan_id,
            "days": len(itinerary.get("itinerary", [])),
            "itinerary": itinerary
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plan/{plan_id}/days/delete")
async def remove_plan_day_with_body(plan_id: int, request: DeleteDayRequest):
    try:
        itinerary = delete_day_from_plan(
            plan_id=plan_id,
            day_number=request.day_number
        )
        return {
            "status": "success",
            "plan_id": plan_id,
            "days": len(itinerary.get("itinerary", [])),
            "itinerary": itinerary
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plan/{plan_id}/regenerate")
async def regenerate_plan(plan_id: int):
    try:
        result = await regenerate_itinerary(plan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plan/save-basic")
async def save_basic_plan(request: CreatePlanRequest):
    preferences_str = ", ".join(request.preferences) if request.preferences else None
    
    plan_id = save_travel_plan(
        start_city=request.start_city,
        target_city=request.target_city,
        days=request.days,
        people=request.people,
        budget=request.budget,
        mode=request.mode,
        preferences=preferences_str,
        plan_generated=False
    )
    
    return {"plan_id": plan_id, "status": "success"}

@router.post("/plan/{plan_id}/generate-itinerary")
async def generate_plan_itinerary(plan_id: int):
    try:
        result = await regenerate_itinerary(plan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
