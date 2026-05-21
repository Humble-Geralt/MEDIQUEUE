from __future__ import annotations

import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import APP_TITLE, APP_VERSION
from core.errors import ApiError
from routes import calls, dev, health, priority, queue, websocket
from schemas.common import error_response

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(queue.router, prefix="/api/v1")
app.include_router(calls.router, prefix="/api/v1")
app.include_router(priority.router, prefix="/api/v1")
app.include_router(dev.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(websocket.router)


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(exc.code, exc.message),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_response("VALIDATION_ERROR", str(exc)),
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "MediQueue API is running."}


def main() -> None:
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
