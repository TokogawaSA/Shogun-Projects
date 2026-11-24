import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function applyWorkingCalendarsRls(): Promise<void> {
  console.log('🔒 [Working Calendar SQL] Enforcing FORCE RLS on working_calendars and public_holidays...');
  const sqlPath = path.join(__dirname, 'migrations', 'add_working_calendars_rls.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Working Calendars RLS SQL file missing at ${sqlPath}`);
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

  console.log('✅ [Working Calendar SQL] FORCE RLS policies active on working_calendars & public_holidays.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyWorkingCalendarsRls()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ [Working Calendar SQL Error]:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
