"""End-to-end smoke test for local MindMesh model artifacts.

Uses an isolated MongoDB database and deletes that exact temporary database at
the end. It never reads or modifies the main `mindmesh` database.

Run from `backend/` with the project virtual environment:
    ..\\.venv\\Scripts\\python.exe scripts\\verify_local_models.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST_DATABASE = "mindmesh_model_verify"
os.environ["MONGODB_DATABASE"] = TEST_DATABASE
os.environ["ML_MODEL_DIR"] = str(ROOT / "models")
sys.path.insert(0, str(ROOT / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

from app.database.mongo import close_database, get_db  # noqa: E402
from app.main import app  # noqa: E402


def main() -> None:
    try:
        with TestClient(app) as client:
            registration = client.post(
                "/auth/register",
                json={"full_name": "Model Verification", "email": "model.verify@example.com", "password": "VerifyPass1", "consent": True},
            )
            registration.raise_for_status()
            token = registration.json()["access_token"]
            response = client.post(
                "/interactions/text",
                headers={"Authorization": f"Bearer {token}"},
                json={"text": "I feel scared and need support today.", "mood": "scared", "channel": "check_in"},
            )
            response.raise_for_status()
            risk = response.json()["risk"]
            assert risk["engine_version"] == "risk-gated-prototype-v3", risk
            assert risk["fusion_calibration_score"] is not None, risk
            assert risk["text_score"] is not None, risk
            assert risk["model_signals"]["text"]["used_for_scoring"] is False, risk
            print(
                "PASS: authenticated check-in stored with local BERT support signal "
                f"and XGBoost calibration preview (score={risk['dynamic_score']}, fusion={risk['fusion_calibration_score']})."
            )
    finally:
        # The target is a fixed isolated test database created only by this script.
        db = get_db()
        db.client.drop_database(TEST_DATABASE)
        close_database()
        print(f"Removed temporary database: {TEST_DATABASE}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"FAILED: {error}", file=sys.stderr)
        raise
