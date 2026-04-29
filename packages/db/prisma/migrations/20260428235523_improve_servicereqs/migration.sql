-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "linkedCollectionId" INTEGER,
ADD COLUMN     "linkedContentId" INTEGER,
ADD COLUMN     "notes" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_linkedContentId_fkey" FOREIGN KEY ("linkedContentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_linkedCollectionId_fkey" FOREIGN KEY ("linkedCollectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
