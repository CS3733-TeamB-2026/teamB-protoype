-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('document_change', 'expiration', 'ownership');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "public"."Notification" (
                                         "id"            SERIAL PRIMARY KEY,
                                         "type"          "public"."NotificationType" NOT NULL,
                                         "title"         TEXT NOT NULL,
                                         "description"   TEXT NOT NULL,
                                         "contentId"     INTEGER NOT NULL,
                                         "read"          BOOLEAN NOT NULL DEFAULT false,
                                         "priority"      "public"."NotificationPriority" NOT NULL DEFAULT 'medium',
                                         "personaTarget" "public"."Persona" NOT NULL,
                                         "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                         CONSTRAINT "Notification_contentId_fkey" FOREIGN KEY ("contentId")
                                             REFERENCES "public"."Content"("id") ON DELETE CASCADE
);
