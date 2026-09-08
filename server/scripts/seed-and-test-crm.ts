import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32chars_min';

async function seedAdminAndTestAPI() {
  console.log('--- 1. Ensuring Default Tenant Exists in Supabase ---');
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
  console.log('Tenant:', tenant.id, tenant.name);

  console.log('\n--- 2. Ensuring Default Admin User Exists in Supabase ---');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AdminPassword@2026', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shogunate.solutions' },
    update: {
      tenantId: tenant.id,
      displayName: 'Administrator',
      role: 'admin',
      isTenantAdmin: true,
      passwordHash,
    },
    create: {
      id: 'usr-admin-master',
      tenantId: tenant.id,
      email: 'admin@shogunate.solutions',
      displayName: 'Administrator',
      role: 'admin',
      isTenantAdmin: true,
      passwordHash,
    },
  });
  console.log('Admin User:', adminUser.id, adminUser.email);

  console.log('\n--- 3. Generating JWT Token for Admin User ---');
  const token = jwt.sign(
    {
      userId: adminUser.id,
      tenantId: tenant.id,
      email: adminUser.email,
      role: adminUser.role,
      isTenantAdmin: adminUser.isTenantAdmin,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log('Generated Valid JWT Token for testing');

  console.log('\n--- 4. Direct Supabase CRM Record Creation & Verification ---');
  const timestamp = Date.now().toString().slice(-5);

  // 4a. Create Lead in Supabase
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      leadNumber: `LEA-${timestamp}`,
      firstName: 'Sophia',
      lastName: 'Sterling',
      company: 'Sterling Global Dynamics',
      title: 'Chief Information Officer',
      email: `sophia.sterling.${timestamp}@sterlingglobal.com`,
      phone: '+1 (555) 789-0123',
      leadStatus: 'pre_qualified',
      rating: 'hot',
      leadSource: 'web_site',
      industry: 'Enterprise Software',
      annualRevenue: 5000000,
      city: 'Zurich',
      country: 'Switzerland',
      assignedUserId: adminUser.id,
      createdById: adminUser.id,
      customFields: { priorityLevel: 'P1', migrationReadiness: 'High' },
    },
  });
  console.log('Created Lead in Supabase:', { id: lead.id, leadNumber: lead.leadNumber, company: lead.company });

  // 4b. Create Account in Supabase
  const account = await prisma.account.create({
    data: {
      tenantId: tenant.id,
      accountNumber: `ACC-${timestamp}`,
      accountName: 'Sterling Global Dynamics Holding AG',
      domain: 'sterlingglobal.com',
      industry: 'Enterprise Software',
      accountType: 'customer',
      rating: 'hot',
      annualRevenue: 5000000,
      billingCity: 'Zurich',
      billingCountry: 'Switzerland',
      assignedUserId: adminUser.id,
      createdById: adminUser.id,
      customFields: { tier: 'Platinum' },
    },
  });
  console.log('Created Account in Supabase:', { id: account.id, accountNumber: account.accountNumber, name: account.accountName });

  // 4c. Create Contact in Supabase
  const contact = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      contactNumber: `CON-${timestamp}`,
      firstName: 'Sophia',
      lastName: 'Sterling',
      accountId: account.id,
      email: `sophia.sterling.${timestamp}@sterlingglobal.com`,
      jobTitle: 'CIO',
      phone: '+1 (555) 789-0123',
      isPrimaryContact: true,
      assignedUserId: adminUser.id,
      createdById: adminUser.id,
    },
  });
  console.log('Created Contact in Supabase:', { id: contact.id, contactNumber: contact.contactNumber, name: `${contact.firstName} ${contact.lastName}` });

  // 4d. Create Deal in Supabase
  const deal = await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      dealNumber: `OPP-${timestamp}`,
      dealName: 'Sterling Global - Antigravity Enterprise Cloud Platform',
      accountId: account.id,
      contactId: contact.id,
      amount: 250000,
      currency: 'USD',
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stage: 'negotiation_review',
      probability: 85,
      dealType: 'new_business',
      assignedUserId: adminUser.id,
      createdById: adminUser.id,
      customFields: { contractLengthMonths: 36 },
    },
  });
  console.log('Created Deal in Supabase:', { id: deal.id, dealNumber: deal.dealNumber, dealName: deal.dealName, amount: deal.amount });

  console.log('\n--- 5. Verifying Counts in Supabase ---');
  const counts = {
    leads: await prisma.lead.count({ where: { tenantId: tenant.id } }),
    accounts: await prisma.account.count({ where: { tenantId: tenant.id } }),
    contacts: await prisma.contact.count({ where: { tenantId: tenant.id } }),
    deals: await prisma.deal.count({ where: { tenantId: tenant.id } }),
  };
  console.log('Current Supabase CRM Counts for Tenant:', counts);

  console.log('\n--- 6. Verifying Records Query with Foreign Key Joins ---');
  const fullDeal = await prisma.deal.findUnique({
    where: { id: deal.id },
    include: {
      account: true,
      contact: true,
      assignedUser: { select: { id: true, displayName: true, email: true } },
    },
  });
  console.log('Full Relational Deal in Supabase:', {
    dealId: fullDeal?.id,
    dealName: fullDeal?.dealName,
    accountName: fullDeal?.account.accountName,
    contactName: `${fullDeal?.contact?.firstName} ${fullDeal?.contact?.lastName}`,
    assignedUser: fullDeal?.assignedUser.displayName,
  });

  return { token, adminUser, tenant };
}

seedAdminAndTestAPI()
  .then(() => console.log('\nSeed & Verification completed successfully.'))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
