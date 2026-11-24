-- AlterTable
ALTER TABLE "catalog_price_books" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "exchangeRateToZar" DECIMAL(14,6) NOT NULL DEFAULT 1.000000,
ADD COLUMN     "rateLockedAt" TIMESTAMP(3),
ADD COLUMN     "subtotalExclVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxMode" TEXT NOT NULL DEFAULT 'EXCLUSIVE',
ADD COLUMN     "totalInclVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 0.1500;

-- AlterTable
ALTER TABLE "crm_accounts" ADD COLUMN     "bbbeeExpiryDate" TIMESTAMP(3),
ADD COLUMN     "bbbeeLevel" INTEGER,
ADD COLUMN     "cipcRegistrationNumber" TEXT,
ADD COLUMN     "csdSupplierNumber" TEXT,
ADD COLUMN     "vatRegistrationNumber" TEXT;

-- AlterTable
ALTER TABLE "financial_quotes" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "exchangeRateToZar" DECIMAL(14,6) NOT NULL DEFAULT 1.000000,
ADD COLUMN     "rateLockedAt" TIMESTAMP(3),
ADD COLUMN     "subtotalExclVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxMode" TEXT NOT NULL DEFAULT 'EXCLUSIVE',
ADD COLUMN     "totalInclVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 0.1500;

-- CreateTable
CREATE TABLE "tax_invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "accountId" TEXT,
    "projectId" TEXT,
    "quoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "subtotalExclVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalInclVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "externalAccountingProvider" TEXT,
    "externalAccountingId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_invoices_tenantId_idx" ON "tax_invoices"("tenantId");

-- CreateIndex
CREATE INDEX "tax_invoices_tenantId_status_idx" ON "tax_invoices"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tax_invoices_accountId_idx" ON "tax_invoices"("accountId");

-- CreateIndex
CREATE INDEX "tax_invoices_projectId_idx" ON "tax_invoices"("projectId");

-- CreateIndex
CREATE INDEX "tax_invoices_quoteId_idx" ON "tax_invoices"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_tenantId_invoiceNumber_key" ON "tax_invoices"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "crm_accounts_tenantId_bbbeeExpiryDate_idx" ON "crm_accounts"("tenantId", "bbbeeExpiryDate");

-- CreateIndex
CREATE INDEX "crm_accounts_vatRegistrationNumber_idx" ON "crm_accounts"("vatRegistrationNumber");

-- CreateIndex
CREATE INDEX "crm_accounts_cipcRegistrationNumber_idx" ON "crm_accounts"("cipcRegistrationNumber");

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "financial_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;



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
