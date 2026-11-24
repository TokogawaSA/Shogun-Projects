-- CreateTable
CREATE TABLE "tenant_accounting_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "encryptedCredentials" TEXT NOT NULL,
    "defaultSalesAccountCode" TEXT NOT NULL DEFAULT '200',
    "defaultVatTaxTypeId" TEXT NOT NULL DEFAULT 'OUTPUT3',
    "lastSyncStatus" TEXT DEFAULT 'IDLE',
    "lastSyncError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_accounting_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_accounting_connections_tenantId_idx" ON "tenant_accounting_connections"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_accounting_connections_tenantId_isActive_idx" ON "tenant_accounting_connections"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_accounting_connections_tenantId_provider_key" ON "tenant_accounting_connections"("tenantId", "provider");

-- AddForeignKey
ALTER TABLE "tenant_accounting_connections" ADD CONSTRAINT "tenant_accounting_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;



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
