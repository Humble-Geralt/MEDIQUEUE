from __future__ import annotations

import re

from adapters.tts_adapter import BaseTtsAdapter, TtsPayload
from core.config import TTS_ENABLED

_CJK_PATTERN = re.compile(r"[\u4e00-\u9fff]")


class TtsService:
    def __init__(self, adapter: BaseTtsAdapter) -> None:
        self.adapter = adapter

    async def synthesize_text(self, text: str) -> TtsPayload:
        normalized = self._normalize_text(text)
        if not normalized:
            return TtsPayload(text="")

        if not TTS_ENABLED:
            return TtsPayload(text=normalized)

        return await self.adapter.generate(normalized, lang=self._detect_language(normalized))

    @staticmethod
    def serialize_payload(payload: TtsPayload) -> dict[str, str | None]:
        return {
            "text": payload.text,
            "audioBase64": payload.audio_base64,
            "url": payload.url,
        }

    @staticmethod
    def _normalize_text(text: str) -> str:
        return " ".join(text.split()).strip()

    @staticmethod
    def _detect_language(text: str) -> str:
        if _CJK_PATTERN.search(text):
            return "zh-CN"
        return "en-US"
