# Core Layer Guide

## Scope

This file applies to `api/core/`.

## Responsibilities

- Hold shared enums, config, constants, and reusable error definitions.
- Keep this directory small and broadly reusable across backend layers.

## Boundaries

- Do not move feature-specific queue workflows into `core/`.
- Be careful with enum or error-code changes because they can affect API compatibility, docs, and frontend assumptions.
- If a change here affects public behavior, sync the relevant docs in the same task when possible.
