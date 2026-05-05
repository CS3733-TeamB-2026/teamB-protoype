# Team Name: Blue Basilisks 

# Special Features:
- AI Powered Insights Feature (Natural language to SQL queries and charts. It is able to interpret broad language requests as specific database queries, and keeps chat context in a message chain. It has multiple layers of security to prevent harmful interactions with the database)
- Global Search (Full text search with OCR across all content and collections, and service requests)
- Service Requests (Allows you to manage your workflow by assigning a service request to a specific employee, with a deadline. The service requests can be attached to content or a collection)
- Collections (Allows you to group similar content together)
- Admin Force Checkin (Allows you to force checkin a piece of content from a user who has it checked out)
- Recycle Bin (Makes it so when you delete content, it gets added to the recycle bin where admins can decide what is deleted permanently, or recovered)
- Bulk Upload (Lets you upload several documents at once)
- Document Timeline (A visual timeline for when documents will expire)
- Expiration Calendar (Lets you see when content will expire on a calendar)
- Drag and Drop Widgets on Dashboard
- Filtering Notifications
- Autofill Add Content Form with Metadata
- Auth0 for Additional Security
- AWS Domain Deployment
- Additional supported content preview types (Video)
- Autotagging Documents if Expiring Soon or Already Expired
- Dark Mode


# teamB-prototype

A content management system for an insurance company. Employees with role-based personas can view, add, edit, recycle, and permanently delete content items (uploaded files or external URLs), manage other employees, and track service requests. A checkout/check-in locking mechanism prevents simultaneous edits on the same content item. Deleted items go to a per-user recycle bin; only the owner or an admin can restore or permanently delete them.

---

## Contents

- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Backend](#backend)
  - [Authentication](#authentication)
  - [API routes](#api-routes)
  - [Checkout / check-in](#checkout--check-in-server-side)
  - [File storage](#file-storage)
  - [Data model](#data-model-abridged)
  - [Separation of concerns](#separation-of-concerns-packagesdb-vs-appsbackend)
- [Frontend](#frontend)
  - [Shared utilities](#shared-utilities-and-library)
  - [Internationalisation](#internationalisation-languagesupport)
  - [Shared components](#shared-components-componentsshared)
  - [Content feature](#content-feature)
  - [Dashboard](#dashboard)
  - [Settings](#settings)
  - [Employees](#employees-feature)
  - [Collections](#collections-feature)
  - [Service Requests](#service-requests-feature)
  - [Notifications](#notifications-feature)
  - [Insights (NL Query)](#insights-nl-query-feature)
  - [Global Search](#global-search)
  - [Background jobs](#background-jobs)
  - [Embeddings and semantic search](#embeddings-and-semantic-search)
- [Conventions](#conventions)
- [Known issues / TODOs](#known-issues--todos)
- [Deployment](#deployment-render)
- [Testing](#testing)

---

## Tech stack

- **Frontend** — React + TypeScript + Vite, Tailwind, shadcn/ui primitives, Recharts, Auth0
- **Backend** — Express 5 + TypeScript (ESM), port `3000`
- **Database** — PrismaORM against PostgreSQL (Supabase)
- **File storage** — Supabase Storage (buckets: `content`, `profiles`)
- **Auth** — Auth0 (JWT via `express-oauth2-jwt-bearer`) + Auth0 Management API for provisioning users
- **Package manager** — pnpm, exclusively (never `npm`)
- **Monorepo** — pnpm workspaces + Turborepo
- **Deployment** — Render.com (single web service, `render` branch)

---

## Repository layout

```
apps/
  backend/
    lib/                   Backend-only utilities (not shared via packages/db)
      embeddings.ts        generateEmbedding() — OpenAI text-embedding-3-small wrapper
      embeddingInputs.ts   buildEmbeddingInput() per entity kind (content, collection, employee, SR)
      extractors.ts        extractText() — pulls plain text from PDF/DOCX/TXT for backfill
    scripts/               One-shot maintenance scripts (not loaded at runtime)
      backfill.ts          Backfills embeddings from Supabase-stored files
      backfill-text.ts     Backfills embeddings from extracted file text
      test-nl-query.ts     Interactive CLI test for the NL-query LLM pipeline
      test-nl-query-exec.ts Same but also executes the generated SQL
    src/
      app.ts               Express entry — middleware, routes, static serving, listen
      jobs/
        index.ts           Registers node-cron schedules (runs on server start)
        autoTag.ts         Hourly job: applies "Expiring Soon" / "Expired" tags to content
      services/
        nlQuery.ts         answerQuestion() — calls OpenAI, validates SQL, executes on read-only Postgres
      hooks/               Thin route handlers (parse req → call packages/db → JSON)
        content.ts
        employee.ts
        bookmark.ts
        collection.ts
        servicereqs.ts
        search.ts          unifiedSearch — fans out semantic search to all four entity types
        notifications.ts   getNotifications, dismissNotification, getDismissedNotifications
        preview.ts         Content-view tracking: getPreviews, addPreview, getHits
        nlQuery.ts         POST /api/nl-query — delegates to services/nlQuery
        types.ts           Shared req/res type aliases
      helpers/
        auth0Management.ts   Auth0 Management API client
        getEmployee.ts       Resolves JWT → EmployeeModel; used by every protected handler
        nlQuerySchema.ts     Zod schemas for NL-query request/response (shared by hook + service)
        openai.ts            OpenAI client singleton + model constant
        permissions.ts       isAdmin / isUserOrAdmin / isPersonaOrAdmin — extracted so permission logic is testable without Express
        sqlSafety.ts         validateSQL() — allowlist-based SQL safety check before execution; isNoDataResponse()
        validateUrl.ts       assertPublicUrl — SSRF-safe URL validator (DNS-resolves before fetching)

  frontend/src/
    pages/                 Top-level routed pages (Home, About, CreditPage, persona landing pages)
    features/              Feature modules
      content/             Content management (largest feature — see below)
      dashboard/           Customizable widget dashboard
      employees/           Employee CRUD
      insights/            NL-query chat interface (AI-powered data analysis)
      notifications/       In-app notification feed and bell
      servicereqs/         Service request CRUD
      settings/            Profile and appearance settings
      GlobalSearch.tsx     Semantic search page across all four entity types
    components/            Shared presentational components and layout chrome
    context/               UserContext, ThemeProvider, Auth0ProviderWithNavigate
    hooks/                 Shared hooks (use-user, use-sort-state, use-avatar-url, use-nl-query, etc.)
    lib/                   types, mime helpers, cn(), formatters, caches
    languageSupport/       i18n (LocaleProvider, useTranslation, dictionaries)

packages/db/
  prisma/schema.prisma     DB schema
  lib/
    prisma.ts              Prisma client (read-write)
    supabase.ts            Supabase client
    embeddings.ts          embeddingToSql() — serialises a vector to pgvector literal format for raw SQL
    fewShotExamples.ts     Curated Q→SQL example pairs injected into the NL-query system prompt
    schemaDescription.ts   Human-readable DB schema description for the LLM system prompt
    systemPrompt.ts        buildSystemPrompt() — assembles schema + examples into the final prompt
  queries/                 Data-access classes: Content, Employee, Bookmark,
                           Collection, ServiceReqs, Bucket, Helper, Notification, Preview
```

---

## Getting started

```bash
pnpm install
pnpm --filter @softeng-app/db exec prisma generate
pnpm dev                                              # runs backend + frontend
```

Backend-only: `pnpm run --filter backend dev`. Migrations: `cd packages/db && pnpm prisma migrate dev`.

### Environment variables (`.env` at repo root)

```
DATABASE_URL=                   # Postgres connection string (Prisma)
NEXT_PUBLIC_DATABASE_URL=       # Same value, exposed for frontend tooling (codebase quirk — not a Next.js project)
SUPABASE_URL=
SUPABASE_ANON_KEY=
AUTH0_MGMT_CLIENT_ID=
AUTH0_MGMT_CLIENT_SECRET=
OPENAI_API_KEY=                 # Required for NL-query (POST /api/nl-query)
ML_SERVICE_URL=                 # Embedding microservice URL (default: http://localhost:3001)
```

The Auth0 tenant (`dev-s638hh1d5ry67sv6.us.auth0.com`) and API audience (`https://hanover-cma-api`) are hardcoded in `app.ts` and `helpers/auth0Management.ts`.

---

## Backend

### Authentication

Every route under `/api` except `GET /api/preview` requires a valid Auth0 JWT:

```ts
// apps/backend/src/app.ts
app.get("/api/preview", content.previewContent)   // public
app.use('/api', checkJwt)                         // everything below is protected
```

The authenticated user's Auth0 `sub` is read from `req.auth.payload.sub` and resolved to an internal `Employee` via `getEmployee(req)` (`helpers/getEmployee.ts`). This helper is used by every protected handler so the employee record is verified on every call and the `auth0Id` is never forwarded to the frontend. The one exception is `getMe`, which reads `req.auth.payload.sub` directly — it is the bootstrap call made before the employee record is guaranteed to exist, so a 404 is intentional.

New employees are created through `POST /api/employee/auth`, which provisions an Auth0 user first and then writes the `Employee` row with the returned `auth0Id`.

### API routes

All routes are JSON unless noted. File-upload routes use `multipart/form-data` with field name `file` (or `photo` for profile photos).

**Public**
- `GET /api/preview?url=...` — fetches a URL server-side and extracts OG metadata + favicon. Blocks private/loopback/link-local addresses to prevent SSRF. 2 MB cap, 5 s timeout.

**Unified search**
- `GET /api/search?q=...&limit=N` — semantic search across all four entity types (content, collections, employees, service requests). Generates an OpenAI embedding for the query, fans out to each entity's `semanticSearch` in parallel (respecting admin visibility rules for collections), and returns results sorted by similarity score. `limit` is capped at 50; default 20. Each result is tagged with `kind` and `similarity`.

**Content** (`/api/content`)
- `GET    /api/content[?persona=...][?unlinkedSR=true]` — all content, or filter by target persona (`admin` returns everything); `unlinkedSR=true` restricts to items with no linked service request
- `GET    /api/content/tags` — distinct set of all tags across content
- `GET    /api/content/search?q=...` — keyword search across content by display name and tags
- `GET    /api/content/transaction-summary` — aggregated counts (by type, status, persona) for the Reports dashboard card
- `GET    /api/content/:id` — one item (with owner and `checkedOutBy`)
- `GET    /api/content/:id/collections` — collections that contain this content item
- `GET    /api/content/info/:id` — Supabase Storage metadata for the underlying file
- `GET    /api/content/download/:id` — streams the file inline with the correct MIME type
- `GET    /api/content/publicUrl/:id` — short-lived (120 s) signed URL
- `POST   /api/content` — create (multipart; `linkURL` *xor* `fileURI`, never both)
- `PUT    /api/content` — update; employee identity from JWT, else `409 { lockReleased: true }` if lock mismatch
- `DELETE /api/content/:id` — soft-delete (recycle); same checkout lock check as `PUT`; clears the lock, does **not** delete the Supabase file
- `GET    /api/content/deleted` — items in the recycle bin (all for admins, owned items only for non-admins)
- `POST   /api/content/:id/restore` — moves item out of recycle bin; owner or admin only
- `DELETE /api/content/:id/permanent` — hard-delete from DB and Supabase; item must already be in the recycle bin; owner or admin only
- `POST   /api/content/:id/checkout` — employee from JWT; 403 if persona doesn't match `targetPersona` (admins bypass); 409 if already locked by someone else
- `POST   /api/content/:id/checkin` — admin can force-checkin any item; non-admins can only checkin their own lock

> **Route order matters**: `info`, `download`, `publicUrl`, `tags`, `search`, `transaction-summary`, and `deleted` must be registered **before** `/:id`, otherwise Express 5 will match them to the parameterized route first. `checkout`, `checkin`, `restore`, and `permanent` are sub-routes under `/:id` and are unaffected.

**Bookmarks** (`/api/bookmark`) — user derived from the JWT, not the URL
- `GET    /api/bookmark`
- `POST   /api/bookmark/:contentId`
- `DELETE /api/bookmark/:contentId`

**Previews** (`/api/previews`) — view-tracking for content items
- `GET    /api/previews` — caller's recently viewed content items
- `POST   /api/previews/:contentId` — record a view; creates or updates the `Preview` row for `(employeeId, contentId)`
- `GET    /api/previews/hits/:contentId` — total view count for a content item

**Employees** (`/api/employee`)
- `GET    /api/employee` — all employees (profile photo URIs signed for 1 h)
- `GET    /api/employee/all` — all employees + login usernames (admin UI)
- `GET    /api/employee/me` — current user, resolved via Auth0 sub
- `GET    /api/employee/dashboard-layout` — caller's saved widget layout (JSON); returns `DEFAULT_LAYOUT` if none saved
- `PUT    /api/employee/dashboard-layout` — persist a widget layout for the caller
- `GET    /api/employee/:id`
- `POST   /api/employee/auth` — create with Auth0; provisions the Auth0 user first
- `POST   /api/employee/photo` — multipart `photo`; image only, max 5 MB; replaces the old photo
- `PUT    /api/employee`
- `DELETE /api/employee`

**Collections** (`/api/collections`) — visibility rules applied at the DB layer for `GET /api/collections`; post-query for single fetches
- `GET    /api/collections[?unlinkedSR=true]` — public collections + caller's own (all for admins); `unlinkedSR=true` restricts to collections not yet linked to any SR
- `POST   /api/collections` — create; owner is derived from JWT, not the request body
- `GET    /api/collections/favorites` — caller's favorited collections
- `GET    /api/collections/owned` — collections owned by the caller
- `GET    /api/collections/:id` — single collection; 403 if private and caller is not owner/admin
- `PUT    /api/collections/:id` — update name, visibility, owner, and full ordered item list (owner or admin only)
- `DELETE /api/collections/:id` — cascades to CollectionItem and CollectionFavorite (owner or admin only)
- `POST   /api/collections/:id/items` — append content items to a collection; deduplicates against existing items and assigns sequential positions after the last existing one (owner or admin only)
- `POST   /api/collections/:id/favorite` — add favorite; guards against favoriting inaccessible private collections
- `DELETE /api/collections/:id/favorite` — remove favorite

> **Route order matters**: `GET /api/collections/favorites` and `GET /api/collections/owned` must be registered **before** `GET /api/collections/:id` to avoid Express matching them as IDs.

**Service Requests** — `GET/POST/PUT /api/servicereqs`, `DELETE /api/servicereqs/:id`, plus `/api/assigned`.
- `GET    /api/servicereqs/unlinked` — SRs not linked to any content or collection; used by `ServiceRequestPicker` in the link dialog
- `PATCH  /api/content/:id/service-request` — sets `serviceRequestId` on a content item (FK lives here, not on the SR row)
- `PATCH  /api/collections/:id/service-request` — sets `serviceRequestId` on a collection
- `GET    /api/content/:id/service-requests` — SR(s) linked to a content item (back-relation lookup)
- `GET    /api/collections/:id/service-requests` — SR(s) linked to a collection

**Notifications** (`/api/notifications`)
- `GET    /api/notifications` — unified notification feed for the caller. Merges persisted notifications (content changes, ownership transfers) with dynamic expiration alerts (content expiring in ≤3 days, ≤1 hour, or already expired). Items the caller has dismissed are excluded. Sorted newest-first.
- `POST   /api/notifications/dismiss` — dismiss a single notification or expiration alert. Body: `{ kind: "notification", notificationId }` or `{ kind: "expiration", contentId, threshold }`.
- `GET    /api/notifications/dismissed` — caller's previously dismissed notifications (for the "dismissed" view).

**Natural-language query**
- `POST /api/nl-query` — accepts `{ question, history[] }`. Calls OpenAI with a schema-aware system prompt; the response includes a SQL query and chart suggestion. The SQL is safety-validated (read-only allowlist) then executed against a Postgres read-only user. Returns `{ sql, explanation, chartType, rows, columns }`.

> **Route order matters in `apps/backend/src/app.ts`**: within the `/api/content` group, `info`, `download`, `publicUrl`, `search`, `tags`, `transaction-summary`, `deleted` must come before `/:id`. Within `/api/collections`, `favorites` and `owned` must come before `/:id`. Within `/api/notifications`, `dismissed` must come before any parameterized sub-route.

### Checkout / check-in (server side)

A content item is "checked out" by writing `checkedOutById` and `checkedOutAt` on the row. Only the holder can `PUT /api/content` (edit) or `DELETE /api/content/:id` (recycle/soft-delete) — the check lives in `Content.updateContent` (`packages/db/queries/content.ts`) and in the `deleteContent` hook. Recycling also clears the checkout lock as part of the same write (`softDeleteContent`). If the lock has been released or taken by someone else, the write returns `409 { lockReleased: true, message: "This item has been forcibly checked in." }` and the frontend handles the forced check-in.

Expired locks (`LOCK_TIMEOUT_MS = 2 * 60 * 1000`) are cleared server-side on the next write attempt. There is no background sweeper — locks are checked at the point of use.

### File storage

Files live in two Supabase buckets:

- `content` — uploaded documents attached to content items
- `profiles` — employee profile photos

All keys are namespaced and randomized: `${ownerOrEmployeeId}/${crypto.randomUUID()}/${originalFilename}`. This prevents collisions and makes accidental overwrites impossible. Uploads are transactional in spirit — if the DB write fails after a successful upload, the handler deletes the orphaned object (`uploadFile`, `updateContent`, `uploadProfilePhoto` all follow this pattern).

All storage operations go through `packages/db/queries/bucket.ts` (`Bucket.uploadFile`, `downloadFile`, `deleteFile`, `createSignedUrl`, `createPublicUrl`, `getFileMetadata`).

### Data model (abridged)

Schema at `packages/db/prisma/schema.prisma`.

- **Employee** — `id`, `firstName`, `lastName`, `persona`, `auth0Id`, `profilePhotoURI`, `dashboardLayout` (JSON — stores the employee's widget layout as a `WidgetLayoutEntry[]`; `null` means use `DEFAULT_LAYOUT`)
- **Content** — `displayName`, `linkURL` *xor* `fileURI`, `ownerId`, `contentType` (`reference` | `workflow`), `status` (`new` | `inProgress` | `complete`), `targetPersona`, `tags: string[]`, `lastModified`, `expiration`, `checkedOutById`, `checkedOutAt`, `deleted` (default `false` — soft-delete flag; all normal queries filter this out), `serviceRequestId` (FK → ServiceRequest; `@unique` — one SR per item max)
- **Bookmark** — join table (`bookmarkerId`, `bookmarkedContentId`) with a composite unique key
- **Collection** — `displayName`, `ownerId`, `public`, `serviceRequestId` (FK → ServiceRequest; `@unique`); items stored in **CollectionItem** (`collectionId`, `contentId`, `position`) — explicit join table so item order is preserved. Favorites stored in **CollectionFavorite** (`employeeId`, `collectionId`). Private collections cannot be linked to SRs — enforced in the backend hooks.
- **ServiceRequest** — `name`, `created`, `deadline`, `type`, `assigneeId`, `ownerId`. **No FK to Content or Collection** — the FK lives on those tables and Prisma resolves `linkedContent` / `linkedCollection` as back-relations.
- **Notification** — `id`, `type` (`change` | `ownership` | `expiration`), `contentId` (FK → Content), `triggeredById` (FK → Employee, nullable), `createdAt`, `metadata` (JSON — extra type-specific fields). Created by the backend when content is updated or ownership changes.
- **NotificationDismissal** — join table (`notificationId`, `employeeId`, `dismissedAt`). Tracks which employees have dismissed which persisted notifications.
- **ExpirationDismissal** — `(employeeId, contentId, threshold)` unique key. Tracks dismissed expiration alerts (`threshold` = `"3d"` | `"1h"` | `"expired"`), so each threshold fires only once per employee per content item.
- **Preview** — `(employeeId, contentId)` unique key, plus `viewedAt`. Records the most recent time an employee viewed a content item.

Enums (`Persona`, `Status`, `ContentType`, `RequestType`) are mapped from strings via the `Helper` class (`packages/db/queries/helper.ts`), so the API accepts plain strings from the frontend.

### Separation of concerns: `packages/db` vs `apps/backend`

The query classes in `packages/db/queries/` are a pure data layer — they talk to the database and nothing else. **They do not enforce permissions.** Deciding whether a requesting employee is allowed to read or mutate a resource (ownership checks, admin access, private-visibility rules) is the responsibility of the route handler in `apps/backend/src/hooks/`. This keeps the query classes reusable and testable in isolation.

All joined `Employee` records use the shared `employeeSelect` constant (`packages/db/queries/helper.ts`), which explicitly excludes `auth0Id` so it is never serialised into an API response.

---

## Frontend

Feature modules live under `apps/frontend/src/features/`: **collections**, **content**, **dashboard**, **employees**, **insights**, **notifications**, **servicereqs**, **settings**, and **tutorial**. Shared plumbing (context, hooks, UI primitives, types) lives in sibling top-level folders.

### Shared utilities and library

**`lib/`**

- **`lib/utils.ts`** — `cn()` (Tailwind class merger), `formatLabel()` (camelCase → human label, e.g. `"inProgress"` → `"In Progress"`), `formatName()` (employee → `"Last, First"`).
- **`lib/types.ts`** — canonical TypeScript types: `Employee`, `ContentItem`, `ContentType`, `ContentStatus`, `Persona`, `BookmarkRecord`, `UrlPreview`, `ServiceReq`. All are plain `type` aliases (never `interface`), hand-written to mirror the Prisma schema shapes — nothing imported from generated types.
- **`lib/mime.ts`** — MIME-type utilities: `categorize`, `CATEGORY_COLORS` (icon and badge color map), `validateFileForUpload`, `stripExtension`, `ALLOWED_ACCEPT_STRING`, `lookupByFilename`, `resolveAllowedType`.
- **`lib/highlight.tsx`** — search-term highlighting. `highlight(text, query)` returns JSX spans. `findMatches(full, query)` returns `{start, end}[]` ranges. `highlightRange(text, offset, matches)` applies pre-computed ranges to a substring — used when a match spans a concatenated full name and you need to highlight each part separately.
- **`lib/avatar-cache.ts`** — session-scoped `Map<employeeId, Blob>` for profile photo bytes. Call `invalidateAvatarCache(id)` after uploading a new photo so the next render re-fetches.

**`hooks/`**

- **`useUser()`** (`hooks/use-user.ts` / `context/UserContext`) — current employee: `id`, `firstName`, `lastName`, `persona`, `profilePhotoURI`, `userName`. Context also exposes `updateUser` and `uploadProfilePhoto`.
- **`useTheme()`** (`context/ThemeProvider`) — `light | dark | system`.
- **`usePageTitle(title)`** — sets the browser `<title>`.
- **`useSortState<T>` / `applySortState`** — generic column sort state used by every sortable table.
- **`useAvatarUrl(id, uri)`** — fetches `GET /api/employee/photo/:id` and caches the blob in `lib/avatar-cache.ts`. Used by `EmployeeAvatar` and any component that needs a per-row signed URL.
- **`useContentFilters(content, bookmarks, userId, persona)`** — owns all content filtering: search term, active tab (`forYou | all | owned | bookmarks | recyclebin`), and sidebar checkbox filters (status, contentType, persona, tags, docType, expirationStatus). Returns `filteredContent`, `activeFilterCount`, and setters. The `recyclebin` tab always yields an empty `filteredContent` — `ViewContent` renders it from a separate `deletedContent` state. Add new filters here, not in `ViewContent`.
- **`useNLQuery()`** (`hooks/use-nl-query.ts`) — wraps `POST /api/nl-query`. Returns `{ ask(request), isLoading }`. `ask` resolves to `NLQueryFullResult` (`sql`, `explanation`, `chartType`, `rows`, `columns`). Used exclusively by `InsightsPage`.
- **`useIsMobile()`** — `true` below 768 px via `matchMedia`. Used by the sidebar shell.

**`toast`** from `sonner` — async success/error notifications, used throughout.

### Internationalisation (`languageSupport/`)

A minimal runtime i18n system supporting English (`en_us`) and Spanish (`sp_sp`):

- **`localeContext.tsx`** — `LocaleProvider` (mounted in `main.tsx`) and `useLocale()` returning `{ locale, setLocale }`.
- **`keys.ts`** — `TranslationKey` — string literal union of every translation key.
- **`dictionaries.ts`** / **`translation.ts`** — per-locale tables and the `ts(key, locale)` lookup.
- **`useTranslation.ts`** — `useTranslation(locale)` returns `{ ts(key: TranslationKey) }`. Usage: `const { ts } = useTranslation(useLocale().locale)`.

Extend by adding a key to `keys.ts` and entries to `dictionaries.ts`.

### Shared components (`components/shared/`)

- **`EmployeeAvatar`** — avatar with initials fallback and HoverCard tooltip. `size`: `sm | default | lg`.
- **`EmployeeCard`** — compact name + persona display; used as list rows inside `EmployeePicker`.
- **`EmployeePicker`** — searchable employee dropdown. Controlled via `selectedId` / `onSelect(id, employee)`. Fetches `/api/employee/all` on mount. Supports `disabled` and a "None" option.
- **`ContentItemCard`** — compact one-line row for a content item (file or link). Shows favicon or `ContentIcon`, display name, subtitle, `ContentExtBadge`, and a nav button. Accepts an `actions` slot for injecting buttons.
- **`ContentPicker`** — searchable content dropdown. Accepts `unlinkedSR` to restrict to items with no existing SR link. Used in the SR link dialog.
- **`CollectionCard`** — compact one-line row for a collection. Shows item count, public/private indicator, and a link to the collection detail page. Accepts an `actions` slot.
- **`CollectionPicker`** — searchable collection dropdown, same UX as `EmployeePicker`. Accepts `publicOnly` to restrict the list to public collections (filtering is client-side). Accepts `unlinkedSR` to query `?unlinkedSR=true`. Used in the service request form.
- **`ServiceRequestCard`** — compact one-line row for a service request. Shows name, type, and assignee. Used by `GlobalSearch`.
- **`ServiceRequestPicker`** — searchable service request dropdown. Fetches `GET /api/servicereqs/unlinked` when `unlinkedOnly` is true. Used by `ServiceRequestLinkDialog`.
- **`ServiceReqDetail`** — detail card showing all fields of a service request. Shown in content and collection detail views.
- **`PersonaBadge`** — badge for a persona value.
- **`SortableHead<T>`** — generic `<TableHead>` with sort-direction arrow. Pairs with `useSortState`.
- **`TablePagination`** — rows-per-page selector + first/prev/next/last navigation bar. Stateless; parent owns `currentPage`/`pageSize`. Resets to page 1 automatically when page size changes.
- **`SlidingTabs`** — animated underline tab strip.
- **`UrlPreviewCard`** — OG metadata card (title, description, image, favicon). Used by `UrlSourceField`; also available standalone.
- **`UrlPreviewLink`** — link that shows a `UrlPreviewCard` on hover.
- **`FilePickerCard`** — drag-and-drop / click-to-browse file selection area.
- **`Hero`** — page-top banner with icon, title, and description.
- **`DottedBackground`** — decorative dotted pattern used as page backgrounds on `GlobalSearch` and `InsightsPage`.

Layout chrome: `components/layout/` (`AppSidebar`, `Navbar`, `Footer`, `DarkmodeButton`, `DisclaimerAlert`, `SidebarOverlay`, `InformationAlert`).

### Content feature

The largest feature — everything under `features/content/`.

```
features/content/
  forms/
    content-form.ts          Types, validation, FormData builder, xhrFetch
    use-content-form.ts      Hook wrapping form state + deferred validation
    ContentFormFields.tsx    Shared form UI for Add and Edit dialogs
    AddContentDialog.tsx     POST /api/content
    EditContentDialog.tsx    PUT  /api/content
    UrlSourceField.tsx       URL input with live OG-preview card
    ConfirmCheckoutDialog.tsx
    ConfirmCheckinDialog.tsx
    ConfirmRestoreDialog.tsx  Accent-colored confirm dialog for restore actions
    ForceCheckinDialog.tsx   Admin-only — release another user's lock
  listing/
    ViewContent.tsx          Main content list page
    ContentTableHeader.tsx   Shared <TableHeader> (checkbox, icon, 7 sortable cols, Actions) used by both ViewContent and RecycleBinTable
    RecycleBinTable.tsx      Recycle bin table — owns its own restore/permanent-delete dialog state
    BookmarkedFiles.tsx      Current user's bookmarks (top 5)
    MyFiles.tsx              Items owned by current user (top 5)
    RecentFiles.tsx          Most recently modified items (top 8)
    ExpirationCalendar.tsx   Full-month calendar of items with expirations
  previews/
    FilePreview.tsx          Inline/full file viewer (PDF, DOCX, images, text…)
    ViewSingleFile.tsx       Full-page viewer at /file/:id
    file-cache.ts            Session-scoped cache for downloaded file bytes
    preview-cache.ts         Session-scoped cache for URL OG metadata
  tags/
    TagInput.tsx             Chip-style tag input with suggestions + create-new
  bulk/
    BulkUploadPage.tsx       Multi-file upload at /bulk-upload; uses POST /api/collections/:id/items to append without replacing
  components/
    ContentIcon.tsx          Lucide icon keyed by file category (uses CATEGORY_COLORS from lib/mime.ts)
    ContentExtBadge.tsx      Badge showing file extension (or "Link")
    ContentStatusBadge.tsx   Null-safe status badge; labels via useTranslation
    ContentTypeBadge.tsx     Same pattern for contentType
    ExpirationBadge.tsx      Urgency badge (red = expired, amber ≤7d, green = future, muted = no expiry); shared by ViewContent, RecycleBinTable, and ExpirationCalendar
```

`ContentItem` is defined in `lib/types.ts` — hand-written to mirror the Prisma `Content` shape with joined `owner` and `checkedOutBy` relations as `Employee` objects. Key fields: `ownerId`, `checkedOutById` (the raw ID), `checkedOutBy` (the joined employee object).

Every item is either a **file** (`fileURI`) or a **link** (`linkURL`), never both. Most UI branches on `item.linkURL ? … : …`.

#### Checkout / check-in flow

1. Pencil icon → `ConfirmCheckoutDialog` opens.
2. Confirm → `POST /api/content/:id/checkout`. If taken, backend returns the holder's name; dialog stays closed. 403 if the caller's persona doesn't match `targetPersona` (admins bypass).
3. On success, `EditContentDialog` opens. A 5-second poll compares `data.checkedOutById` to `user.id` as strings. Mismatch = lock lost → dialog closes with toast.
4. Submit → `PUT /api/content`. `409 { lockReleased: true }` → close + toast.
5. Cancel/close → `POST /api/content/:id/checkin` (skipped if already expired server-side).

The three confirm dialogs are near-identical `AlertDialog` wrappers with an async `onConfirm` and a local `loading` flag that gates the close handler. `ForceCheckinDialog` is admin-only — it checkins using the current holder's `employeeID`.

#### Add/Edit dialogs and form plumbing

Both dialogs share `ContentFormFields` (UI), `useContentForm` (state), and `buildContentFormData` + `xhrFetch` (submission):

|                        | AddContentDialog              | EditContentDialog                        |
| ---------------------- | ----------------------------- | ---------------------------------------- |
| Method                 | `POST /api/content`           | `PUT /api/content`                       |
| Initial values         | `initialValues(userId, persona)` | `fromContentItem(content)`            |
| Extra fields on submit | —                             | `id` (employee identity from JWT)        |
| Source field required  | yes                           | no (keeps existing file/link)            |
| 409 handling           | —                             | `{ lockReleased: true }` → close + toast |

**`content-form.ts`** — single source of truth:
- `ContentFormValues` — `contentType` and `status` use `"none"` as a sentinel so `<Select>` can show its placeholder; `dateModified` + `lastModifiedTime` are kept separate and merged into one ISO timestamp by `buildContentFormData`.
- `initialValues(userId, persona)` / `fromContentItem(item)` — starting values for Add / Edit.
- `getErrors(values, isEdit)` — returns `{ field: message }`; `isEdit` relaxes the source requirement.
- `buildContentFormData(values)` — serializes to `FormData`; `tags` is JSON-stringified (FormData can't send arrays; backend does `JSON.parse(payload.tags || "[]")`).
- `xhrFetch(...)` — XHR wrapper used instead of `fetch` when a file is attached, so upload progress can be tracked and the request can be cancelled mid-flight via an `AbortSignal`.

**`useContentForm`** — thin `useState` wrapper with deferred validation: errors only show after the first submit attempt, but `hasErrors` is always current so the Submit button can disable in real time. `reset()` increments `formKey`, which callers pass as `key` on `ContentFormFields` to force a remount.

#### `UrlSourceField` — live OG previews

Fetches `GET /api/preview?url=...` on mount and on blur. Results cached in `preview-cache.ts` — a module-level `Map` with three states: `undefined` (never fetched), `null` (unreachable), `UrlPreview` (success). Storing `null` prevents re-hitting dead URLs on every render.

#### `TagInput`

Fetches `GET /api/content/tags` on mount for suggestions; degrades to create-only if that fails. Tags are Title Cased at commit time (Enter, comma, or suggestion click), not while typing. Restricted to letters and spaces. Backspace on empty input removes the last chip. `creatable={false}` suppresses the create option (filter contexts). Uses `PopoverAnchor` (not `PopoverTrigger`) and `onMouseDown` + `preventDefault` on suggestions to prevent blur-before-select.

#### File previews and caching

`FilePreview` renders the appropriate viewer by filetype (PDF, DOCX, images, text, etc.). Bytes are cached in `file-cache.ts` — `textCache: Map<url, string>` for text, `blobCache: Map<url, Blob>` for binary. Session-scoped, never auto-evicted — call `invalidateFileCacheById(id)` after saving an edit.

`ViewSingleFile` (at `/file/:id`) fetches only metadata and delegates to `<FilePreview mode="full" />`. Both inline and full-page share the same cache, so navigating between them doesn't re-download.

#### `ExpirationCalendar`

At `/calendar`. Buckets content with an `expiration` into a `Map<"YYYY-MM-DD", ContentItem[]>`. Manual grid (no calendar library) — `firstDay` of the month padded to full weeks. Each day cell shows up to 3 chips color-coded by urgency (red = expired, amber ≤7d, yellow ≤14d). Overflow shows "+N more". Clicking a day toggles a detail panel.

#### `BulkUploadPage`

At `/bulk-upload`. Select multiple files (each gets an editable display name pre-filled from the filename), fill shared metadata (persona, owner, tags, type, status), upload sequentially via `POST /api/content`. Per-row status icons: `pending → uploading → success | error`. Errors don't stop remaining uploads. "Upload More" resets the file list, keeping metadata for a second batch.

### Dashboard

`features/dashboard/Dashboard.tsx` renders a user-customizable widget grid. The layout is persisted per-employee via `GET/PUT /api/employee/dashboard-layout`.

**`widget-registry.ts`** — `WIDGET_REGISTRY` maps each `WidgetId` to its React component, display label, default size (`small | medium | full`), and description. `DEFAULT_LAYOUT` is the `WidgetLayoutEntry[]` used when an employee has no saved layout. To add a widget: create the card component under `features/dashboard/components/cards/`, register it in `WIDGET_REGISTRY`, and add a default entry to `DEFAULT_LAYOUT`.

**`use-dashboard-layout.ts`** (`useDashboardLayout()`) — fetches the employee's saved layout on mount; `setLayout` updates local state and fire-and-forgets a `PUT` to persist it.

**`DashboardCustomizeSheet.tsx`** — slide-in sheet (triggered from a button in `Dashboard.tsx`) that lets employees toggle widgets on/off and reorder them via drag handles.

**`WidgetRow.tsx`** — renders one row of the widget grid, sizing widgets by their `size` field.

Available cards: `HelloCard` (greeting + avatar), `ClockCard` (live clock), `EmployeeChartCard` (Recharts pie by persona), `ContentTypeChartCard` (bar chart by file type; memoized), `QuickLinksCard`, `LinksCard` (role-filtered links), `BookmarkedCard`, `MyContentCard`, `RecentFilesCard`, `PreviewedFilesCard` (recently viewed), `OwnedCollectionsCard`, `FavoritedCollectionsCard`, `ServiceRequestsCard` (assigned SRs), `ReportCard` (analytics/transaction summary).

### Settings

Nested-route layout at `/settings/*`. `SettingsLayout.tsx` renders a sidebar nav and `<Outlet />` — each section is a fresh mount.

- **`ProfileSettings.tsx`** — uses react-hook-form + zod. Populated via `form.reset(...)` in a `useEffect` watching `user`. Photo upload is separate: hidden file input, client-side MIME + 5 MB validation, then `uploadProfilePhoto(file)` from `UserContext`. `userName` and `persona` are read-only. Submit disabled unless `isDirty`.
- **`AppearanceSettings.tsx`** — shadcn `RadioGroup` backed by `useTheme()`; no local state.

Adding a section: create the component under `features/settings/sections/` wrapped in `<SettingsSection>`, register the nested route, add to `SettingsNav.tsx`.

### Employees feature

Full CRUD under `features/employees/`. Both dialogs import helpers from `employee-form.ts` (`EmployeeFormValues`, `initialValues`, `getErrors`, `buildPayload`, `toEmployee`, `lowestAvailableId`), but there is no shared form-fields component or custom hook — each dialog manages its own `useState`.

- **Creating** — `AddEmployeeDialog` fetches taken IDs/names on open; pre-fills ID with `lowestAvailableId(taken)`. Posts to `POST /api/employee/auth`.
- **Editing** — `firstName`, `lastName`, `persona` only (`id` read-only). `PUT /api/employee`.
- **Deleting** — `ConfirmDeleteDialog` warns about owned file removal. `DELETE /api/employee`.

**`useEmployeeNameTaken(open, excludeId?)`** — fetches all employees when the dialog opens, builds a `Set` of `"firstName|lastName"` keys, returns a `checkNameTaken(first, last)` function. `excludeId` prevents the edited employee's own name from triggering a false conflict. Silently no-ops if the fetch fails.

**Validation** — Add requires firstName, lastName (unique), id (positive int, not taken), persona, userName, email, password, confirmPassword (matching). Edit requires firstName and lastName (unique, self excluded).

Search matches firstName, lastName, full name, persona, id. Name matches highlighted via `highlightRange`. Rows extracted to `EmployeeRow` so `useAvatarUrl` can be called per row (hooks can't be called inside `.map()`).

### Collections feature

`features/collections/` contains dialogs for creating and managing collections. Key components:

- **`AddToCollectionDialog`** — composes `CollectionPicker` + `AddCollectionDialog` to let a user pick an existing collection or create a new one, then calls `POST /api/collections/:id/items` to append selected content. A `refreshKey` counter triggers `CollectionPicker` to refetch after a new collection is created in the same dialog session.
- **`AddCollectionDialog`** — creates a new collection via `POST /api/collections`.

### Service Requests feature

Full CRUD under `features/servicereqs/`. `AddServiceReqDialog` and `EditServiceReqDialog` share `ServiceReqFormFields` (fully controlled, no internal state) and each instantiate their own `useServiceReqForm`.

**`useServiceReqForm`** — same deferred-validation pattern as `useContentForm`: errors hidden until first submit, `hasErrors` always current, `reset()` increments `formKey` for remount. `createdDate` and `createdTime` are kept separate (date picker returns `Date`, time input returns `"HH:MM:SS"`) and merged into an ISO timestamp in `buildServiceReqJSON`. `type: "none"` is the sentinel for the `<Select>` placeholder and is rejected by validation.

Access control: Edit and Delete disabled unless the user is `ownerId`, `assigneeId`, or `admin`.

Search matches name, type, owner full name, assignee full name. `highlightRange` on the name column. All columns sortable; default: type asc.

**API endpoints** — see the full list under Service Requests in the Backend section above.

**SR ↔ Content/Collection link architecture** — the FK (`serviceRequestId`) lives on the `Content` and `Collection` tables, not on `ServiceRequest`. This means:
- Writing a link always goes through `Content.setServiceRequest` or `Collection.setServiceRequest`, never a direct SR update.
- `ServiceRequest.linkedContent` / `linkedCollection` are Prisma back-relations; they can be queried with `include` but cannot be set during SR create/update.
- The `@unique` constraint on each FK column ensures at most one SR per content item and one per collection.
- Creating an SR and then linking it requires three steps: create SR → set FK on content/collection → re-fetch SR (see `createServiceReq` hook).
- Deleting an SR requires nulling out the FK on linked rows first (no cascade in schema).
- `srInclude` is defined in `packages/db/queries/helper.ts` (not `servicereqs.ts`) to allow `content.ts` and `collection.ts` to import it without creating circular imports.

**`ServiceRequestLinkDialog`** — manages SR links from the content/collection detail view. When linking an existing SR it PATCHes the content/collection endpoint (not the SR). When creating a new SR it passes `startingValues` to `AddServiceReqDialog` so the link is embedded in the create payload — no second PATCH needed.

**`ContentPicker` / `CollectionPicker`** — both accept `unlinkedSR` prop. When true, `?unlinkedSR=true` is appended to the fetch URL so only items with no existing SR link are shown. The collection picker additionally requires `publicOnly` in the SR form context because private collections cannot be linked.

### Notifications feature

`features/notifications/` — in-app notification feed.

- **`NotificationBell`** — bell icon in the `Navbar` with an unread count badge. Navigates to `/notifications` on click. Polls `GET /api/notifications` every 60 s to keep the badge count fresh.
- **`ViewNotifications`** — full notification list page at `/notifications`. Two tabs: active (unread) and dismissed. Renders `NotificationCard` for each item.
- **`NotificationCard`** — single notification row. Shows the notification type (`change`, `ownership`, or `expiration`), the content name, the triggering employee (if any), and relative time. Includes a dismiss button that calls `POST /api/notifications/dismiss`.
- **`ClearAllDialog`** — confirm dialog for bulk-dismissing all active notifications.

Notification types produced by the backend:
- `change` — content was edited by someone else
- `ownership` — content ownership was transferred
- `expiration` — content is expiring within 3 days, 1 hour, or has already expired (three distinct threshold alerts)

Expiration alerts are synthetic (not stored as `Notification` rows) — the backend assembles them from `Content.expiration` values at query time and filters out any the employee has already dismissed via `ExpirationDismissal`.

### Insights (NL Query) feature

`features/insights/` — AI-powered natural-language data analysis chat.

At `/insights`. The page maintains a `conversation: ChatTurn[]` and renders either `EmptyState` (with suggested prompts) or `ConversationView`. The user types a question in `ChatInput` at the bottom; the page calls `useNLQuery().ask()` which posts to `POST /api/nl-query`.

**Conversation history** is sent with each request so the model has context for follow-up questions. Only valid (non-errored) user/assistant pairs are included; `pairUpValidTurns` drops any user turn whose assistant response errored, since a dangling user turn in the `messages` array breaks the OpenAI API's alternating-role requirement.

**`ResultRenderer`** — dispatches to `ResultTable`, `ResultChart`, or `ResultScorecard` based on `chartType` returned by the LLM. `ResultChart` uses Recharts; chart type is one of `bar`, `line`, `pie`, or `scalar`. `ResultScorecard` is used when the query returns a single aggregate value. `formatInsightValue.ts` handles number formatting (currencies, percentages, plain numbers).

**Backend pipeline** (`apps/backend/services/nlQuery.ts`):
1. Build a static system prompt from DB schema description + few-shot examples (`packages/db/lib/`).
2. Call OpenAI with structured output (`zodResponseFormat`): `{ sql, explanation, chartType }`.
3. Validate the SQL with `validateSQL` (read-only allowlist in `helpers/sqlSafety.ts`).
4. Execute on a Postgres read-only user via `prisma.$queryRawUnsafe`. Cap at 1000 rows.
5. Retry once on validation failure (re-submits with the error as a correction message).

`NL_QUERY_MODEL` is set in `helpers/openai.ts`. The system prompt is built once at module load and cached (it is static content — no reason to rebuild per request).

### Global Search

`features/GlobalSearch.tsx` — semantic search page at `/search`.

Sends `GET /api/search?q=...&limit=N`, which generates an OpenAI embedding for the query and fans out to `Content.semanticSearch`, `Collection.semanticSearch`, `Employee.semanticSearch`, and `ServiceReqs.semanticSearch` in parallel. Results are sorted by similarity score and tagged with `kind`.

The last query is persisted to `localStorage` so navigating away and returning re-runs it automatically. The URL `?q=` param is set on submit and read on mount — the Navbar search bar sets this param when navigating to `/search`.

Results can be filtered client-side by `kind` using pill toggles (Content / Collections / Employees / Service Requests). A `limit` selector (10 / 20 / 50) controls how many results are fetched from the backend.

The `SearchResult` type is in `lib/types.ts`:
```ts
type SearchResult =
  | { kind: "content";    similarity: number; item: ContentItem }
  | { kind: "collection"; similarity: number; item: Collection }
  | { kind: "employee";   similarity: number; item: Employee }
  | { kind: "servicereq"; similarity: number; item: ServiceReq }
```

### Background jobs

`apps/backend/src/jobs/index.ts` — registers cron schedules on server start using `node-cron`.

- **Hourly tag sync** (`0 * * * *`): calls `applyExpirationTagsToAll()` from `autoTag.ts`, which queries all content with an expiration and computes whether to add/remove the `"Expiring Soon"` or `"Expired"` tags. Tags are only written when they actually change (idempotent). `applyExpirationTagsToOne(id)` is also exported for on-demand use after a single item changes.

### Embeddings and semantic search

Each of the four searchable entity types (Content, Collection, Employee, ServiceRequest) has a pgvector `embedding` column. The embedding is generated by `generateEmbedding()` (`apps/backend/lib/embeddings.ts`), which delegates to a separate ML microservice at `ML_SERVICE_URL` (default `http://localhost:3001`). That sidecar wraps `text-embedding-3-small` (1536 dimensions).

Embedding inputs are constructed by `buildEmbeddingInput(kind, item)` (`apps/backend/lib/embeddingInputs.ts`) — a plain-text representation of the entity's searchable fields. Text for file-based content is extracted by `extractText()` (`apps/backend/lib/extractors.ts`) using pdf-parse and mammoth.

**Backfill scripts** (`apps/backend/scripts/`) are one-shot utilities run manually to populate embeddings for existing rows — not loaded at runtime.

The `packages/db/lib/embeddings.ts` module provides `embeddingToSql()`, which serialises a vector into the pgvector literal format used by each query class's `semanticSearch` raw SQL call.

---

## Conventions

- **shadcn/ui primitives** — reach for a component from `components/ui/` (`Button`, `Dialog`, `Card`, `Input`, `Select`, `Popover`, `Table`, `Badge`, `Avatar`, etc.) before writing raw `<div>` elements. Add new primitives with `pnpm --filter frontend exec shadcn add <component>`. The `components/ui/` files are auto-generated and must not be hand-edited.
- **pnpm only** — never `npm` or `npx`. Use `pnpm prisma migrate dev`, not `pnpx prisma migrate dev`.
- **Relative API paths everywhere** — never hardcode `localhost:3000`. The backend serves the frontend's built `dist/` in production, so `/api/...` works in both environments.
- **`type` aliases only, no `interface`** — project-wide TypeScript convention for the frontend. A few legacy files still use `interface`; migrate as they're touched. No OOP/class-based patterns in frontend TS.
- **`cache: "no-store"` on poll requests** — avoids stale cache hits on the 5-second edit-dialog poll and the 10-second list poll in `ViewContent`.
- **Compare lock owners as strings** — use `String(data.checkedOutById) !== String(user!.id)`. The field is a number in the DB but JSON serialization can produce inconsistencies across endpoints, so string-comparing avoids `42 !== "42"` false mismatches.
- **Always `parseInt` IDs on the backend** — `FormData` values are always strings, so `id`, `ownerID`, `employeeID` need parsing before use.
- **Auth headers** — always `Authorization: Bearer ${token}` using `getAccessTokenSilently()` from `@auth0/auth0-react`.
- **Polling (not WebSockets)** — consistent pattern: `ViewContent` lists poll every 10s, `EditContentDialog` polls every 5s.
- **Express 5 wildcards** — use `app.get('/{*splat}', ...)`, not `app.get('*', ...)`. Required for the SPA fallback.


---
### Testing

- Backend tests live at `apps/backend/src/*.test.tsx`; run via `cd apps/backend && pnpm test`.
- Vitest test files need `import 'dotenv/config'` at the top.
- `prisma.config.ts` needs `import { config } from "dotenv"; config({ path: ".env" })` at the top.
