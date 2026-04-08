-- DropForeignKey
ALTER TABLE "Login" DROP CONSTRAINT "Login_employeeID_fkey";

-- AddForeignKey
ALTER TABLE "Login" ADD CONSTRAINT "Login_employeeID_fkey" FOREIGN KEY ("employeeID") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
