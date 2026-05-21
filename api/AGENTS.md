# API Agent Guide

## Scope

This file applies to all files under `api/`.

More specific instructions under child directories override this file for those subtrees.

## Tech Stack And Tooling

- Python `3.12`
- FastAPI
- Pydantic `v2`
- Uvicorn
- `uv` for dependency management, virtualenv management, and command execution

## Package Responsibilities

- `main.py` should stay focused on app composition, middleware, exception wiring, and router registration.
- Business behavior belongs in the appropriate layer directory, not directly in package bootstrap code.
- Keep the current package split legible: `routes`, `services`, `schemas`, `store`, `adapters`, `core`.

## Working Rules

- Run backend commands from the repository root with `uv --directory api ...`.
- Do not switch to `pip install` or manually manage dependencies outside `uv` unless the user explicitly asks for it.
- Keep `pyproject.toml` and `uv.lock` in sync when dependencies change.
- Do not commit `.venv`, `__pycache__`, or generated artifacts.

## Architecture Boundaries

Current backend code is organized as:

- `main.py`: FastAPI app entrypoint and router registration
- `routes/`: HTTP and WebSocket entrypoints only
- `services/`: business rules, queue transitions, orchestration
- `schemas/`: request, response, and domain schemas
- `store/`: MVP in-memory state storage
- `adapters/`: external integration boundaries such as LLM adapters
- `core/`: enums, config, and shared error definitions

Read the deeper `AGENTS.md` file inside a specific layer before changing that layer.

When editing:

- Keep routes thin. Validation, state transitions, and queue rules belong in `services/`.
- Do not mutate the store directly from routers when an existing service boundary can own that logic.
- Put external-provider logic behind `adapters/` instead of mixing it into routes or services.
- Keep response-shape concerns in `schemas/` and shared response helpers.

## API Contract Conventions

- Base path stays under `/api/v1` unless the versioning strategy is intentionally changed.
- External JSON fields should remain camelCase-compatible.
- Time fields should use ISO 8601 strings.
- State-changing endpoints should continue to support snapshot-version conflict checks where applicable.
- WebSocket events should use stable, explicit event names such as `snapshot.sync` and `queue.updated`.
- REST responses should keep the unified envelope shape: `success`, `data`, `error`, `meta`.

## Contract Discipline

- Prefer typed Pydantic models over loose dictionaries at layer boundaries.
- Preserve the unified response envelope and camelCase external field shape.
- If changing enum values, response payloads, or event names, update the backend docs in the same task when possible.

## MVP Product Boundaries

This backend currently implements the MVP defined by the repository docs:

- Three clients only: doctor, display screen, and patient
- Core capabilities: queue snapshot, next call, skip, pause, resume, priority request, doctor review, realtime sync
- Priority requests are analyzed first, then approved or rejected by the doctor
- Current storage is in-memory and optimized for a local/demo MVP

Do not expand the backend into a nurse workflow, admin system, audit system, or HIS/EMR integration unless the product docs are updated first.

## Verification Expectations

Run the smallest relevant verification loop after meaningful backend changes.

Minimum checks:

- `uv --directory api run --no-cache python -m compileall .`

When changing routes, schemas, or queue logic, also run focused API smoke checks. Prefer deterministic checks such as FastAPI `TestClient` scripts or future `pytest` coverage over manual inspection only.

## Documentation Sync

If you change backend contracts or architecture expectations, update the matching docs in the repository:

- `docs/backend_api_architecture.md`
- `README.md` when the user-facing architecture summary changes

If the task exposes a missing local rule for backend work, update this file so the guidance becomes repository-visible.

## Handoff Expectations

When finishing backend work, report:

- what changed
- what was verified
- any remaining gaps or mocked behavior
- whether this `api/AGENTS.md` guidance was relied on or updated
