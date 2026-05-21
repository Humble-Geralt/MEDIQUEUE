from __future__ import annotations

from core.enums import QueuePriorityLevel, QueueTicketStatus
from schemas.common import BaseSchema
from schemas.patient import Patient
from schemas.priority import PriorityRequest


class QueueTicket(BaseSchema):
    ticket_no: str
    patient: Patient
    room_no: str
    status: QueueTicketStatus
    priority_level: QueuePriorityLevel
    check_in_time: str


class QueueSnapshot(BaseSchema):
    snapshot_version: str
    room_no: str
    current_call: QueueTicket | None = None
    waiting_list: list[QueueTicket]
    is_paused: bool
    pending_priority_requests: list[PriorityRequest]
    updated_at: str


class CallNextBody(BaseSchema):
    room_no: str
    expected_snapshot_version: str | None = None


class CallSkipBody(BaseSchema):
    room_no: str
    ticket_no: str
    expected_snapshot_version: str | None = None


class PauseResumeBody(BaseSchema):
    room_no: str
    expected_snapshot_version: str | None = None
