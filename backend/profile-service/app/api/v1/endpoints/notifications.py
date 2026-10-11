from fastapi import APIRouter, Depends, status
from typing import List
from app.models.notification import Notification
from app.api.deps import get_current_user_id
from datetime import datetime

router = APIRouter()

@router.get("", response_model=List[dict])
async def get_notifications(user_id: str = Depends(get_current_user_id)):
    notifs = await Notification.find(Notification.user_id == str(user_id)).sort("-created_at").to_list()
    return [{
        "id": str(n.id),
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at
    } for n in notifs]

@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    notif = await Notification.get(ObjectId(notification_id))
    if notif and notif.user_id == str(user_id):
        notif.is_read = True
        await notif.save()
    return {"status": "ok"}
