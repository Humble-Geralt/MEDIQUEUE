from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class BaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)


class ErrorPayload(BaseSchema):
    code: str
    message: str


class ResponseMeta(BaseSchema):
    snapshot_version: str | None = None


def success_response(data: Any, snapshot_version: str | None = None) -> dict[str, Any]:
    payload = data.model_dump(by_alias=True) if isinstance(data, BaseModel) else data
    meta = ResponseMeta(snapshot_version=snapshot_version).model_dump(
        by_alias=True, exclude_none=True
    )
    return {
        "success": True,
        "data": payload,
        "error": None,
        "meta": meta or None,
    }


def error_response(code: str, message: str) -> dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "error": ErrorPayload(code=code, message=message).model_dump(by_alias=True),
    }
