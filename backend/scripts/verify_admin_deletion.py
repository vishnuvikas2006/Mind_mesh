"""Smoke-test permanent victim deletion and its backend authorization.

Run from ``backend`` with MongoDB running.  The script creates one uniquely
named temporary database and removes only that database when it finishes.
"""
import os
from datetime import UTC, datetime
from pathlib import Path
import sys
from uuid import uuid4

os.environ["MONGODB_DATABASE"] = f"mindmesh_delete_verify_{uuid4().hex}"
os.environ["JWT_SECRET"] = "verify-delete-only-not-a-production-secret"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from gridfs import GridFSBucket

from app.config import settings
from app.database.mongo import close_database, get_db

settings.cache_clear()
from app.main import app
from app.security import hash_password


def bearer(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def main() -> None:
    database = os.environ["MONGODB_DATABASE"]
    try:
        with TestClient(app) as client:
            victim_response = client.post("/auth/register", json={
                "full_name": "Deletion Verify Victim", "email": "delete.victim@example.com",
                "mobile": "+15550002001", "password": "VictimPass1", "consent": True,
            })
            assert victim_response.status_code == 201, victim_response.text
            victim = victim_response.json()
            victim_id = victim["user"]["_id"]
            victim_token = victim["access_token"]

            db = get_db()
            trusted_id = str(uuid4())
            db.users.insert_one({
                "_id": trusted_id, "victim_id": victim_id, "role": "trusted_person",
                "full_name": "Linked Trusted", "email": "linked.trusted@example.com",
                "password_hash": hash_password("TrustedPass1"), "enabled": True,
                "session_version": 0,
            })
            audio_id = GridFSBucket(db).upload_from_stream("private.webm", b"private-audio", metadata={"user_id": victim_id})
            db.interactions.insert_one({"_id": str(uuid4()), "user_id": victim_id, "text": "private", "voice_reference": str(audio_id), "created_at": datetime.now(UTC)})
            db.location_shares.insert_one({"_id": str(uuid4()), "victim_id": victim_id, "trusted_person_id": trusted_id})

            admin_id = str(uuid4())
            db.users.insert_one({
                "_id": admin_id, "full_name": "Deletion Verify Admin", "email": "delete.admin@example.com",
                "password_hash": hash_password("AdminPass1"), "role": "admin", "enabled": True,
                "session_version": 0,
            })
            admin_response = client.post("/auth/login", json={"identifier": "delete.admin@example.com", "password": "AdminPass1", "expected_role": "admin"})
            assert admin_response.status_code == 200, admin_response.text
            admin_token = admin_response.json()["access_token"]

            endpoint = f"/official/victims/{victim_id}"
            assert client.request("DELETE", endpoint, json={"confirmation": "DELETE"}).status_code == 401
            assert client.request("DELETE", endpoint, headers=bearer(victim_token), json={"confirmation": "DELETE"}).status_code == 403
            assert client.request("DELETE", endpoint, headers=bearer(admin_token), json={"confirmation": "NO"}).status_code == 422
            assert client.request("DELETE", f"/official/victims/{admin_id}", headers=bearer(admin_token), json={"confirmation": "DELETE"}).status_code == 404

            deleted = client.request("DELETE", endpoint, headers=bearer(admin_token), json={"confirmation": "DELETE"})
            assert deleted.status_code == 200, deleted.text
            assert db.users.find_one({"_id": victim_id}) is None
            assert db.users.find_one({"_id": trusted_id}) is None
            assert db.interactions.count_documents({"user_id": victim_id}) == 0
            assert db.location_shares.count_documents({"victim_id": victim_id}) == 0
            assert db.fs.files.count_documents({"_id": audio_id}) == 0
            assert db.audit_logs.count_documents({"event": "victim_account_permanently_deleted", "actor_id": admin_id, "target_account_id": victim_id}) == 1
            assert client.request("DELETE", endpoint, headers=bearer(admin_token), json={"confirmation": "DELETE"}).status_code == 404
        print("Admin-only victim deletion, linked-record cleanup, and audit checks passed.")
    finally:
        close_database()
        from pymongo import MongoClient
        MongoClient(os.environ.get("MONGODB_URI", "mongodb://localhost:27017"), serverSelectionTimeoutMS=3000).drop_database(database)


if __name__ == "__main__":
    main()
