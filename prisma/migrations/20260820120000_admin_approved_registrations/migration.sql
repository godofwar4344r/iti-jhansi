-- Admin-gated registration.
--
-- A self-service sign-up now lands as PENDING and cannot sign in until an
-- administrator approves it. Accounts an administrator creates are APPROVED
-- outright.
--
-- Every account that already exists is grandfathered to APPROVED: they were
-- created before the gate existed, and defaulting them to PENDING would lock
-- out the whole institute, including the administrator running this migration.

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add the gate, defaulted to APPROVED for the backfill.
ALTER TABLE "users" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
                    ADD COLUMN "approvalNote"   TEXT,
                    ADD COLUMN "approvedAt"     TIMESTAMP(3),
                    ADD COLUMN "approvedById"   TEXT;

-- Existing rows are already APPROVED via the default above; stamp when.
UPDATE "users" SET "approvedAt" = "createdAt" WHERE "approvedAt" IS NULL;

-- New rows must start PENDING, so flip the default now the backfill is done.
ALTER TABLE "users" ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "users_approvalStatus_idx" ON "users"("approvalStatus");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
