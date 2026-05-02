/**
 * Plain-text schema description fed to the LLM in the NL→SQL system prompt.
 *
 * Hand-curated rather than auto-generated because:
 *  - We can exclude noisy columns (searchVector, embedding, JSON blobs)
 *  - We can add semantic hints ("ownerId references Employee" is clearer than the type alone)
 *  - We can document enums inline where relevant
 *
 * Update this when the Prisma schema changes. The clearer this is, the more
 * accurate the generated SQL will be.
 */
export const SCHEMA_DESCRIPTION = `
You are querying a Postgres database for a Hanover Insurance content management system.
All tables are in the "public" schema. Identifiers are case-sensitive — always quote
mixed-case table and column names with double quotes (e.g., "Employee", "firstName").

ENUMS (use the exact lowercase string values when filtering):
  Persona: 'underwriter', 'businessAnalyst', 'actuarialAnalyst', 'EXLOperator', 'businessOps', 'admin'
  Status: 'new', 'inProgress', 'complete'
  ContentType: 'reference', 'workflow'
  RequestType: 'reviewClaim', 'requestAdjuster', 'checkClaim'
  NotificationType: 'change', 'ownership'

TABLES:

"Employee" — people who use the system.
  - id (int, PK)                    -- externally assigned employee number
  - "firstName" (text)
  - "lastName" (text)
  - persona (Persona enum)          -- the employee's role
  - "auth0Id" (text, unique, nullable)
  - "profilePhotoURI" (text, nullable)
  Notes: ("firstName", "lastName") together are unique.

"Content" — documents, references, and workflows managed by the CMS.
  - id (int, PK)
  - "linkURL" (text, unique, nullable)
  - created (timestamp, nullable)
  - "lastModified" (timestamp)
  - expiration (timestamp, nullable)  -- when the content expires
  - status (Status enum)
  - "contentType" (ContentType enum)
  - "targetPersona" (Persona enum)    -- which persona this content is for
  - "displayName" (text)
  - "fileURI" (text, unique, nullable)
  - "checkedOutAt" (timestamp, nullable)
  - "checkedOutById" (int, nullable, FK → Employee.id)  -- who currently has it checked out
  - "ownerId" (int, nullable, FK → Employee.id)         -- the content's owner
  - tags (text[])                                       -- array of tag strings

"ServiceRequest" — work items, often linked to content or collections.
  - id (int, PK)
  - created (timestamp, default now)
  - deadline (timestamp, nullable)
  - type (RequestType enum)
  - "assigneeId" (int, nullable, FK → Employee.id)      -- who is assigned to do the work
  - "ownerId" (int, FK → Employee.id)                   -- who created/owns the request
  - name (text, nullable)
  - notes (text, nullable)
  - "linkedContentId" (int, nullable, FK → Content.id)
  - "linkedCollectionId" (int, nullable, FK → Collection.id)

"Collection" — named groups of Content items.
  - id (int, PK)
  - "displayName" (text)
  - "ownerId" (int, FK → Employee.id)
  - public (boolean)

"CollectionItem" — many-to-many between Collection and Content with ordering.
  - "collectionId" (int, FK → Collection.id)
  - "contentId" (int, FK → Content.id)
  - position (int)
  PK is ("collectionId", "contentId").

"CollectionFavorite" — which employees have favorited which collections.
  - "employeeId" (int, FK → Employee.id)
  - "collectionId" (int, FK → Collection.id)
  PK is ("employeeId", "collectionId").

"Bookmark" — which employees have bookmarked which content.
  - "bookmarkerId" (int, FK → Employee.id)
  - "bookmarkedContentId" (int, FK → Content.id)
  PK is ("bookmarkerId", "bookmarkedContentId").

"Preview" — log of when an employee previewed a content item.
  - "previewerId" (int, FK → Employee.id)
  - "previewedContentId" (int, FK → Content.id)
  - "previewDate" (timestamp, default now)
  PK is ("previewerId", "previewedContentId", "previewDate").
  Use this to count views/previews per content or per employee.

"Notification" — system notifications about content changes or ownership transfers.
  - id (int, PK)
  - type (NotificationType enum)
  - "contentId" (int, FK → Content.id)
  - "triggeredById" (int, nullable, FK → Employee.id)   -- who caused the notification
  - "targetPersona" (Persona enum)                       -- which persona should see it
  - "createdAt" (timestamp, default now)

"NotificationDismissal" — tracks which notifications which employees have dismissed.
  - "notificationId" (int, FK → Notification.id)
  - "employeeId" (int, FK → Employee.id)
  - "dismissedAt" (timestamp, default now)
  PK is ("notificationId", "employeeId").

"ExpirationDismissal" — tracks employees dismissing expiration warnings on content.
  - "contentId" (int, FK → Content.id)
  - "employeeId" (int, FK → Employee.id)
  - threshold (text)                                     -- e.g., '30d', '7d'
  - "dismissedAt" (timestamp, default now)
  PK is ("contentId", "employeeId", threshold).

KEY RELATIONSHIPS AT A GLANCE:
  - Content has TWO Employee relationships: owner ("ownerId") and current checker-outer ("checkedOutById")
  - ServiceRequest has TWO Employee relationships: owner ("ownerId") and assignee ("assigneeId")
  - To count previews/views on Content, JOIN "Preview" on "previewedContentId"
  - To count bookmarks on Content, JOIN "Bookmark" on "bookmarkedContentId"
  - Tags are a Postgres text[] column — use ANY(tags), array overlap (&&), or unnest(tags) to query them
`.trim();