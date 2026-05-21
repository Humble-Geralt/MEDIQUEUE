from __future__ import annotations

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from core.enums import ConnectionRole
from services.connection_manager import ConnectionManager
from services.dependencies import get_connection_manager, get_queue_service
from services.queue_service import QueueService

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/rooms/{room_no}")
async def room_socket(
    websocket: WebSocket,
    room_no: str,
    role: ConnectionRole = Query(ConnectionRole.DISPLAY),
    patient_id: str | None = Query(default=None, alias="patientId"),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    queue_service: QueueService = Depends(get_queue_service),
) -> None:
    await connection_manager.connect(websocket, room_no, role, patient_id)
    snapshot = queue_service.get_snapshot(room_no)
    await websocket.send_json(
        {
            "type": "snapshot.sync",
            "payload": snapshot.model_dump(by_alias=True),
        }
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, room_no)
