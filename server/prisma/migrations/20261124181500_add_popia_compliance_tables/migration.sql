-- CreateTable
CREATE TABLE "popia_consent_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "lawfulBasis" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "sourceIp" TEXT,
    "evidenceUrl" TEXT,

    CONSTRAINT "popia_consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popia_retention_policies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "moduleName" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 1095,
    "actionOnExpiry" TEXT NOT NULL DEFAULT 'anonymize',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popia_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popia_audit_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "actorUserId" TEXT,
    "actorAgent" TEXT NOT NULL DEFAULT 'human',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldsAccessed" JSONB NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popia_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "popia_consent_records_tenantId_idx" ON "popia_consent_records"("tenantId");

-- CreateIndex
CREATE INDEX "popia_consent_records_tenantId_subjectType_subjectId_idx" ON "popia_consent_records"("tenantId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "popia_consent_records_tenantId_purpose_idx" ON "popia_consent_records"("tenantId", "purpose");

-- CreateIndex
CREATE INDEX "popia_retention_policies_tenantId_idx" ON "popia_retention_policies"("tenantId");

-- CreateIndex
CREATE INDEX "popia_retention_policies_tenantId_isActive_idx" ON "popia_retention_policies"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "popia_retention_policies_tenantId_moduleName_key" ON "popia_retention_policies"("tenantId", "moduleName");

-- CreateIndex
CREATE INDEX "popia_audit_logs_tenantId_idx" ON "popia_audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "popia_audit_logs_tenantId_createdAt_idx" ON "popia_audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "popia_audit_logs_tenantId_entityType_entityId_idx" ON "popia_audit_logs"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "popia_audit_logs_tenantId_action_idx" ON "popia_audit_logs"("tenantId", "action");



-- ============================================================================
-- POPIA Governance Engine: Row-Level Security (RLS) & Immutable Audit Trigger
-- South Africa Protection of Personal Information Act (POPIA) 4 of 2013
-- ============================================================================

-- 1. Enable and FORCE Row-Level Security on all 3 POPIA Governance tables
ALTER TABLE "popia_consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "popia_consent_records" FORCE ROW LEVEL SECURITY;

ALTER TABLE "popia_retention_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "popia_retention_policies" FORCE ROW LEVEL SECURITY;

ALTER TABLE "popia_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "popia_audit_logs" FORCE ROW LEVEL SECURITY;

-- 2. Tenant Isolation RLS Policies (bound to session setting app.current_tenant_id)
DROP POLICY IF EXISTS popia_consent_tenant_isolation ON "popia_consent_records";
CREATE POLICY popia_consent_tenant_isolation ON "popia_consent_records"
    FOR ALL
    USING ("tenantId"::text = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId"::text = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS popia_retention_tenant_isolation ON "popia_retention_policies";
CREATE POLICY popia_retention_tenant_isolation ON "popia_retention_policies"
    FOR ALL
    USING ("tenantId"::text = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId"::text = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS popia_audit_tenant_isolation ON "popia_audit_logs";
CREATE POLICY popia_audit_tenant_isolation ON "popia_audit_logs"
    FOR ALL
    USING ("tenantId"::text = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId"::text = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 3. Non-superuser RLS execution role (ensures RLS applies even when pool connects as superuser)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shogun_rls_enforced') THEN
        CREATE ROLE shogun_rls_enforced NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "popia_consent_records" TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "popia_retention_policies" TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "popia_audit_logs" TO shogun_rls_enforced;

-- 4. Append-Only Immutability Trigger on popia_audit_logs (blocks UPDATE, DELETE, and TRUNCATE)
CREATE OR REPLACE FUNCTION prevent_popia_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'POPIA_AUDIT_LOG_IMMUTABLE: popia_audit_logs is an append-only immutable compliance table; % operations are strictly prohibited.', TG_OP
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_popia_audit_logs_immutable ON "popia_audit_logs";
CREATE TRIGGER trg_popia_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON "popia_audit_logs"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_popia_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_popia_audit_logs_no_truncate ON "popia_audit_logs";
CREATE TRIGGER trg_popia_audit_logs_no_truncate
    BEFORE TRUNCATE ON "popia_audit_logs"
    FOR EACH STATEMENT
    EXECUTE FUNCTION prevent_popia_audit_log_mutation();
