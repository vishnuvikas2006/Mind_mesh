"""MongoDB lifecycle and collection indexes."""
from datetime import UTC
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from app.config import settings

_client: MongoClient | None = None


def get_db() -> Database:
    global _client
    if _client is None:
        # Read BSON dates as UTC-aware values. Route-level normalization still
        # supports data created by older clients that returned naïve datetimes.
        _client = MongoClient(
            settings()["mongodb_uri"],
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            retryWrites=True,
            tz_aware=True,
            tzinfo=UTC,
        )
    return _client[settings()["database"]]


def initialise_database() -> None:
    db = get_db()
    # A quick ping creates a clear startup failure when MongoDB is unavailable.
    db.client.admin.command("ping")
    db.users.create_index("email", unique=True)
    db.users.create_index("mobile", unique=True, sparse=True)
    db.users.create_index("username", unique=True, sparse=True)
    db.users.create_index([("victim_id", ASCENDING), ("role", ASCENDING)])
    db.users.create_index([("role", ASCENDING), ("created_at", DESCENDING)])
    db.interactions.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.risk_scores.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.alerts.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    db.alerts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.emergency_events.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.help_requests.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.support_actions.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.support_sessions.create_index([("user_id", ASCENDING), ("scheduled_for", ASCENDING)])
    db.audit_logs.create_index([("created_at", DESCENDING)])
    db.audit_logs.create_index([("target_account_id", ASCENDING), ("created_at", DESCENDING)])
    db.password_reset_tokens.create_index("token_hash", unique=True)
    db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    db.location_shares.create_index([("victim_id", ASCENDING), ("trusted_person_id", ASCENDING)], unique=True)
    db.location_shares.create_index("expires_at", expireAfterSeconds=0)


def close_database() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
