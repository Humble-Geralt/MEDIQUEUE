from __future__ import annotations

from typing import Annotated

from pydantic import StringConstraints

from schemas.common import BaseSchema


class TtsSynthesisBody(BaseSchema):
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class TtsClip(BaseSchema):
    text: str
    audio_base64: str | None = None
    url: str | None = None
