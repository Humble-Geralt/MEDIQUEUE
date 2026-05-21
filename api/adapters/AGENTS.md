# Adapters Layer Guide

## Scope

This file applies to `api/adapters/`.

## Responsibilities

- Isolate external integrations behind stable Python interfaces.
- Keep mock adapters and real adapters aligned on input and output shape.
- Return structured data that services can consume directly.

## Boundaries

- Do not mutate queue state directly from adapters.
- Do not leak provider-specific response formats into routes.
- If a real LLM provider is added, preserve a mockable fallback path for local development and demos.
