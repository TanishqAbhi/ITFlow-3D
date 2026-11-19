import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User, UserRoleEnum
from app.models.audit import ActivityLog, Notification, NotificationCategoryEnum
from app.core.websocket import ws_manager


class AuditService:
    @staticmethod
    def record_activity(
        db: Session,
        user: Optional[User],
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None,
    ) -> ActivityLog:
        """
        Appends an immutable audit log entry.
        Captures entity changes, actor role, and client environment.
        """
        user_id = user.id if user else None
        user_email = user.email if user else "system@itflow3d.com"
        user_role = user.role if user else UserRoleEnum.ADMIN

        log = ActivityLog(
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            previous_state=json.dumps(previous_state) if previous_state else None,
            new_state=json.dumps(new_state) if new_state else None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    async def create_notification(
        db: Session,
        title: str,
        message: str,
        category: NotificationCategoryEnum = NotificationCategoryEnum.SYSTEM,
        recipient_id: Optional[int] = None,
        recipient_role: Optional[UserRoleEnum] = None,
        link_url: Optional[str] = None,
    ) -> Notification:
        """Creates a persistent notification and broadcasts in real-time via WebSocket."""
        notif = Notification(
            recipient_id=recipient_id,
            recipient_role=recipient_role,
            title=title,
            message=message,
            category=category,
            link_url=link_url,
            is_read=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        payload = {
            "type": "NOTIFICATION",
            "data": {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "category": notif.category.value,
                "link_url": notif.link_url,
                "created_at": notif.created_at.isoformat(),
            }
        }

        if recipient_id:
            await ws_manager.send_personal_message(payload, recipient_id)
        elif recipient_role:
            await ws_manager.broadcast_to_role(recipient_role, payload)
        else:
            await ws_manager.broadcast(payload)

        return notif


audit_service = AuditService()
