# Frontend Workspace Guide

## Scope

This file applies to all files under `web/`.

## Current Priority

- Preserve the current AI Studio visual design as much as possible.
- Prefer fixing data flow, API contracts, and realtime wiring before touching layout or styling.
- If a UI adjustment is required, keep it minimal and in service of making the existing design work with the real backend.

## Integration Rules

- The frontend should talk directly to the FastAPI backend.
- Do not add a Node compatibility layer or mock backend unless the user explicitly asks for it.
- REST calls should target the documented FastAPI `/api/v1/*` endpoints.
- Realtime should connect directly to FastAPI WebSocket room endpoints.

## Editing Rules

- Favor adapter functions and hooks over large component rewrites.
- Keep visual components focused on presentation.
- Put backend contract mapping in dedicated frontend data-layer files.
- Preserve the current multi-view behavior: `sandbox`, `doctor`, `tv`, `mobile`.

## Verification

- Run `npm run lint`.
- Run `npm run build`.
- After wiring changes, confirm the app can load queue data and react to room events against the FastAPI backend.
