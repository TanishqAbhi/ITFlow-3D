from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.core.database import get_db
from app.models.user import User
from app.models.audit import Notification
from app.schemas.audit import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        or_(
            Notification.recipient_id == current_user.id,
            Notification.recipient_role == current_user.role
        )
    ).order_by(desc(Notification.created_at)).limit(limit).all()

    return [NotificationResponse.model_validate(n) for n in notifs]


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}


@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        or_(
            Notification.recipient_id == current_user.id,
            Notification.recipient_role == current_user.role
        )
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}
