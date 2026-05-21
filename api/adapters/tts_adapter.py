from __future__ import annotations

import base64
import io
import logging
from abc import ABC, abstractmethod
from typing import NamedTuple

import edge_tts

logger = logging.getLogger(__name__)

class TtsPayload(NamedTuple):
    text: str
    audio_base64: str | None = None
    url: str | None = None

class BaseTtsAdapter(ABC):
    @abstractmethod
    async def generate(self, text: str, lang: str = "zh-CN") -> TtsPayload:
        raise NotImplementedError

class MockTtsAdapter(BaseTtsAdapter):
    async def generate(self, text: str, lang: str = "zh-CN") -> TtsPayload:
        return TtsPayload(text=text)

class EdgeTtsAdapter(BaseTtsAdapter):
    VOICES = {
        "zh-CN": "zh-CN-XiaoxiaoNeural",
        "en-US": "en-US-GuyNeural",
    }

    async def generate(self, text: str, lang: str = "zh-CN") -> TtsPayload:
        voice = self.VOICES.get(lang, self.VOICES["zh-CN"])
        communicate = edge_tts.Communicate(text, voice)

        try:
            audio_data = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.write(chunk["data"])
        except Exception as exc:  # pragma: no cover - network/provider fallback
            logger.warning("Edge TTS generation failed, falling back to text-only payload: %s", exc)
            return TtsPayload(text=text)

        if audio_data.tell() == 0:
            return TtsPayload(text=text)

        b64_audio = base64.b64encode(audio_data.getvalue()).decode("utf-8")
        return TtsPayload(text=text, audio_base64=b64_audio)
