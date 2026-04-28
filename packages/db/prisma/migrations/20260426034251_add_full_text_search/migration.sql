-- Drop existing searchVector if it exists from a previous attempt
ALTER TABLE "Content" DROP COLUMN IF EXISTS "searchVector";

-- Add text content column (if not already there)
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "textContent" TEXT;

-- Recreate the generated tsvector column cleanly
ALTER TABLE "Content" ADD COLUMN "searchVector" TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('english', coalesce("textContent", ''))) STORED;

-- Add GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "content_search_idx" ON "Content" USING GIN("searchVector");