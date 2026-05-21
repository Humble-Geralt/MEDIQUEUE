# Frontend Data Layer Guide

## Scope

This file applies to files under `web/src/lib/`.

## Rules

- This directory is the only place that should know the raw FastAPI contract details.
- Keep endpoint paths, request bodies, websocket event parsing, and backend-to-UI mapping here.
- Avoid leaking backend-only field names directly into presentation components unless the UI contract is intentionally being changed.
- If FastAPI contract changes, update this directory first and then verify downstream hooks/components.

