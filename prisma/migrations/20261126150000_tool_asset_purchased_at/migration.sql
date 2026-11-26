-- Aanschafdatum op gereedschap-assets
ALTER TABLE "ToolAsset" ADD COLUMN IF NOT EXISTS "purchasedAt" TIMESTAMP(3);
