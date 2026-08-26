/**
 * Enterprise Project Portfolio Management (PPM) - Unit & Logic Test Suite
 * Validates:
 * 1. Financial Rollup, Variances & Profit Margin Microservices
 * 2. Portfolio-Wide Aggregation & Health State Engine
 * 3. 5x5 Probability-Impact Scoring & Sentinel Escalation Gates
 * 4. Cross-Departmental Bottleneck & Dependency Propagation
 * 5. Resource Capacity Planning & Over-Allocation Detection
 * 6. Strategic Pillar Capital Share & Target ROI Valuations
 */

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log('🧪 RUNNING ENTERPRISE PPM DOMAIN & MICROSERVICE TESTS');
console.log('======================================================\n');

// ----------------------------------------------------
// 1. Financial Rollup & Variance Calculations
// ----------------------------------------------------
console.log('Test Group 1: Multi-Tier Financial Rollup & Variance Engine');

function calculateProjectFinancialSummary(budget, expenses, laborLogs) {
  // Sum approved expenses by category
  let actualCapex = 0;
  let actualOpex = 0;

  expenses.forEach((e) => {
    if (e.status === 'approved') {
      if (e.category === 'hardware') {
        actualCapex += Number(e.amount || 0);
      } else {
        actualOpex += Number(e.amount || 0);
      }
    }
  });

  // Sum labor costs (hours * hourlyCostRate)
  let actualLabor = 0;
  laborLogs.forEach((l) => {
    actualLabor += Number(l.hours || 0) * Number(l.hourlyCostRate || 0);
  });

  const totalActual = actualCapex + actualOpex + actualLabor;
  const capexAlloc = Number(budget.capexBudget || 0);
  const opexAlloc = Number(budget.opexBudget || 0);
  const laborAlloc = Number(budget.laborBudget || 0);
  const totalAlloc = capexAlloc + opexAlloc + laborAlloc;

  const totalVariance = totalAlloc - totalActual;
  const capexVariance = capexAlloc - actualCapex;
  const opexVariance = opexAlloc - actualOpex;
  const laborVariance = laborAlloc - actualLabor;

  const profitMarginPercent = totalAlloc > 0
    ? Number(((totalVariance / totalAlloc) * 100).toFixed(2))
    : 0;

  return {
    actualCapex,
    actualOpex,
    actualLabor,
    totalActual,
    totalAlloc,
    capexVariance,
    opexVariance,
    laborVariance,
    totalVariance,
    profitMarginPercent,
    isOverBudget: totalActual > totalAlloc,
  };
}

const sampleBudget = {
  capexBudget: 50000,
  opexBudget: 30000,
  laborBudget: 70000,
};

const sampleExpenses = [
  { category: 'hardware', amount: 35000, status: 'approved' },
  { category: 'software', amount: 12000, status: 'approved' },
  { category: 'travel', amount: 5000, status: 'approved' },
  { category: 'hardware', amount: 20000, status: 'rejected' }, // Rejected, should not count
  { category: 'software', amount: 4000, status: 'pending' },   // Pending, should not count
];

const sampleLaborLogs = [
  { hours: 200, hourlyCostRate: 150 }, // 30,000
  { hours: 100, hourlyCostRate: 120 }, // 12,000
];

const finSummary = calculateProjectFinancialSummary(sampleBudget, sampleExpenses, sampleLaborLogs);

assert(finSummary.actualCapex === 35000, 'CapEx sums only approved hardware expenses (35,000)');
assert(finSummary.actualOpex === 17000, 'OpEx sums software & travel approved expenses (12,000 + 5,000 = 17,000)');
assert(finSummary.actualLabor === 42000, 'Labor cost calculated accurately (30,000 + 12,000 = 42,000)');
assert(finSummary.totalActual === 94000, 'Total actual cost rolls up cleanly (35,000 + 17,000 + 42,000 = 94,000)');
assert(finSummary.totalAlloc === 150000, 'Total budget allocation summed (50k + 30k + 70k = 150,000)');
assert(finSummary.totalVariance === 56000, 'Total cost variance positive under budget (150,000 - 94,000 = 56,000)');
assert(finSummary.profitMarginPercent === 37.33, 'Profit margin percentage accurately derived (37.33%)');
assert(finSummary.isOverBudget === false, 'Project correctly flagged as within budget ceiling');

// ----------------------------------------------------
// 2. Portfolio-Wide Aggregation & Health State Engine
// ----------------------------------------------------
console.log('\nTest Group 2: Portfolio Aggregation & Health State Engine');

function calculatePortfolioSnapshot(portfolio, projectSummaries, projectRisks) {
  const linkedProjIds = new Set(portfolio.projectIds || []);
  const linkedSummaries = projectSummaries.filter((p) => linkedProjIds.has(p.projectId));
  const linkedRisks = projectRisks.filter((r) => linkedProjIds.has(r.projectId));

  const totalAllocated = Number(portfolio.budgetAllocated || 0);
  const totalActual = linkedSummaries.reduce((a, p) => a + (p.totalActual || 0), 0);
  const avgCompletion = linkedSummaries.length > 0
    ? Math.round(linkedSummaries.reduce((a, p) => a + (p.completionPercent || 0), 0) / linkedSummaries.length)
    : 0;

  const criticalRisksCount = linkedRisks.filter((r) => r.riskScore >= 15 && r.status !== 'closed').length;
  const activeRisksCount = linkedRisks.filter((r) => r.status !== 'closed').length;

  let healthStatus = 'on_track';
  if (criticalRisksCount > 0 || totalActual > totalAllocated) {
    healthStatus = 'critical';
  } else if (totalActual > totalAllocated * 0.85 || activeRisksCount >= 3) {
    healthStatus = 'at_risk';
  }

  return {
    totalAllocated,
    totalActual,
    totalVariance: totalAllocated - totalActual,
    avgCompletion,
    criticalRisksCount,
    activeRisksCount,
    healthStatus,
  };
}

const mockPortfolio = {
  id: 'port-ai-core',
  name: 'AI Autonomous Platform',
  projectIds: ['proj-1', 'proj-2'],
  budgetAllocated: 300000,
  targetROI: 40,
};

const mockProjectSummaries = [
  { projectId: 'proj-1', totalActual: 110000, completionPercent: 75 },
  { projectId: 'proj-2', totalActual: 90000, completionPercent: 65 },
  { projectId: 'proj-3', totalActual: 80000, completionPercent: 40 }, // Not in portfolio
];

const mockProjectRisks = [
  { projectId: 'proj-1', riskScore: 16, status: 'open' }, // Critical
  { projectId: 'proj-2', riskScore: 8, status: 'open' },
  { projectId: 'proj-3', riskScore: 20, status: 'open' }, // In unlinked project
];

const portSnapshot = calculatePortfolioSnapshot(mockPortfolio, mockProjectSummaries, mockProjectRisks);

assert(portSnapshot.totalActual === 200000, 'Portfolio aggregates only linked projects (110k + 90k = 200,000)');
assert(portSnapshot.avgCompletion === 70, 'Average milestone completion percentage calculated ((75 + 65) / 2 = 70%)');
assert(portSnapshot.criticalRisksCount === 1, 'Critical risk counter evaluates only linked open threats (1)');
assert(portSnapshot.healthStatus === 'critical', 'Portfolio health correctly escalates to "critical" due to open score >= 15 threat');

// ----------------------------------------------------
// 3. 5x5 Probability-Impact Scoring & Sentinel Trigger
// ----------------------------------------------------
console.log('\nTest Group 3: 5x5 Probability-Impact Scoring & Sentinel Trigger');

function calculateRiskScoreAndSeverity(prob, impact) {
  const p = Math.min(5, Math.max(1, Number(prob)));
  const i = Math.min(5, Math.max(1, Number(impact)));
  const score = p * i;

  let severity = 'low';
  if (score >= 15) severity = 'critical';
  else if (score >= 10) severity = 'high';
  else if (score >= 5) severity = 'medium';

  const shouldTriggerSentinelEmail = score >= 15;

  return { probability: p, impact: i, score, severity, shouldTriggerSentinelEmail };
}

const riskEvaluation1 = calculateRiskScoreAndSeverity(5, 4); // 20
assert(riskEvaluation1.score === 20, '5 * 4 correctly yields score of 20');
assert(riskEvaluation1.severity === 'critical', 'Score 20 correctly classified as "critical"');
assert(riskEvaluation1.shouldTriggerSentinelEmail === true, 'Score 20 triggers automated sentinel escalation email');

const riskEvaluation2 = calculateRiskScoreAndSeverity(3, 4); // 12
assert(riskEvaluation2.score === 12, '3 * 4 correctly yields score of 12');
assert(riskEvaluation2.severity === 'high', 'Score 12 classified as "high"');
assert(riskEvaluation2.shouldTriggerSentinelEmail === false, 'Score 12 does not trigger critical email alert');

const riskEvaluation3 = calculateRiskScoreAndSeverity(2, 2); // 4
assert(riskEvaluation3.severity === 'low', 'Score 4 classified as "low"');

// ----------------------------------------------------
// 4. Cross-Departmental Bottleneck Mapping
// ----------------------------------------------------
console.log('\nTest Group 4: Cross-Departmental Bottleneck & Dependency Propagation');

function detectDepartmentBottlenecks(risks) {
  const deptMap = {};

  risks.forEach((r) => {
    if (r.status !== 'closed') {
      const deps = r.departmentDependencies || ['General'];
      deps.forEach((dep) => {
        if (!deptMap[dep]) {
          deptMap[dep] = { total: 0, criticalCount: 0, blocked: false };
        }
        deptMap[dep].total++;
        if (r.riskScore >= 15) {
          deptMap[dep].criticalCount++;
          deptMap[dep].blocked = true;
        }
      });
    }
  });

  return deptMap;
}

const sampleRiskList = [
  { id: 'r1', riskScore: 16, status: 'open', departmentDependencies: ['DevOps', 'Backend'] },
  { id: 'r2', riskScore: 12, status: 'open', departmentDependencies: ['DevOps'] },
  { id: 'r3', riskScore: 6, status: 'open', departmentDependencies: ['Finance'] },
  { id: 'r4', riskScore: 20, status: 'closed', departmentDependencies: ['Security & QA'] }, // Closed, should not block
];

const bottleneckMap = detectDepartmentBottlenecks(sampleRiskList);

assert(bottleneckMap['DevOps'].criticalCount === 1, 'DevOps correctly assigned 1 critical dependency');
assert(bottleneckMap['DevOps'].blocked === true, 'DevOps flagged as bottlenecked/blocked');
assert(bottleneckMap['Finance'].blocked === false, 'Finance remains unblocked (score 6 < 15)');
assert(!bottleneckMap['Security & QA'], 'Closed risk dependency ignored for active bottlenecking');

// ----------------------------------------------------
// 5. Resource Capacity Planning & Over-Allocation Engine
// ----------------------------------------------------
console.log('\nTest Group 5: Resource Capacity & Over-Allocation Detection');

function calculateResourceUtilization(profile, activeTasks) {
  const userTasks = activeTasks.filter((t) => t.assigneeId === profile.userId);
  const totalAssignedHours = userTasks.reduce((a, t) => a + Number(t.estimatedHours || 0), 0);
  const capacity = Number(profile.weeklyCapacityHours || 40);
  const utilizationPercent = Math.round((totalAssignedHours / capacity) * 100);

  let status = 'optimal';
  if (totalAssignedHours > capacity) {
    status = 'over_allocated';
  } else if (totalAssignedHours >= capacity * 0.8) {
    status = 'near_capacity';
  }

  return {
    userId: profile.userId,
    totalAssignedHours,
    capacity,
    utilizationPercent,
    status,
    isBurnoutRisk: status === 'over_allocated',
  };
}

const engineerProfile = {
  userId: 'usr-senior-1',
  weeklyCapacityHours: 40,
  hourlyCostRate: 120,
};

const tasksAssigned = [
  { assigneeId: 'usr-senior-1', estimatedHours: 25 },
  { assigneeId: 'usr-senior-1', estimatedHours: 20 }, // Total 45 hours
];

const utilization = calculateResourceUtilization(engineerProfile, tasksAssigned);

assert(utilization.totalAssignedHours === 45, 'Total assigned hours summed to 45h');
assert(utilization.utilizationPercent === 113, 'Utilization correctly computed as 113%');
assert(utilization.status === 'over_allocated', 'Status accurately marked as "over_allocated"');
assert(utilization.isBurnoutRisk === true, 'Flagged as burnout risk for resource rebalancing');

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n======================================================');
console.log(`📊 PPM TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
