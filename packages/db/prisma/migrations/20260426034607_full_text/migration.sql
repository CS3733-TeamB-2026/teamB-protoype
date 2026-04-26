-- DropIndex
DROP INDEX "content_search_idx";

-- AlterTable
ALTER TABLE "Content" ALTER COLUMN "searchVector" DROP DEFAULT;
