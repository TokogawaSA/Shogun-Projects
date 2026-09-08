import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testConnections() {
  console.log('Testing DATABASE_URL (Port 6543)...');
  const prisma1 = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  try {
    const res1 = await prisma1.$queryRaw`SELECT 1 as connected;`;
    console.log('DATABASE_URL (6543) Result:', res1);
  } catch (err: any) {
    console.error('DATABASE_URL (6543) Error:', err.message);
  } finally {
    await prisma1.$disconnect();
  }

  console.log('\nTesting DIRECT_URL (Port 5432)...');
  const prisma2 = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
  });
  try {
    const res2 = await prisma2.$queryRaw`SELECT 1 as connected;`;
    console.log('DIRECT_URL (5432) Result:', res2);
  } catch (err: any) {
    console.error('DIRECT_URL (5432) Error:', err.message);
  } finally {
    await prisma2.$disconnect();
  }
}

testConnections();
