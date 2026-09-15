"""UTC-safe helpers for timestamps read from current and legacy MongoDB data."""
from datetime import UTC, datetime


def utc_datetime(value: datetime | None) -> datetime | None:
    """Treat legacy timezone-naive BSON dates as UTC and normalize all others."""
    if not isinstance(value, datetime):
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def is_after(value: datetime | None, reference: datetime | None = None) -> bool:
    timestamp = utc_datetime(value)
    now = utc_datetime(reference) if reference else datetime.now(UTC)
    return bool(timestamp and now and timestamp > now)
