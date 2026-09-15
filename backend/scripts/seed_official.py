"""Create an administrator/reviewer account for a local demo.

Run from the backend directory only after replacing the default JWT secret:
    python scripts/seed_official.py reviewer@example.com "Asha Reviewer" "SecurePass1"
"""
from datetime import UTC, datetime
from pathlib import Path
import sys
from uuid import uuid4

from pymongo.errors import DuplicateKeyError

# ``python scripts/seed_official.py`` sets sys.path to the scripts folder.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.mongo import get_db, initialise_database
from app.security import hash_password


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("Usage: python scripts/seed_official.py EMAIL 'Full Name' PASSWORD")
    _, email, full_name, password = sys.argv
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")
    initialise_database()
    try:
        get_db().users.insert_one({
            "_id": str(uuid4()), "full_name": full_name.strip(), "email": email.lower().strip(),
            "password_hash": hash_password(password), "role": "admin", "consent_status": True,
            "created_at": datetime.now(UTC),
        })
    except DuplicateKeyError:
        raise SystemExit("A user with that email already exists.")
    print(f"Created administrator account for {email.lower().strip()}.")


if __name__ == "__main__":
    main()
