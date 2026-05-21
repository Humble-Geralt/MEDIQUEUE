from __future__ import annotations

from schemas.common import BaseSchema


class ResetDemoBody(BaseSchema):
    room_no: str
