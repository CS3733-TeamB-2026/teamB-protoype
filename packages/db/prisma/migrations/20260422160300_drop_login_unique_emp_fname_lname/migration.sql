/*
  Warnings:

  - You are about to drop the `Login` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[firstName,lastName]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Login" DROP CONSTRAINT "Login_employeeID_fkey";

-- DropTable
DROP TABLE "Login";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_firstName_lastName_key" ON "Employee"("firstName", "lastName");
