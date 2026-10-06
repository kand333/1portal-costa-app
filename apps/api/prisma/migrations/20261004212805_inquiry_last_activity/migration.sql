-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: the latest message of each conversation, or the inquiry itself when it has none.
UPDATE "Inquiry" AS i
SET "lastActivityAt" = GREATEST(i."createdAt", COALESCE((SELECT MAX(m."createdAt") FROM "InquiryMessage" AS m WHERE m."inquiryId" = i."id"), i."createdAt"));
