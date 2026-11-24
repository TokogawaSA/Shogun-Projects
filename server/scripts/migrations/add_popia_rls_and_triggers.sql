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
