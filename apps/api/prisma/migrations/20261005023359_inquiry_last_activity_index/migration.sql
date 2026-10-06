-- DropIndex
DROP INDEX "Inquiry_createdAt_idx";

-- CreateIndex
CREATE INDEX "Inquiry_lastActivityAt_idx" ON "Inquiry"("lastActivityAt");
