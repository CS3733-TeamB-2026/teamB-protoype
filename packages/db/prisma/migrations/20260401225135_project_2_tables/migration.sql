/*
  Warnings:

  - You are about to drop the `TestFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Persona" AS ENUM ('underwriter', 'businessAnalyst');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('todo', 'inProgress', 'done');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('reference', 'workflow');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('reviewClaim', 'requestAdjuster', 'checkClaim');

-- DropTable
DROP TABLE "TestFile";

-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "persona" "Persona",

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "linkURL" TEXT,
    "ownerID" INTEGER,
    "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration" TIMESTAMP(3),
    "isWorkflow" "ContentType" NOT NULL,
    "status" "Status",

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "ownerID" INTEGER NOT NULL,
    "asigneeID" INTEGER,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "type" "RequestType" NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("ownerID","created")
);

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerID_fkey" FOREIGN KEY ("ownerID") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_ownerID_fkey" FOREIGN KEY ("ownerID") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_asigneeID_fkey" FOREIGN KEY ("asigneeID") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
