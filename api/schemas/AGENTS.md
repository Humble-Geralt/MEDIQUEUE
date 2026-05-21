# Schemas Layer Guide

## Scope

This file applies to `api/schemas/`.

## Responsibilities

- Define request, response, and shared domain models.
- Keep validation and serialization concerns here.
- Reuse common schema base classes and helpers for consistent aliases and response envelopes.

## Boundaries

- Avoid embedding business workflows or mutable state behavior in schema classes.
- Keep external field names stable unless the API contract is intentionally changed.
- If adding a new public payload shape, prefer a named schema over anonymous dict structures.
