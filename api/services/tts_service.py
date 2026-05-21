from __future__ import annotations

from adapters.tts_adapter import BaseTtsAdapter, TtsPayload
from core.config import TTS_ENABLED
from schemas.queue import QueueTicket

class TtsService:
    def __init__(self, adapter: BaseTtsAdapter) -> None:
        self.adapter = adapter

    async def build_call_announcement(self, ticket: QueueTicket) -> list[TtsPayload]:
        if not TTS_ENABLED:
            return []

        patient = ticket.patient
        # Chinese announcement
        # Use full name for voice announcement as requested
        zh_text = f"请 {ticket.ticket_no} 号 {patient.name}，到 {ticket.room_no} 诊室就诊。"
        
        # English announcement
        en_name = patient.english_name_or_pinyin or ticket.ticket_no
        en_text = f"Number {ticket.ticket_no}, {en_name}, please proceed to room {ticket.room_no}."

        results = [
            await self.adapter.generate(zh_text, lang="zh-CN"),
            await self.adapter.generate(en_text, lang="en-US"),
        ]
        return results
