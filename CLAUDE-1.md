# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Pull requests

Always target `dev`, never `main`.

## Package manager

Always use `pnpm`. Never use `npm` or `yarn`.

## Common commands

```bash
# Add a shadcn/ui component
pnpm --filter frontend exec shadcn add <component>

# Run everything (frontend + backend) in dev mode
pnpm dev

# Run a single workspace
pnpm --filter frontend dev
pnpm --filter backend dev

# Type-check frontend (no output = clean)
pnpm --filter frontend exec tsc --noEmit

# Lint frontend
pnpm --filter frontend lint

# Build frontend for production
pnpm --filter frontend build

# Generate Prisma client after schema changes
pnpm --filter db exec prisma generate

# Push schema changes to the database
pnpm --filter db exec prisma db push

# Open Prisma Studio
pnpm --filter db exec prisma studio
```

## Monorepo structure

```
apps/
  frontend/   React + Vite + Tailwind v4 + shadcn/ui
  backend/    Express 5 + tsx (no build step in dev)
packages/
  db/         Prisma client + all query classes (shared by backend)
```

Turborepo orchestrates builds. The `@softeng-app/db` package is a workspace dependency of the backend — import it as `import * as q from "@softeng-app/db"`.

## Environment setup

Copy or create `apps/backend/.env` with these keys (values from the team's shared secrets):

```
SUPABASE_URL=
SUPABASE_SECRET_KEY=
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_SECRET_KEY=
NEXT_PUBLIC_DATABASE_URL=
```

The frontend has no `.env` of its own — it talks to the backend via Vite's dev proxy (`/api` → `localhost:3000`). The frontend dev server runs on port 5173.

## Architecture

### Auth flow

Auth0 is the identity provider. The frontend uses `@auth0/auth0-react`; the backend validates JWTs with `express-oauth2-jwt-bearer`.

- **Frontend**: `Auth0Provider` (in `main.tsx`) → `UserProvider` (in `context/UserContext.tsx`) → rest of app. `UserProvider` fetches `/api/employee/me` once and distributes the result via React context. All components call `useUser()` from `@/hooks/use-user.ts` (which re-exports from the context).
- **Backend**: `app.use('/api', checkJwt)` — everything after that line requires a valid JWT. `GET /api/preview` is intentionally before the middleware and is unauthenticated (`/api/preview` is a server-side proxy that fetches Open Graph metadata from external URLs on behalf of the frontend — it must be unauthenticated so the Vite dev proxy can call it without a token). Extract the Auth0 user with `req.auth?.payload.sub`.
- **User identity**: Auth0's `sub` claim maps to `Employee.auth0Id` in the database. `/api/employee/me` does this lookup.

### API calls from the frontend

Every authenticated API call follows this pattern:
```ts
const token = await getAccessTokenSilently(); // cached by Auth0 SDK, not a network call
const res = await fetch("/api/...", { headers: { Authorization: `Bearer ${token}` } });
```

`getAccessTokenSilently()` is sourced from `useAuth0()` directly in components/hooks that need it (not from `UserProvider`).

### Backend route handlers

All route handlers live in `apps/backend/src/hooks/` and are typed with a local `{req, res}` type alias. They import query classes from `@softeng-app/db` (e.g., `q.Content`, `q.Employee`).

### Database layer

`packages/db/queries/` contains static classes (`Content`, `Employee`, `Login`, `Bookmark`, `ServiceReqs`) that wrap Prisma calls, plus `Bucket` which wraps Supabase Storage for file uploads/downloads. The Prisma client is instantiated once in `packages/db/lib/prisma.ts` using a `PrismaPg` adapter and `NEXT_PUBLIC_DATABASE_URL`. Generated Prisma types live in `packages/db/generated/`.

### Content checkout/lock system

Content items have `checkedOutById` and `checkedOutAt` fields. Editing requires a checkout (`POST /api/content/checkout`), and the lock auto-expires after 2 minutes (enforced by a `setInterval` in `app.ts` calling `content.clearExpiredLocks()`). The frontend polls for lock state changes every 15 seconds.

### Frontend conventions

- Path alias `@/` maps to `src/`
- `lib/types.ts` is the single source of truth for shared TypeScript types (`ContentItem`, `UrlPreview`, `BookmarkRecord`, etc.). Enum-like string literal unions (`ContentType`, `ContentStatus`, `Persona`, etc.) are defined as standalone named types here — never redeclare them locally in component files, import them instead.
- `lib/utils.ts` contains `cn()` (Tailwind class merger), `formatLabel()` (camelCase → human label), and `formatName()` (person → "Last, First")
- `lib/employee-form.ts` mirrors `lib/content-form.ts` for the employee forms
- shadcn/ui primitives are in `components/ui/` (auto-generated, don't hand-edit)
- Shared app components are in `components/shared/`; layout chrome in `components/layout/`
- Page-level components are in `pages/`; modal/dialog components are in `dialogs/`
- `features/content/forms/content-form.ts` owns the `ContentFormValues` type and `getErrors`/`initialValues`/`fromContentItem`/`buildContentFormData` helpers
- `features/content/forms/ContentFormFields.tsx` is the shared field component rendered by both `AddContentDialog` and `EditContentDialog`
- Feature code is organized under `features/content/` by concern: `forms/`, `listing/`, `previews/`, `components/`, `tags/`
- `hooks/use-content-filters.ts` owns all content filtering logic (search, tabs, sidebar filters) — add new filters there, not in `ViewContent` directly
- `lib/file-cache.ts` caches downloaded file content (text/blob) by URL; `lib/preview-cache.ts` caches URL link-preview results — both are module-level singletons
- Custom hooks beyond `use-user.ts`: `use-content-form.ts` (form state/validation), `use-sort-state.ts` (table sorting)
- `lib/mime.ts` handles file type detection and validation; `lib/highlight.tsx` handles search term highlighting

### Backend note

Route handlers are named `hooks/` (not `routes/`) — this mirrors the frontend hooks convention but applies to Express handlers.

### Dropdown/popover UI pattern

- Use `overscroll-contain` on scrollable dropdown lists to stop scroll from propagating into the parent dialog (see `EmployeePicker`, `TagInput`)
- Use `overflow-hidden` on the popover container to clip button hover highlights to the border-radius — no need to manually round individual items
- Use `PopoverAnchor` (not `PopoverTrigger`) to anchor a dropdown to an input without toggling behavior; pair with `onOpenAutoFocus` + `onFocusOutside` to keep focus in the input while the dropdown is open

### Tailwind v4 CSS variable syntax

- Use `w-(--radix-css-var)` not `w-[var(--radix-css-var)]`

### FormData arrays

- FormData can't send arrays natively — serialize with `JSON.stringify` on the frontend and `JSON.parse(payload.field || "[]")` on the backend

### Prisma raw queries

- `prisma.$queryRaw<T[]>\`...\`` is available via the PrismaPg adapter for queries the ORM can't express (e.g., `SELECT DISTINCT unnest(tags)` on array fields)

### Comment style

- Exported functions, components, and types get JSDoc blocks (`/** ... */`)
- Non-obvious implementation logic gets inline `//` comments
- JSX sections use `{/* */}` block comments
