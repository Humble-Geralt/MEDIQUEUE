from __future__ import annotations

from fastapi import APIRouter, Depends

from schemas.common import success_response
from schemas.dev import ResetDemoBody
from services.connection_manager import ConnectionManager
from services.dependencies import get_connection_manager, get_queue_service
from services.queue_service import QueueService

router = APIRouter(tags=["dev"])


@router.post("/dev/reset")
async def reset_demo_state(
    body: ResetDemoBody,
    queue_service: QueueService = Depends(get_queue_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    snapshot = queue_service.reset_demo_state(body.room_no)
    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "queue.updated",
            "payload": snapshot.model_dump(by_alias=True),
        },
    )
    return success_response(snapshot, snapshot.snapshot_version)
