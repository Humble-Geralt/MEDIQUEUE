# Frontend Hooks Guide

## Scope

This file applies to files under `web/src/hooks/`.

## Rules

- Hooks in this directory own React lifecycle, reconnect behavior, and state synchronization.
- Keep network requests delegated to `../lib/`.
- Keep component-facing outputs stable and UI-friendly.
- When handling websocket events, prefer rebuilding state from authoritative snapshots instead of hand-maintaining complex client-side mutations.

