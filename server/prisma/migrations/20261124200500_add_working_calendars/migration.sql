-- AlterTable
ALTER TABLE "projects" ADD COLUMN "calendarId" TEXT;

-- CreateTable
CREATE TABLE "working_calendars" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'South Africa Standard (SAST)',
    "countryCode" TEXT NOT NULL DEFAULT 'ZA',
    "workDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "dailyWorkHours" DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "isObservedMonday" BOOLEAN NOT NULL DEFAULT false,
    "isAdHocDeclared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "working_calendars_tenantId_idx" ON "working_calendars"("tenantId");

-- CreateIndex
CREATE INDEX "working_calendars_countryCode_isDefault_idx" ON "working_calendars"("countryCode", "isDefault");

-- CreateIndex
CREATE INDEX "public_holidays_calendarId_date_idx" ON "public_holidays"("calendarId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "public_holidays_calendarId_date_key" ON "public_holidays"("calendarId", "date");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "working_calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_calendars" ADD CONSTRAINT "working_calendars_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_holidays" ADD CONSTRAINT "public_holidays_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "working_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- South African Working Calendars & Public Holidays Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE "working_calendars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "working_calendars" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS working_calendars_select ON "working_calendars";
CREATE POLICY working_calendars_select ON "working_calendars"
    FOR SELECT
    USING (
        "tenantId" IS NULL
        OR "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
    );

DROP POLICY IF EXISTS working_calendars_write ON "working_calendars";
CREATE POLICY working_calendars_write ON "working_calendars"
    FOR ALL
    USING (
        ("tenantId" IS NULL AND current_setting('app.allow_global_calendar_seed', true) = 'true')
        OR "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
    )
    WITH CHECK (
        ("tenantId" IS NULL AND current_setting('app.allow_global_calendar_seed', true) = 'true')
        OR "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
    );

ALTER TABLE "public_holidays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public_holidays" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_holidays_select ON "public_holidays";
CREATE POLICY public_holidays_select ON "public_holidays"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "working_calendars" wc
            WHERE wc."id" = "public_holidays"."calendarId"
              AND (
                  wc."tenantId" IS NULL
                  OR wc."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
              )
        )
    );

DROP POLICY IF EXISTS public_holidays_write ON "public_holidays";
CREATE POLICY public_holidays_write ON "public_holidays"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "working_calendars" wc
            WHERE wc."id" = "public_holidays"."calendarId"
              AND (
                  (wc."tenantId" IS NULL AND current_setting('app.allow_global_calendar_seed', true) = 'true')
                  OR wc."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "working_calendars" wc
            WHERE wc."id" = "public_holidays"."calendarId"
              AND (
                  (wc."tenantId" IS NULL AND current_setting('app.allow_global_calendar_seed', true) = 'true')
                  OR wc."tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
              )
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shogun_rls_enforced') THEN
        CREATE ROLE shogun_rls_enforced NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "working_calendars" TO shogun_rls_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public_holidays" TO shogun_rls_enforced;
