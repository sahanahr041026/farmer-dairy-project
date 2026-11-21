"""Money helpers: exact decimal arithmetic with half-up rounding to paise.

Database columns are NUMERIC (see models.Money / models.Rate); values cross the ORM
boundary as floats already rounded to 2 decimals, and every calculation or total goes
through these helpers so binary-float drift (e.g. round(2.675, 2) == 2.67) never reaches
a stored or displayed amount.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Optional

_CENT = Decimal("0.01")


def D(value) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


def q2(value) -> float:
    """Round half-up to 2 decimals."""
    return float(D(value).quantize(_CENT, rounding=ROUND_HALF_UP))


def money_sum(values: Iterable) -> float:
    total = Decimal("0")
    for v in values:
        if v is not None:
            total += D(v)
    return q2(total)


def calc_amount(quantity, rate) -> float:
    return q2(D(quantity) * D(rate))


def clamp(value, lo: Optional[float], hi: Optional[float]) -> Decimal:
    v = D(value)
    if lo is not None:
        v = max(v, D(lo))
    if hi is not None:
        v = min(v, D(hi))
    return v
