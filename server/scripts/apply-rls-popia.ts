import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function applyPopiaRlsAndTriggers(): Promise<void> {
  console.log('🔒 [POPIA Governance SQL] Enforcing FORCE RLS and immutable audit log trigger...');
  const sqlPath = path.join(__dirname, 'migrations', 'add_popia_rls_and_triggers.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`POPIA SQL migration file missing at ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Execute block-aware SQL statements (preserving $$ ... $$ PL/pgSQL blocks)
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('--')) {
      continue;
    }
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches && dollarMatches.length % 2 === 1) {
      inDollarQuote = !inDollarQuote;
    }
    current += line + '\n';
    if (!inDollarQuote && line.trim().endsWith(';')) {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
    }
  }
  if (current.trim()) {
    statements.push(current.trim());
  }

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }

  console.log('✅ [POPIA Governance SQL] FORCE RLS policies and immutable trigger active.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyPopiaRlsAndTriggers()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ [POPIA Governance SQL Error]:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
