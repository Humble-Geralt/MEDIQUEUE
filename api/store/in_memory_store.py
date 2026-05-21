from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime

from core.config import DEFAULT_ROOM_NO
from core.enums import Gender, Language, QueuePriorityLevel, QueueTicketStatus
from schemas.patient import Patient
from schemas.priority import PriorityRequest
from schemas.queue import QueueTicket


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class InMemoryStore:
    room_no: str = DEFAULT_ROOM_NO
    is_paused: bool = False
    snapshot_version: str = field(default_factory=now_iso)
    current_call_ticket_no: str | None = None
    tickets: list[QueueTicket] = field(default_factory=list)
    priority_requests: dict[str, PriorityRequest] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.tickets:
            self.tickets = self._build_mock_tickets()

    def touch(self) -> str:
        self.snapshot_version = now_iso()
        return self.snapshot_version

    def reset(self) -> str:
        self.is_paused = False
        self.current_call_ticket_no = None
        self.priority_requests.clear()
        self.tickets = self._build_mock_tickets()
        return self.touch()

    def _build_mock_tickets(self) -> list[QueueTicket]:
        mock_people = [
            Patient(
                patient_id="p_001",
                name="王建国",
                gender=Gender.MALE,
                english_name_or_pinyin="Wang Jianguo",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_002",
                name="李晓菲",
                gender=Gender.FEMALE,
                english_name_or_pinyin="Li Xiaofei",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_003",
                name="David Smith",
                gender=Gender.MALE,
                english_name_or_pinyin="David Smith",
                language=Language.EN_US,
            ),
            Patient(
                patient_id="p_004",
                name="刘志伟",
                gender=Gender.MALE,
                english_name_or_pinyin="Liu Zhiwei",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_005",
                name="陈雨欣",
                gender=Gender.FEMALE,
                english_name_or_pinyin="Chen Yuxin",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_006",
                name="Anna Brown",
                gender=Gender.FEMALE,
                english_name_or_pinyin="Anna Brown",
                language=Language.EN_US,
            ),
            Patient(
                patient_id="p_007",
                name="赵海明",
                gender=Gender.MALE,
                english_name_or_pinyin="Zhao Haiming",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_008",
                name="孙嘉宁",
                gender=Gender.FEMALE,
                english_name_or_pinyin="Sun Jianing",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_009",
                name="周宇航",
                gender=Gender.MALE,
                english_name_or_pinyin="Zhou Yuhang",
                language=Language.ZH_CN,
            ),
            Patient(
                patient_id="p_010",
                name="Mia Johnson",
                gender=Gender.FEMALE,
                english_name_or_pinyin="Mia Johnson",
                language=Language.EN_US,
            ),
        ]

        tickets: list[QueueTicket] = []
        for index, patient in enumerate(mock_people, start=1):
            tickets.append(
                QueueTicket(
                    ticket_no=f"A{index:03d}",
                    patient=patient,
                    room_no=self.room_no,
                    status=QueueTicketStatus.WAITING,
                    priority_level=QueuePriorityLevel.NORMAL,
                    check_in_time=f"2026-05-21T09:{index:02d}:00+00:00",
                )
            )
        return tickets
