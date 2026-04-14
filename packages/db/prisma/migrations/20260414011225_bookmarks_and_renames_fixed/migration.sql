/*
  Warnings:

  - You are about to drop the column `checkedOutBy` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `ownerID` on the `Content` table. All the data in the column will be lost.
  - The primary key for the `ServiceRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assigneeID` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ownerID` on the `ServiceRequest` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_checkedOutBy_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_ownerID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_assigneeID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_ownerID_fkey";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "checkedOutBy",
DROP COLUMN "employeeId",
DROP COLUMN "ownerID",
ADD COLUMN     "checkedOutById" INTEGER,
ADD COLUMN     "ownerId" INTEGER;

-- AlterTable
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_pkey",
DROP COLUMN "assigneeID",
DROP COLUMN "ownerID",
ADD COLUMN     "assigneeId" INTEGER,
ADD COLUMN     "ownerId" INTEGER NOT NULL,
ADD CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("ownerId", "created");

-- CreateTable
CREATE TABLE "Bookmark" (
    "bookmarkerId" INTEGER NOT NULL,
    "bookmarkedContentId" INTEGER NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("bookmarkerId","bookmarkedContentId")
);

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookmarkerId_fkey" FOREIGN KEY ("bookmarkerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookmarkedContentId_fkey" FOREIGN KEY ("bookmarkedContentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
