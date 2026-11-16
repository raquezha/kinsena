# Product rules

Condensed durable behavior. Prefer these over session notes.

## Checklist & planning

- Manual `sortOrder` ranks open items (lower = higher priority).
- Auto-plan salary cuts keep higher-rank items after due-after-next hard skips; due date is not the cut key among opens.
- Drag the grip to reorder open items only; done/skipped rows are not reorder targets.

## Defaults

- Recurring templates can be paused (`isActive = false`); paused templates do not spawn into new paydays.
- Fixed-N installments: X = default amount; stop when completed reaches N; `EVERY` spawns at most once per calendar month per template.
- “Add missing defaults” applies templates to the current open payday with existing gates (`hasTemplate`, fund-from fit, installment remaining).

## Icons & brands

- Auto mode resolves brand from the item/destination name on the server, then falls back to keyword category icons.
- Destination cards show brand badges (SVG or monogram) plus live template usage counts (active and paused).
- Client never bundles `simple-icons`; use `/api/brand-icon` and `/api/icon-search` when the UI needs live lookup.

## History activity

- Newest-first Activity section on `/history`.
- Logged actions only: decide, skip, add item, remove item, finish, toggle done.
- Quiet actions (receive, reorder, approve, restore/reopen, notes, template archive) emit nothing.
