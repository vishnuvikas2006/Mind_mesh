"""Authorised administrative views for registered victim accounts."""
from datetime import UTC, datetime
from uuid import uuid4
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from gridfs import GridFSBucket
from gridfs.errors import NoFile

from app.database.mongo import get_db
from app.routes.interactions import voice_note_summary
from app.schemas import DeleteVictimInput
from app.security import require_official
from app.serialise import document
from app.timeutils import utc_datetime

router = APIRouter(prefix="/official", tags=["Authorised administration"])


def active_location_context(location: dict | None, now: datetime | None = None) -> dict:
    """Return only an active, explicitly shared approximate location."""
    timestamp = utc_datetime(now) or datetime.now(UTC)
    expiry = utc_datetime(location.get("expires_at")) if location else None
    if not location or not expiry or expiry <= timestamp:
        return {"shared": False}
    latitude, longitude = location.get("latitude"), location.get("longitude")
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        return {"shared": False}
    return {
        "shared": True, "latitude": latitude, "longitude": longitude,
        "precision": location.get("precision", "approximate"),
        "updated_at": utc_datetime(location.get("updated_at")), "expires_at": expiry,
    }


@router.get("/victims")
def registered_victims(
    query: str = Query(default="", max_length=100),
    official: dict = Depends(require_official),
):
    """List registered victim accounts for authorised reviewers only.

    The list intentionally contains a limited operational summary; case contents
    are fetched only after the official deliberately opens a member record.
    """
    db = get_db()
    filter_query: dict = {"role": "victim"}
    if query.strip():
        safe_query = {"$regex": query.strip(), "$options": "i"}
        filter_query["$or"] = [{"full_name": safe_query}, {"email": safe_query}]
    users = list(db.users.find(filter_query, {"password_hash": 0}).sort("created_at", -1).limit(200))
    items = [victim_summary(db, user) for user in users]
    # Emergency cases must reach the top for every portal client, not only the
    # web UI. Within each group, the most recent activity appears first.
    items.sort(key=lambda item: item.get("emergency_created_at") or item.get("last_interaction_at") or item.get("created_at") or "", reverse=True)
    items.sort(key=lambda item: not item.get("emergency_active", False))
    return {
        "total": db.users.count_documents(filter_query),
        "items": items,
    }


@router.delete("/victims/{victim_id}")
def permanently_delete_victim(
    victim_id: str = Path(min_length=8, max_length=80, pattern=r"^[A-Za-z0-9-]+$"),
    payload: DeleteVictimInput = ...,
    official: dict = Depends(require_official),
):
    """Permanently remove a victim and the private records tied to the account.

    This endpoint deliberately accepts only victim IDs and requires both a
    current admin session and the literal ``DELETE`` confirmation.  It cannot
    be used to remove the caller, another administrator, or a trusted person.
    MongoDB standalone deployments do not provide multi-document transactions,
    so all dependent records are identified before any deletion is started and
    a minimal audit event is written only after the account deletion succeeds.
    """
    del payload  # Pydantic has already enforced the explicit confirmation.
    db = get_db()
    victim = db.users.find_one({"_id": victim_id, "role": "victim"}, {"_id": 1})
    if not victim:
        # Do not disclose whether another type of account exists at this ID.
        raise HTTPException(status_code=404, detail="Victim account not found or has already been deleted.")

    trusted_ids = [person["_id"] for person in db.users.find(
        {"victim_id": victim_id, "role": "trusted_person"}, {"_id": 1}
    )]
    account_ids = [victim_id, *trusted_ids]
    alert_ids = [alert["_id"] for alert in db.alerts.find({"user_id": victim_id}, {"_id": 1})]
    voice_references = [
        interaction.get("voice_reference")
        for interaction in db.interactions.find(
            {"user_id": victim_id, "voice_reference": {"$exists": True}}, {"voice_reference": 1}
        )
        if isinstance(interaction.get("voice_reference"), str)
    ]

    # Delete sensitive material and child records first.  Audit events are
    # retained as minimal operational evidence and do not contain the victim's
    # name, contact details, messages, transcripts, or location values.
    voice_bucket = GridFSBucket(db)
    for reference in voice_references:
        try:
            voice_bucket.delete(ObjectId(reference))
        except (NoFile, ValueError):
            # A missing/legacy GridFS blob must not leave the account record
            # behind; it is already inaccessible because the metadata is being
            # removed immediately below.
            continue

    for collection_name in (
        "interactions", "risk_scores", "alerts", "emergency_events",
        "help_requests", "support_sessions",
    ):
        db[collection_name].delete_many({"user_id": victim_id})
    db.support_actions.delete_many({"$or": [{"user_id": victim_id}, {"alert_id": {"$in": alert_ids}}]})
    db.password_reset_tokens.delete_many({"user_id": {"$in": account_ids}})
    db.location_shares.delete_many({"$or": [{"victim_id": victim_id}, {"trusted_person_id": {"$in": trusted_ids}}]})

    removed = db.users.delete_many({"_id": {"$in": account_ids}})
    if removed.deleted_count < 1:
        raise HTTPException(status_code=404, detail="Victim account not found or has already been deleted.")

    now = datetime.now(UTC)
    db.audit_logs.insert_one({
        "_id": str(uuid4()),
        "actor_id": official["_id"],
        "target_account_id": victim_id,
        "event": "victim_account_permanently_deleted",
        "created_at": now,
    })
    return {"ok": True, "message": "Victim account and linked private records were permanently deleted."}


@router.get("/victims/{victim_id}")
def registered_victim_detail(victim_id: str, official: dict = Depends(require_official)):
    db = get_db()
    user = db.users.find_one({"_id": victim_id, "role": "victim"}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Victim record not found.")
    latest_risk = db.risk_scores.find_one({"user_id": victim_id}, sort=[("created_at", -1)])
    # Administrative records contain operational metadata only. Private message
    # contents and voice references are not exposed through this portal.
    interactions = list(db.interactions.find({"user_id": victim_id}, {"text": 0, "voice_reference": 0}).sort("created_at", -1).limit(20))
    history = list(db.risk_scores.find({"user_id": victim_id}).sort("created_at", -1).limit(20))
    alerts = list(db.alerts.find({"user_id": victim_id}).sort("created_at", -1).limit(20))
    actions = list(db.support_actions.find({"user_id": victim_id}).sort("created_at", -1).limit(20))
    sessions = list(db.support_sessions.find({"user_id": victim_id}).sort("scheduled_for", 1).limit(20))
    help_requests = list(db.help_requests.find(
        {"user_id": victim_id}, {"interaction_id": 0, "text": 0, "voice_reference": 0}
    ).sort("created_at", -1).limit(20))
    emergency_events = list(db.emergency_events.find({"user_id": victim_id}).sort("created_at", -1).limit(20))
    voice_notes = list(db.interactions.find(
        {"user_id": victim_id, "channel": "voice", "voice_reference": {"$exists": True}},
        {"_id": 1, "mood": 1, "created_at": 1, "voice_reference": 1},
    ).sort("created_at", -1).limit(20))
    trusted_people = list(db.users.find({"victim_id": victim_id, "role": "trusted_person"}, {"password_hash": 0}).sort("created_at", -1))
    location = active_location_context(user.get("location"))
    return document({
        "victim": {"id": user["_id"], "case_reference": f"MM-{user['_id'][:8].upper()}", "full_name": user["full_name"], "username": user.get("username"), "email": user["email"], "mobile": user.get("mobile"), "created_at": user["created_at"], "consent_status": user.get("consent_status", False)},
        "latest_risk": latest_risk,
        "risk_history": list(reversed(history)),
        "recent_interactions": interactions,
        "alerts": [
            {
                "_id": alert["_id"], "severity": alert.get("severity", "high"),
                "status": alert.get("status", "pending_review"),
                "reasons": alert.get("reasons", []), "created_at": alert.get("created_at"),
                "is_emergency": bool(alert.get("emergency_event_id")),
            }
            for alert in alerts
        ],
        "support_actions": actions,
        "support_sessions": sessions,
        "help_requests": help_requests,
        "emergency_events": emergency_events,
        "voice_notes": [voice_note_summary(note) for note in voice_notes],
        "trusted_people": [{"id": person["_id"], "full_name": person["full_name"], "relationship": person.get("relationship"), "enabled": person.get("enabled", True), "permissions": person.get("permissions", [])} for person in trusted_people],
        "location_context": location,
    })


@router.get("/location-context")
def authorised_location_context(official: dict = Depends(require_official)):
    """Active, approximate locations for the admin's relative density view.

    This is intentionally a current, time-limited context feed. It never
    returns past locations or a location that has not been deliberately shared.
    """
    db = get_db()
    now = datetime.now(UTC)
    users = list(db.users.find(
        {"role": "victim", "location.expires_at": {"$gt": now}},
        {"full_name": 1, "location": 1},
    ).limit(200))
    items = []
    for user in users:
        location = active_location_context(user.get("location"), now)
        if not location["shared"]:
            continue
        latest_risk = db.risk_scores.find_one({"user_id": user["_id"]}, sort=[("created_at", -1)]) or {}
        emergency = db.emergency_events.find_one({"user_id": user["_id"], "status": "pending_human_review"})
        items.append({
            "id": user["_id"], "case_reference": f"MM-{user['_id'][:8].upper()}", "full_name": user.get("full_name", "Unknown"),
            "risk_level": latest_risk.get("risk_level", "low"), "emergency_active": bool(emergency), **location,
        })
    return document({"items": items})


def victim_summary(db, user: dict) -> dict:
    victim_id = user["_id"]
    latest_risk = db.risk_scores.find_one({"user_id": victim_id}, sort=[("created_at", -1)])
    latest_interaction = db.interactions.find_one({"user_id": victim_id}, sort=[("created_at", -1)])
    next_session = db.support_sessions.find_one({"user_id": victim_id, "status": "scheduled"}, sort=[("scheduled_for", 1)])
    emergency = db.emergency_events.find_one({"user_id": victim_id, "status": "pending_human_review"}, sort=[("created_at", -1)])
    latest_voice_note = db.interactions.find_one({"user_id": victim_id, "channel": "voice", "voice_reference": {"$exists": True}}, sort=[("created_at", -1)])
    return document({
        "id": victim_id,
        "case_reference": f"MM-{victim_id[:8].upper()}",
        "full_name": user["full_name"],
        "email": user["email"],
        "mobile": user.get("mobile"),
        "created_at": user["created_at"],
        "consent_status": user.get("consent_status", False),
        "latest_risk": {"dynamic_score": latest_risk.get("dynamic_score"), "risk_level": latest_risk.get("risk_level"), "trend": latest_risk.get("trend")} if latest_risk else None,
        "last_interaction_at": latest_interaction.get("created_at") if latest_interaction else None,
        "upcoming_support": next_session.get("support_type") if next_session else None,
        "emergency_active": bool(emergency),
        "emergency_created_at": emergency.get("created_at") if emergency else None,
        "latest_voice_note_at": latest_voice_note.get("created_at") if latest_voice_note else None,
    })
