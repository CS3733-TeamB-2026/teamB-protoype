/*
  Warnings:

  - You are about to drop the column `linkedCollectionId` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `linkedContentId` on the `ServiceRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serviceRequestId]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serviceRequestId]` on the table `Content` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_linkedCollectionId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_linkedContentId_fkey";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "serviceRequestId" INTEGER;

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "serviceRequestId" INTEGER;

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "linkedCollectionId",
DROP COLUMN "linkedContentId";

-- CreateIndex
CREATE UNIQUE INDEX "Collection_serviceRequestId_key" ON "Collection"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_serviceRequestId_key" ON "Content"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
