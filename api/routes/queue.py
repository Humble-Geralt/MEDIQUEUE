from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from schemas.common import success_response
from services.dependencies import get_queue_service
from services.queue_service import QueueService

router = APIRouter(tags=["queue"])


@router.get("/queue")
async def get_queue(
    room_no: str = Query(..., alias="roomNo"),
    queue_service: QueueService = Depends(get_queue_service),
) -> dict:
    snapshot = queue_service.get_snapshot(room_no)
    return success_response(snapshot, snapshot.snapshot_version)


@router.get("/patients/{patient_id}/queue-view")
async def get_patient_queue_view(
    patient_id: str,
    queue_service: QueueService = Depends(get_queue_service),
) -> dict:
    patient_view, snapshot_version = queue_service.get_patient_queue_view(patient_id)
    return success_response(patient_view, snapshot_version)
