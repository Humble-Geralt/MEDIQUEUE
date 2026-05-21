# Frontend Source Guide

## Scope

This file applies to all files under `web/src/`.

## Architecture Rules

- Keep presentation components focused on rendering and user interaction.
- Put FastAPI request logic and response mapping under `src/lib/`.
- Put React orchestration and realtime lifecycle logic under `src/hooks/`.
- Prefer adapting backend data into the existing UI contract rather than rewriting the visual components.

## Editing Rules

- Preserve the current AI Studio visual structure unless a UI change is required to make the real backend flow work.
- If a new backend field is introduced, map it in the bridge layer first and only then thread it into components.
- Reuse existing `types.ts` UI-facing types when possible so the doctor, TV, and patient views stay aligned.

## Verification

- Run `npm run lint`.
- Run `npm run build`.
- When changing the bridge or websocket flow, smoke test against the local FastAPI server.

