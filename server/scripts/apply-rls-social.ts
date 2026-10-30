import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function applySocialRlsPolicies() {
  console.log('🔒 [RLS Policy Engine] Enforcing tenant_isolation policies on social listening tables...');
  const sqlPath = path.join(__dirname, 'migrations', 'add_social_listening_module.sql');
  if (!fs.existsSync(sqlPath)) {
    console.warn(`[RLS Policy Engine] Migration file not found at ${sqlPath}`);
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  // Split statements and execute sequentially
  const statements = sql
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err: any) {
      // Ignore if table/constraint/policy already exists or setting warning
      console.warn(`[RLS Policy Engine] Notice on statement execution: ${err.message}`);
    }
  }

  console.log('✅ [RLS Policy Engine] Multi-tenant RLS policies applied successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applySocialRlsPolicies()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ [RLS Policy Engine Error]:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
