"""MongoDB connection singleton."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = _client[os.environ["DB_NAME"]]


def get_db():
    return db


async def log_activity(actor: dict, action: str, description: str,
                       entity_type: str = None, entity_id: str = None, metadata: dict = None):
    from models import ActivityLog
    log = ActivityLog(
        actor_id=actor.get("id") if actor else None,
        actor_name=actor.get("full_name") or actor.get("email") if actor else None,
        actor_role=actor.get("role") if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        metadata=metadata or {},
    )
    await db.activity_logs.insert_one(log.model_dump())


async def create_notification(user_id: str, title: str, message: str,
                               type_: str = "info", link: str = None):
    from models import Notification
    notif = Notification(user_id=user_id, title=title, message=message, type=type_, link=link)
    await db.notifications.insert_one(notif.model_dump())
