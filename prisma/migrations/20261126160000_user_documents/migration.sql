-- Persoonsdocumenten bij gebruikers (ID / rijbewijs / certificaat / VOG / …)
CREATE TABLE IF NOT EXISTS "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "expiresAt" TIMESTAMP(3),
    "neverExpires" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "originalName" TEXT,
    "contentType" TEXT,
    "expiryNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserDocument_userId_idx" ON "UserDocument"("userId");
CREATE INDEX IF NOT EXISTS "UserDocument_expiresAt_idx" ON "UserDocument"("expiresAt");
CREATE INDEX IF NOT EXISTS "UserDocument_expiryNotifiedAt_idx" ON "UserDocument"("expiryNotifiedAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserDocument_userId_fkey'
    ) THEN
        ALTER TABLE "UserDocument"
            ADD CONSTRAINT "UserDocument_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
