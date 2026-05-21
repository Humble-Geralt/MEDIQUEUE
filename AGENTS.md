# Repository Agent Guide

## Scope

This file applies to the entire repository unless a deeper `AGENTS.md` narrows it.

## Source Of Truth

When making product or architecture changes, align with these repository documents first:

- `docs/native_description.md`
- `docs/prd_v2.md`
- `docs/design.md`
- `docs/backend_api_architecture.md`
- `docs/frontend_architecture.md`
- `README.md`

## Repository Rules

- Keep user-visible behavior, docs, and code aligned.
- Markdown links inside repository documents should use relative paths, not absolute local paths.
- Do not revert unrelated user changes.
- Prefer incremental, reviewable changes over large unstructured rewrites.

## Backend Note

Backend implementation lives under `api/` and is managed with `uv`.

Before editing backend code, read:

- `api/AGENTS.md`
- any deeper `AGENTS.md` files under the exact backend subdirectories you touch
