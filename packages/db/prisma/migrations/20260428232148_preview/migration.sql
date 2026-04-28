/*
  Warnings:

  - You are about to drop the column `hits` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "hits",
ADD COLUMN     "created" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Preview" (
    "previewerId" INTEGER NOT NULL,
    "previewedContentId" INTEGER NOT NULL,
    "previewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preview_pkey" PRIMARY KEY ("previewerId","previewedContentId","previewDate")
);

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_previewedContentId_fkey" FOREIGN KEY ("previewedContentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_previewerId_fkey" FOREIGN KEY ("previewerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
