# teamB-prototype

A content management system for an insurance company. Employees with assigned personas (`underwriter`, `businessAnalyst`, `admin`) can view, add, edit, and delete content items (uploaded files or external URLs), manage other employees, and track service requests. A checkout/check-in locking mechanism prevents simultaneous edits on the same content item.

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
    components/            Shared presentational components
    context/               UserContext, ThemeProvider
    hooks/                 Shared hooks (use-user, use-sort-state, use-avatar-url, etc.)
    lib/                   types, mime helpers, cn(), formatters

packages/db/
  prisma/schema.prisma     DB schema
  lib/prisma.ts            Prisma client
  lib/supabase.ts          Supabase client
  queries/                 Data-access classes: Content, Employee, Login,
                           Bookmark, ServiceReqs, Bucket, Helper
```

Route handlers in `apps/backend/src/hooks/` are intentionally thin — they parse the request, call a static method on the matching `packages/db/queries/*` class, and return JSON. Business logic (locking, validation, persona mapping) lives in the query classes.

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

Every route under `/api` except `POST /api/preview` requires a valid Auth0 JWT:

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

### Shared utilities

- **`useUser()`** (`hooks/use-user.ts` / `context/UserContext`) — current employee: `firstName`, `lastName`, `persona`, `profilePhotoURI`, `userName`. Context also exposes `updateUser` and `uploadProfilePhoto`.
- **`useTheme()`** (`context/ThemeProvider`) — `light | dark | system`
- **`usePageTitle(title)`** — sets the browser tab title
- **`useSortState` / `applySortState`** — column sorting used by every table
- **`useAvatarUrl`** — resolves a signed avatar URL per employee row
- **`cn()`** (`lib/utils`) — Tailwind class merger
- **`toast`** from `sonner` — async success/error notifications
- **Types** (`lib/types.ts`) — `Employee`, `ContentItem`, etc. `type` aliases only, no `interface`.

### Content feature

The largest feature — everything under `features/content/` plus the two pages that render it: `ViewContent` (listing) and `ViewSingleFile` (full-page viewer).

```
features/content/
  forms/
    content-form.ts          Shared types, validation, FormData builder, XHR helper
    use-content-form.ts      Hook wrapping form state + deferred validation
    ContentFormFields.tsx    Form UI shared by Add and Edit dialogs
    AddContentDialog.tsx     POST /api/content
    EditContentDialog.tsx    PUT  /api/content
    UrlSourceField.tsx       URL input with live OG-preview card
    TagInput.tsx             Chip-style tag input with suggestions + create-new
    ExpirationCalendar.tsx   Full-month calendar of items with expirations
  listing/
    BookmarkedFiles.tsx      Current user's bookmarks (top 5)
    MyFiles.tsx              Items owned by current user (top 5)
    RecentFiles.tsx          Most recently modified items (top 8)
  previews/
    FilePreview.tsx          Inline/full file viewer (PDF, DOCX, images, text…)
    file-cache.ts            Session-scoped cache for downloaded file bytes
    preview-cache.ts         Session-scoped cache for URL OG metadata
  dialogs/
    ConfirmCheckoutDialog.tsx   Confirm checkout
    ConfirmCheckinDialog.tsx    Confirm checkin
    ForceCheckinDialog.tsx      Admin-only — release another user's lock
  components/
    ContentIcon.tsx             Lucide icon keyed by file category
    ContentExtBadge.tsx         Badge showing file extension (or "Link")
    ContentStatusBadge.tsx      Badge for status
    ContentTypeBadge.tsx        Badge for contentType
```

**Content item shape** (`lib/types.ts`):

```ts
type ContentItem = {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    ownerID: number | null;
    owner: { id: number; firstName: string; lastName: string } | null;
    checkedOutBy: number | null;
    checkedOutAt: string | null;
    checkedOutByEmployee: { id: number; firstName: string; lastName: string } | null;
    lastModified: string;
    expiration: string | null;
    contentType: "reference" | "workflow";
    targetPersona: "underwriter" | "businessAnalyst" | "admin";
    status: "new" | "inProgress" | "complete" | null;
    tags: string[];
}
```

Every item is either a **file** (stored in Supabase, referenced by `fileURI`) or a **link** (external URL in `linkURL`). Never both — the backend enforces this, and most UI code branches on `item.linkURL ? … : …`.

#### Checkout / check-in flow (frontend)

The lock-and-edit dance is the most load-bearing piece of logic in the feature:

1. User clicks the pencil icon on a row → `ConfirmCheckoutDialog` opens.
2. Confirm → `POST /api/content/checkout` with `{ id, employeeID }`. If another user holds the lock, the backend returns their name and a toast shows; the dialog stays closed.
3. On success, `EditContentDialog` opens. While open, a 5-second poll re-fetches the item and compares `data.checkedOutBy` to `user.id` **as strings**. If they stop matching, the lock expired or was force-released — the dialog closes and shows a toast.
4. Apply → `PUT /api/content` with `employeeID` in the body. If the backend returns `409 { lockReleased: true }`, the dialog closes with a toast.
5. Cancel or close → `POST /api/content/checkin`. Skipped if the lock has already expired server-side.

The three confirm dialogs (`ConfirmCheckoutDialog`, `ConfirmCheckinDialog`, `ForceCheckinDialog`) are near-identical AlertDialog wrappers that each take an async `onConfirm` and manage a local `loading` state. `ForceCheckinDialog` is admin-only and releases another user's lock by calling `POST /api/content/checkin` with the current holder's `employeeID`. All three disable their close handler while loading so the user can't dismiss mid-request.

#### Add/Edit dialogs

Both dialogs share nearly everything: `ContentFormFields` for the UI, `useContentForm` for state, and `buildContentFormData` + `xhrFetch` for submission.

|                             | AddContentDialog       | EditContentDialog                             |
| --------------------------- | ---------------------- | --------------------------------------------- |
| Method                      | `POST /api/content`    | `PUT /api/content`                            |
| Initial values              | `initialValues(userId, persona)` | `fromContentItem(content)`          |
| Extra fields on submit      | none                   | `id`, `employeeID`                            |
| Shows Content ID            | no                     | yes (read-only)                               |
| Required source field       | yes                    | no (keeps existing file/link)                 |
| 409 handling                | n/a                    | `{ lockReleased: true }` → close + toast      |

File uploads go through **`xhrFetch`** (in `content-form.ts`) instead of `fetch` — XHR is used specifically to get upload-progress events, which power a `<Progress>` bar and honor an `AbortSignal` for the Cancel button. When an upload is in flight, the dialog's close handler is gated on `!uploading && !submitting` so the user can't orphan the request.

#### Form plumbing — `content-form.ts`

Single source of truth for form behavior:

- **`ContentFormValues`** — form shape. `contentType` and `status` use `"none"` as a sentinel for "not selected" so shadcn's `<Select>` can show its placeholder. `dateModified` and `lastModifiedTime` are stored separately and merged into one ISO timestamp in `buildContentFormData`.
- **`initialValues(userId, persona)`** / **`fromContentItem(item)`** — starting values for Add / Edit.
- **`getErrors(values, isEdit)`** — returns `{ field: message }`. Empty map = valid. `isEdit` relaxes the source requirement.
- **`buildContentFormData(values)`** — serializes to `FormData`. `tags` is JSON-serialized (FormData can't send arrays; backend does `JSON.parse(payload.tags || "[]")`). File field is only appended in file mode; URL mode sends an empty `linkURL` string.
- **`xhrFetch(url, method, headers, body, onProgress, signal)`** — returns a `{ ok, status, json }` shape matching the subset of `Response` the caller uses.

#### `useContentForm`

Thin `useState` wrapper with **deferred validation**: errors aren't shown until the first submit attempt (`submitted = true`), but `hasErrors` reflects current validity regardless so the Submit button can disable itself once the form becomes invalid after first submission. `reset()` increments `formKey`, which callers pass as the `key` prop on `ContentFormFields` to force a full remount.

#### `UrlSourceField` — live OG previews

When URL mode is active, renders the URL input and a preview card below it. Fetches `GET /api/preview?url=...` on mount (if a value is already present) and on blur. Results cached in **`preview-cache.ts`**, a module-level `Map` with three states: `undefined` (never fetched), `null` (unreachable), or `UrlPreview` (success). Storing `null` explicitly prevents re-hitting dead URLs on every render.

#### `TagInput` — chip input with suggestions

Fetches `GET /api/content/tags` on mount for the suggestion list; silently degrades to create-only if the request fails. Tags are Title Cased at commit time (Enter, comma, or clicking a suggestion), not while typing. Input is restricted to letters and spaces via regex on every keystroke. Backspace on empty input removes the last chip. When `creatable={false}` (filter contexts), the "Create" option is suppressed. Uses `PopoverAnchor` (not `PopoverTrigger`) to avoid toggle-on-click, and `onMouseDown` + `preventDefault` on suggestions so the input doesn't blur before the selection registers.

#### File previews & caching

`FilePreview` fetches from `/api/content/download/:id` and renders the appropriate viewer by filetype (PDF, DOCX, images, text, etc.). Two caches in **`file-cache.ts`**:

- `textCache: Map<src, string>` for text-format files
- `blobCache: Map<src, Blob>` for binary formats

Both are keyed by the download URL. The cache lives for the entire session and is never auto-evicted — **call `invalidateFileCacheById(id)` after saving an edit** so stale bytes don't show up in the next preview.

`ViewSingleFile` (at `/file/:id`) fetches only item metadata, then delegates to `<FilePreview mode="full" />`. Bytes come from the same cache the inline preview uses, so navigating between list and full-page view doesn't re-download.

#### Listing components

`BookmarkedFiles`, `MyFiles`, and `RecentFiles` (under `features/content/listing/`) are near-structurally-identical compact summary lists used by dashboard cards:

- **`BookmarkedFiles`** — fetches `/api/bookmark` and `/api/content?persona=...` in parallel, filters to bookmarked IDs, top 5.
- **`MyFiles`** — `/api/content?persona=...`, filters by `ownerId === user.id`, top 5.
- **`RecentFiles`** — `/api/content?persona=...`, sorts by `lastModified` desc, top 8.

All three render: icon (via `ContentIcon` + `getCategory` from `lib/mime.ts`), display name, last-modified date, and either a "View →" link (`linkURL` items) or the file extension. Same loading/error/empty states.

#### Shared presentational components

Four components under `features/content/components/` keep icon/color/label choices in one place:

- **`ContentIcon`** — Lucide icon keyed by a `Category` (`pdf` / `document` / `spreadsheet` / `presentation` / `image` / `audio` / `video` / `archive` / `code` / other). `isLink={true}` overrides to a `Link` icon. Colors from `CATEGORY_COLORS[category].icon` in `lib/mime.ts`.
- **`ContentExtBadge`** — uppercased extension or `"Link"`. Colors paired with `ContentIcon` from the same map.
- **`ContentStatusBadge`** — returns `null` for missing/unrecognized status so callers can render it unconditionally. Labels localized via `useTranslation`.
- **`ContentTypeBadge`** — same pattern for `contentType`.

Adding a new status or content type means extending one `Record<Enum, { className }>` map (plus enum + translations).

#### `ExpirationCalendar`

Full-month calendar view at `/calendar`. Fetches content filtered by persona, keeps items with `expiration`, and buckets them into a `Map<"YYYY-MM-DD", ContentItem[]>`. The grid is built manually (no calendar library) — `firstDay` of the month plus a padded week to round out the last row. Each day cell shows up to 3 chips color-coded by urgency (red if expired, amber ≤7d, yellow ≤14d, neutral otherwise). Overflow collapses into "+N more". Clicking a day toggles a detail panel at the bottom.

### Dashboard

`pages/Dashboard.tsx` is a grid of self-contained cards. The page does nothing but render them:

```tsx
// apps/frontend/src/pages/Dashboard.tsx
const cards = [
    HelloCard, ClockCard, EmployeeChartCard, ContentTypeChartCard,
    QuickLinksCard, BookmarkedCard, MyContentCard, RecentFilesCard, LinksCard,
]
// ...
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 mx-15">
    {cards.map((Card, index) => <Card key={index} />)}
</div>
```

Adding a card is a one-line change: write it under `features/dashboard/components/cards/`, import, drop into the `cards` array. Some cards span multiple columns via `md:col-span-2`. All cards share a colored top border (`border-t-secondary border-t-4` or `border-t-accent`), soft shadow, and subtle `hover:scale-101 transition-transform`.

**Cards:**

- **`HelloCard`** — greeting with avatar + name from `useUser()`; falls back to initials.
- **`ClockCard`** — live clock via `setInterval`.
- **`EmployeeChartCard`** — Recharts pie chart of headcount by persona; colors from `--chart-1`…`--chart-5`.
- **`ContentTypeChartCard`** — horizontal bar chart of file types. Filters out `linkURL` items, buckets by extension via `categorize()` (Images / PDFs / Documents / Spreadsheets / Presentations / Videos / Archives / Other). Chart data memoized on `content`.
- **`QuickLinksCard`** — shortcuts; View Users and Add Employee are admin-only.
- **`LinksCard`** — static links filtered by `user.persona` (each link declares `access: string[]`).
- **`BookmarkedCard` / `MyContentCard` / `RecentFilesCard`** — presentational wrappers around the listing components. `RecentFilesCard` also has a "View Files" button linking to `/files`.

**Conventions for new cards:** put them in `features/dashboard/components/cards/`, fetch with `useAuth0().getAccessTokenSilently()` + `Authorization: Bearer ${token}`, use relative API paths, match the existing styling, and `useMemo` derived chart/list data.

### Settings

Nested-route layout at `/settings/*`. `SettingsLayout.tsx` renders a sidebar and an `<Outlet />` for the active section — each section is a fresh component mount.

```
/settings/profile       → ProfileSettings
/settings/appearance    → AppearanceSettings
/settings/account       → (disabled, redirects to profile)
/settings/notifications → (disabled, redirects to profile)
```

- **`SettingsLayout.tsx`** — two-column shell with a shared page header.
- **`SettingsNav.tsx`** — sidebar with `NavLink` active-state styling. Items are `{ to, label, icon, disabled? }`. Disabled items render dimmed and redirect to `profile` on click.
- **`SettingsSection.tsx`** — presentational wrapper (`title`, optional `description`, children) used by every section for consistent headers.
- **`ProfileSettings.tsx`** — uses **react-hook-form** with a **zod** resolver. Defaults are empty, then populated via `form.reset(...)` inside a `useEffect` watching `user` (avoids flash of empty fields). Profile photo upload is separate from the form: hidden `<input type="file">` triggered by a styled `<label>`, validates image MIME + 5 MB cap client-side, then calls `uploadProfilePhoto(file)` from `UserContext`. `userName` and `persona` are disabled (managed in Auth0 / by admins). Submit disabled unless `isDirty`; after save, `form.reset(values)` flips it back.
- **`AppearanceSettings.tsx`** — theme selector backed by `useTheme()`. Pure shadcn `RadioGroup`, no local state — context is the source of truth.

**Adding a section:** create the component under `features/settings/sections/` wrapping content in `<SettingsSection>`, register a nested route, add an entry to `SettingsNav.tsx`.

### Employees feature

Full CRUD for employee accounts under `features/employees/`.

```
ViewEmployees
├── AddEmployeeDialog
│   └── useEmployeeNameTaken      ← uniqueness check
└── EditEmployeeDialog
    └── useEmployeeNameTaken      ← uniqueness check (excludes self)

AddEmployee                        ← legacy standalone page (superseded)
```

Unlike the Service Requests feature, this module does **not** use a shared form-fields component or a custom form hook — each dialog manages its own `useState`.

**Data flow:**

- **Fetching** — `ViewEmployees` pulls from `GET /api/employee/all` on mount.
- **Creating** — `AddEmployeeDialog` fetches `/api/employee` on open to build a set of taken IDs and names; the ID field is pre-filled with the lowest available positive integer via `lowestAvailableId(taken)`. Submit validates then `POST`s `/api/employee/auth`.
- **Editing** — `EditEmployeeDialog` pre-populates from props; only `firstName`, `lastName`, `persona` are editable (`id` is read-only). Submit `PUT`s `/api/employee`.
- **Deleting** — `ConfirmDeleteDialog` warns that files owned by the employee will also be removed. On confirm, `DELETE /api/employee` with the ID.

**Name uniqueness — `useEmployeeNameTaken`:**

```ts
const checkNameTaken = useEmployeeNameTaken(open, excludeId?)
```

Fetches all employees when the dialog opens and builds a `Set` of normalized `"firstName|lastName"` keys. Returns a `checkNameTaken(first, last)` function that returns an error string if taken, or `""` if available. The optional `excludeId` (used in `EditEmployeeDialog`) filters out the employee being edited so their own name doesn't trigger a false conflict. Non-fatal — if the fetch fails, the check is silently skipped.

**Validation:**

- *Add* — required: `firstName`, `lastName` (not a duplicate), `id` (positive integer, not taken), `persona` (not the placeholder), `userName`, `email`, `password`, `confirmPassword` (must match).
- *Edit* — required: `firstName`, `lastName` (not a duplicate, own name excluded). `persona` is always valid (dropdown).

**Access control** — Edit and Delete are disabled for the logged-in user's own row (`employee.id === currentUserId`).

**Search & sorting** — search matches across `firstName`, `lastName`, concatenated full name, `persona`, and `id`. Whitespace stripped before matching. Name matches highlighted via `highlightRange`, with the last name's highlight offset derived from the first name's length. Sortable columns: `id`, `firstName`, `lastName`, `persona`. Default: `id` asc.

Rows are extracted into a separate `EmployeeRow` component so `useAvatarUrl` can be called per row without violating hook rules inside `.map()`.

### Service Requests feature

Full CRUD for service requests under `features/servicereqs/`.

```
ViewServiceReqs
├── AddServiceReqDialog
│   └── ServiceReqFormFields   ← shared
└── EditServiceReqDialog
    └── ServiceReqFormFields   ← shared
```

Form state is managed by `useServiceReqForm`, instantiated independently in each dialog. `ServiceReqFormFields` is fully controlled — owns no state, receives values and callbacks via props.

**`useServiceReqForm`:**

```ts
const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
    useServiceReqForm(initialValues);
```

Validation is **deferred** (same pattern as `useContentForm`): error messages appear only after first submit, but `hasErrors` is always current so the Submit button can disable in real time. `reset()` increments `formKey` for remount.

**`ServiceReqFormValues`:**

```ts
type ServiceReqFormValues = {
    id: number | undefined;
    name: string;
    createdDate: Date;
    createdTime: string;         // "HH:MM:SS" — kept separate for the time <input>
    deadline: Date | undefined;
    ownerId: number;
    assigneeId: number | undefined;
    type: "reviewClaim" | "requestAdjuster" | "checkClaim" | "none";
}
```

`"none"` is a sentinel for the placeholder state of the `<Select>`. Treated as an error and never sent to the API. `createdDate` and `createdTime` are merged into one ISO timestamp in `buildServiceReqJSON`.

**Validation** — required: `name`, `ownerId`, `assigneeId`, `type` (not `"none"`), `createdDate`, `createdTime`, `deadline`.

**Access control** — Edit and Delete are disabled unless the logged-in user is the `ownerId`, the `assigneeId`, or an `admin`.

**Search & sorting** — search matches across `name`, `type`, owner full name, assignee full name. Matches in the `name` column highlighted via `highlightRange`. All columns sortable. Default: `type` asc.

**API endpoints** — `GET/POST/PUT /api/servicereqs`, `DELETE /api/servicereq`.

---

## Conventions

- **pnpm only** — never `npm` or `npx`. Use `pnpm prisma migrate dev`, not `pnpx prisma migrate dev`.
- **Relative API paths everywhere** — never hardcode `localhost:3000`. The backend serves the frontend's built `dist/` in production, so `/api/...` works in both environments.
- **`type` aliases only, no `interface`** — project-wide TypeScript convention for the frontend. A few legacy files still use `interface`; migrate as they're touched. No OOP/class-based patterns in frontend TS.
- **`cache: "no-store"` on poll requests** — avoids stale cache hits on the 5-second edit-dialog poll and the 10-second list poll in `ViewContent`.
- **Compare lock owners as strings** — `String(data.checkedOutBy) !== String(user!.id)`. The backend sometimes returns numbers and sometimes the nested employee object depending on the endpoint, so string-comparing IDs is the safe cross-cutting form.
- **Always `parseInt` IDs on the backend** — `FormData` values are always strings, so `id`, `ownerID`, `employeeID` need parsing before use.
- **Auth headers** — always `Authorization: Bearer ${token}` using `getAccessTokenSilently()` from `@auth0/auth0-react`.
- **Targeted changes preferred** — minimal diffs over full file rewrites.
- **Polling (not WebSockets)** — consistent pattern: `ViewContent` lists poll every 10s, `EditContentDialog` polls every 5s.
- **Express 5 wildcards** — use `app.get('/{*splat}', ...)`, not `app.get('*', ...)`. Required for the SPA fallback.

### Known issues / TODOs

- `queryContentByOwnerId` (in `packages/db/queries/content.ts`) uses `localStorage` on the server — unfixed.
- `queryContentByName` needs case-insensitive search.

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
