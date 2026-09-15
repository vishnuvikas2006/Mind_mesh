from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database.mongo import get_db

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except (TypeError, ValueError):
        # Treat malformed legacy records exactly like an invalid sign-in rather
        # than leaking implementation details through the authentication API.
        return False


def create_access_token(user_id: str, role: str, session_version: int = 0) -> str:
    expires = datetime.now(UTC) + timedelta(hours=12)
    return jwt.encode({"sub": user_id, "role": role, "sv": session_version, "exp": expires}, settings()["jwt_secret"], algorithm="HS256")


def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please log in to continue.")
    try:
        payload = jwt.decode(credentials.credentials, settings()["jwt_secret"], algorithms=["HS256"])
        user = get_db().users.find_one({"_id": payload["sub"]}, {"password_hash": 0})
        if not user or not user.get("enabled", True) or int(payload.get("sv", 0)) != int(user.get("session_version", 0)):
            user = None
    except (jwt.InvalidTokenError, KeyError):
        user = None
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please log in again.")
    return user


def require_victim(user: Annotated[dict, Depends(current_user)]) -> dict:
    if user.get("role") != "victim":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Victim portal access is required.")
    return user


def require_trusted_person(user: Annotated[dict, Depends(current_user)]) -> dict:
    if user.get("role") != "trusted_person":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trusted-person portal access is required.")
    if user.get("must_change_password"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Change the temporary password before opening the trusted-person portal.")
    return user


def require_official(user: Annotated[dict, Depends(current_user)]) -> dict:
    # ``official`` is retained for existing SIH demo accounts; new UI calls it Admin.
    if user.get("role") not in {"official", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required.")
    return user
