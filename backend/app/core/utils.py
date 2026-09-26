import uuid
from datetime import datetime, timezone


def make_reference(prefix: str, year: int, count: int) -> str:
    """Generate human-readable operation references.

    Examples:
        make_reference("REC", 2024, 1)  →  "REC/2024/0001"
        make_reference("DEL", 2024, 42) →  "DEL/2024/0042"
    """
    return f"{prefix}/{year}/{str(count + 1).zfill(4)}"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()
