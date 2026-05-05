-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "embedding" vector(384);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "embedding" vector(384);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "embedding" vector(384);
