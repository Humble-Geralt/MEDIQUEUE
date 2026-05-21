# Services Layer Guide

## Scope

This file applies to `api/services/`.

## Responsibilities

- Own queue transitions, priority-review orchestration, and realtime coordination rules.
- Encapsulate business invariants so both HTTP routes and future tests can reuse them.
- Keep service methods deterministic and easy to validate from focused smoke tests.

## Boundaries

- Do not depend on FastAPI request or response objects here.
- Do not bury serialization-only concerns here when they belong in `schemas/`.
- Use `adapters/` for external model or provider calls instead of mixing transport details into business logic.

## State Rules

- Queue ordering, pause behavior, skip behavior, and priority approval effects should be implemented here or in closely related helpers.
- If a state transition changes, verify the corresponding API and WebSocket behavior in the same task.
