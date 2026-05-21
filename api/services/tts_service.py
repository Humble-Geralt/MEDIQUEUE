from __future__ import annotations

from adapters.tts_adapter import BaseTtsAdapter, TtsPayload
from core.config import TTS_ENABLED
from schemas.queue import QueueTicket


class TtsService:
    def __init__(self, adapter: BaseTtsAdapter) -> None:
        self.adapter = adapter

    async def build_call_announcement(
        self, ticket: QueueTicket, *, is_recall: bool = False
    ) -> list[TtsPayload]:
        if not TTS_ENABLED:
            return []

        patient = ticket.patient
        if is_recall:
            zh_text = (
                f"请{ticket.ticket_no}号{patient.name}再次前往{ticket.room_no}诊室就诊。"
            )
            en_text = (
                f"Number {ticket.ticket_no}, "
                f"{patient.english_name_or_pinyin or patient.name}, "
                f"please proceed again to room {ticket.room_no}."
            )
        else:
            zh_text = f"请{ticket.ticket_no}号{patient.name}到{ticket.room_no}诊室就诊。"
            en_text = (
                f"Number {ticket.ticket_no}, "
                f"{patient.english_name_or_pinyin or patient.name}, "
                f"please proceed to room {ticket.room_no}."
            )

        return await self._generate_bilingual(zh_text, en_text)

    async def build_priority_insert_announcement(
        self,
        priority_ticket: QueueTicket,
        delayed_ticket: QueueTicket,
        reason_text: str,
    ) -> list[TtsPayload]:
        if not TTS_ENABLED:
            return []

        zh_reason = self._normalize_reason(reason_text, fallback="紧急症状", limit=22)
        en_reason = self._normalize_english_reason(reason_text)

        zh_text = (
            f"请候诊患者留意，原先排在后面的{priority_ticket.ticket_no}号"
            f"因{zh_reason}已获优先就诊，原排在前面的{delayed_ticket.ticket_no}号将顺延。"
            "请大家理解。如您也有特殊情况，可以通过手机提交优先申请。"
        )
        en_text = (
            f"Attention please. Ticket {priority_ticket.ticket_no} has been approved "
            f"for priority consultation due to {en_reason}. "
            f"Ticket {delayed_ticket.ticket_no} will be seen slightly later. "
            "If you also have special circumstances, please submit a priority request on your phone. "
            "Thank you for your understanding."
        )

        return await self._generate_bilingual(zh_text, en_text)

    def serialize_announcements(
        self, announcements: list[TtsPayload]
    ) -> list[dict[str, str | None]]:
        return [
            {
                "text": item.text,
                "audioBase64": item.audio_base64,
                "url": item.url,
            }
            for item in announcements
        ]

    async def _generate_bilingual(
        self, zh_text: str, en_text: str
    ) -> list[TtsPayload]:
        return [
            await self.adapter.generate(zh_text, lang="zh-CN"),
            await self.adapter.generate(en_text, lang="en-US"),
        ]

    def _normalize_reason(
        self, reason_text: str, *, fallback: str, limit: int
    ) -> str:
        condensed = " ".join(reason_text.split()).strip(" ,.;:!?")
        if not condensed:
            return fallback
        if len(condensed) <= limit:
            return condensed
        return f"{condensed[:limit]}…"

    def _normalize_english_reason(self, reason_text: str) -> str:
        condensed = self._normalize_reason(
            reason_text, fallback="an urgent medical condition", limit=56
        )
        ascii_ratio = 0.0
        if condensed:
            ascii_ratio = sum(ord(char) < 128 for char in condensed) / len(condensed)
        if ascii_ratio >= 0.65:
            return condensed
        return "an urgent medical condition"

