-- DropIndex
DROP INDEX "crm_accounts_customFields_gin_idx";

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxInvoiceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PEACH_V2',
    "checkoutId" TEXT,
    "merchantTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resultCode" TEXT,
    "registrationId" TEXT,
    "rawResponse" JSONB NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_merchantTransactionId_key" ON "payment_transactions"("merchantTransactionId");

-- CreateIndex
CREATE INDEX "payment_transactions_tenantId_idx" ON "payment_transactions"("tenantId");

-- CreateIndex
CREATE INDEX "payment_transactions_taxInvoiceId_idx" ON "payment_transactions"("taxInvoiceId");

-- CreateIndex
CREATE INDEX "payment_transactions_checkoutId_idx" ON "payment_transactions"("checkoutId");

-- CreateIndex
CREATE INDEX "payment_transactions_tenantId_status_idx" ON "payment_transactions"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_taxInvoiceId_fkey" FOREIGN KEY ("taxInvoiceId") REFERENCES "tax_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;



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
