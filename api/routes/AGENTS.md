# Routes Layer Guide

## Scope

This file applies to `api/routes/`.

## Responsibilities

- Keep route handlers thin.
- Perform request parsing, dependency injection, and service invocation here.
- Return response envelopes here, but keep business decisions in `services/`.

## Do Not Put Here

- Queue ordering rules
- Priority-review decision logic
- Direct mutable store manipulation when a service can own it
- External provider integration logic

## Realtime Rules

- WebSocket and HTTP event naming should stay explicit and stable.
- If a route triggers broadcasts, keep the broadcast payloads aligned with the documented API contract.
