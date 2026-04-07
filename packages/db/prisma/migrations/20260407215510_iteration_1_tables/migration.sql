/*
  Warnings:

  - You are about to drop the column `name` on the `Content` table. All the data in the column will be lost.
  - The primary key for the `Login` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `loginID` on the `Login` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Login` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[linkURL]` on the table `Content` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fileURI]` on the table `Content` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayName` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeID` to the `Login` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Login` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Login" DROP CONSTRAINT "Login_loginID_fkey";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "name",
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "fileURI" TEXT;

-- AlterTable
ALTER TABLE "Login" DROP CONSTRAINT "Login_pkey",
DROP COLUMN "loginID",
DROP COLUMN "password",
ADD COLUMN     "employeeID" INTEGER NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD CONSTRAINT "Login_pkey" PRIMARY KEY ("employeeID");

-- CreateIndex
CREATE UNIQUE INDEX "Content_linkURL_key" ON "Content"("linkURL");

-- CreateIndex
CREATE UNIQUE INDEX "Content_fileURI_key" ON "Content"("fileURI");

-- AddForeignKey
ALTER TABLE "Login" ADD CONSTRAINT "Login_employeeID_fkey" FOREIGN KEY ("employeeID") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
