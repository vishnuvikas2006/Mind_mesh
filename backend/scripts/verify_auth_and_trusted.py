"""End-to-end smoke test for authentication, trusted access, and safety flows.

Uses an isolated MongoDB database and deletes only that generated test database
when finished. Run from ``backend`` with the project virtual environment.
"""
import os
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

os.environ["MONGODB_DATABASE"] = f"m{uuid4().hex[:24]}"
os.environ["JWT_SECRET"] = "verify-auth-only-not-a-production-secret"
os.environ["PASSWORD_RESET_DEV_MODE"] = "true"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.config import settings
from app.database.mongo import close_database, get_db

settings.cache_clear()
from app.main import app
from app.security import hash_password


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def main() -> None:
    database = os.environ["MONGODB_DATABASE"]
    try:
        with TestClient(app) as client:
            victim = client.post("/auth/register", json={"full_name": "Verify Victim", "email": "victim.verify@example.com", "mobile": "+15550001001", "password": "VictimPass1", "consent": True})
            assert victim.status_code == 201, victim.text
            victim_data = victim.json(); victim_token = victim_data["access_token"]; victim_id = victim_data["user"]["_id"]
            assert client.post("/auth/login", json={"identifier": "+15550001001", "password": "VictimPass1", "expected_role": "victim"}).status_code == 200
            assert client.post("/auth/login", json={"identifier": "victim.verify@example.com", "password": "VictimPass1", "expected_role": "admin"}).status_code == 401

            created = client.post("/trusted/people", headers=bearer(victim_token), json={"full_name": "Verify Trusted", "email": "trusted.verify@example.com", "relationship": "Friend", "temporary_password": "TemporaryPass1", "confirm_temporary_password": "TemporaryPass1", "permissions": ["help_requests", "emergency_alerts"]})
            assert created.status_code == 201, created.text
            trusted = created.json(); assert "password_hash" not in trusted and "temporary_password" not in trusted
            trusted_id = trusted["_id"]

            trusted_login = client.post("/auth/login", json={"identifier": "trusted.verify@example.com", "password": "TemporaryPass1", "expected_role": "trusted_person"})
            assert trusted_login.status_code == 200, trusted_login.text
            trusted_token = trusted_login.json()["access_token"]
            assert trusted_login.json()["user"]["must_change_password"] is True
            assert client.get("/trusted/portal", headers=bearer(trusted_token)).status_code == 403
            changed = client.post("/auth/change-password", headers=bearer(trusted_token), json={"current_password": "TemporaryPass1", "new_password": "TrustedPass2"})
            assert changed.status_code == 200, changed.text
            trusted_token = changed.json()["access_token"]
            assert client.get("/trusted/portal", headers=bearer(trusted_token)).status_code == 200
            assert client.get("/victim/me/overview", headers=bearer(trusted_token)).status_code == 403

            help_request = client.post("/interactions/text", headers=bearer(victim_token), json={"text": "I need someone to help me", "mood": "need_help", "channel": "check_in"})
            assert help_request.status_code == 200, help_request.text
            assert help_request.json()["help_request"]["delivery"]["delivery_status"] == "recorded_for_in_app_review"
            portal = client.get("/trusted/portal", headers=bearer(trusted_token))
            assert portal.status_code == 200 and len(portal.json().get("help_requests", [])) == 1

            location_permission = client.patch(f"/trusted/people/{trusted_id}", headers=bearer(victim_token), json={"permissions": ["help_requests", "emergency_alerts", "live_location"]})
            assert location_permission.status_code == 200, location_permission.text
            assert client.get("/trusted/portal", headers=bearer(trusted_token)).status_code == 401
            trusted_token = client.post("/auth/login", json={"identifier": "trusted.verify@example.com", "password": "TrustedPass2", "expected_role": "trusted_person"}).json()["access_token"]
            assert client.put("/victim/me/location", headers=bearer(victim_token), json={"latitude": 12.9716, "longitude": 77.5946}).status_code == 200
            assert client.post("/trusted/location-shares", headers=bearer(victim_token), json={"trusted_person_id": trusted_id, "duration_minutes": 15}).status_code == 200
            assert client.get("/trusted/portal/location", headers=bearer(trusted_token)).json()["shared"] is True
            assert client.delete(f"/trusted/location-shares/{trusted_id}", headers=bearer(victim_token)).status_code == 200
            assert client.get("/trusted/portal/location", headers=bearer(trusted_token)).json()["shared"] is False

            emergency = client.post("/emergencies", headers=bearer(victim_token)); assert emergency.status_code == 200, emergency.text
            assert emergency.json()["delivery"]["external_delivery"] == "not_configured"
            assert client.post("/emergencies", headers=bearer(victim_token)).json()["duplicate_prevented"] is True

            reset = client.post("/auth/password-reset/request", json={"identifier": "victim.verify@example.com"})
            assert reset.status_code == 200 and reset.json().get("development_only") is True
            reset_token = parse_qs(urlparse(reset.json()["development_only_reset_url"]).query)["token"][0]
            assert client.post("/auth/password-reset/confirm", json={"token": reset_token, "new_password": "VictimPass2"}).status_code == 200
            assert client.get("/victim/me/overview", headers=bearer(victim_token)).status_code == 401
            victim_token = client.post("/auth/login", json={"identifier": "victim.verify@example.com", "password": "VictimPass2", "expected_role": "victim"}).json()["access_token"]

            get_db().users.insert_one({"_id": "verify-admin", "full_name": "Verify Admin", "email": "admin.verify@example.com", "password_hash": hash_password("AdminPass1"), "role": "admin", "enabled": True, "session_version": 0})
            admin_login = client.post("/auth/login", json={"identifier": "admin.verify@example.com", "password": "AdminPass1", "expected_role": "admin"})
            assert admin_login.status_code == 200, admin_login.text
            admin_token = admin_login.json()["access_token"]
            assert client.get("/official/victims", headers=bearer(admin_token)).status_code == 200
            detail = client.get(f"/official/victims/{victim_id}", headers=bearer(admin_token))
            assert detail.status_code == 200 and "I need someone to help me" not in detail.text
            assert client.get("/official/victims", headers=bearer(victim_token)).status_code == 403
        print("Authentication, trusted-person, location, help-request, emergency, reset, and admin checks passed.")
    finally:
        close_database()
        # This exact generated database is the only destructive operation here.
        from pymongo import MongoClient
        MongoClient(os.environ.get("MONGODB_URI", "mongodb://localhost:27017"), serverSelectionTimeoutMS=3000).drop_database(database)


if __name__ == "__main__":
    main()
