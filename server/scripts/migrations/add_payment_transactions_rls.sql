-- ============================================================================
-- South African Payment Rails: Peach Payments V2 Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE "payment_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_transactions" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_transactions_tenant_isolation ON "payment_transactions";
CREATE POLICY payment_transactions_tenant_isolation ON "payment_transactions"
    FOR ALL
    USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shogun_rls_enforced') THEN
        CREATE ROLE shogun_rls_enforced NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "payment_transactions" TO shogun_rls_enforced;
