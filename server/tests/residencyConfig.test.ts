import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  evaluateDataResidency,
  parseEnv,
  isApprovedSouthAfricanHost,
} from '../src/config/env.js';
import { getDatabasePoolConfig, getDatabaseUrl } from '../src/config/db.js';
import { getRedisOptions, getRedisSslConfig } from '../src/config/redis.js';
import {
  storageService,
  buildTenantStorageKey,
  assertTenantKeyNamespace,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  PRESIGNED_URL_TTL_SECONDS,
  TenantStorageIsolationError,
} from '../src/services/storageService.js';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Phase 1 – South African POPIA Data Residency & Infrastructure Guardrails', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment & POPIA Section 72 Residency Enforcement (env.ts)', () => {
    it('applies South African defaults (za-jhb, ENFORCE_LOCAL_RESIDENCY=true, Africa/Johannesburg)', () => {
      const cfg = parseEnv({});
      expect(cfg.DATA_RESIDENCY_REGION).toBe('za-jhb');
      expect(cfg.ENFORCE_LOCAL_RESIDENCY).toBe(true);
      expect(cfg.DEFAULT_TIMEZONE).toBe('Africa/Johannesburg');
    });

    it('accepts all approved South African residency regions and rejects offshore region enums', () => {
      for (const region of ['za-jhb', 'za-cpt', 'af-south-1', 'southafricanorth'] as const) {
        const cfg = parseEnv({ DATA_RESIDENCY_REGION: region });
        expect(cfg.DATA_RESIDENCY_REGION).toBe(region);
      }

      expect(() => parseEnv({ DATA_RESIDENCY_REGION: 'us-east-1' })).toThrow();
    });

    it('flags non-SA database hosts and logs a critical boot warning when ENFORCE_LOCAL_RESIDENCY=true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const audit = evaluateDataResidency({
        NODE_ENV: 'production',
        DATA_RESIDENCY_REGION: 'af-south-1',
        ENFORCE_LOCAL_RESIDENCY: 'true',
        DB_HOST: 'shogun-prod.c9akciq32.us-east-1.rds.amazonaws.com',
        DATABASE_URL:
          'postgresql://postgres:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
        REDIS_HOST: 'redis.eu-central-1.cache.amazonaws.com',
        S3_REGION: 'us-west-2',
      });

      expect(audit.enforced).toBe(true);
      expect(audit.compliant).toBe(false);

      const violatedTargets = audit.violations.map((v) => v.target);
      expect(violatedTargets).toContain('DB_HOST');
      expect(violatedTargets).toContain('DATABASE_URL');
      expect(violatedTargets).toContain('REDIS_HOST');
      expect(violatedTargets).toContain('S3_REGION');
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0]?.[0]).toContain('[CRITICAL][POPIA-S72]');
    });

    it('approves South African cloud endpoints, .co.za domains, and private RFC 1918 VPC subnets', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(isApprovedSouthAfricanHost('db.af-south-1.rds.amazonaws.com')).toBe(true);
      expect(isApprovedSouthAfricanHost('pg-southafricanorth.postgres.co.za')).toBe(true);
      expect(isApprovedSouthAfricanHost('db.za-jhb.hostafrica.co.za')).toBe(true);
      expect(isApprovedSouthAfricanHost('10.24.0.15')).toBe(true);
      expect(isApprovedSouthAfricanHost('172.28.0.5')).toBe(true);
      expect(isApprovedSouthAfricanHost('192.168.10.20')).toBe(true);
      expect(isApprovedSouthAfricanHost('8.8.8.8')).toBe(false);

      const audit = evaluateDataResidency({
        NODE_ENV: 'production',
        DATA_RESIDENCY_REGION: 'af-south-1',
        ENFORCE_LOCAL_RESIDENCY: 'true',
        DB_HOST: 'shogun.cluster-xyz.af-south-1.rds.amazonaws.com',
        REDIS_HOST: '10.0.12.40',
        S3_REGION: 'af-south-1',
        S3_ENDPOINT: 'https://s3.af-south-1.amazonaws.com',
      });

      expect(audit.compliant).toBe(true);
      expect(audit.violations).toHaveLength(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('bypasses offshore host blocking when ENFORCE_LOCAL_RESIDENCY=false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const audit = evaluateDataResidency({
        ENFORCE_LOCAL_RESIDENCY: 'false',
        DB_HOST: 'db.us-east-1.rds.amazonaws.com',
        S3_REGION: 'us-east-1',
      });

      expect(audit.enforced).toBe(false);
      expect(audit.compliant).toBe(true);
      expect(audit.violations).toHaveLength(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('POPIA Section 19 – TLS & PgBouncer Transaction Pooling (db.ts & redis.ts)', () => {
    it('enforces ssl: { rejectUnauthorized: true } and PgBouncer transaction pooling in production', () => {
      const prodEnv: NodeJS.ProcessEnv = {
        NODE_ENV: 'production',
        DB_HOST: 'pgbouncer.za-jhb.hostafrica.co.za',
        DB_PORT: '6432',
        DB_USER: 'shogun_sa',
        DB_PASSWORD: 'strong_password',
        DB_NAME: 'shogun_prod',
        REDIS_HOST: '10.10.1.25',
      };

      const dbPool = getDatabasePoolConfig(prodEnv);
      expect(dbPool.ssl).toEqual({ rejectUnauthorized: true });
      expect(dbPool.pgbouncer).toBe(true);
      expect(dbPool.poolMode).toBe('transaction');
      expect(dbPool.statementCacheSize).toBe(0);

      const dbUrl = getDatabaseUrl(prodEnv);
      expect(dbUrl).toContain('pgbouncer=true');
      expect(dbUrl).toContain('statement_cache_size=0');
      expect(dbUrl).toContain('sslmode=require');
      expect(dbUrl).toContain('sslaccept=strict');

      const redisSsl = getRedisSslConfig(prodEnv);
      expect(redisSsl).toEqual({ rejectUnauthorized: true });

      const redisOpts = getRedisOptions(prodEnv);
      expect(redisOpts.tls).toEqual({ rejectUnauthorized: true });
    });
  });

  describe('Tenant-Isolated Object Storage & 15-Minute Pre-Signed URLs (storageService.ts)', () => {
    const saStorageEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      DATA_RESIDENCY_REGION: 'af-south-1',
      ENFORCE_LOCAL_RESIDENCY: 'true',
      S3_REGION: 'af-south-1',
      S3_BUCKET: 'shogun-za-vault',
      S3_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
      S3_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    };

    it('constructs strictly namespaced keys: tenants/${tenantId}/${module}/${uuid}-${sanitizedFilename}', () => {
      const key = buildTenantStorageKey(
        'tenant-jhb-01',
        'projects',
        '../../Q4 Architectural Blueprint (Final).pdf'
      );

      expect(key).toMatch(
        /^tenants\/tenant-jhb-01\/projects\/[0-9a-f-]{36}-Q4-Architectural-Blueprint-Final.pdf$/i
      );
      expect(assertTenantKeyNamespace('tenant-jhb-01', key)).toBe(key);
    });

    it('rejects any file path missing the tenants/${tenantId}/ prefix or attempting cross-tenant traversal', async () => {
      const invalidPaths = [
        'projects/550e8400-e29b-41d4-a716-446655440000-spec.pdf',
        'uploads/tenant-jhb-01/projects/spec.pdf',
        'tenants/tenant-cpt-99/projects/550e8400-e29b-41d4-a716-446655440000-spec.pdf',
        'tenants/tenant-jhb-01-spoofed/projects/550e8400-e29b-41d4-a716-446655440000-spec.pdf',
        'tenants/tenant-jhb-01/projects/../../tenant-cpt-99/secret.pdf',
        'tenants/tenant-jhb-01/projects/%2e%2e/secret.pdf',
        '/tenants/tenant-jhb-01/projects/550e8400-e29b-41d4-a716-446655440000-spec.pdf',
        'tenants/tenant-jhb-01/only-three-segments.pdf',
      ];

      for (const badPath of invalidPaths) {
        expect(() => storageService.validateTenantKey('tenant-jhb-01', badPath)).toThrow(
          TenantStorageIsolationError
        );

        await expect(
          createPresignedDownloadUrl(
            { tenantId: 'tenant-jhb-01', key: badPath },
            saStorageEnv
          )
        ).rejects.toThrow(TenantStorageIsolationError);

        await expect(
          createPresignedUploadUrl(
            {
              tenantId: 'tenant-jhb-01',
              module: 'projects',
              filename: 'spec.pdf',
              key: badPath,
            },
            saStorageEnv
          )
        ).rejects.toThrow(TenantStorageIsolationError);
      }
    });

    it('generates short-lived 15-minute (900s) pre-signed upload and download URLs and rejects longer TTLs', async () => {
      const upload = await createPresignedUploadUrl(
        {
          tenantId: 'tenant-jhb-01',
          module: 'documents',
          filename: 'POPIA Compliance Certificate.pdf',
          contentType: 'application/pdf',
        },
        saStorageEnv
      );

      expect(upload.method).toBe('PUT');
      expect(upload.expiresInSeconds).toBe(PRESIGNED_URL_TTL_SECONDS);
      expect(upload.expiresInSeconds).toBe(900);
      expect(upload.key.startsWith('tenants/tenant-jhb-01/documents/')).toBe(true);
      expect(upload.url).toContain('https://shogun-za-vault.s3.af-south-1.amazonaws.com/tenants/tenant-jhb-01/documents/');
      expect(upload.url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(upload.url).toContain('X-Amz-Expires=900');
      expect(upload.url).toContain('X-Amz-Signature=');

      const download = await createPresignedDownloadUrl(
        {
          tenantId: 'tenant-jhb-01',
          key: upload.key,
          responseContentDisposition: 'attachment',
        },
        saStorageEnv
      );

      expect(download.method).toBe('GET');
      expect(download.expiresInSeconds).toBe(900);
      expect(download.url).toContain('X-Amz-Expires=900');
      expect(download.url).toContain('response-content-disposition=attachment');

      // Reject TTL > 15 minutes (900 seconds)
      await expect(
        createPresignedDownloadUrl(
          {
            tenantId: 'tenant-jhb-01',
            key: upload.key,
            expiresInSeconds: 901,
          },
          saStorageEnv
        )
      ).rejects.toThrow(/900 seconds/);
    });

    it('blocks pre-signed URL generation when S3_REGION is offshore under ENFORCE_LOCAL_RESIDENCY=true', async () => {
      await expect(
        createPresignedUploadUrl(
          {
            tenantId: 'tenant-jhb-01',
            module: 'crm',
            filename: 'contract.pdf',
          },
          {
            ...saStorageEnv,
            S3_REGION: 'eu-west-1',
          }
        )
      ).rejects.toThrow(TenantStorageIsolationError);
    });
  });

  describe('SA Cloud Healthcheck Endpoint (GET /api/v1/health/residency)', () => {
    it('returns active region, database encryption status, and POPIA compliance flags', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ ssl: true }] as any);

      const server = app.listen(0);
      try {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        const response = await fetch(`http://127.0.0.1:${port}/api/v1/health/residency`);
        const body = (await response.json()) as any;

        expect(response.status).toBe(200);
        expect(body.activeRegion).toBeDefined();
        expect(['za-jhb', 'za-cpt', 'af-south-1', 'southafricanorth']).toContain(body.region);
        expect(body.timezone).toBe('Africa/Johannesburg');
        expect(body.databaseEncryption).toBeDefined();
        expect(body.databaseEncryption.pooling.mode).toBe('transaction');
        expect(body.popiaCompliance).toBeDefined();
        expect(body.popiaCompliance.tenantIsolatedStorage).toBe(true);
        expect(body.popiaCompliance.presignedUrlMaxTtlSeconds).toBe(900);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });
});
