-- Migration script: Add Social Listening Module & Enable Multi-Tenant RLS
-- Target: PostgreSQL 16+

-- 1. Create table social_listening_rules if not exists
CREATE TABLE IF NOT EXISTS "social_listening_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "excludedWords" JSONB,
    "platforms" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_listening_rules_pkey" PRIMARY KEY ("id")
);

-- 2. Create table social_interactions if not exists
CREATE TABLE IF NOT EXISTS "social_interactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "mediaUrls" JSONB,
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "sentimentScore" DOUBLE PRECISION DEFAULT 0.0,
    "intent" TEXT NOT NULL DEFAULT 'general',
    "urgency" TEXT NOT NULL DEFAULT 'low',
    "status" TEXT NOT NULL DEFAULT 'new',
    "threadHistory" JSONB,
    "escalatedTaskId" TEXT,
    "linkedContactId" TEXT,
    "linkedAccountId" TEXT,
    "linkedDealId" TEXT,
    "postUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_interactions_pkey" PRIMARY KEY ("id")
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS "social_listening_rules_tenantId_idx" ON "social_listening_rules"("tenantId");
CREATE INDEX IF NOT EXISTS "social_listening_rules_isActive_idx" ON "social_listening_rules"("isActive");

CREATE INDEX IF NOT EXISTS "social_interactions_tenantId_idx" ON "social_interactions"("tenantId");
CREATE INDEX IF NOT EXISTS "social_interactions_platform_idx" ON "social_interactions"("platform");
CREATE INDEX IF NOT EXISTS "social_interactions_sentiment_idx" ON "social_interactions"("sentiment");
CREATE INDEX IF NOT EXISTS "social_interactions_intent_idx" ON "social_interactions"("intent");
CREATE INDEX IF NOT EXISTS "social_interactions_status_idx" ON "social_interactions"("status");
CREATE INDEX IF NOT EXISTS "social_interactions_escalatedTaskId_idx" ON "social_interactions"("escalatedTaskId");
CREATE INDEX IF NOT EXISTS "social_interactions_linkedContactId_idx" ON "social_interactions"("linkedContactId");
CREATE INDEX IF NOT EXISTS "social_interactions_linkedAccountId_idx" ON "social_interactions"("linkedAccountId");

-- 4. Foreign Key Constraints
ALTER TABLE "social_listening_rules" DROP CONSTRAINT IF EXISTS "social_listening_rules_tenantId_fkey";
ALTER TABLE "social_listening_rules" ADD CONSTRAINT "social_listening_rules_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_interactions" DROP CONSTRAINT IF EXISTS "social_interactions_tenantId_fkey";
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_interactions" DROP CONSTRAINT IF EXISTS "social_interactions_ruleId_fkey";
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_ruleId_fkey" 
    FOREIGN KEY ("ruleId") REFERENCES "social_listening_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "social_interactions" DROP CONSTRAINT IF EXISTS "social_interactions_escalatedTaskId_fkey";
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_escalatedTaskId_fkey" 
    FOREIGN KEY ("escalatedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "social_interactions" DROP CONSTRAINT IF EXISTS "social_interactions_linkedContactId_fkey";
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_linkedContactId_fkey" 
    FOREIGN KEY ("linkedContactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "social_interactions" DROP CONSTRAINT IF EXISTS "social_interactions_linkedAccountId_fkey";
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_linkedAccountId_fkey" 
    FOREIGN KEY ("linkedAccountId") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Multi-Tenant Row Level Security (RLS) Enforcement
ALTER TABLE "social_listening_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_interactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "social_listening_rules";
CREATE POLICY tenant_isolation_policy ON "social_listening_rules"
    FOR ALL
    USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy ON "social_interactions";
CREATE POLICY tenant_isolation_policy ON "social_interactions"
    FOR ALL
    USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));
