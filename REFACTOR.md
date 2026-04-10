# Refactor Plan

## Bugs ✓
- [x] Fix URL typo in `ViewContent.tsx:103` — `/api/content}` → `/api/content`
- [x] Fix hardcoded `localhost:3000` URLs in `AddEmployee.tsx` and `AddContent.tsx`
- [x] Fix route ordering in `app.ts` — specific routes before parameterized ones

## Backend cleanup ✓
- [x] Extract `buildFileURI()` helper in `content.ts` — removes duplicated path construction
- [x] Remove dead `express` import/instance from `employee.ts`
- [x] Simplify `!!content.fileURI` → `content.fileURI` in `deleteContent`

## High Priority

### Extract `useUser()` hook
- [x] Create `src/hooks/useUser.ts` — wraps `JSON.parse(localStorage.getItem("user") || "null")`
- [x] Replace inline pattern in `Navbar.tsx`
- [x] Replace inline pattern in `ViewContent.tsx`
- [x] Replace inline pattern in `AddContent.tsx`
- [x] Replace inline pattern in `EmployeeHome.tsx`
- [x] Replace inline pattern in `RecentFiles.tsx`

### Merge `BusinessAnalystPersona` + `Underwriter` into shared `PersonaPage`
- [ ] Create `src/pages/PersonaPage.tsx` accepting a typed `links` prop
- [ ] Replace `BusinessAnalystPersona.tsx` body with `<PersonaPage links={...} />`
- [ ] Replace `UnderwriterPersona.tsx` body with `<PersonaPage links={...} />`

### Folder restructure ✓
- [x] Create `src/layout/` — moved `Navbar`, `Footer`, `AppSidebar`, `SidebarOverlay`
- [x] Create `src/pages/` — moved all full-page components
- [x] Create `src/dialogs/` — moved `EditContentDialog`, `EditEmployeeDialog`, `LoginDialog`, `ConfirmDeleteDialog`
- [x] Delete `FilesPage.tsx`
- [x] Move `useSortState` → `src/hooks/use-sort-state.ts`

## Medium Priority

### Consolidate `AddContent` form state
- [ ] Replace 18+ individual `useState` calls with a single `const [form, setForm] = useState({...})`

### Simplify `EditContentDialog` conditionals
- [ ] Collapse linkURL/fileURI nested ternary (lines 97–119) into flat `&&` checks
- [ ] Collapse duplicate Expiration field — render once regardless of `defaultValue`
- [ ] Collapse duplicate Status Select — render once regardless of `defaultValue`

## Low Priority
- [ ] Fix `Navbar.tsx` `setTimeout` hack — find proper fix for Popover/Dialog sequencing
