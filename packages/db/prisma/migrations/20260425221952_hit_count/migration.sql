-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "hits" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
