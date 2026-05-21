from __future__ import annotations

from fastapi import APIRouter, Depends

from schemas.common import success_response
from schemas.tts import TtsClip, TtsSynthesisBody
from services.dependencies import get_tts_service
from services.tts_service import TtsService

router = APIRouter(tags=["tts"])


@router.post("/tts")
async def synthesize_tts(
    body: TtsSynthesisBody,
    tts_service: TtsService = Depends(get_tts_service),
) -> dict:
    payload = await tts_service.synthesize_text(body.text)
    clip = TtsClip(
        text=payload.text,
        audio_base64=payload.audio_base64,
        url=payload.url,
    )
    return success_response(clip)
