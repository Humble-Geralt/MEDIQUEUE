from __future__ import annotations

import uuid

from adapters.llm_adapter import BaseLlmAdapter
from core.enums import (
    PriorityRequestStatus,
    QueuePriorityLevel,
    QueueTicketStatus,
    ReviewDecision,
)
from core.errors import ApiError
from schemas.priority import PriorityRequest
from schemas.queue import QueueSnapshot, QueueTicket
from services.queue_service import QueueService
from store.in_memory_store import now_iso


class PriorityService:
    def __init__(self, queue_service: QueueService, llm_adapter: BaseLlmAdapter) -> None:
        self.queue_service = queue_service
        self.llm_adapter = llm_adapter

    def create_request(self, ticket_no: str, description_text: str) -> tuple[PriorityRequest, QueueSnapshot]:
        ticket = self.queue_service.find_ticket(ticket_no)

        existing_pending = next(
            (
                request
                for request in self.queue_service.store.priority_requests.values()
                if request.ticket_no == ticket_no
                and request.review_status == PriorityRequestStatus.PENDING
            ),
            None,
        )
        if existing_pending:
            raise ApiError(
                "REQUEST_ALREADY_REVIEWED",
                "There is already a pending priority request for this ticket.",
                409,
            )

        ai_result = self.llm_adapter.analyze(description_text, ticket)
        ticket.priority_level = QueuePriorityLevel.PRIORITY_REVIEWING

        request = PriorityRequest(
            request_id=f"pr_{uuid.uuid4().hex[:8]}",
            ticket_no=ticket_no,
            description_text=description_text,
            ai_result=ai_result,
            review_status=PriorityRequestStatus.PENDING,
            created_at=now_iso(),
        )
        self.queue_service.store.priority_requests[request.request_id] = request
        self.queue_service.store.touch()
        return request, self.queue_service.get_snapshot(ticket.room_no)

    def review_request(
        self,
        request_id: str,
        decision: ReviewDecision,
        room_no: str,
        expected_snapshot_version: str | None = None,
    ) -> tuple[PriorityRequest, QueueSnapshot, QueueTicket, QueueTicket | None]:
        self.queue_service.ensure_room(room_no)
        self.queue_service.ensure_snapshot_version(expected_snapshot_version)

        request = self.queue_service.store.priority_requests.get(request_id)
        if request is None:
            raise ApiError("REQUEST_NOT_FOUND", "Priority request does not exist.", 404)
        if request.review_status != PriorityRequestStatus.PENDING:
            raise ApiError(
                "REQUEST_ALREADY_REVIEWED",
                "Priority request has already been reviewed.",
                409,
            )

        ticket = self.queue_service.find_ticket(request.ticket_no)
        request.reviewed_at = now_iso()
        delayed_ticket: QueueTicket | None = None

        if decision == ReviewDecision.APPROVE:
            request.review_status = PriorityRequestStatus.APPROVED
            ticket.priority_level = QueuePriorityLevel.PRIORITY_APPROVED
            if ticket.status == QueueTicketStatus.WAITING:
                waiting_tickets = self.queue_service.waiting_tickets()
                if waiting_tickets and waiting_tickets[0].ticket_no != ticket.ticket_no:
                    delayed_ticket = waiting_tickets[0]
                self.queue_service.move_ticket_to_waiting_front(ticket.ticket_no)
        else:
            request.review_status = PriorityRequestStatus.REJECTED
            ticket.priority_level = QueuePriorityLevel.NORMAL

        self.queue_service.store.touch()
        return request, self.queue_service.get_snapshot(room_no), ticket, delayed_ticket
