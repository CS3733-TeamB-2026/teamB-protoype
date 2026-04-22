/*
  Warnings:

  - The primary key for the `ServiceRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id");
