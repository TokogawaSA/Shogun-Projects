import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

export const TEST_LOGINS = [
  {
    email: 'admin@shogunate.solutions',
    password: 'AdminPassword@2026',
    displayName: 'Alex Vance',
    role: 'admin',
    isTenantAdmin: true,
    description: 'System Administrator (Full Tenant Control & Settings)',
  },
  {
    email: 'pm@shogunate.solutions',
    password: 'PmPassword@2026',
    displayName: 'Sarah Connor',
    role: 'project_manager',
    isTenantAdmin: false,
    description: 'Project Manager (WBS, Gantt, Budgets, Deliverables)',
  },
  {
    email: 'dev@shogunate.solutions',
    password: 'DevPassword@2026',
    displayName: 'David Chen',
    role: 'developer',
    isTenantAdmin: false,
    description: 'Software Engineer (Tasks, Kanban, Timesheets)',
  },
  {
    email: 'viewer@shogunate.solutions',
    password: 'ViewerPassword@2026',
    displayName: 'Victoria Sterling',
    role: 'viewer',
    isTenantAdmin: false,
    description: 'Client / Stakeholder (Read-Only Views & Status)',
  },
];

async function seedTestingLogins() {
  console.log('================================================================');
  console.log('  PROVISIONING TESTING LOGINS FOR SHOGUN PROJECTS');
  console.log('================================================================\n');

  // 1. Ensure Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-enterprise-root' },
    update: {
      name: 'Shogun Enterprise Core',
      domain: 'shogunate.solutions',
      industry: 'Software & Cloud Automation',
    },
    create: {
      id: 'tenant-enterprise-root',
      name: 'Shogun Enterprise Core',
      domain: 'shogunate.solutions',
      industry: 'Software & Cloud Automation',
    },
  });
  console.log(`[Tenant] Initialized: ${tenant.name} (${tenant.id})`);

  // 2. Hash and Upsert Users
  const salt = await bcrypt.genSalt(10);
  const createdUsers: any[] = [];

  for (const item of TEST_LOGINS) {
    const passwordHash = await bcrypt.hash(item.password, salt);

    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        tenantId: tenant.id,
        displayName: item.displayName,
        role: item.role,
        isTenantAdmin: item.isTenantAdmin,
        passwordHash,
      },
      create: {
        tenantId: tenant.id,
        email: item.email,
        displayName: item.displayName,
        role: item.role,
        isTenantAdmin: item.isTenantAdmin,
        passwordHash,
      },
    });

    createdUsers.push({
      email: user.email,
      password: item.password,
      role: user.role,
      displayName: user.displayName,
      isTenantAdmin: user.isTenantAdmin,
      description: item.description,
    });

    console.log(`[User Ready] ${item.role.padEnd(16)} -> ${item.email}`);
  }

  console.log('\n================================================================');
  console.log('  TESTING CREDENTIALS SUMMARY');
  console.log('================================================================');
  console.table(
    createdUsers.map((u) => ({
      Role: u.role,
      Email: u.email,
      Password: u.password,
      'Display Name': u.displayName,
      Admin: u.isTenantAdmin ? 'YES' : 'NO',
      Description: u.description,
    }))
  );
  console.log('================================================================\n');
}

seedTestingLogins()
  .catch((err) => {
    console.error('[Seeding Error]:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
