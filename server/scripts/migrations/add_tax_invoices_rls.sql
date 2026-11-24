-- ============================================================================
-- South African SARS VAT & TaxInvoice Multi-Tenant Row-Level Security (RLS)
-- ============================================================================

-- 1. Enable and FORCE Row-Level Security on tax_invoices
ALTER TABLE "tax_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_invoices" FORCE ROW LEVEL SECURITY;

-- 2. Strict Tenant Isolation Policy on tax_invoices
DROP POLICY IF EXISTS tax_invoices_tenant_isolation ON "tax_invoices";
CREATE POLICY tax_invoices_tenant_isolation ON "tax_invoices"
    FOR ALL
    USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- 3. Grant table permissions to non-superuser RLS enforcement role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shogun_rls_enforced') THEN
        CREATE ROLE shogun_rls_enforced NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tax_invoices" TO shogun_rls_enforced;

-- 4. JSONB GIN index on crm_accounts.customFields for tenant-scoped B2B firmographic lookups
CREATE INDEX IF NOT EXISTS "crm_accounts_customFields_gin_idx" ON "crm_accounts" USING GIN ("customFields");
