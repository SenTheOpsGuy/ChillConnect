-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('BOOKING_COORDINATION', 'SERVICE_DISCUSSION', 'LOGISTICS', 'SUPPORT', 'SYSTEM');

-- AlterTable Message - Add template fields
ALTER TABLE "messages" ADD COLUMN "templateId" TEXT,
ADD COLUMN "templateVariables" TEXT;

-- CreateTable ChatTemplate
CREATE TABLE "chat_templates" (
    "id" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "templateText" TEXT NOT NULL,
    "description" TEXT,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "chat_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_templates" ADD CONSTRAINT "chat_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
