import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function inspectSchema() {
  console.log('--- Inspecting Supabase PostgreSQL Tables & Columns ---');
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Tables in public schema:', tables.map(t => t.table_name));

  for (const t of ['tenants', 'users', 'crm_leads', 'crm_accounts', 'crm_contacts', 'crm_deals']) {
    const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string }>>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${t}
      ORDER BY ordinal_position;
    `;
    console.log(`\nColumns for ${t}:`, columns.map(c => `${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
  }
}

inspectSchema()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
