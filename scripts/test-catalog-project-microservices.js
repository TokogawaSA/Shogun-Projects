/**
 * Products & Services Catalog and Expanded Projects/Tasks Microservices - Unit & Logic Test Suite
 * Validates:
 * 1. Catalog Pricing Engine & Multi-Tier PriceBook Calculation Rules
 * 2. Inventory Adjustment & Low-Stock Alert Evaluation
 * 3. Time Log Aggregation, Billable Hours & Nested Task Rollups
 * 4. Milestone Completion Progression & Auto-Transition State Engine
 * 5. Gantt Task Dependency DAG & Cycle Detection (Kahn's Algorithm)
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
console.log('🧪 RUNNING CATALOG & EXPANDED PROJECTS MICROSERVICES TESTS');
console.log('======================================================\n');

// ----------------------------------------------------
// 1. Catalog Pricing Engine & PriceBook Rules
// ----------------------------------------------------
console.log('Test Group 1: Catalog Pricing Engine & PriceBook Tier Rules');

function calculatePricingBreakdown(items, priceBook, currency = 'USD') {
  let subtotal = 0;
  let totalDiscount = 0;
  let taxTotal = 0;
  let totalCost = 0;

  const computedItems = items.map((item, index) => {
    const qty = Math.max(1, item.quantity || 1);
    const originalPrice = item.baseUnitPrice >= 0 ? item.baseUnitPrice : 0;
    const costPrice = item.costPrice || 0;
    const taxRate = item.taxRatePercent || 0;

    let effectiveUnitPrice = originalPrice;
    if (item.customUnitPrice !== undefined && item.customUnitPrice !== null) {
      effectiveUnitPrice = item.customUnitPrice;
    } else if (priceBook?.pricingRules && priceBook.pricingRules[item.productId] !== undefined) {
      effectiveUnitPrice = priceBook.pricingRules[item.productId];
    }

    const grossLineTotal = effectiveUnitPrice * qty;
    const discount = Math.min(grossLineTotal, item.manualDiscountAmount || 0);
    const netSubtotal = Math.max(0, grossLineTotal - discount);
    const lineTax = Number(((netSubtotal * taxRate) / 100).toFixed(2));
    const lineTotal = Number((netSubtotal + lineTax).toFixed(2));

    const lineCost = costPrice * qty;
    const lineMargin = netSubtotal - lineCost;
    const lineMarginPercent = netSubtotal > 0 ? (lineMargin / netSubtotal) * 100 : 0;

    subtotal += grossLineTotal;
    totalDiscount += discount;
    taxTotal += lineTax;
    totalCost += lineCost;

    return {
      id: `item-${index + 1}`,
      productId: item.productId,
      quantity: qty,
      unitPrice: effectiveUnitPrice,
      subtotal: netSubtotal,
      taxAmount: lineTax,
      totalPrice: lineTotal,
      marginAmount: Number(lineMargin.toFixed(2)),
      marginPercent: Number(lineMarginPercent.toFixed(2)),
    };
  });

  const grandTotal = Number((subtotal - totalDiscount + taxTotal).toFixed(2));
  const totalMargin = Number((subtotal - totalDiscount - totalCost).toFixed(2));
  const netRevenue = subtotal - totalDiscount;
  const marginPercent = netRevenue > 0 ? Number(((totalMargin / netRevenue) * 100).toFixed(2)) : 0;

  return {
    items: computedItems,
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    grandTotal,
    totalCost: Number(totalCost.toFixed(2)),
    totalMargin,
    marginPercent,
    currency,
  };
}

const mockItems = [
  {
    productId: 'prod-server-blade',
    productName: 'Enterprise Server Blade',
    type: 'product',
    baseUnitPrice: 2500,
    costPrice: 1500,
    taxRatePercent: 10,
    quantity: 2,
    manualDiscountAmount: 200,
  },
  {
    productId: 'serv-cloud-arch',
    productName: 'Cloud Architecture Advisory',
    type: 'service',
    baseUnitPrice: 200,
    costPrice: 80,
    taxRatePercent: 0,
    quantity: 10,
    manualDiscountAmount: 0,
  },
];

const standardPricing = calculatePricingBreakdown(mockItems, null);
assert(standardPricing.subtotal === 7000, 'Subtotal correctly calculates (2*2500 + 10*200 = 7000)');
assert(standardPricing.totalDiscount === 200, 'Total discount applied correctly (200)');
assert(standardPricing.taxTotal === 480, 'Tax total calculated accurately ((5000-200)*10% = 480)');
assert(standardPricing.grandTotal === 7280, 'Grand total sums net subtotal + tax (6800 + 480 = 7280)');
assert(standardPricing.totalCost === 3800, 'Total cost accurately derived (2*1500 + 10*80 = 3800)');
assert(standardPricing.totalMargin === 3000, 'Total profit margin calculated (6800 net revenue - 3800 cost = 3000)');
assert(standardPricing.marginPercent === 44.12, 'Margin percentage accurately derived (3000 / 6800 = 44.12%)');

// PriceBook tier override
const enterprisePriceBook = {
  id: 'pb-enterprise-tier',
  pricingRules: {
    'prod-server-blade': 2100, // Discounted tier price
  },
};
const enterprisePricing = calculatePricingBreakdown(mockItems, enterprisePriceBook);
assert(enterprisePricing.items[0].unitPrice === 2100, 'PriceBook tier rule overrides base price for server blade (2100)');
assert(enterprisePricing.subtotal === 6200, 'PriceBook adjusted subtotal computed (2*2100 + 10*200 = 6200)');

// ----------------------------------------------------
// 2. Inventory Adjustment & Low Stock Evaluation
// ----------------------------------------------------
console.log('\nTest Group 2: Inventory Management & Low Stock Thresholds');

function evaluateLowStockStatus(inventoryQty = 0, reorderLevel = 0) {
  return inventoryQty <= reorderLevel;
}

function processInventoryDelta(currentQty, delta, reorderLevel) {
  const newQty = Math.max(0, currentQty + delta);
  const isLowStock = evaluateLowStockStatus(newQty, reorderLevel);
  return { newQty, isLowStock };
}

const inv1 = processInventoryDelta(15, -10, 8);
assert(inv1.newQty === 5, 'Inventory quantity decreases from 15 to 5 on fulfillment (-10)');
assert(inv1.isLowStock === true, 'Low stock alert triggers when quantity (5) <= reorderLevel (8)');

const inv2 = processInventoryDelta(5, 20, 8);
assert(inv2.newQty === 25, 'Inventory restock correctly increases quantity to 25');
assert(inv2.isLowStock === false, 'Low stock alert clears when restocked quantity (25) > reorderLevel (8)');

const inv3 = processInventoryDelta(3, -10, 5);
assert(inv3.newQty === 0, 'Inventory quantity floors at 0 to prevent negative physical stock');
assert(inv3.isLowStock === true, 'Out of stock condition correctly flagged as low stock');

// ----------------------------------------------------
// 3. Time Log Aggregation & Nested Task Rollups
// ----------------------------------------------------
console.log('\nTest Group 3: Time Tracking & Task Hour Rollup Engine');

function aggregateTimeLogs(logs) {
  let totalHours = 0;
  let billableHours = 0;
  let nonBillableHours = 0;
  let totalLaborCost = 0;

  for (const log of logs) {
    const hours = Number(log.hoursLogged || 0);
    const rate = Number(log.hourlyRate || 0);
    totalHours += hours;

    if (log.isBillable !== false) {
      billableHours += hours;
    } else {
      nonBillableHours += hours;
    }

    totalLaborCost += hours * rate;
  }

  return {
    totalHours: Number(totalHours.toFixed(2)),
    billableHours: Number(billableHours.toFixed(2)),
    nonBillableHours: Number(nonBillableHours.toFixed(2)),
    totalLaborCost: Number(totalLaborCost.toFixed(2)),
    logCount: logs.length,
  };
}

const mockTimeLogs = [
  { hoursLogged: 4.5, isBillable: true, hourlyRate: 150 },
  { hoursLogged: 2.0, isBillable: true, hourlyRate: 150 },
  { hoursLogged: 1.5, isBillable: false, hourlyRate: 100 },
];

const timeSummary = aggregateTimeLogs(mockTimeLogs);
assert(timeSummary.totalHours === 8.0, 'Total hours summed accurately (4.5 + 2.0 + 1.5 = 8.0h)');
assert(timeSummary.billableHours === 6.5, 'Billable hours isolated correctly (4.5 + 2.0 = 6.5h)');
assert(timeSummary.nonBillableHours === 1.5, 'Non-billable hours isolated correctly (1.5h)');
assert(timeSummary.totalLaborCost === 1125, 'Total labor cost computed (6.5 * 150 + 1.5 * 100 = 1125)');

// Nested hierarchy rollups
const parentTaskDirectLogs = [{ hoursLogged: 3.0, isBillable: true, hourlyRate: 120 }];
const childTask1Hours = 8.0;
const childTask2Hours = 5.5;
const parentTotalRolledUpHours = aggregateTimeLogs(parentTaskDirectLogs).totalHours + childTask1Hours + childTask2Hours;
assert(parentTotalRolledUpHours === 16.5, 'Parent task rolls up direct hours + child sub-tasks (3.0 + 8.0 + 5.5 = 16.5h)');

// ----------------------------------------------------
// 4. Milestone Progression & Auto-Transition
// ----------------------------------------------------
console.log('\nTest Group 4: Milestone Progress & Auto-Transition Engine');

function calculateMilestoneProgress(tasks) {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      completionPercentage: 0,
      status: 'pending',
    };
  }

  let completedTasks = 0;
  let inProgressTasks = 0;

  for (const task of tasks) {
    const status = String(task.status || '').toLowerCase();
    if (status === 'done' || status === 'completed') {
      completedTasks++;
    } else if (status === 'in_progress' || status === 'review') {
      inProgressTasks++;
    }
  }

  const completionPercentage = Number(((completedTasks / totalTasks) * 100).toFixed(1));

  let status = 'pending';
  if (completedTasks === totalTasks) {
    status = 'completed';
  } else if (completedTasks > 0 || inProgressTasks > 0) {
    status = 'in_progress';
  }

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    completionPercentage,
    status,
  };
}

const milestoneTasksPending = [
  { status: 'todo' },
  { status: 'todo' },
  { status: 'todo' },
];
const m1 = calculateMilestoneProgress(milestoneTasksPending);
assert(m1.completionPercentage === 0, 'Pending milestone has 0% completion');
assert(m1.status === 'pending', 'Status remains pending when no tasks started');

const milestoneTasksInProgress = [
  { status: 'done' },
  { status: 'in_progress' },
  { status: 'todo' },
  { status: 'todo' },
];
const m2 = calculateMilestoneProgress(milestoneTasksInProgress);
assert(m2.completionPercentage === 25.0, '25% completion for 1 of 4 completed tasks');
assert(m2.status === 'in_progress', 'Milestone auto-transitions to in_progress');

const milestoneTasksCompleted = [
  { status: 'done' },
  { status: 'done' },
  { status: 'done' },
];
const m3 = calculateMilestoneProgress(milestoneTasksCompleted);
assert(m3.completionPercentage === 100.0, '100% completion when all tasks are done');
assert(m3.status === 'completed', 'Milestone auto-transitions to completed');

// ----------------------------------------------------
// 5. Gantt Dependency DAG & Cycle Detection
// ----------------------------------------------------
console.log('\nTest Group 5: Gantt Task Dependency DAG & Cycle Detection');

function detectCyclicDependencies(tasks) {
  const adjList = new Map();
  const inDegree = new Map();

  for (const task of tasks) {
    adjList.set(task.id, []);
    inDegree.set(task.id, 0);
  }

  for (const task of tasks) {
    const preds = task.predecessorTaskIds || [];
    for (const predId of preds) {
      if (adjList.has(predId)) {
        adjList.get(predId).push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    }
  }

  const queue = [];
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) {
      queue.push(taskId);
    }
  });

  const topologicalOrder = [];

  while (queue.length > 0) {
    const current = queue.shift();
    topologicalOrder.push(current);

    const neighbors = adjList.get(current) || [];
    for (const neighbor of neighbors) {
      const nextDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  const hasCycle = topologicalOrder.length !== tasks.length;
  const cycleNodes = [];
  if (hasCycle) {
    inDegree.forEach((degree, taskId) => {
      if (degree > 0) {
        cycleNodes.push(taskId);
      }
    });
  }

  return {
    isValid: !hasCycle,
    hasCycle,
    cycleNodes,
    topologicalOrder,
  };
}

// Valid linear workflow: Task A -> Task B -> Task C
const validChain = [
  { id: 'task-a', predecessorTaskIds: [] },
  { id: 'task-b', predecessorTaskIds: ['task-a'] },
  { id: 'task-c', predecessorTaskIds: ['task-b'] },
];
const validRes = detectCyclicDependencies(validChain);
assert(validRes.isValid === true, 'Linear dependency chain is valid');
assert(validRes.hasCycle === false, 'No cycles detected in linear chain');
assert(validRes.topologicalOrder.join('->') === 'task-a->task-b->task-c', 'Topological execution order resolved (A -> B -> C)');

// Circular blocking dependency: Task 1 -> Task 2 -> Task 3 -> Task 1
const circularChain = [
  { id: 'task-1', predecessorTaskIds: ['task-3'] },
  { id: 'task-2', predecessorTaskIds: ['task-1'] },
  { id: 'task-3', predecessorTaskIds: ['task-2'] },
];
const cycleRes = detectCyclicDependencies(circularChain);
assert(cycleRes.isValid === false, 'Circular dependency graph flagged as invalid');
assert(cycleRes.hasCycle === true, 'Cycle detected in circular task predecessor chain');
assert(cycleRes.cycleNodes.length === 3, 'All 3 blocked cycle nodes identified (task-1, task-2, task-3)');

// ----------------------------------------------------
// Final Summary
// ----------------------------------------------------
console.log('\n======================================================');
console.log(`📊 CATALOG & PROJECTS TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
