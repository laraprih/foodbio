-- Add showHeroLogo column to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "showHeroLogo" BOOLEAN NOT NULL DEFAULT true;
