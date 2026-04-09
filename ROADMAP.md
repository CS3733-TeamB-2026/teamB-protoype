# Roadmap

Items are ordered by dependency. Features in the same phase can be worked in parallel on separate branches.

## Phase 0 — Immediate fixes ✓
- [x] Fix URL typo in `ViewContent.tsx:103` — `/api/content}` → `/api/content`
- [x] Fix hardcoded `localhost:3000` URLs in `AddEmployee.tsx` and `AddContent.tsx`
- [x] Fix route ordering in `app.ts` (`info/:id`, `download/:id` before `/:id`)
- [ ] Extract `useUser()` hook (see REFACTOR.md) — JWT will change this shape; one place is better than six

## Phase 1 — Auth (JWT)
JWT touches the login flow, localStorage, and every protected route. Do this before building more features on top of the current model.
- [ ] Backend: sign a JWT on login (`jsonwebtoken` package), return token alongside employee data
- [ ] Backend: add auth middleware that validates the JWT on protected routes
- [ ] Frontend: store token in localStorage (or httpOnly cookie), attach as `Authorization: Bearer` header on API calls
- [ ] Frontend: update `useUser()` to decode and return claims from the token
- [ ] Frontend: redirect to login on 401 responses

## Phase 2 — Quick refactors (parallel with Phase 1 or immediately after)
These are self-contained and won't conflict with feature branches.
- [x] Folder restructure: `src/pages/`, `src/layout/`, `src/dialogs/`
- [x] Delete `FilesPage.tsx` (duplicate utilities, superseded by `ViewContent`)
- [x] Move `useSortState` to `src/hooks/`
- [ ] Merge `BusinessAnalyst` + `Underwriter` into shared `PersonaPage` component
- [ ] Simplify `EditContentDialog` conditionals (nested ternaries → flat `&&` checks)
- [ ] Consolidate `AddContent` 18+ useState calls into a single form object

## Phase 3 — Content list features
All touch `ViewContent` — coordinate to avoid conflicts.
- [x] `canEdit()` permission logic — admin sees all editable; others gate by persona or ownership
- [x] View-only for other personas' content
- [ ] Fetch all-persona content (remove persona filter from API call)
- [ ] Persist bookmarks: add `bookmarks` join table to Prisma, expose GET/POST/DELETE endpoints, update `toggleBookmark` to call API
- [ ] Float bookmarked items to top of content list
- [ ] Add filter panel: filter by `contentType`, `targetPersona`, `status` (pure frontend, filter the fetched array)
- [ ] Add confirmation step before opening `EditContentDialog` (reuse `ConfirmDeleteDialog` pattern)

## Phase 4 — Checkin/Checkout system
- [ ] Add `lockedBy: Int?` and `lockedAt: DateTime?` to Content schema, run migration
- [ ] Backend: expose `POST /api/content/lock/:id` and `POST /api/content/unlock/:id` endpoints
- [ ] Frontend: show lock indicator on content rows, disable edit for items locked by others
- [ ] Frontend: auto-unlock on dialog close/cancel

## Phase 5 — Employee photos
- [ ] Add `photoURI: String?` to Employee schema, run migration
- [ ] Backend: wire up photo upload (multer) on `POST /api/employee` and `PUT /api/employee`
- [ ] Frontend: show photo in `ViewEmployees`, upload input in `AddEmployee` and `EditEmployeeDialog`

## Phase 6 — Dashboard
- [ ] New route `/dashboard` in `App.tsx`
- [ ] Backend: expose a stats endpoint (content counts by type/persona/status, employee counts by persona, recent additions)
- [ ] Frontend: display as cards and/or simple charts

## Phase 7 — Content / data work
- [ ] Auto-populate add content form from URL using existing `/api/preview` endpoint
- [ ] Replace raw owner ID number input with employee search/select dropdown
- [ ] Seed or add content to reach 30 items per position (underwriter + business analyst)

## Phase 8 — Polish
- [ ] Add disclaimer to home page: "This website has been created for WPI's CS 3733 Software Engineering as a class project and is not in use by Hanover Insurance."
- [ ] Remaining REFACTOR.md items not yet addressed
