from __future__ import annotations

from fastapi import APIRouter, Depends

from core.enums import ReviewDecision
from schemas.common import success_response
from schemas.priority import CreatePriorityRequestBody, ReviewPriorityRequestBody
from services.connection_manager import ConnectionManager
from services.dependencies import (
    get_connection_manager,
    get_priority_service,
    get_queue_service,
    get_tts_service,
)
from services.priority_service import PriorityService
from services.queue_service import QueueService
from services.tts_service import TtsService

router = APIRouter(tags=["priority"])


@router.post("/priority-requests")
async def create_priority_request(
    body: CreatePriorityRequestBody,
    priority_service: PriorityService = Depends(get_priority_service),
    queue_service: QueueService = Depends(get_queue_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    request, snapshot = priority_service.create_request(body.ticket_no, body.description_text)
    ticket = queue_service.find_ticket(body.ticket_no)
    await connection_manager.broadcast(
        ticket.room_no,
        {
            "type": "queue.updated",
            "payload": snapshot.model_dump(by_alias=True),
        },
    )
    return success_response(request, snapshot.snapshot_version)


@router.post("/priority-requests/{request_id}/review")
async def review_priority_request(
    request_id: str,
    body: ReviewPriorityRequestBody,
    priority_service: PriorityService = Depends(get_priority_service),
    tts_service: TtsService = Depends(get_tts_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    request, snapshot, ticket, delayed_ticket = priority_service.review_request(
        request_id=request_id,
        decision=body.decision,
        room_no=body.room_no,
        expected_snapshot_version=body.expected_snapshot_version,
    )
    tts_announcements: list[dict[str, str | None]] = []
    if delayed_ticket is not None and body.decision == ReviewDecision.APPROVE:
        tts_announcements = tts_service.serialize_announcements(
            await tts_service.build_priority_insert_announcement(
                priority_ticket=ticket,
                delayed_ticket=delayed_ticket,
                reason_text=request.description_text,
            )
        )
    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "priority.reviewed",
            "payload": {
                "requestId": request.request_id,
                "ticketNo": ticket.ticket_no,
                "decision": body.decision.value,
                "snapshotVersion": snapshot.snapshot_version,
                "delayedTicketNo": delayed_ticket.ticket_no if delayed_ticket else None,
                "ttsAnnouncements": tts_announcements,
            },
        },
    )
    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "queue.updated",
            "payload": snapshot.model_dump(by_alias=True),
        },
    )
    return success_response(request, snapshot.snapshot_version)
