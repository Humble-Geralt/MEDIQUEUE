from __future__ import annotations

from fastapi import APIRouter, Depends

from schemas.common import success_response
from schemas.queue import CallNextBody, CallRecallBody, CallSkipBody, PauseResumeBody
from services.connection_manager import ConnectionManager
from services.dependencies import (
    get_connection_manager,
    get_queue_service,
    get_tts_service,
)
from services.queue_service import QueueService
from services.tts_service import TtsService

router = APIRouter(tags=["calls"])


@router.post("/calls/next")
async def call_next(
    body: CallNextBody,
    queue_service: QueueService = Depends(get_queue_service),
    tts_service: TtsService = Depends(get_tts_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    snapshot, next_ticket = queue_service.call_next(
        body.room_no, body.expected_snapshot_version
    )
    announcements = tts_service.serialize_announcements(
        await tts_service.build_call_announcement(next_ticket)
    )

    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "call.started",
            "payload": {
                "roomNo": body.room_no,
                "currentCall": queue_service.build_public_call_payload(next_ticket),
                "snapshotVersion": snapshot.snapshot_version,
                "isRecall": False,
                "ttsAnnouncements": announcements,
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
    return success_response(snapshot, snapshot.snapshot_version)


@router.post("/calls/recall")
async def recall_current(
    body: CallRecallBody,
    queue_service: QueueService = Depends(get_queue_service),
    tts_service: TtsService = Depends(get_tts_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    snapshot, current_ticket = queue_service.recall_current(
        body.room_no, body.expected_snapshot_version
    )
    announcements = tts_service.serialize_announcements(
        await tts_service.build_call_announcement(current_ticket, is_recall=True)
    )

    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "call.recalled",
            "payload": {
                "roomNo": body.room_no,
                "currentCall": queue_service.build_public_call_payload(current_ticket),
                "snapshotVersion": snapshot.snapshot_version,
                "isRecall": True,
                "ttsAnnouncements": announcements,
            },
        },
    )
    return success_response(snapshot, snapshot.snapshot_version)


@router.post("/calls/skip")
async def skip_current(
    body: CallSkipBody,
    queue_service: QueueService = Depends(get_queue_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    snapshot, skipped_ticket = queue_service.skip_current(
        body.room_no,
        body.ticket_no,
        body.expected_snapshot_version,
    )
    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "call.skipped",
            "payload": {
                "roomNo": body.room_no,
                "ticketNo": skipped_ticket.ticket_no,
                "snapshotVersion": snapshot.snapshot_version,
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
    return success_response(snapshot, snapshot.snapshot_version)


@router.post("/calls/pause")
async def pause_calls(
    body: PauseResumeBody,
    queue_service: QueueService = Depends(get_queue_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    snapshot = queue_service.pause(body.room_no, body.expected_snapshot_version)
    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "call.paused",
            "payload": {
                "roomNo": body.room_no,
                "snapshotVersion": snapshot.snapshot_version,
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
    return success_response(snapshot, snapshot.snapshot_version)


@router.post("/calls/resume")
async def resume_calls(
    body: PauseResumeBody,
    queue_service: QueueService = Depends(get_queue_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
) -> dict:
    snapshot = queue_service.resume(body.room_no, body.expected_snapshot_version)
    await connection_manager.broadcast(
        body.room_no,
        {
            "type": "call.resumed",
            "payload": {
                "roomNo": body.room_no,
                "snapshotVersion": snapshot.snapshot_version,
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
    return success_response(snapshot, snapshot.snapshot_version)

