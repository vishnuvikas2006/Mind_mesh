"""JSON-safe serialization for MongoDB documents returned by the API."""
from datetime import datetime
from typing import Any


def document(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [document(item) for item in value]
    if isinstance(value, dict):
        return {key: document(item) for key, item in value.items()}
    return value
