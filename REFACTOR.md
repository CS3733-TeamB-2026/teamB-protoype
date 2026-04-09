# Refactor Plan

## Bugs
- [ ] Fix URL typo in `ViewContent.tsx:103` — `` `/api/content}` `` → `/api/content`

## High Priority

### Extract `useUser()` hook
- [ ] Create `src/hooks/useUser.ts` — wraps `JSON.parse(localStorage.getItem("user") || "null")`
- [ ] Replace inline pattern in `Navbar.tsx`
- [ ] Replace inline pattern in `ViewContent.tsx`
- [ ] Replace inline pattern in `AddContent.tsx`
- [ ] Replace inline pattern in `EmployeeHome.tsx`
- [ ] Replace inline pattern in `FilesPage.tsx`
- [ ] Replace inline pattern in `RecentFiles.tsx`

### Merge `BusinessAnalyst` + `Underwriter` into shared `PersonaPage`
- [ ] Create `src/pages/PersonaPage.tsx` accepting a typed `links` prop
- [ ] Replace `BusinessAnalyst.tsx` body with `<PersonaPage links={...} />`
- [ ] Replace `Underwriter.tsx` body with `<PersonaPage links={...} />`

### Gut `FilesPage.tsx`
- [ ] Remove local `getCategory()`, `getPreviewMode()`, `CATEGORY_COLORS` — import from `src/helpers/mime.ts`
- [ ] Remove local `ContentIcon` — import from `src/components/shared/ContentIcon.tsx`
- [ ] Remove local `ExtBadge` — import from `src/components/shared/ContentExtBadge.tsx`

## Medium Priority

### Consolidate `AddContent` form state
- [ ] Replace 18+ individual `useState` calls with a single `const [form, setForm] = useState({...})`

### Simplify `EditContentDialog` conditionals
- [ ] Collapse linkURL/fileURI nested ternary (lines 97–119) into flat `&&` checks
- [ ] Collapse duplicate Expiration field (lines 161–183) — render once regardless of `defaultValue`
- [ ] Collapse duplicate Status Select (lines 200–234) — render once regardless of `defaultValue`

### Move `useSortState` to hooks
- [ ] Move `src/helpers/useSortState.ts` → `src/hooks/useSortState.ts`
- [ ] Update imports

## Folder Restructure
- [ ] Create `src/layout/` — move `Navbar`, `Footer`, `AppSidebar`, `SidebarOverlay`
- [ ] Create `src/pages/` — move `ViewContent`, `FilesPage`, `AddContent`, `AddEmployee`, `BusinessAnalyst`, `Underwriter`, `EmployeeHome`, `Home`
- [ ] Create `src/dialogs/` — move `EditContentDialog`, `EditEmployeeDialog`, `LoginDialog`, `ConfirmDeleteDialog`
- [ ] Update all imports after moves

## Low Priority
- [ ] Fix `Navbar.tsx:92` `setTimeout` hack — find proper fix for Popover/Dialog sequencing
