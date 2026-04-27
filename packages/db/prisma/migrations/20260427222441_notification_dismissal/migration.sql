-- CreateTable
CREATE TABLE "NotificationDismissal" (
    "notificationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDismissal_pkey" PRIMARY KEY ("notificationId","employeeId")
);

-- CreateTable
CREATE TABLE "ExpirationDismissal" (
    "contentId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "threshold" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpirationDismissal_pkey" PRIMARY KEY ("contentId","employeeId","threshold")
);

-- AddForeignKey
ALTER TABLE "NotificationDismissal" ADD CONSTRAINT "NotificationDismissal_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDismissal" ADD CONSTRAINT "NotificationDismissal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpirationDismissal" ADD CONSTRAINT "ExpirationDismissal_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpirationDismissal" ADD CONSTRAINT "ExpirationDismissal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
