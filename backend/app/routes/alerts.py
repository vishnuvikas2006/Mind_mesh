from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.database.mongo import get_db
from app.schemas import ReviewAlertInput, SupportActionInput
from app.security import require_official
from app.serialise import document

router = APIRouter(prefix="/alerts", tags=["Human review"])


@router.get("")
def list_alerts(official: dict = Depends(require_official)):
    db = get_db()
    alerts = list(db.alerts.find({}).sort("created_at", -1).limit(100))
    return [alert_summary(db, alert) for alert in alerts]


@router.get("/overview")
def alert_overview(official: dict = Depends(require_official)):
    db = get_db()
    pending = db.alerts.count_documents({"status": "pending_review"})
    high = db.alerts.count_documents({"status": "pending_review", "severity": "high"})
    critical = db.alerts.count_documents({"status": "pending_review", "severity": "critical"})
    reviewed_today = db.audit_logs.count_documents({"event": "alert_reviewed", "created_at": {"$gte": datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)}})
    return {"pending": pending, "high": high, "critical": critical, "reviewed_today": reviewed_today}


@router.get("/{alert_id}")
def alert_detail(alert_id: str, official: dict = Depends(require_official)):
    db = get_db()
    alert = db.alerts.find_one({"_id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    user = db.users.find_one({"_id": alert["user_id"]}, {"password_hash": 0}) or {}
    risk = db.risk_scores.find_one({"_id": alert["risk_id"]}) or {}
    # Reviewers see the model's reasons and interaction metadata, never private
    # message text through this administrative case endpoint.
    interactions = list(db.interactions.find({"user_id": alert["user_id"]}, {"text": 0, "voice_reference": 0}).sort("created_at", -1).limit(5))
    actions = list(db.support_actions.find({"alert_id": alert_id}).sort("created_at", -1))
    audit = list(db.audit_logs.find({"alert_id": alert_id}).sort("created_at", -1))
    location = user.get("location")
    return document({
        **alert_summary(db, alert),
        "risk": risk,
        "victim": {"id": user.get("_id"), "name": user.get("full_name", "Unknown"), "consent_status": user.get("consent_status", False)},
        "location_context": {
            "shared": bool(location), "latitude": location.get("latitude") if location else None,
            "longitude": location.get("longitude") if location else None,
            "precision": location.get("precision") if location else None,
            "updated_at": location.get("updated_at") if location else None,
        },
        "recent_interactions": interactions,
        "support_actions": actions,
        "audit_history": audit,
    })


@router.post("/{alert_id}/review")
def review_alert(alert_id: str, payload: ReviewAlertInput, official: dict = Depends(require_official)):
    db = get_db()
    alert = db.alerts.find_one({"_id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    now = datetime.now(UTC)
    db.alerts.update_one({"_id": alert_id}, {"$set": {"status": "reviewed", "assigned_to": official["_id"], "review": {"decision": payload.decision, "note": payload.note, "reviewer_id": official["_id"], "reviewed_at": now}}})
    if alert.get("emergency_event_id"):
        # A real human decision ends the active emergency boundary state. The
        # original event remains in the audit record with its review outcome.
        db.emergency_events.update_one(
            {"_id": alert["emergency_event_id"]},
            {"$set": {"status": "reviewed", "reviewed_at": now, "reviewed_by": official["_id"]}},
        )
    db.audit_logs.insert_one({"_id": str(uuid4()), "alert_id": alert_id, "actor_id": official["_id"], "event": "alert_reviewed", "decision": payload.decision, "created_at": now})
    return {"ok": True}


@router.post("/{alert_id}/actions")
def add_support_action(alert_id: str, payload: SupportActionInput, official: dict = Depends(require_official)):
    db = get_db()
    alert = db.alerts.find_one({"_id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    now = datetime.now(UTC)
    action = {"_id": str(uuid4()), "alert_id": alert_id, "user_id": alert["user_id"], "action_type": payload.action_type, "note": payload.note, "reviewer_id": official["_id"], "status": "initiated", "created_at": now}
    db.support_actions.insert_one(action)
    if payload.scheduled_for:
        display_name = {"counselling": "Counselling session", "medical": "Medical support", "legal": "Legal support", "rehabilitation": "Follow-up check-in", "follow_up": "Follow-up check-in"}[payload.action_type]
        db.support_sessions.insert_one({
            "_id": str(uuid4()), "user_id": alert["user_id"], "alert_id": alert_id,
            "support_type": display_name, "scheduled_for": payload.scheduled_for,
            "status": "scheduled", "created_at": now, "created_by": official["_id"],
        })
    db.alerts.update_one({"_id": alert_id}, {"$set": {"assigned_to": official["_id"], "status": "reviewed"}})
    if alert.get("emergency_event_id"):
        db.emergency_events.update_one(
            {"_id": alert["emergency_event_id"]},
            {"$set": {"status": "under_human_review", "reviewed_at": now, "reviewed_by": official["_id"]}},
        )
    db.audit_logs.insert_one({"_id": str(uuid4()), "alert_id": alert_id, "actor_id": official["_id"], "event": "support_action_initiated", "action_type": payload.action_type, "created_at": now})
    return {"action_id": action["_id"], "status": action["status"], "session_scheduled": bool(payload.scheduled_for)}


def alert_summary(db, alert: dict) -> dict:
    user = db.users.find_one({"_id": alert["user_id"]}, {"full_name": 1}) or {}
    risk = db.risk_scores.find_one({"_id": alert["risk_id"]}, {"dynamic_score": 1, "previous_score": 1, "risk_level": 1, "trend": 1}) or {}
    return document({
        "_id": alert["_id"], "case_reference": f"MM-{alert['user_id'][:8].upper()}", "user_id": alert["user_id"],
        "victim_name": user.get("full_name", "Unknown"), "severity": alert["severity"], "status": alert["status"],
        "created_at": alert["created_at"], "reasons": alert.get("reasons", []),
        "dynamic_score": risk.get("dynamic_score"), "previous_score": risk.get("previous_score"), "risk_level": risk.get("risk_level", alert["severity"]), "trend": risk.get("trend", "new"),
        "is_emergency": bool(alert.get("emergency_event_id")),
    })
