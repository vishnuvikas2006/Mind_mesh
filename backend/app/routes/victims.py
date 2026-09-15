from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends

from app.database.mongo import get_db
from app.schemas import LocationUpdateInput
from app.security import require_victim
from app.serialise import document
from app.timeutils import is_after, utc_datetime

router = APIRouter(prefix="/victim", tags=["Victim dashboard"])
LOCATION_CONTEXT_DURATION = timedelta(minutes=30)


def live_location(location: dict | None, now: datetime | None = None) -> bool:
    """A location snapshot is visible only during its deliberate share window."""
    return bool(location and is_after(location.get("expires_at"), now))


@router.get("/me/overview")
def overview(user: dict = Depends(require_victim)):
    db = get_db()
    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    recent_risk = list(db.risk_scores.find({"user_id": user["_id"]}).sort("created_at", -1).limit(7))
    sessions = list(db.support_sessions.find({"user_id": user["_id"], "status": "scheduled"}).sort("scheduled_for", 1).limit(3))
    return {
        "checkins_this_week": db.interactions.count_documents({"user_id": user["_id"], "created_at": {"$gte": seven_days_ago}}),
        "latest_risk": document(recent_risk[0]) if recent_risk else None,
        "risk_history": [document(item) for item in reversed(recent_risk)],
        "upcoming_support": [document(item) for item in sessions],
        "location_shared": live_location(user.get("location")),
    }


@router.get("/me/history")
def history(user: dict = Depends(require_victim)):
    db = get_db()
    items = list(db.interactions.find({"user_id": user["_id"]}, {"text": 0}).sort("created_at", -1).limit(30))
    return [document(item) for item in items]


@router.get("/me/support")
def support_history(user: dict = Depends(require_victim)):
    db = get_db()
    actions = list(db.support_actions.find({"user_id": user["_id"]}).sort("created_at", -1).limit(20))
    sessions = list(db.support_sessions.find({"user_id": user["_id"]}).sort("scheduled_for", 1).limit(20))
    return {"actions": [document(action) for action in actions], "sessions": [document(session) for session in sessions]}


@router.get("/me/location")
def location_status(user: dict = Depends(require_victim)):
    location = user.get("location")
    if not live_location(location):
        return {"shared": False, "updated_at": None}
    return {"shared": True, "updated_at": document(utc_datetime(location.get("updated_at"))), "expires_at": document(utc_datetime(location.get("expires_at"))), "precision": "approximate"}


@router.put("/me/location")
def share_approximate_location(payload: LocationUpdateInput, user: dict = Depends(require_victim)):
    """Store only a coarsened location after a deliberate user action."""
    now = datetime.now(UTC)
    location = {
        # Rounding to two decimals makes location context approximate (~1 km), not live tracking.
        "latitude": round(payload.latitude, 2),
        "longitude": round(payload.longitude, 2),
        "accuracy_meters": round(payload.accuracy_meters or 0),
        "updated_at": now,
        # A deliberate location snapshot is not continuous tracking. It expires
        # after the same 30-minute urgent-support window used by the frontend.
        "expires_at": now + LOCATION_CONTEXT_DURATION,
        "precision": "approximate",
    }
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"location": location}})
    return {"shared": True, "updated_at": document(location["updated_at"]), "expires_at": document(location["expires_at"]), "precision": "approximate"}


@router.delete("/me/location")
def remove_location(user: dict = Depends(require_victim)):
    get_db().users.update_one({"_id": user["_id"]}, {"$unset": {"location": ""}})
    return {"shared": False}
