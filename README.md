# teamB-prototype

A content management system for an insurance company. Employees with role-based personas can view, add, edit, and delete content items (uploaded files or external URLs), manage other employees, and track service requests. A checkout/check-in locking mechanism prevents simultaneous edits on the same content item.

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
  backend/src/
    app.ts                 Express entry — middleware, routes, static serving, listen
    hooks/                 Thin route handlers (parse req → call packages/db → JSON)
      content.ts
      employee.ts
      bookmark.ts
      login.ts
      servicereqs.ts
      types.ts             Shared req/res type aliases
    helpers/
      auth0Management.ts   Auth0 Management API client

  frontend/src/
    pages/                 Top-level routed pages
    features/              Feature modules (content, dashboard, settings, employees, servicereqs)
    components/            Shared presentational components and layout chrome
    context/               UserContext, ThemeProvider, Auth0ProviderWithNavigate
    hooks/                 Shared hooks (use-user, use-sort-state, use-avatar-url, etc.)
    lib/                   types, mime helpers, cn(), formatters, caches
    languageSupport/       i18n (LocaleProvider, useTranslation, dictionaries)

packages/db/
  prisma/schema.prisma     DB schema
  lib/prisma.ts            Prisma client
  lib/supabase.ts          Supabase client
  queries/                 Data-access classes: Content, Employee, Login,
                           Bookmark, ServiceReqs, Bucket, Helper
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

The authenticated user's Auth0 `sub` is read from `req.auth.payload.sub` and resolved to an internal `Employee` via `queryEmployeeByAuth(auth0Id)`. New employees are created through `POST /api/employee/auth`, which provisions an Auth0 user first and then writes the `Employee` row with the returned `auth0Id`.

### API routes

All routes are JSON unless noted. File-upload routes use `multipart/form-data` with field name `file` (or `photo` for profile photos).

**Public**
- `GET /api/preview?url=...` — fetches a URL server-side and extracts OG metadata + favicon. Blocks private/loopback/link-local addresses to prevent SSRF. 2 MB cap, 5 s timeout.

**Content** (`/api/content`)
- `GET    /api/content[?persona=...]` — all content, or filter by target persona (`admin` returns everything)
- `GET    /api/content/tags` — distinct set of all tags across content
- `GET    /api/content/:id` — one item (with owner and `checkedOutBy`)
- `GET    /api/content/info/:id` — Supabase Storage metadata for the underlying file
- `GET    /api/content/download/:id` — streams the file inline with the correct MIME type
- `GET    /api/content/publicUrl/:id` — short-lived (120 s) signed URL
- `POST   /api/content` — create (multipart; `linkURL` *xor* `fileURI`, never both)
- `PUT    /api/content` — update; requires `employeeID` matching `checkedOutById`, else `409 { lockReleased: true }`
- `DELETE /api/content/:id?employeeID=...` — same lock check; also deletes the Supabase file if present
- `POST   /api/content/checkout` — `{ id, employeeID }`; fails with the current holder's name if taken
- `POST   /api/content/checkin`  — `{ id, employeeID }`

**Bookmarks** (`/api/bookmark`) — user derived from the JWT, not the URL
- `GET    /api/bookmark`
- `POST   /api/bookmark/:contentId`
- `DELETE /api/bookmark/:contentId`

**Employees** (`/api/employee`)
- `GET    /api/employee` — all employees (profile photo URIs signed for 1 h)
- `GET    /api/employee/all` — all employees + login usernames (admin UI)
- `GET    /api/employee/me` — current user, resolved via Auth0 sub
- `GET    /api/employee/:id`
- `POST   /api/employee` — create without Auth0 (legacy)
- `POST   /api/employee/auth` — create with Auth0; provisions the Auth0 user first
- `POST   /api/employee/photo` — multipart `photo`; image only, max 5 MB; replaces the old photo
- `PUT    /api/employee`
- `DELETE /api/employee`

**Login** (`/api/login`) — legacy local auth, retained for compatibility
- `POST /api/login`, `POST /api/login/create`, `PUT /api/login`, `DELETE /api/login`

**Service Requests** — `GET/POST/PUT /api/servicereqs`, `DELETE /api/servicereq`, plus `/api/assigned`.

> **Route order matters in `apps/backend/src/app.ts`**: `checkout`, `checkin`, `info`, `download`, `publicUrl`, and `tags` must be registered **before** `/:id`, otherwise Express 5 will match them to the parameterized route first.

### Checkout / check-in (server side)

A content item is "checked out" by writing `checkedOutById` and `checkedOutAt` on the row. Only the holder can `PUT /api/content` or `DELETE /api/content/:id` — the check lives in `Content.updateContent` (`packages/db/queries/content.ts`) and in the `deleteContent` hook. If the lock has been released or taken by someone else, the write returns `409 { lockReleased: true, message: "This item has been forcibly checked in." }` and the frontend handles the forced check-in.

Expired locks (`LOCK_TIMEOUT_MS = 2 * 60 * 1000`) are cleared by a `setInterval` running `clearExpiredLocks` every 30 s, registered in `app.ts`.

### File storage

Files live in two Supabase buckets:

- `content` — uploaded documents attached to content items
- `profiles` — employee profile photos

All keys are namespaced and randomized: `${ownerOrEmployeeId}/${crypto.randomUUID()}/${originalFilename}`. This prevents collisions and makes accidental overwrites impossible. Uploads are transactional in spirit — if the DB write fails after a successful upload, the handler deletes the orphaned object (`uploadFile`, `updateContent`, `uploadProfilePhoto` all follow this pattern).

All storage operations go through `packages/db/queries/bucket.ts` (`Bucket.uploadFile`, `downloadFile`, `deleteFile`, `createSignedUrl`, `createPublicUrl`, `getFileMetadata`).

### Data model (abridged)

Schema at `packages/db/prisma/schema.prisma`.

- **Employee** — `id`, `firstName`, `lastName`, `persona`, `auth0Id`, `profilePhotoURI`
- **Login** — local username/passwordHash keyed to `employeeID` (legacy)
- **Content** — `displayName`, `linkURL` *xor* `fileURI`, `ownerId`, `contentType` (`reference` | `workflow`), `status` (`new` | `inProgress` | `complete`), `targetPersona`, `tags: string[]`, `lastModified`, `expiration`, `checkedOutById`, `checkedOutAt`
- **Bookmark** — join table (`bookmarkerId`, `bookmarkedContentId`) with a composite unique key
- **ServiceRequest** — `name`, `created`, `deadline`, `type`, `assigneeId`, `ownerId`

Enums (`Persona`, `Status`, `ContentType`, `RequestType`) are mapped from strings via the `Helper` class (`packages/db/queries/helper.ts`), so the API accepts plain strings from the frontend.

---

## Frontend

Five feature modules live under `apps/frontend/src/features/`: **content**, **dashboard**, **settings**, **employees**, and **servicereqs**. Shared plumbing (context, hooks, UI primitives, types) lives in sibling top-level folders.

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
- **`useContentFilters(content, bookmarks, userId, persona)`** — owns all content filtering: search term, active tab (`forYou | all | owned | bookmarks`), and sidebar checkbox filters (status, contentType, persona, tags, docType). Returns `filteredContent`, `activeFilterCount`, and setters. Add new filters here, not in `ViewContent`.
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
- **`PersonaBadge`** — badge for a persona value.
- **`SortableHead<T>`** — generic `<TableHead>` with sort-direction arrow. Pairs with `useSortState`.
- **`SlidingTabs`** — animated underline tab strip.
- **`UrlPreviewCard`** — OG metadata card (title, description, image, favicon). Used by `UrlSourceField`; also available standalone.
- **`UrlPreviewLink`** — link that shows a `UrlPreviewCard` on hover.
- **`FilePickerCard`** — drag-and-drop / click-to-browse file selection area.
- **`Hero`** — page-top banner with icon, title, and description.

Layout chrome: `components/layout/` (`AppSidebar`, `Navbar`, `Footer`, `DarkmodeButton`, `DisclaimerAlert`, `SidebarOverlay`).

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
    ForceCheckinDialog.tsx   Admin-only — release another user's lock
  listing/
    ViewContent.tsx          Main content list page
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
    BulkUploadPage.tsx       Multi-file upload at /bulk-upload
  components/
    ContentIcon.tsx          Lucide icon keyed by file category (uses CATEGORY_COLORS from lib/mime.ts)
    ContentExtBadge.tsx      Badge showing file extension (or "Link")
    ContentStatusBadge.tsx   Null-safe status badge; labels via useTranslation
    ContentTypeBadge.tsx     Same pattern for contentType
```

`ContentItem` is defined in `lib/types.ts` — hand-written to mirror the Prisma `Content` shape with joined `owner` and `checkedOutBy` relations as `Employee` objects. Key fields: `ownerId`, `checkedOutById` (the raw ID), `checkedOutBy` (the joined employee object).

Every item is either a **file** (`fileURI`) or a **link** (`linkURL`), never both. Most UI branches on `item.linkURL ? … : …`.

#### Checkout / check-in flow

1. Pencil icon → `ConfirmCheckoutDialog` opens.
2. Confirm → `POST /api/content/checkout`. If taken, backend returns the holder's name; dialog stays closed.
3. On success, `EditContentDialog` opens. A 5-second poll compares `data.checkedOutById` to `user.id` as strings. Mismatch = lock lost → dialog closes with toast.
4. Submit → `PUT /api/content`. `409 { lockReleased: true }` → close + toast.
5. Cancel/close → `POST /api/content/checkin` (skipped if already expired server-side).

The three confirm dialogs are near-identical `AlertDialog` wrappers with an async `onConfirm` and a local `loading` flag that gates the close handler. `ForceCheckinDialog` is admin-only — it checkins using the current holder's `employeeID`.

#### Add/Edit dialogs and form plumbing

Both dialogs share `ContentFormFields` (UI), `useContentForm` (state), and `buildContentFormData` + `xhrFetch` (submission):

|                        | AddContentDialog              | EditContentDialog                        |
| ---------------------- | ----------------------------- | ---------------------------------------- |
| Method                 | `POST /api/content`           | `PUT /api/content`                       |
| Initial values         | `initialValues(userId, persona)` | `fromContentItem(content)`            |
| Extra fields on submit | —                             | `id`, `employeeID`                       |
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

`features/dashboard/Dashboard.tsx` is a flat array of self-contained card components rendered in a responsive grid. Add a card by creating it under `features/dashboard/components/cards/` and appending it to the `cards` array — one-line change. Cards share a colored top border, soft shadow, and `hover:scale-101 transition-transform`. Some span multiple columns via `md:col-span-2`.

Cards: `HelloCard` (greeting + avatar), `ClockCard` (live clock), `EmployeeChartCard` (Recharts pie by persona), `ContentTypeChartCard` (bar chart by file type; memoized), `QuickLinksCard`, `LinksCard` (filtered by persona), `BookmarkedCard`, `MyContentCard`, `RecentFilesCard` (wrappers around the listing components).

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

### Service Requests feature

Full CRUD under `features/servicereqs/`. `AddServiceReqDialog` and `EditServiceReqDialog` share `ServiceReqFormFields` (fully controlled, no internal state) and each instantiate their own `useServiceReqForm`.

**`useServiceReqForm`** — same deferred-validation pattern as `useContentForm`: errors hidden until first submit, `hasErrors` always current, `reset()` increments `formKey` for remount. `createdDate` and `createdTime` are kept separate (date picker returns `Date`, time input returns `"HH:MM:SS"`) and merged into an ISO timestamp in `buildServiceReqJSON`. `type: "none"` is the sentinel for the `<Select>` placeholder and is rejected by validation.

Access control: Edit and Delete disabled unless the user is `ownerId`, `assigneeId`, or `admin`.

Search matches name, type, owner full name, assignee full name. `highlightRange` on the name column. All columns sortable; default: type asc.

**API endpoints** — `GET/POST/PUT /api/servicereqs`, `DELETE /api/servicereq`.

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

### Known issues / TODOs

- `queryContentByOwnerId` (in `packages/db/queries/content.ts`) uses `localStorage` on the server — unfixed.
- `queryContentByName` needs case-insensitive search. → 'queryContentByName' no longer exists - Ricardo

---

## Deployment (Render)

Deployed as a single web service from the `render` branch. Express serves the frontend's built `dist/` as static files; `app.get('/{*splat}', ...)` sends `index.html` for all non-API routes (SPA fallback, Express 5 syntax).

- **Build:** `pnpm install --no-frozen-lockfile && pnpm --filter @softeng-app/db exec prisma generate && pnpm run build`
- **Start:** `pnpm run --filter backend start`
- **Bind:** `app.listen(3000, '0.0.0.0')` — required on Render.

### Testing

- Backend tests live at `apps/backend/src/*.test.tsx`; run via `cd packages/db && pnpm test`.
- Vitest test files need `import 'dotenv/config'` at the top.
- `prisma.config.ts` needs `import { config } from "dotenv"; config({ path: ".env" })` at the top.
