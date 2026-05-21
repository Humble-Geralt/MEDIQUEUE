from __future__ import annotations

from core.enums import Gender, Language, QueueTicketStatus
from schemas.common import BaseSchema


class Patient(BaseSchema):
    patient_id: str
    name: str
    gender: Gender
    english_name_or_pinyin: str | None = None
    language: Language


class PatientQueueView(BaseSchema):
    patient_id: str
    patient_name: str
    ticket_no: str
    status: QueueTicketStatus
    room_no: str
    people_ahead: int
    estimated_wait_minutes: int
    is_paused: bool
    is_offline_snapshot: bool = False
    is_my_turn: bool = False
