-- ============================================================================
-- Outbound Accounting Connections (Sage SA & Xero) Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE "tenant_accounting_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_accounting_connections" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_accounting_connections_isolation ON "tenant_accounting_connections";
CREATE POLICY tenant_accounting_connections_isolation ON "tenant_accounting_connections"
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
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tenant_accounting_connections" TO shogun_rls_enforced;
