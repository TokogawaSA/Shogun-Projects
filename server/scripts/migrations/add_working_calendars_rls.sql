-- ============================================================================
-- South African Working Calendars & Public Holidays Row-Level Security (RLS)
-- Supports shared global 'ZA' baseline ("tenantId" IS NULL) + tenant-isolated
-- custom calendars and company December shutdown days.
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
