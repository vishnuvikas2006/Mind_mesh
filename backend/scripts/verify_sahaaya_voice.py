"""Safe smoke tests for the authenticated Sahaaya free-tier endpoint.

The test intentionally has no OpenRouter key. It verifies authentication,
payload validation, and the friendly setup response without contacting a cloud
model or sending audio.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
os.environ["MONGODB_DATABASE"] = "mindmesh_sahaaya_verify"
os.environ["OPENAI_API_KEY"] = ""
os.environ["VOICE_PROVIDER"] = "openrouter"
os.environ["OPENROUTER_API_KEY"] = ""
sys.path.insert(0, str(ROOT / "backend"))

from fastapi.testclient import TestClient  # noqa: E402
from app.database.mongo import close_database, get_db  # noqa: E402
from app.main import app  # noqa: E402


def main() -> None:
    database_name = "mindmesh_sahaaya_verify"
    try:
        with TestClient(app) as client:
            account = client.post("/auth/register", json={
                "full_name": "Sahaaya Test", "email": "sahaaya.verify@example.com", "password": "VerifyPass1", "consent": True,
            })
            account.raise_for_status()
            headers = {"Authorization": f"Bearer {account.json()['access_token']}"}
            invalid = client.post("/voice/session", headers=headers, json={"sdp": "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\n", "language": "unsupported"})
            assert invalid.status_code == 422, invalid.text
            unavailable = client.post("/voice/local-turn", headers=headers, json={"text": "Hello", "language": "auto"})
            assert unavailable.status_code == 503, unavailable.text
            assert "openrouter" in unavailable.json()["detail"].lower(), unavailable.text
            unauthenticated = client.post("/voice/local-turn", json={"text": "Hello", "language": "auto"})
            assert unauthenticated.status_code == 401, unauthenticated.text
            print("PASS: Sahaaya free-tier endpoint validates input, requires authentication, and gives a safe setup response.")
    finally:
        db = get_db()
        db.client.drop_database(database_name)
        close_database()
        print(f"Removed temporary database: {database_name}")


if __name__ == "__main__":
    main()
