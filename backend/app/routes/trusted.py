"""Victim-managed trusted-person accounts and permission-gated views."""
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from app.database.mongo import get_db
from app.routes.interactions import voice_note_summary
from app.schemas import LocationShareInput, TrustedPersonCreateInput, TrustedPersonUpdateInput
from app.security import hash_password, require_trusted_person, require_victim
from app.serialise import document
from app.timeutils import utc_datetime

router = APIRouter(prefix="/trusted", tags=["Trusted persons"])


def shared_alert_summary(alert: dict) -> dict:
    """The trusted portal receives status metadata, never private alert content."""
    return {
        "_id": alert["_id"], "severity": alert.get("severity", "high"),
        "status": alert.get("status", "pending_review"), "created_at": alert.get("created_at"),
        "is_emergency": bool(alert.get("emergency_event_id")),
    }


def trusted_summary(person: dict) -> dict:
    return {
        "_id": person["_id"], "full_name": person["full_name"], "email": person["email"], "mobile": person.get("mobile"),
        "relationship": person.get("relationship", "Trusted person"), "permissions": sorted(person.get("permissions", [])),
        "enabled": person.get("enabled", True), "must_change_password": person.get("must_change_password", False),
        "created_at": person.get("created_at"), "updated_at": person.get("updated_at"),
    }


def owned_person(victim_id: str, person_id: str) -> dict:
    person = get_db().users.find_one({"_id": person_id, "victim_id": victim_id, "role": "trusted_person"})
    if not person:
        raise HTTPException(status_code=404, detail="Trusted person not found.")
    return person


def audit(actor_id: str, event: str, target_id: str | None = None, **extra) -> None:
    get_db().audit_logs.insert_one({"_id": str(uuid4()), "actor_id": actor_id, "target_id": target_id, "event": event, "created_at": datetime.now(UTC), **extra})


@router.get("/people")
def list_people(victim: dict = Depends(require_victim)):
    people = list(get_db().users.find({"victim_id": victim["_id"], "role": "trusted_person"}, {"password_hash": 0}).sort("created_at", -1))
    return [document(trusted_summary(person)) for person in people]


@router.post("/people", status_code=201)
def create_person(payload: TrustedPersonCreateInput, victim: dict = Depends(require_victim)):
    now = datetime.now(UTC)
    person = {
        "_id": str(uuid4()), "full_name": payload.full_name.strip(), "email": str(payload.email).lower(), "mobile": payload.mobile,
        "relationship": payload.relationship.strip(), "password_hash": hash_password(payload.temporary_password),
        "role": "trusted_person", "victim_id": victim["_id"], "permissions": sorted(payload.permissions),
        "must_change_password": True, "enabled": True, "session_version": 0, "consent_status": False,
        "created_at": now, "updated_at": now,
    }
    try:
        get_db().users.insert_one(person)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account already exists with those contact details.")
    audit(victim["_id"], "trusted_person_created", person["_id"], permissions=person["permissions"])
    return document(trusted_summary(person))


@router.patch("/people/{person_id}")
def update_person(person_id: str, payload: TrustedPersonUpdateInput, victim: dict = Depends(require_victim)):
    person = owned_person(victim["_id"], person_id)
    updates = payload.model_dump(exclude_none=True)
    if "full_name" in updates:
        updates["full_name"] = updates["full_name"].strip()
    if "relationship" in updates:
        updates["relationship"] = updates["relationship"].strip()
    if "email" in updates:
        updates["email"] = str(updates["email"]).lower()
    if "permissions" in updates:
        updates["permissions"] = sorted(updates["permissions"])
    if not updates:
        return document(trusted_summary(person))
    updates["updated_at"] = datetime.now(UTC)
    # Permission and account-status changes immediately invalidate existing
    # trusted-person tokens; the frontend cannot bypass this server-side check.
    if "permissions" in updates or "enabled" in updates:
        updates["session_version"] = int(person.get("session_version", 0)) + 1
        if updates.get("enabled") is False:
            get_db().location_shares.update_one({"victim_id": victim["_id"], "trusted_person_id": person_id}, {"$set": {"active": False, "revoked_at": updates["updated_at"]}})
    try:
        get_db().users.update_one({"_id": person_id}, {"$set": updates})
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account already exists with those contact details.")
    audit(victim["_id"], "trusted_person_updated", person_id, fields=sorted(key for key in updates if key not in {"updated_at", "session_version"}))
    return document(trusted_summary(get_db().users.find_one({"_id": person_id})))


@router.delete("/people/{person_id}")
def remove_person(person_id: str, victim: dict = Depends(require_victim)):
    person = owned_person(victim["_id"], person_id)
    now = datetime.now(UTC)
    get_db().users.update_one({"_id": person["_id"]}, {"$set": {"enabled": False, "updated_at": now, "session_version": int(person.get("session_version", 0)) + 1}})
    get_db().location_shares.update_one({"victim_id": victim["_id"], "trusted_person_id": person_id}, {"$set": {"active": False, "revoked_at": now}})
    audit(victim["_id"], "trusted_person_removed", person_id)
    return {"ok": True}


@router.get("/people/{person_id}/history")
def person_history(person_id: str, victim: dict = Depends(require_victim)):
    owned_person(victim["_id"], person_id)
    records = list(get_db().audit_logs.find({"target_id": person_id, "actor_id": victim["_id"]}).sort("created_at", -1).limit(100))
    return [document(record) for record in records]


@router.get("/location-shares")
def location_shares(victim: dict = Depends(require_victim)):
    shares = list(get_db().location_shares.find({"victim_id": victim["_id"]}).sort("created_at", -1))
    return [document({"trusted_person_id": share["trusted_person_id"], "active": share.get("active", False), "expires_at": share.get("expires_at"), "updated_at": share.get("updated_at")}) for share in shares]


@router.post("/location-shares")
def start_location_share(payload: LocationShareInput, victim: dict = Depends(require_victim)):
    person = owned_person(victim["_id"], payload.trusted_person_id)
    if not person.get("enabled", True) or "live_location" not in person.get("permissions", []):
        raise HTTPException(status_code=400, detail="Enable the live-location permission for this trusted person first.")
    now = datetime.now(UTC)
    expires_at = None if payload.duration_minutes == 0 else now + timedelta(minutes=payload.duration_minutes)
    get_db().location_shares.update_one(
        {"victim_id": victim["_id"], "trusted_person_id": person["_id"]},
        {"$set": {"active": True, "expires_at": expires_at, "updated_at": now, "revoked_at": None}, "$setOnInsert": {"_id": str(uuid4()), "created_at": now}},
        upsert=True,
    )
    audit(victim["_id"], "location_share_started", person["_id"], expires_at=expires_at)
    return {"active": True, "expires_at": expires_at}


@router.delete("/location-shares/{person_id}")
def stop_location_share(person_id: str, victim: dict = Depends(require_victim)):
    owned_person(victim["_id"], person_id)
    now = datetime.now(UTC)
    get_db().location_shares.update_one({"victim_id": victim["_id"], "trusted_person_id": person_id}, {"$set": {"active": False, "revoked_at": now, "updated_at": now}})
    audit(victim["_id"], "location_share_stopped", person_id)
    return {"active": False}


@router.get("/portal")
def trusted_portal(person: dict = Depends(require_trusted_person)):
    db = get_db()
    victim = db.users.find_one({"_id": person.get("victim_id"), "role": "victim"}, {"password_hash": 0})
    if not victim:
        raise HTTPException(status_code=404, detail="The linked victim account is unavailable.")
    permissions = set(person.get("permissions", []))
    result: dict = {"victim": {"full_name": victim.get("full_name")}, "relationship": person.get("relationship"), "permissions": sorted(permissions), "connection_active": person.get("enabled", True)}
    latest_risk = db.risk_scores.find_one({"user_id": victim["_id"]}, sort=[("created_at", -1)])
    latest_checkin = db.interactions.find_one({"user_id": victim["_id"], "channel": "check_in"}, sort=[("created_at", -1)])
    if "wellbeing_score" in permissions and latest_risk:
        result["wellbeing_score"] = latest_risk.get("dynamic_score")
    if "wellbeing_status" in permissions and latest_risk:
        result["wellbeing_status"] = latest_risk.get("risk_level")
    if "daily_checkins" in permissions and latest_checkin:
        result["latest_checkin"] = {"mood": latest_checkin.get("mood"), "created_at": latest_checkin.get("created_at")}
    if "alert_history" in permissions:
        alerts = list(db.alerts.find({"user_id": victim["_id"]}, {"reasons": 0}).sort("created_at", -1).limit(20))
        result["alerts"] = [shared_alert_summary(alert) for alert in alerts]
    elif "emergency_alerts" in permissions:
        # Emergency access is intentionally narrower than alert history.
        alerts = list(db.alerts.find({"user_id": victim["_id"], "status": "pending_review"}, {"reasons": 0}).sort("created_at", -1).limit(20))
        result["alerts"] = [shared_alert_summary(alert) for alert in alerts]
    if "emergency_alerts" in permissions or "alert_history" in permissions:
        result["emergency_active"] = bool(db.emergency_events.find_one({"user_id": victim["_id"], "status": "pending_human_review"}))
    if "help_requests" in permissions:
        result["help_requests"] = list(db.interactions.find(
            {"user_id": victim["_id"], "mood": "need_help"},
            {"text": 0, "voice_reference": 0, "audio_reference": 0},
        ).sort("created_at", -1).limit(20))
    if "voice_notes" in permissions:
        voice_notes = list(db.interactions.find(
            {"user_id": victim["_id"], "channel": "voice", "voice_reference": {"$exists": True}},
            {"_id": 1, "mood": 1, "created_at": 1, "voice_reference": 1},
        ).sort("created_at", -1).limit(20))
        result["voice_notes"] = [voice_note_summary(note) for note in voice_notes]
    return document(result)


@router.get("/portal/location")
def trusted_location(person: dict = Depends(require_trusted_person)):
    if "live_location" not in person.get("permissions", []):
        raise HTTPException(status_code=403, detail="Location sharing is not authorised by the victim.")
    now = datetime.now(UTC)
    db = get_db()
    share = db.location_shares.find_one({"victim_id": person.get("victim_id"), "trusted_person_id": person["_id"], "active": True, "$or": [{"expires_at": None}, {"expires_at": {"$gt": now}}]})
    if not share:
        latest_share = db.location_shares.find_one({"victim_id": person.get("victim_id"), "trusted_person_id": person["_id"]}, sort=[("updated_at", -1)])
        if latest_share and latest_share.get("revoked_at"):
            return {"shared": False, "state": "revoked"}
        latest_expiry = utc_datetime(latest_share.get("expires_at")) if latest_share else None
        if latest_expiry and latest_expiry <= now:
            return {"shared": False, "state": "expired", "expires_at": document(latest_expiry)}
        return {"shared": False, "state": "not_active"}
    victim = db.users.find_one({"_id": person["victim_id"]}, {"location": 1})
    location = victim.get("location") if victim else None
    if not location:
        return {"shared": False, "state": "waiting_for_location", "expires_at": document(utc_datetime(share.get("expires_at")))}
    location_expires_at = utc_datetime(location.get("expires_at"))
    if not location_expires_at or location_expires_at <= now:
        return {"shared": False, "state": "location_expired", "expires_at": document(location_expires_at or utc_datetime(share.get("expires_at")))}
    share_expires_at = utc_datetime(share.get("expires_at"))
    active_until = min((value for value in [share_expires_at, location_expires_at] if value is not None), default=location_expires_at)
    return document({"shared": True, "state": "active", "expires_at": active_until, "precision": location.get("precision"), "latitude": location.get("latitude"), "longitude": location.get("longitude"), "updated_at": utc_datetime(location.get("updated_at"))})
