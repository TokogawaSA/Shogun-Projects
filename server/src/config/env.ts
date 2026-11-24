import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const SUPPORTED_RESIDENCY_REGIONS = [
  'za-jhb',
  'za-cpt',
  'af-south-1',
  'southafricanorth',
] as const;

export type DataResidencyRegion = (typeof SUPPORTED_RESIDENCY_REGIONS)[number];

const APPROVED_SA_S3_REGIONS = new Set<string>([
  'za-jhb',
  'za-cpt',
  'af-south-1',
  'southafricanorth',
  'southafricawest',
]);

const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((val) => {
    if (val === undefined || val === null || val === '') {
      return defaultValue;
    }
    if (typeof val === 'boolean') {
      return val;
    }
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return val;
  }, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // South African POPIA Data Residency & Timezone Controls
  DATA_RESIDENCY_REGION: z.enum(SUPPORTED_RESIDENCY_REGIONS).default('za-jhb'),
  ENFORCE_LOCAL_RESIDENCY: booleanFromEnv(true),
  DEFAULT_TIMEZONE: z.string().trim().min(1).default('Africa/Johannesburg'),

  // PostgreSQL / PgBouncer Configuration
  DATABASE_URL: z.string().trim().min(1).optional(),
  DIRECT_URL: z.string().trim().min(1).optional(),
  DB_HOST: z.string().trim().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('shogun_db'),
  DB_SCHEMA: z.string().default('public'),
  DB_SSL: booleanFromEnv(false),
  DB_PGBOUNCER: booleanFromEnv(true),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_POOL_TIMEOUT: z.coerce.number().int().positive().default(30),

  // Redis / BullMQ Configuration
  REDIS_URL: z.string().trim().min(1).optional(),
  REDIS_HOST: z.string().trim().min(1).default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: booleanFromEnv(false),

  // South African Object Storage (S3-Compatible: AWS af-south-1 / HOSTAFRICA Object Storage)
  S3_REGION: z.string().trim().min(1).default('af-south-1'),
  S3_ENDPOINT: z.string().trim().min(1).optional(),
  S3_BUCKET: z.string().trim().min(1).default('shogun-za-vault'),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_FORCE_PATH_STYLE: booleanFromEnv(false),

  // South African Payment Rails: Peach Payments Checkout V2 (ZAR Cards, PayShap, Capitec Pay, Instant EFT)
  PEACH_ENTITY_ID: z.string().trim().default(''),
  PEACH_CLIENT_ID: z.string().trim().default(''),
  PEACH_CLIENT_SECRET: z.string().trim().default(''),
  PEACH_WEBHOOK_SECRET: z.string().trim().default(''),
  PEACH_MERCHANT_ID: z.string().trim().default(''),
  PEACH_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  PUBLIC_APP_URL: z.string().trim().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().trim().default('http://localhost:5000'),

  // Outbound Accounting Sync Encryption & OAuth2 Credentials (Sage SA v2.0.0 & Xero)
  ACCOUNTING_ENCRYPTION_KEY: z.string().trim().default(''),
  XERO_CLIENT_ID: z.string().trim().default(''),
  XERO_CLIENT_SECRET: z.string().trim().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface ResidencyViolation {
  target: 'DB_HOST' | 'DATABASE_URL' | 'REDIS_HOST' | 'REDIS_URL' | 'S3_REGION' | 'S3_ENDPOINT';
  value: string;
  reason: string;
}

export interface ResidencyAuditResult {
  compliant: boolean;
  enforced: boolean;
  region: DataResidencyRegion;
  timezone: string;
  checkedEndpoints: {
    dbHost: string;
    databaseUrlHost?: string;
    redisHost: string;
    redisUrlHost?: string;
    s3Region: string;
    s3EndpointHost?: string;
  };
  violations: ResidencyViolation[];
}

/**
 * Extract hostname from a connection URI (postgresql://, redis://, https://) or raw host:port string.
 */
export function extractHostname(uriOrHost: string): string {
  const trimmed = uriOrHost.trim();
  if (!trimmed) return '';

  if (trimmed.includes('://')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    } catch {
      // Fallback regex extraction when URI contains unescaped placeholders
      const match = trimmed.match(/@([^:/?#]+)|^[a-z0-9+.-]+:\/\/([^:/?#]+)/i);
      const extracted = match?.[1] || match?.[2];
      if (extracted) {
        return extracted.replace(/^\[|\]$/g, '').toLowerCase();
      }
    }
  }

  // Handle IPv6 literal [::1]:5432 or plain ::1
  if (trimmed.startsWith('[')) {
    const endBracket = trimmed.indexOf(']');
    if (endBracket !== -1) {
      return trimmed.slice(1, endBracket).toLowerCase();
    }
  }
  if (trimmed.includes(':') && trimmed.indexOf(':') !== trimmed.lastIndexOf(':')) {
    return trimmed.toLowerCase();
  }

  return trimmed.split(':')[0].toLowerCase();
}

/**
 * Check whether an IPv4 address belongs to loopback or RFC 1918 private VPC CIDR blocks:
 * - 127.0.0.0/8 (Loopback)
 * - 10.0.0.0/8 (Private VPC)
 * - 172.16.0.0/12 (Private VPC / Docker SA Bridge)
 * - 192.168.0.0/16 (Private VPC)
 */
export function isPrivateOrLoopbackIp(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  // IPv6 Unique Local Address (fc00::/7) or Link-Local (fe80::/10)
  if (/^(fc|fd)[0-9a-f]{2}:/i.test(normalized) || /^fe80:/i.test(normalized)) {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1, 5).map((part) => Number.parseInt(part, 10));
  if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  return false;
}

/**
 * Determine if a hostname is an approved South African cloud/VPS endpoint or private local VPC host.
 * Enforces POPIA Section 72 Cross-Border Data Transfer restrictions.
 */
export function isApprovedSouthAfricanHost(rawHost: string): boolean {
  const host = extractHostname(rawHost);
  if (!host) return false;

  // Reject unconfigured template placeholders (e.g., aws-0-[region].pooler.supabase.com)
  if (host.includes('[') || host.includes(']')) {
    return false;
  }

  // 1. Loopback & Private VPC subnets
  if (host === 'localhost' || isPrivateOrLoopbackIp(host)) {
    return true;
  }

  // 2. Internal container / private DNS service labels (e.g. 'postgres', 'pgbouncer', 'redis', '*.internal', '*.local')
  if (
    !host.includes('.') ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    host.endsWith('.svc.cluster.local')
  ) {
    return true;
  }

  // 3. Explicit offshore region markers must ALWAYS be rejected even if paired with cloud suffixes
  const offshoreRegionPattern =
    /(us-east|us-west|eu-west|eu-central|eu-north|eu-south|ap-south|ap-southeast|ap-northeast|ap-east|sa-east|ca-central|me-south|me-central|il-central|uk-south|uksouth|westeurope|northeurope|eastus|westus|centralus|southeastasia|eastasia|australiaeast)/i;
  if (offshoreRegionPattern.test(host)) {
    return false;
  }

  // 4. Approved South African regional endpoints & ccTLDs:
  // - South African .za domains (.co.za, .org.za, .net.za, .gov.za, .ac.za, .za)
  // - HOSTAFRICA / HCode local infrastructure (hostafrica.*, hcode.*, za-jhb, za-cpt)
  // - AWS Africa (Cape Town): af-south-1
  // - Azure South Africa North / West: southafricanorth, southafricawest
  if (
    host.endsWith('.za') ||
    /(^|\.|-)af-south-1(\.|-|$)/i.test(host) ||
    /(^|\.|-)southafricanorth(\.|-|$)/i.test(host) ||
    /(^|\.|-)southafricawest(\.|-|$)/i.test(host) ||
    /(^|\.|-)za-(jhb|cpt)(\.|-|$)/i.test(host) ||
    /(^|\.)hostafrica\.(co\.za|com)$/i.test(host) ||
    /(^|\.)hcode\.(co\.za|cloud)$/i.test(host)
  ) {
    return true;
  }

  return false;
}

/**
 * Determine if an S3 region identifier resides within South Africa.
 */
export function isApprovedSouthAfricanS3Region(region: string): boolean {
  return APPROVED_SA_S3_REGIONS.has(region.trim().toLowerCase());
}

/**
 * Parse and validate environment variables via Zod.
 */
export function parseEnv(rawEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  return envSchema.parse(rawEnv);
}

/**
 * Validate runtime environment variables and assert POPIA Section 72 South African data residency.
 * Logs a critical boot warning whenever ENFORCE_LOCAL_RESIDENCY=true and an offshore endpoint is detected.
 */
export function evaluateDataResidency(
  rawEnv: NodeJS.ProcessEnv = process.env,
  options: { logWarnings?: boolean } = { logWarnings: true }
): ResidencyAuditResult {
  const parsed = parseEnv(rawEnv);

  // Pin runtime default timezone to SAST (Africa/Johannesburg, UTC+2) unless explicitly overridden
  if (!rawEnv.TZ) {
    process.env.TZ = parsed.DEFAULT_TIMEZONE;
  }

  const dbHost = extractHostname(parsed.DB_HOST);
  const databaseUrlHost = parsed.DATABASE_URL ? extractHostname(parsed.DATABASE_URL) : undefined;
  const redisHost = extractHostname(parsed.REDIS_HOST);
  const redisUrlHost = parsed.REDIS_URL ? extractHostname(parsed.REDIS_URL) : undefined;
  const s3Region = parsed.S3_REGION.trim().toLowerCase();
  const s3EndpointHost = parsed.S3_ENDPOINT ? extractHostname(parsed.S3_ENDPOINT) : undefined;

  const violations: ResidencyViolation[] = [];

  if (parsed.ENFORCE_LOCAL_RESIDENCY) {
    if (!isApprovedSouthAfricanHost(dbHost)) {
      violations.push({
        target: 'DB_HOST',
        value: parsed.DB_HOST,
        reason: `Database host "${parsed.DB_HOST}" is outside approved South African regions (za-jhb, za-cpt, af-south-1, southafricanorth) or private VPC subnets.`,
      });
    }

    if (databaseUrlHost && !isApprovedSouthAfricanHost(databaseUrlHost)) {
      violations.push({
        target: 'DATABASE_URL',
        value: databaseUrlHost,
        reason: `DATABASE_URL host "${databaseUrlHost}" resolves outside approved South African regions or private VPC subnets.`,
      });
    }

    if (!isApprovedSouthAfricanHost(redisHost)) {
      violations.push({
        target: 'REDIS_HOST',
        value: parsed.REDIS_HOST,
        reason: `Redis host "${parsed.REDIS_HOST}" is outside approved South African regions or private VPC subnets.`,
      });
    }

    if (redisUrlHost && !isApprovedSouthAfricanHost(redisUrlHost)) {
      violations.push({
        target: 'REDIS_URL',
        value: redisUrlHost,
        reason: `REDIS_URL host "${redisUrlHost}" resolves outside approved South African regions or private VPC subnets.`,
      });
    }

    if (!isApprovedSouthAfricanS3Region(s3Region)) {
      violations.push({
        target: 'S3_REGION',
        value: parsed.S3_REGION,
        reason: `S3_REGION "${parsed.S3_REGION}" is not an approved South African object storage region (expected za-jhb, za-cpt, af-south-1, or southafricanorth).`,
      });
    }

    if (s3EndpointHost && !isApprovedSouthAfricanHost(s3EndpointHost)) {
      violations.push({
        target: 'S3_ENDPOINT',
        value: parsed.S3_ENDPOINT!,
        reason: `S3_ENDPOINT host "${s3EndpointHost}" resolves outside approved South African regions or private VPC subnets.`,
      });
    }

    if (violations.length > 0 && options.logWarnings !== false) {
      for (const violation of violations) {
        console.warn(
          `[CRITICAL][POPIA-S72][RESIDENCY_WARNING] Offshore infrastructure detected on ${violation.target} (${violation.value}): ${violation.reason}`
        );
      }
    }
  }

  return {
    compliant: violations.length === 0,
    enforced: parsed.ENFORCE_LOCAL_RESIDENCY,
    region: parsed.DATA_RESIDENCY_REGION,
    timezone: parsed.DEFAULT_TIMEZONE,
    checkedEndpoints: {
      dbHost,
      databaseUrlHost,
      redisHost,
      redisUrlHost,
      s3Region,
      s3EndpointHost,
    },
    violations,
  };
}

export const env: EnvConfig = parseEnv(process.env);
export const bootResidencyAudit: ResidencyAuditResult = evaluateDataResidency(process.env, {
  logWarnings: true,
});

export default env;
