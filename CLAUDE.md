# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

| Task | Command |
|------|---------|
| Dev (all apps) | `pnpm run dev` |
| Build (all apps) | `pnpm run build` |
| Start (production) | `pnpm run start` |
| Run DB migrations | `cd packages/db && pnpm exec prisma migrate dev` |
| Regenerate Prisma client | `cd packages/db && pnpm exec prisma generate` |
| Lint | ESLint at root — handled by WebStorm |

Turbo automatically runs `db:generate` before `dev` and `build`, so the Prisma client is always up to date.

## Environment

`.env` lives in `apps/backend/`. Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_KEY` — Supabase service key

Supabase storage is cloud-only (no local emulation).

## Architecture

This is a **pnpm + Turbo monorepo** with three workspaces:

```
apps/
  frontend/   React 19 + Vite + TypeScript + TailwindCSS 4 + shadcn/ui
  backend/    Express 5 + TypeScript (tsx/nodemon), port 3000
packages/
  db/         Prisma ORM + Supabase storage — all DB access lives here
```

### Frontend (`apps/frontend`)
- In dev, Vite proxies `/api/*` to `http://localhost:3000`.
- In production, the backend serves `frontend/dist` as static files with a SPA fallback.
- shadcn/ui components use the **radix-mira** style with HugeIcons.
- Path alias `@` maps to `src/`.
- File type support is centralized in `src/helpers/mime.ts` — this is the single source of truth for allowed upload types, preview modes, and category colors. Add new file types here.

### Backend (`apps/backend`)
- Route handlers are in `src/hooks/` (one file per domain: `login`, `content`, `employee`, `servicereqs`).
- File uploads use Multer with **memory storage** (`upload.single("file")`). `req.file` is `undefined` for non-file requests.
- `fileURI` (the Supabase bucket path) is internal to the backend — the frontend never sends or relies on it.

### Database layer (`packages/db`)
- All Prisma queries are in `packages/db/queries/`. Backend hooks import from `@softeng-app/db`.
- `packages/db/queries/bucket.ts` handles Supabase file storage (upload, download, delete, metadata).
- Schema is at `packages/db/prisma/schema.prisma`. After editing the schema, run `prisma migrate dev` then `prisma generate`.

### Key domain models
- **Employee** — has a `persona`: `underwriter | businessAnalyst | admin`
- **Content** — either a `linkURL` (external link) or a `fileURI` (bucket file), never both. `contentType`: `reference | workflow`. `status`: `new | inProgress | complete`.
- **ServiceRequest** — `type`: `reviewClaim | requestAdjuster | checkClaim`

### Known issues / work in progress
- `FilesPage.tsx` duplicates utilities from `mime.ts` and `src/components/shared/` — don't use as a reference; tracked for removal in REFACTOR.md.
- Bookmarks (`ViewContent.tsx`) are client-side only (`Set<number>`, lost on refresh) — not yet persisted to the DB.
- Auth is pre-JWT: login returns a raw employee object stored in localStorage. This will change — see ROADMAP.md Phase 1.
- `useSortState` is in `src/helpers/` but belongs in `src/hooks/` — tracked in REFACTOR.md.

### Permissions
- `canEdit()` in `ViewContent.tsx` is the source of truth for edit access: admin can edit anything; others can edit content where `targetPersona` matches their persona or they are the owner.

### Planning docs
- `ROADMAP.md` — feature phases and ordering rationale
- `REFACTOR.md` — code quality tasks with checkboxes
