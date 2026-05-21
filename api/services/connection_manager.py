from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

from core.enums import ConnectionRole

logger = logging.getLogger(__name__)


@dataclass
class ConnectionRecord:
    websocket: WebSocket
    role: ConnectionRole
    patient_id: str | None = None


class ConnectionManager:
    def __init__(self) -> None:
        self._rooms: dict[str, list[ConnectionRecord]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        room_no: str,
        role: ConnectionRole,
        patient_id: str | None = None,
    ) -> None:
        await websocket.accept()
        self._rooms.setdefault(room_no, []).append(
            ConnectionRecord(websocket=websocket, role=role, patient_id=patient_id)
        )

    def disconnect(self, websocket: WebSocket, room_no: str) -> None:
        room_connections = self._rooms.get(room_no, [])
        self._rooms[room_no] = [
            item for item in room_connections if item.websocket is not websocket
        ]
        if not self._rooms[room_no]:
            self._rooms.pop(room_no, None)

    async def broadcast(self, room_no: str, message: dict[str, Any]) -> None:
        for connection in list(self._rooms.get(room_no, [])):
            try:
                await connection.websocket.send_json(message)
            except (RuntimeError, WebSocketDisconnect) as exc:
                logger.info(
                    "Dropping stale websocket during broadcast for room %s: %s",
                    room_no,
                    exc,
                )
                self.disconnect(connection.websocket, room_no)
