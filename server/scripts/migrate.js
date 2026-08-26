/**
 * PostgreSQL Database Migration & Schema Sync Runner
 * 
 * Validates database connectivity and pushes the Prisma relational schema
 * directly to the PostgreSQL instance without requiring interactive input.
 * 
 * Usage:
 *   node scripts/migrate.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

// Load environment configuration
dotenv.config({ path: path.join(serverDir, '.env') });

console.log('🔄 [PostgreSQL Database Migration] Starting Schema Synchronization...');

// 1. Resolve or construct DATABASE_URL
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.DB_USER && process.env.DB_NAME) {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = encodeURIComponent(process.env.DB_USER);
  const pass = encodeURIComponent(process.env.DB_PASSWORD || '');
  const name = process.env.DB_NAME;
  const schema = process.env.DB_SCHEMA || 'public';
  dbUrl = `postgresql://${user}:${pass}@${host}:${port}/${name}?schema=${schema}&connection_limit=10`;
  process.env.DATABASE_URL = dbUrl;
}

if (!dbUrl) {
  console.error('❌ [Migration Error] DATABASE_URL or DB_USER/DB_NAME environment variables are not set.');
  console.error('Please configure your database credentials in server/.env.');
  process.exit(1);
}

// Log safe connection target (masking password)
const safeTarget = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log(`🔌 [Database Target] Connecting to: ${safeTarget}`);

try {
  // 2. Generate Prisma Client
  console.log('📦 [Prisma] Generating Prisma client...');
  execSync('npx prisma generate', {
    cwd: serverDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  // 3. Push schema to PostgreSQL database (creating missing tables, RLS readiness, and relational constraints)
  console.log('🚀 [Prisma] Pushing schema to PostgreSQL...');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: serverDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log('\n======================================================');
  console.log('✅ [PostgreSQL Database Migration Complete]');
  console.log('All PostgreSQL tables, foreign keys, JSONB fields, and indexes are active.');
  console.log('======================================================\n');
} catch (err) {
  console.error('❌ [Migration Error] Failed to synchronize database schema:', err.message);
  process.exit(1);
}
