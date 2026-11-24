import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function applyPaymentTransactionsRls(): Promise<void> {
  console.log('🔒 [Peach Payments SQL] Enforcing FORCE RLS on payment_transactions...');
  const sqlPath = path.join(__dirname, 'migrations', 'add_payment_transactions_rls.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`PaymentTransaction RLS SQL file missing at ${sqlPath}`);
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

  console.log('✅ [Peach Payments SQL] FORCE RLS policy active on payment_transactions.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyPaymentTransactionsRls()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ [Peach Payments SQL Error]:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
