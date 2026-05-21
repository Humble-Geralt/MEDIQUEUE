from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter

from schemas.common import success_response

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    return success_response(
        {
            "status": "ok",
            "serverTime": datetime.now(UTC).isoformat(),
        }
    )
