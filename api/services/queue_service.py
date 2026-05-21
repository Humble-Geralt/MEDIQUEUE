from __future__ import annotations

from core.config import DEFAULT_WAIT_MINUTES
from core.enums import (
    Gender,
    PriorityRequestStatus,
    QueuePriorityLevel,
    QueueTicketStatus,
)
from core.errors import ApiError
from schemas.patient import PatientQueueView
from schemas.priority import PriorityRequest
from schemas.queue import QueueSnapshot, QueueTicket
from store.in_memory_store import InMemoryStore, now_iso


class QueueService:
    def __init__(self, store: InMemoryStore) -> None:
        self.store = store

    def get_snapshot(self, room_no: str) -> QueueSnapshot:
        self.ensure_room(room_no)
        return self._build_snapshot()

    def get_patient_queue_view(self, patient_id: str) -> tuple[PatientQueueView, str]:
        ticket = self._find_ticket_by_patient_id(patient_id)
        waiting_tickets = self._waiting_tickets()

        people_ahead = 0
        if ticket.status == QueueTicketStatus.WAITING and ticket in waiting_tickets:
            people_ahead = waiting_tickets.index(ticket)

        patient_view = PatientQueueView(
            patient_id=ticket.patient.patient_id,
            patient_name=ticket.patient.name,
            ticket_no=ticket.ticket_no,
            status=ticket.status,
            room_no=ticket.room_no,
            people_ahead=people_ahead,
            estimated_wait_minutes=people_ahead * DEFAULT_WAIT_MINUTES,
            is_paused=self.store.is_paused,
            is_my_turn=ticket.status == QueueTicketStatus.CALLED,
        )
        return patient_view, self.store.snapshot_version

    def call_next(
        self, room_no: str, expected_snapshot_version: str | None = None
    ) -> tuple[QueueSnapshot, QueueTicket]:
        self.ensure_room(room_no)
        self.ensure_snapshot_version(expected_snapshot_version)
        if self.store.is_paused:
            raise ApiError("ROOM_PAUSED", "Current room is paused.", 409)

        current_ticket = self._current_call_ticket()
        if current_ticket and current_ticket.status == QueueTicketStatus.CALLED:
            current_ticket.status = QueueTicketStatus.COMPLETED
            self.store.current_call_ticket_no = None

        next_ticket = next((ticket for ticket in self.store.tickets if ticket.status == QueueTicketStatus.WAITING), None)
        if next_ticket is None:
            raise ApiError("NO_WAITING_PATIENT", "There is no waiting patient in the queue.", 404)

        next_ticket.status = QueueTicketStatus.CALLED
        self.store.current_call_ticket_no = next_ticket.ticket_no
        self.store.touch()
        return self._build_snapshot(), next_ticket

    def skip_current(
        self,
        room_no: str,
        ticket_no: str,
        expected_snapshot_version: str | None = None,
    ) -> tuple[QueueSnapshot, QueueTicket]:
        self.ensure_room(room_no)
        self.ensure_snapshot_version(expected_snapshot_version)
        current_ticket = self._current_call_ticket()
        if current_ticket is None or current_ticket.ticket_no != ticket_no:
            raise ApiError("TICKET_NOT_FOUND", "Current called ticket was not found.", 404)

        current_ticket.status = QueueTicketStatus.SKIPPED
        current_ticket.priority_level = QueuePriorityLevel.RETURNING
        self.store.current_call_ticket_no = None
        self.store.touch()
        return self._build_snapshot(), current_ticket

    def pause(self, room_no: str, expected_snapshot_version: str | None = None) -> QueueSnapshot:
        self.ensure_room(room_no)
        self.ensure_snapshot_version(expected_snapshot_version)
        self.store.is_paused = True
        self.store.touch()
        return self._build_snapshot()

    def resume(self, room_no: str, expected_snapshot_version: str | None = None) -> QueueSnapshot:
        self.ensure_room(room_no)
        self.ensure_snapshot_version(expected_snapshot_version)
        self.store.is_paused = False
        self.store.touch()
        return self._build_snapshot()

    def reset_demo_state(self, room_no: str) -> QueueSnapshot:
        self.ensure_room(room_no)
        self.store.reset()
        return self._build_snapshot()

    def move_ticket_to_waiting_front(self, ticket_no: str) -> None:
        target_index = next(
            (index for index, ticket in enumerate(self.store.tickets) if ticket.ticket_no == ticket_no),
            None,
        )
        if target_index is None:
            raise ApiError("TICKET_NOT_FOUND", "Target ticket does not exist.", 404)

        target = self.store.tickets.pop(target_index)
        insert_at = next(
            (
                index
                for index, ticket in enumerate(self.store.tickets)
                if ticket.status == QueueTicketStatus.WAITING
            ),
            len(self.store.tickets),
        )
        self.store.tickets.insert(insert_at, target)

    def find_ticket(self, ticket_no: str) -> QueueTicket:
        ticket = next((ticket for ticket in self.store.tickets if ticket.ticket_no == ticket_no), None)
        if ticket is None:
            raise ApiError("TICKET_NOT_FOUND", "Ticket does not exist.", 404)
        return ticket

    def ensure_room(self, room_no: str) -> None:
        if room_no != self.store.room_no:
            raise ApiError("ROOM_NOT_FOUND", "Room was not found.", 404)

    def ensure_snapshot_version(self, expected_snapshot_version: str | None) -> None:
        if (
            expected_snapshot_version is not None
            and expected_snapshot_version != self.store.snapshot_version
        ):
            raise ApiError(
                "VERSION_CONFLICT",
                "Snapshot version is outdated.",
                409,
            )

    def build_public_call_payload(self, ticket: QueueTicket) -> dict[str, str]:
        return {
            "ticketNo": ticket.ticket_no,
            "displayName": self.mask_public_name(ticket),
            "roomNo": ticket.room_no,
        }

    def mask_public_name(self, ticket: QueueTicket) -> str:
        patient = ticket.patient
        name = patient.name.strip()
        if any("\u4e00" <= char <= "\u9fff" for char in name):
            masked = name if len(name) < 2 else name[0] + "X" + name[2:]
            suffix = ""
            if patient.gender == Gender.MALE:
                suffix = " 先生"
            elif patient.gender == Gender.FEMALE:
                suffix = " 女士"
            return f"{masked}{suffix}"
        return patient.english_name_or_pinyin or patient.name

    def _build_snapshot(self) -> QueueSnapshot:
        current_ticket = self._current_call_ticket()
        pending_requests = [
            request
            for request in self.store.priority_requests.values()
            if request.review_status == PriorityRequestStatus.PENDING
        ]
        return QueueSnapshot(
            snapshot_version=self.store.snapshot_version,
            room_no=self.store.room_no,
            current_call=current_ticket,
            waiting_list=self._waiting_tickets(),
            is_paused=self.store.is_paused,
            pending_priority_requests=pending_requests,
            updated_at=now_iso(),
        )

    def _waiting_tickets(self) -> list[QueueTicket]:
        return [
            ticket
            for ticket in self.store.tickets
            if ticket.status == QueueTicketStatus.WAITING
        ]

    def _current_call_ticket(self) -> QueueTicket | None:
        if self.store.current_call_ticket_no is None:
            return None
        return next(
            (
                ticket
                for ticket in self.store.tickets
                if ticket.ticket_no == self.store.current_call_ticket_no
            ),
            None,
        )

    def _find_ticket_by_patient_id(self, patient_id: str) -> QueueTicket:
        ticket = next(
            (ticket for ticket in self.store.tickets if ticket.patient.patient_id == patient_id),
            None,
        )
        if ticket is None:
            raise ApiError("TICKET_NOT_FOUND", "Patient queue record does not exist.", 404)
        return ticket
