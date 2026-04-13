-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutBy" INTEGER,
ADD COLUMN     "employeeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_checkedOutBy_fkey" FOREIGN KEY ("checkedOutBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
