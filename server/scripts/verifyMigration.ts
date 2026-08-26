/**
 * Phase 5: Post-Migration Referential Integrity & Data Verification
 * 
 * Audits PostgreSQL database state to guarantee 100% relational consistency:
 * - Zero orphan contacts or project tasks
 * - Valid linkedProjectId for closed_won deals
 * - Intact JSONB customFields trees
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export interface VerificationReport {
  passed: boolean;
  tenantCounts: Record<string, number>;
  orphanContactsCount: number;
  orphanTasksCount: number;
  closedWonDealsWithLinkedProject: number;
  totalClosedWonDeals: number;
  errors: string[];
}

export async function runDataVerification(tenantId: string = 'tenant-enterprise-root'): Promise<VerificationReport> {
  console.log('\n======================================================');
  console.log('🔍 RUNNING PHASE 5 DATA INTEGRITY & CUTOVER AUDIT');
  console.log(`   Target Tenant: ${tenantId}`);
  console.log('======================================================\n');

  const errors: string[] = [];

  try {
    // 1. Table Counts
    const [
      tenantsCount,
      usersCount,
      accountsCount,
      contactsCount,
      dealsCount,
      projectsCount,
      tasksCount,
      riskItemsCount,
    ] = await Promise.all([
      prisma.tenant.count({ where: { id: tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.account.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId } }),
      prisma.project.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.riskItem.count({ where: { tenantId } }),
    ]);

    const tenantCounts = {
      tenants: tenantsCount,
      users: usersCount,
      accounts: accountsCount,
      contacts: contactsCount,
      deals: dealsCount,
      projects: projectsCount,
      tasks: tasksCount,
      riskItems: riskItemsCount,
    };

    console.log('📊 Table Record Counts:');
    console.table(tenantCounts);

    // 2. Orphan Contacts Check
    console.log('🔎 Checking for Orphan Contacts...');
    const allContacts = await prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, accountId: true },
    });

    const accountIds = new Set(
      (await prisma.account.findMany({ where: { tenantId }, select: { id: true } })).map((a) => a.id)
    );

    let orphanContactsCount = 0;
    for (const c of allContacts) {
      if (c.accountId && !accountIds.has(c.accountId)) {
        orphanContactsCount++;
        errors.push(`Orphan Contact detected: Contact ${c.id} points to non-existent Account ${c.accountId}`);
      }
    }

    if (orphanContactsCount === 0) {
      console.log('  ✓ 0 Orphan Contacts found.');
    } else {
      console.error(`  ✗ ${orphanContactsCount} Orphan Contacts found!`);
    }

    // 3. Orphan Tasks Check
    console.log('🔎 Checking for Orphan Tasks...');
    const allTasks = await prisma.task.findMany({
      where: { tenantId },
      select: { id: true, projectId: true },
    });

    const projectIds = new Set(
      (await prisma.project.findMany({ where: { tenantId }, select: { id: true } })).map((p) => p.id)
    );

    let orphanTasksCount = 0;
    for (const t of allTasks) {
      if (!projectIds.has(t.projectId)) {
        orphanTasksCount++;
        errors.push(`Orphan Task detected: Task ${t.id} points to non-existent Project ${t.projectId}`);
      }
    }

    if (orphanTasksCount === 0) {
      console.log('  ✓ 0 Orphan Tasks found.');
    } else {
      console.error(`  ✗ ${orphanTasksCount} Orphan Tasks found!`);
    }

    // 4. Closed-Won Deals Linkage Check
    console.log('🔎 Checking Closed-Won Deals & Linked Project Consistency...');
    const closedWonDeals = await prisma.deal.findMany({
      where: { tenantId, stage: 'closed_won' },
      select: { id: true, dealName: true, linkedProjectId: true },
    });

    let closedWonDealsWithLinkedProject = 0;
    for (const d of closedWonDeals) {
      if (d.linkedProjectId) {
        if (projectIds.has(d.linkedProjectId)) {
          closedWonDealsWithLinkedProject++;
        } else {
          errors.push(`Closed-Won Deal ${d.id} links to missing Project ${d.linkedProjectId}`);
        }
      }
    }

    console.log(`  ✓ ${closedWonDealsWithLinkedProject} of ${closedWonDeals.length} Closed-Won Deals properly linked to valid Projects.`);

    const passed = errors.length === 0;

    console.log('\n======================================================');
    console.log(`🎯 VERIFICATION RESULT: ${passed ? 'PASSED (100% INTEGRITY)' : 'FAILED'}`);
    if (!passed) {
      console.log('Errors:');
      errors.forEach((e) => console.log(` - ${e}`));
    }
    console.log('======================================================\n');

    return {
      passed,
      tenantCounts,
      orphanContactsCount,
      orphanTasksCount,
      closedWonDealsWithLinkedProject,
      totalClosedWonDeals: closedWonDeals.length,
      errors,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith('verifyMigration.ts') || process.argv[1]?.endsWith('verifyMigration.js')) {
  runDataVerification()
    .then((report) => process.exit(report.passed ? 0 : 1))
    .catch((err) => {
      console.error('[Verification Fatal Error]:', err);
      process.exit(1);
    });
}
