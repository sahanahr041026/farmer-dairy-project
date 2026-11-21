import datetime


def utcnow() -> datetime.datetime:
    """Naive UTC timestamp (matches existing DateTime columns) without the deprecated utcnow()."""
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
