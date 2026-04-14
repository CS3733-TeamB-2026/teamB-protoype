/*
  Warnings:

  - A unique constraint covering the columns `[auth0Id]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "auth0Id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_auth0Id_key" ON "Employee"("auth0Id");
