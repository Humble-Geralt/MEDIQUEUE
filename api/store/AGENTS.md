# Store Layer Guide

## Scope

This file applies to `api/store/`.

## Responsibilities

- Own the in-memory mutable state used by the MVP backend.
- Provide a predictable, minimal storage surface for services.
- Keep seed data deterministic enough for local smoke testing.

## Boundaries

- Do not place HTTP, WebSocket, or FastAPI framework logic here.
- Do not mix external-provider logic into the store.
- If persistence is introduced later, treat that as an architectural change and update the backend docs.
