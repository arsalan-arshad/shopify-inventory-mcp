# Contributing to shopify-inventory-mcp

Thanks for your interest! This project is **open source (MIT)**. Contact for security: arsalanarshad.dev@gmail.com.

## Before you open a PR

- Open an issue first for anything beyond a small fix (new tools, scope changes, write paths).
- Keep PRs focused; branch names `feat/<short>` or `fix/<short>`.
- Never commit secrets. `.env` is git-ignored; document every variable in `.env.example`.

## What must pass locally

```bash
npm test
npm run build
```

CI runs the same on PRs into `main`. There is no separate lint script yet — don’t claim one.

## Design rules

- The server stays **read-only**. Any write tool needs the owner’s explicit sign-off first.
- Numbers come from the **deterministic core** only (`src/forecast/`); tools must never return model-generated figures.
- Keep Shopify scopes minimal (`read_inventory`, `read_locations`, `read_orders`, `read_products`). Justify any new scope in the PR.
- Prefer fixture tests for forecast math; mock network for Shopify client tests.

## PR template

Use the checklist in `.github/PULL_REQUEST_TEMPLATE.md`. Describe what you verified with real commands.
