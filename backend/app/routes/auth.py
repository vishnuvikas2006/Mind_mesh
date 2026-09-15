"""Password-only authentication and recovery.

There are deliberately no OTP endpoints, codes, or verification fallbacks in
this module. Trusted people receive credentials from the linked victim and must
replace their temporary password before receiving portal access.
"""
from datetime import UTC, datetime, timedelta
from hashlib import sha256
import secrets
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pymongo.errors import DuplicateKeyError

from app.config import settings
from app.database.mongo import get_db
from app.schemas import ChangePasswordInput, LoginInput, PasswordResetConfirmInput, PasswordResetRequestInput, RegisterInput, TokenResponse
from app.security import create_access_token, current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_ATTEMPTS = 8
RESET_WINDOW_SECONDS = 60 * 60
RESET_ATTEMPTS = 4
_attempts: dict[str, list[float]] = {}


def public_user(user: dict) -> dict:
    allowed = {"_id", "full_name", "username", "email", "mobile", "role", "consent_status", "created_at", "must_change_password", "enabled"}
    return {key: value for key, value in user.items() if key in allowed}


def user_response(user: dict) -> dict:
    return {"access_token": create_access_token(user["_id"], user["role"], int(user.get("session_version", 0))), "user": public_user(user)}


def normalise_identifier(identifier: str) -> str:
    return identifier.strip().lower()


def find_by_identifier(identifier: str) -> dict | None:
    value = normalise_identifier(identifier)
    return get_db().users.find_one({"$or": [{"username": value}, {"email": value}, {"mobile": identifier.strip()}]})


def rate_limit(bucket: str, key: str, limit: int, window: int) -> None:
    now = time.monotonic()
    entries = _attempts.setdefault(f"{bucket}:{key}", [])
    entries[:] = [entry for entry in entries if now - entry < window]
    if len(entries) >= limit:
        raise HTTPException(status_code=429, detail="Please wait before trying again.")
    entries.append(now)


def expected_roles(role: str) -> set[str]:
    return {"admin": {"admin", "official"}, "trusted_person": {"trusted_person"}, "victim": {"victim"}}[role]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterInput):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent is required before creating an account.")
    now = datetime.now(UTC)
    user = {
        "_id": str(uuid4()), "full_name": payload.full_name.strip(), "email": str(payload.email).lower(),
        "mobile": payload.mobile, "password_hash": hash_password(payload.password), "role": "victim",
        "consent_status": True, "enabled": True, "session_version": 0, "created_at": now, "updated_at": now,
    }
    if payload.username:
        user["username"] = payload.username
    try:
        get_db().users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account already exists with those details.")
    return user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginInput, request: Request):
    # Limit by both identifier and source address without revealing account state.
    source = request.client.host if request.client else "unknown"
    rate_limit("login", f"{source}:{normalise_identifier(payload.identifier)}", LOGIN_ATTEMPTS, LOGIN_WINDOW_SECONDS)
    user = find_by_identifier(payload.identifier)
    if not user or not user.get("enabled", True) or user.get("role") not in expected_roles(payload.expected_role) or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="The sign-in details are incorrect.")
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": datetime.now(UTC)}})
    return user_response(user)


@router.post("/change-password", response_model=TokenResponse)
def change_password(payload: ChangePasswordInput, user: dict = Depends(current_user)):
    # ``current_user`` intentionally excludes password hashes from ordinary
    # route handlers, so fetch it only for this credential verification step.
    stored_user = get_db().users.find_one({"_id": user["_id"]})
    if not stored_user or not verify_password(payload.current_password, stored_user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="The current password is incorrect.")
    now = datetime.now(UTC)
    next_version = int(stored_user.get("session_version", 0)) + 1
    get_db().users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(payload.new_password), "must_change_password": False, "updated_at": now, "session_version": next_version}},
    )
    get_db().audit_logs.insert_one({"_id": str(uuid4()), "actor_id": user["_id"], "event": "password_changed", "created_at": now})
    updated = get_db().users.find_one({"_id": user["_id"]})
    return user_response(updated)


@router.post("/password-reset/request")
def request_password_reset(payload: PasswordResetRequestInput, request: Request):
    """Create a short-lived, single-use token without account enumeration.

    Production delivery requires an email provider. The raw URL is included only
    when explicit development mode is enabled, never in normal responses.
    """
    source = request.client.host if request.client else "unknown"
    rate_limit("reset", f"{source}:{normalise_identifier(payload.identifier)}", RESET_ATTEMPTS, RESET_WINDOW_SECONDS)
    user = find_by_identifier(payload.identifier)
    response: dict[str, object] = {"ok": True, "message": "If an account matches those details, reset instructions are available."}
    if not user or not user.get("enabled", True):
        return response
    raw_token = secrets.token_urlsafe(32)
    token_hash = sha256(raw_token.encode()).hexdigest()
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=int(settings()["password_reset_ttl_minutes"]))
    get_db().password_reset_tokens.update_many({"user_id": user["_id"], "used_at": None}, {"$set": {"used_at": now, "invalidated_reason": "superseded"}})
    get_db().password_reset_tokens.insert_one({"_id": str(uuid4()), "user_id": user["_id"], "token_hash": token_hash, "created_at": now, "expires_at": expires_at, "used_at": None})
    # Email dispatch is intentionally not simulated. A deployment must connect
    # an approved provider before claiming it sent a link.
    if settings()["password_reset_dev_mode"]:
        response["development_only_reset_url"] = f"{settings()['frontend_origin']}/reset-password?token={raw_token}"
        response["development_only"] = True
    return response


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirmInput):
    now = datetime.now(UTC)
    token = get_db().password_reset_tokens.find_one({"token_hash": sha256(payload.token.encode()).hexdigest(), "used_at": None, "expires_at": {"$gt": now}})
    if not token:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has expired.")
    user = get_db().users.find_one({"_id": token["user_id"]})
    if not user or not user.get("enabled", True):
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has expired.")
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(payload.new_password), "must_change_password": False, "session_version": int(user.get("session_version", 0)) + 1, "updated_at": now}})
    get_db().password_reset_tokens.update_one({"_id": token["_id"]}, {"$set": {"used_at": now}})
    get_db().audit_logs.insert_one({"_id": str(uuid4()), "actor_id": user["_id"], "event": "password_reset", "created_at": now})
    return {"ok": True, "message": "Password updated. Please sign in with the new password."}


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return public_user(user)
