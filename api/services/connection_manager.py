from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import WebSocket

from core.enums import ConnectionRole


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

    async def broadcast(self, room_no: str, message: dict[str, Any]) -> None:
        for connection in list(self._rooms.get(room_no, [])):
            await connection.websocket.send_json(message)
