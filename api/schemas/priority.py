from __future__ import annotations

from core.enums import PriorityRequestStatus, ReviewDecision
from schemas.common import BaseSchema


class PriorityAiResult(BaseSchema):
    urgency_level: str
    medical_reason: bool
    is_abuse_suspected: bool
    recommended_action: str
    explanation: str


class PriorityRequest(BaseSchema):
    request_id: str
    ticket_no: str
    description_text: str
    ai_result: PriorityAiResult | None = None
    review_status: PriorityRequestStatus
    created_at: str
    reviewed_at: str | None = None


class CreatePriorityRequestBody(BaseSchema):
    ticket_no: str
    description_text: str


class ReviewPriorityRequestBody(BaseSchema):
    decision: ReviewDecision
    room_no: str
    expected_snapshot_version: str | None = None
