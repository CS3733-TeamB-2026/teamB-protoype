/*
  Warnings:

  - The values [todo,done] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isWorkflow` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `asigneeID` on the `ServiceRequest` table. All the data in the column will be lost.
  - Added the required column `contentType` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetPersona` to the `Content` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Persona" ADD VALUE 'admin';

-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('new', 'inProgress', 'complete');
ALTER TABLE "Content" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_asigneeID_fkey";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "isWorkflow",
ADD COLUMN     "contentType" "ContentType" NOT NULL,
ADD COLUMN     "targetPersona" "Persona" NOT NULL,
ALTER COLUMN "lastModified" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "asigneeID",
ADD COLUMN     "assigneeID" INTEGER;

-- CreateTable
CREATE TABLE "Login" (
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "loginID" INTEGER NOT NULL,

    CONSTRAINT "Login_pkey" PRIMARY KEY ("loginID")
);

-- AddForeignKey
ALTER TABLE "Login" ADD CONSTRAINT "Login_loginID_fkey" FOREIGN KEY ("loginID") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assigneeID_fkey" FOREIGN KEY ("assigneeID") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
