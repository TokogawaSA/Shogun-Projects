# Graph Report - Shogun Projects  (2026-08-26)

## Corpus Check
- 190 files · ~138,114 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1087 nodes · 2234 edges · 60 communities (47 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9062be71`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuthContext.tsx
- crm.ts
- index.js
- index.ts
- devDependencies
- scripts
- useFirestoreCRM.ts
- compilerOptions
- App.tsx
- settings.ts
- dependencies
- compilerOptions
- useAuth
- LayoutEditor.tsx
- settingsRoutes.tsx
- test-logic.js
- SettingsLayout.tsx
- serve-dist.js
- AutoNumberingConfig.tsx
- helmet
- CommunicationViews.tsx
- ProfileMatrixTable.tsx
- express-rate-limit
- nodemailer
- zod
- useAuth
- vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs
- EntityDetailView.tsx
- dependencies
- devDependencies
- inventoryService.ts
- app.ts
- index.ts
- test-phase3-api-socket-mcp.js
- DynamicFieldRenderer.tsx
- milestones.ts
- timeRollups.ts
- email.ts
- engine.ts
- scripts
- Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition
- convertLead.ts
- timeRollup.ts
- test-crm-conversion.js
- package.json
- risks.ts
- auth.ts
- inboundLeadWebhook.ts
- onDealStageUpdated.ts
- graphify.md
- graphify.md
- server.js
- package-cpanel.js
- migrate.js
- cron-trigger.sh

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 67 edges
2. `doc()` - 53 edges
3. `collection()` - 39 edges
4. `db` - 31 edges
5. `setDoc()` - 31 edges
6. `updateDoc()` - 29 edges
7. `serverTimestamp()` - 26 edges
8. `Task` - 24 edges
9. `onSnapshot()` - 23 edges
10. `Project` - 21 edges

## Surprising Connections (you probably didn't know these)
- `ProjectsPage()` --references--> `react`  [EXTRACTED]
  src/pages/ProjectsPage.tsx → package.json
- `DynamicFieldRendererProps` --references--> `FieldDefinition`  [EXTRACTED]
  src/modules/crm/components/DynamicFieldRenderer.tsx → src/types/crmEntities.ts
- `handleShutdown()` --calls--> `disconnectDatabase()`  [EXTRACTED]
  server/src/index.ts → server/src/config/db.ts
- `updateDeal()` --calls--> `updateDealWithEvents()`  [EXTRACTED]
  server/src/controllers/crmController.ts → server/src/services/dealService.ts
- `updateTask()` --calls--> `updateTaskWithEvents()`  [EXTRACTED]
  server/src/controllers/projectController.ts → server/src/services/taskService.ts

## Import Cycles
- None detected.

## Communities (60 total, 13 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.11
Nodes (9): Account360Summary, DealData, ProjectData, ConvertLeadModal(), ConvertLeadModalProps, UseEntityRecordResult, ProjectsPage(), api (+1 more)

### Community 1 - "crm.ts"
Cohesion: 0.15
Nodes (22): ProjectContext, ProjectContextType, ProjectProviderProps, Account360Drawer(), Account360DrawerProps, ConvertDealModal(), ConvertDealModalProps, DealKanbanBoard() (+14 more)

### Community 2 - "index.js"
Cohesion: 0.06
Nodes (50): authLimiter, createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks(), getProductById(), getProducts() (+42 more)

### Community 3 - "index.ts"
Cohesion: 0.11
Nodes (16): db, manageInventoryDeduction, db, evaluateClientHealth, db, onTaskStatusChange, AccountContextSummary, generateTasksFromMeetingNotes() (+8 more)

### Community 4 - "devDependencies"
Cohesion: 0.17
Nodes (21): convertLead(), createAccount(), createContact(), createDeal(), createLead(), deleteAccount(), deleteContact(), deleteDeal() (+13 more)

### Community 5 - "scripts"
Cohesion: 0.07
Nodes (29): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, nodemailer, shogun-projects, devDependencies (+21 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.08
Nodes (39): ExpenseManager(), FinancialDashboard(), ProjectBudgetTracker(), ExtendedBudgetSummary, PortfolioFinancialTotals, useFinancials(), UseFinancialsReturn, PortfolioAnalyticsSummary (+31 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 9 - "settings.ts"
Cohesion: 0.14
Nodes (18): TaskCardProps, TaskDetailModal(), TaskDetailModalProps, AuthContextType, DependencyConflict, DependencyManager(), DependencyManagerProps, SubTaskItem() (+10 more)

### Community 10 - "dependencies"
Cohesion: 0.07
Nodes (27): Account, AccountEntityType, AccountRating, Contact, CRMEntity, CRMFieldType, Deal, DealEntityType (+19 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compileOnSave, compilerOptions, module, moduleResolution, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck (+5 more)

### Community 12 - "useAuth"
Cohesion: 0.04
Nodes (48): autoprefixer, axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react (+40 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.06
Nodes (55): app, disconnectDatabase(), createRedisConnection(), disconnectRedis(), getRedisClient(), redisConnectionOptions, handleGenerateTasks(), handleSummarizeAccount() (+47 more)

### Community 15 - "test-logic.js"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.28
Nodes (6): SettingsHeader(), SettingsHeaderProps, SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 17 - "serve-dist.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 18 - "AutoNumberingConfig.tsx"
Cohesion: 0.17
Nodes (17): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+9 more)

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 22 - "express-rate-limit"
Cohesion: 0.05
Nodes (115): statusOrder, TaskCard(), AuthContext, AuthProviderProps, TenantInfo, useAuth(), RealtimeRoomOptions, useRealtimeRoom() (+107 more)

### Community 23 - "nodemailer"
Cohesion: 0.11
Nodes (27): CatalogListView(), CatalogStats, DEFAULT_MOCK_PRICE_BOOKS, DEFAULT_MOCK_PRODUCTS, useCatalog(), UseCatalogReturn, LineItemEditor(), LineItemEditorProps (+19 more)

### Community 28 - "zod"
Cohesion: 0.16
Nodes (13): App(), AppLayout(), Header(), Sidebar(), AuthProvider(), ProjectProvider(), queryClient, DashboardPage() (+5 more)

### Community 30 - "vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs"
Cohesion: 0.10
Nodes (19): dist, node_modules, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+11 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.67
Nodes (3): EntityBlocksViewer(), EntityBlocksViewerProps, BlockLayout

### Community 32 - "dependencies"
Cohesion: 0.05
Nodes (39): bcryptjs, bullmq, cors, dotenv, express, express-rate-limit, helmet, ioredis (+31 more)

### Community 33 - "devDependencies"
Cohesion: 0.05
Nodes (36): nodemon, prisma, devDependencies, nodemon, prisma, tsx, @types/bcryptjs, @types/cors (+28 more)

### Community 34 - "inventoryService.ts"
Cohesion: 0.16
Nodes (12): adjustProductInventory, calculateLineItemsPricing, CalculatePricingRequest, db, InventoryAdjustmentRequest, InventoryAdjustmentResponse, onProductWritten, calculatePricingBreakdown() (+4 more)

### Community 35 - "app.ts"
Cohesion: 0.18
Nodes (13): fallbackAccounts, UseAccountsResult, fallbackContacts, UseContactsResult, Account, AccountStatus, AccountTier, BillingDetails (+5 more)

### Community 36 - "index.ts"
Cohesion: 0.29
Nodes (10): columns, initialFallbackTasks, KanbanBoard(), ProjectHeader(), useProject(), useFirestoreTasks, UseFirestoreTasksResult, useTasks() (+2 more)

### Community 37 - "test-phase3-api-socket-mcp.js"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.29
Nodes (8): DynamicFieldRenderer(), DynamicFieldRendererProps, formatDate(), getBadgeClasses(), toInputDate(), InlineEditWrapper(), InlineEditWrapperProps, PicklistOption

### Community 39 - "milestones.ts"
Cohesion: 0.25
Nodes (7): calculateMilestoneProgress(), DependencyValidationResult, MilestoneProgressResult, onTaskMilestoneSync, syncMilestoneStatus(), TaskDependencyNode, validateProjectGanttDependencies

### Community 40 - "timeRollups.ts"
Cohesion: 0.29
Nodes (7): aggregateTimeLogs(), db, logTaskTime, LogTaskTimeRequest, onTimeLogWritten, recalculateTaskHours(), TaskTimeAggregationResult

### Community 41 - "email.ts"
Cohesion: 0.25
Nodes (7): saveEmailCredentials, SaveEmailCredentialsRequest, SaveEmailCredentialsResponse, SmtpConfigInput, testEmailConnection, TestEmailConnectionRequest, TestEmailConnectionResponse

### Community 42 - "engine.ts"
Cohesion: 0.48
Nodes (6): evaluateCondition(), executeSendEmailAction(), executeWorkflowEngine, getFieldValue(), resolveTokens(), VALID_WORKFLOW_MODULES

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 45 - "convertLead.ts"
Cohesion: 0.40
Nodes (4): convertLead, ConvertLeadPayload, ConvertLeadResult, db

### Community 48 - "package.json"
Cohesion: 0.40
Nodes (5): AccountEntity, BaseCRMEntity, ContactEntity, DealEntity, LeadEntity

### Community 50 - "auth.ts"
Cohesion: 0.50
Nodes (3): setUserCustomClaims, SetUserCustomClaimsRequest, SetUserCustomClaimsResponse

### Community 58 - "server.js"
Cohesion: 0.40
Nodes (3): __dirname, __filename, server

### Community 60 - "package-cpanel.js"
Cohesion: 0.13
Nodes (14): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, rootDir (+6 more)

### Community 71 - "migrate.js"
Cohesion: 0.40
Nodes (4): __dirname, __filename, safeTarget, serverDir

## Knowledge Gaps
- **357 isolated node(s):** `name`, `build`, `build:watch`, `serve`, `shell` (+352 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `express-rate-limit` to `AuthContext.tsx`, `crm.ts`, `index.ts`, `useFirestoreCRM.ts`, `SettingsLayout.tsx`, `zod`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `ProjectsPage()` connect `AuthContext.tsx` to `zod`, `useAuth`, `express-rate-limit`, `index.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `name`, `build`, `build:watch` to the rest of the system?**
  _357 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.058469945355191254 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._