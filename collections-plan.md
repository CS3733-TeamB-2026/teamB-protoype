# Collections Feature — Implementation Plan

## Scope

Ordered lists of content items with an owner, name, and public/private flag. Includes CRUD backend routes, a tabbed list page, an inline-editable detail/view page, a favorite-collections system, two dashboard cards, and a shared `ContentItemCard` component. Tags and "add from ViewContent" are deferred.

## Decisions

- **Private → favorites**: Favorites persist in DB; only cascade-delete on collection delete.
- **ContentPicker**: Simple name-search popover, same pattern as `EmployeePicker`.
- **Dashboard cards**: Two separate cards — `FavoriteCollectionsCard` and `MyCollectionsCard`.
- **Schema**: No existing data in collection tables, safe to restructure.

---

## Schema changes — `packages/db/prisma/schema.prisma`

Replace implicit Prisma many-to-many with explicit join tables. Remove `Content[]` from `Collection` and `Collection[]` from `Content` (replace with `CollectionItem[]`). Add `CollectionFavorite[]` to `Employee`.

```prisma
model Collection {
  id          Int    @id @default(autoincrement())
  displayName String
  owner       Employee @relation(fields: [ownerId], references: [id])
  ownerId     Int
  public      Boolean

  items     CollectionItem[]
  favorites CollectionFavorite[]

  @@schema("public")
}

model CollectionItem {
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  collectionId Int
  content      Content    @relation(fields: [contentId], references: [id], onDelete: Cascade)
  contentId    Int
  position     Int

  @@id([collectionId, contentId])
  @@schema("public")
}

model CollectionFavorite {
  employee     Employee   @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId   Int
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  collectionId Int

  @@id([employeeId, collectionId])
  @@schema("public")
}
```

> **User runs `prisma db push` after this step.**

---

## File list

| File | Status | Change |
|------|--------|--------|
| `packages/db/prisma/schema.prisma` | ✅ | Schema above |
| `packages/db/queries/collection.ts` | ✅ | `Collection` query class |
| `packages/db/index.ts` | ✅ | Export `Collection` |
| `apps/backend/src/hooks/collection.ts` | ✅ | Route handlers |
| `apps/backend/src/app.ts` | ✅ | Routes registered |
| `apps/frontend/src/lib/types.ts` | ⬜ | Add `Collection`, `CollectionItem` types |
| `apps/frontend/src/components/shared/ContentItemCard.tsx` | ✅ | Shared content row component (PR #211) |
| `apps/frontend/src/features/content/listing/RecentFiles.tsx` | ✅ | Uses `ContentItemCard` |
| `apps/frontend/src/features/content/listing/BookmarkedFiles.tsx` | ✅ | Uses `ContentItemCard` |
| `apps/frontend/src/features/content/listing/MyFiles.tsx` | ✅ | Uses `ContentItemCard` |
| `apps/frontend/src/features/content/listing/ExpirationCalendar.tsx` | ✅ | Uses `ContentItemCard` in detail panel |
| `apps/frontend/src/features/collections/ContentPicker.tsx` | ✅ | Add-content popover |
| `apps/frontend/src/features/collections/ViewCollections.tsx` | ⬜ | Tabbed list page |
| `apps/frontend/src/features/collections/ViewSingleCollection.tsx` | ⬜ | Detail/edit-in-place |
| `apps/frontend/src/features/dashboard/components/cards/FavoriteCollectionsCard.tsx` | ⬜ | Dashboard card |
| `apps/frontend/src/features/dashboard/components/cards/MyCollectionsCard.tsx` | ⬜ | Dashboard card |
| `apps/frontend/src/components/layout/AppSidebar.tsx` | ⬜ | Add "Collections" nav item |
| Router file | ⬜ | `/collections` and `/collections/:id` routes |

---

## API routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/collections` | any employee | Public + own; admin gets all |
| `GET` | `/api/collections/:id` | any employee | 403 if private and not owner/admin |
| `POST` | `/api/collections` | any employee | Owner = calling user |
| `PUT` | `/api/collections/:id` | owner or admin | Update name, public flag, items+order |
| `DELETE` | `/api/collections/:id` | owner or admin | Cascades to items and favorites |
| `PUT` | `/api/collections/:id/owner` | owner or admin | Transfer ownership |
| `POST` | `/api/collections/:id/favorite` | any employee | Add favorite |
| `DELETE` | `/api/collections/:id/favorite` | any employee | Remove favorite |

---

## Frontend types (add to `lib/types.ts`)

```ts
export type Collection = {
  id: number;
  displayName: string;
  ownerId: number;
  owner: Employee;
  public: boolean;
  items: CollectionItem[];
  isFavorited?: boolean;
};

export type CollectionItem = {
  collectionId: number;
  contentId: number;
  position: number;
  content: ContentItem;
};
```

---

## `ContentItemCard` component

**File:** `apps/frontend/src/components/shared/ContentItemCard.tsx`

Extracts the identical item row from `RecentFiles`, `BookmarkedFiles`, `MyFiles`. Encapsulates `ContentIcon`, `displayName`, `lastModified`, file extension badge, and "View →" link for URLs.

```tsx
interface Props {
  item: ContentItem;
  actions?: React.ReactNode; // slot for delete button, drag handle, etc.
}
```

---

## Edge cases

- **Making a collection private**: Non-owner favorites become invisible but are not deleted.
- **Deleting a collection**: `onDelete: Cascade` on `CollectionItem` and `CollectionFavorite`.
- **Transferring ownership**: Show clear warning — former owner loses edit rights immediately.
- **Position integrity**: Always send the full ordered `contentId[]` on update and rewrite all positions (no gaps).
- **Duplicate items**: Enforced at DB level via `@@id([collectionId, contentId])`.
- **Admin visibility**: `GET /api/collections` — if `persona === admin`, return all; otherwise `WHERE public = true OR ownerId = me`.

---

## Implementation order

1. ✅ **Schema** → user ran `prisma db push`
2. ✅ `packages/db/queries/collection.ts` — query class
3. ✅ `packages/db/index.ts` — export
4. ✅ Backend hook + route registration in `app.ts`
5. ⬜ `lib/types.ts` — add `Collection`, `CollectionItem` frontend types
6. ✅ `ContentItemCard` — extracted from listing files; PR #211 merged
7. ✅ `ContentPicker.tsx` — content search popover
8. ⬜ `ViewCollections.tsx` — tabbed list (All / Mine / Favorites)
9. ⬜ `ViewSingleCollection.tsx` — detail/edit-in-place, ownership transfer
10. ⬜ Dashboard cards (`FavoriteCollectionsCard`, `MyCollectionsCard`)
11. ⬜ Sidebar nav item + `/collections` / `/collections/:id` routes