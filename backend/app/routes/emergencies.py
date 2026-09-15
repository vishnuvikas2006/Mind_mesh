"""Victim-initiated emergency records.

MindMesh records and queues an emergency for authorised in-app review. It does
not claim to send a call, SMS, email, or push notification unless a verified
provider is integrated separately.
"""
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends

from app.database.mongo import get_db
from app.security import require_victim
from app.serialise import document

router = APIRouter(prefix="/emergencies", tags=["Emergency support"])


def recipient_summary(db, victim_id: str) -> dict:
    trusted_count = db.users.count_documents({
        "victim_id": victim_id, "role": "trusted_person", "enabled": True,
        "permissions": "emergency_alerts",
    })
    admin_count = db.users.count_documents({"role": {"$in": ["admin", "official"]}, "enabled": {"$ne": False}})
    return {
        "authorised_trusted_people": trusted_count,
        "authorised_admins": admin_count,
        "delivery_status": "recorded_for_in_app_review",
        "external_delivery": "not_configured",
    }


@router.post("")
def create_emergency(victim: dict = Depends(require_victim)):
    db = get_db()
    now = datetime.now(UTC)
    # A double tap must not create a stream of duplicate critical events.
    recent = db.emergency_events.find_one({"user_id": victim["_id"], "created_at": {"$gte": now - timedelta(seconds=60)}}, sort=[("created_at", -1)])
    if recent:
        return document({**recent, "duplicate_prevented": True})
    delivery = recipient_summary(db, victim["_id"])
    event = {
        "_id": str(uuid4()), "user_id": victim["_id"], "created_at": now,
        "status": "pending_human_review", "delivery": delivery,
    }
    db.emergency_events.insert_one(event)
    alert = {
        "_id": str(uuid4()), "user_id": victim["_id"], "risk_id": None,
        "severity": "critical", "status": "pending_review", "assigned_to": None,
        "created_at": now, "reasons": ["The member activated the emergency button."],
        "emergency_event_id": event["_id"],
    }
    db.alerts.insert_one(alert)
    db.audit_logs.insert_one({"_id": str(uuid4()), "actor_id": victim["_id"], "event": "emergency_activated", "emergency_event_id": event["_id"], "created_at": now})
    return document({**event, "alert_id": alert["_id"], "duplicate_prevented": False})


@router.get("")
def list_emergencies(victim: dict = Depends(require_victim)):
    events = list(get_db().emergency_events.find({"user_id": victim["_id"]}).sort("created_at", -1).limit(50))
    return [document(event) for event in events]
