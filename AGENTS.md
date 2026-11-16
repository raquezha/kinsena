# Agent notes (Kinsena)

Short durable rules for coding agents. Task progress stays in `.workflow/tasks/*/WORK.md`.

## Stack

- Svelte 5 + SvelteKit + TypeScript + Drizzle/SQLite. Styling uses CSS tokens in `src/lib/ui`, not Tailwind.
- Icons use the existing `Icon` path catalog / Lucide-static names. Do not add `lucide-react` or React components.
- `simple-icons` stays server-only (`src/lib/server/*`). Never import it from `.svelte` or client modules.

## Data & migrations

- Prefer additive migrations. For new tables/indexes that may already exist after a partial apply, use `IF NOT EXISTS`.
- Do not rewrite history of already-shipped SQL unless you also keep re-runs safe (`IF NOT EXISTS` / no-op alters).
- Back up `data/kinsena.db` before major upgrades. Never delete `./data` to “fix” migrations.

## Product invariants

- Open checklist order: skip → open before done → manual `sortOrder` → id. Due date does not order open items.
- Activity feed emits only: decide, skip, add item, remove item, finish, toggle done — in the same SQLite transaction as the mutation.
- Template/route `icon`: `null` = Auto; catalog key = category override; `brand:<key>` = brand override. Resolve brands on the server.
- Defaults and Active item sheets share the collapsible inline icon picker; keep Defaults page structure stable unless a task says otherwise.

## Docs

- User-facing workflow: `README.md`
- Condensed domain rules: `docs/agents/product-rules.md`
- Temporary task state: `.workflow/tasks/*/WORK.md` only
