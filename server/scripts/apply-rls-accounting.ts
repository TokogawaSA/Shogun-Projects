import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function applyAccountingConnectionsRls(): Promise<void> {
  console.log('🔒 [Accounting Sync SQL] Enforcing FORCE RLS on tenant_accounting_connections...');
  const sqlPath = path.join(__dirname, 'migrations', 'add_accounting_connections_rls.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Accounting RLS SQL file missing at ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of sql.split('\n')) {
    if (line.trim().startsWith('--')) continue;
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches && dollarMatches.length % 2 === 1) {
      inDollarQuote = !inDollarQuote;
    }
    current += line + '\n';
    if (!inDollarQuote && line.trim().endsWith(';')) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }

  console.log('✅ [Accounting Sync SQL] FORCE RLS policy active on tenant_accounting_connections.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyAccountingConnectionsRls()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ [Accounting Sync SQL Error]:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
