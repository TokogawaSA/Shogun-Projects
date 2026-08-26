# Graph Report - Shogun Projects  (2026-08-26)

## Corpus Check
- 165 files · ~123,241 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 912 nodes · 1736 edges · 47 communities (39 shown, 8 thin omitted)
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
- test-phase3-api-socket-mcp.js
- DynamicFieldRenderer.tsx
- scripts
- Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition
- test-crm-conversion.js
- graphify.md
- graphify.md
- server.js
- package-cpanel.js
- migrate.js
- cron-trigger.sh

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 61 edges
2. `apiClient` - 47 edges
3. `Task` - 24 edges
4. `Project` - 21 edges
5. `withTenantTx()` - 16 edges
6. `EntityModuleName` - 16 edges
7. `compilerOptions` - 16 edges
8. `createRedisConnection()` - 14 edges
9. `compilerOptions` - 13 edges
10. `useProject()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ProjectsPage()` --references--> `react`  [EXTRACTED]
  src/pages/ProjectsPage.tsx → package.json
- `DynamicFieldRendererProps` --references--> `FieldDefinition`  [EXTRACTED]
  src/modules/crm/components/DynamicFieldRenderer.tsx → src/types/crmEntities.ts
- `EntityHeaderProps` --references--> `EntityModuleName`  [EXTRACTED]
  src/modules/crm/components/EntityHeader.tsx → src/types/crmEntities.ts
- `EntitySummaryWidgetProps` --references--> `EntityModuleName`  [EXTRACTED]
  src/modules/crm/components/EntitySummaryWidget.tsx → src/types/crmEntities.ts
- `RelatedListsNavProps` --references--> `EntityModuleName`  [EXTRACTED]
  src/modules/crm/components/RelatedListsNav.tsx → src/types/crmEntities.ts

## Import Cycles
- None detected.

## Communities (47 total, 8 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.13
Nodes (6): Account360Summary, DealData, ProjectData, UseEntityRecordResult, api, apiClient

### Community 1 - "crm.ts"
Cohesion: 0.12
Nodes (30): Account360Drawer(), Account360DrawerProps, ConvertDealModal(), ConvertDealModalProps, DealKanbanBoard(), StageColumnConfig, stageConfigs, stageOrder (+22 more)

### Community 2 - "index.js"
Cohesion: 0.06
Nodes (41): app, authLimiter, disconnectDatabase(), createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks() (+33 more)

### Community 3 - "index.ts"
Cohesion: 0.13
Nodes (16): ProfileMatrixTable(), RoleHierarchyTree(), CallWebhookActionPayload, CreateTaskActionPayload, EmailProvider, FieldName, FieldPermissionLevel, ModuleCrudPermissions (+8 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (23): convertLead(), createAccount(), createContact(), createDeal(), createLead(), deleteAccount(), deleteContact(), deleteDeal() (+15 more)

### Community 5 - "scripts"
Cohesion: 0.21
Nodes (12): EntityLookupModal(), EntityLookupModalProps, MassEditModal(), MassEditModalProps, EntityEditView(), EntityListView(), FALLBACK_SEEDS, MODULE_SCHEMAS (+4 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.08
Nodes (40): ExpenseManager(), FinancialDashboard(), ProjectBudgetTracker(), ExtendedBudgetSummary, PortfolioFinancialTotals, useFinancials(), UseFinancialsReturn, PortfolioAnalyticsSummary (+32 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 9 - "settings.ts"
Cohesion: 0.16
Nodes (12): ConvertLeadModal(), ConvertLeadModalProps, EntityHeader(), EntityHeaderProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps, RelatedListsNav() (+4 more)

### Community 10 - "dependencies"
Cohesion: 0.07
Nodes (32): Account, AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, Contact, ContactEntity, CRMEntity (+24 more)

### Community 11 - "compilerOptions"
Cohesion: 0.27
Nodes (8): WorkflowBuilderModal(), WorkflowBuilderModalProps, WorkflowListView(), ConditionOperator, WorkflowAction, WorkflowCondition, WorkflowRule, WorkflowTriggerType

### Community 12 - "useAuth"
Cohesion: 0.04
Nodes (48): autoprefixer, axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react (+40 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.06
Nodes (57): createRedisConnection(), disconnectRedis(), getRedisClient(), redisConnectionOptions, handleGenerateTasks(), handleSummarizeAccount(), addTimeLog(), createMilestone() (+49 more)

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.16
Nodes (11): HubCardProps, SettingsHub(), DataSharingRulesView(), ScheduledCronView(), WebhooksGatewayView(), NotificationDispatcherView(), PicklistManagerView(), AuditTrailView() (+3 more)

### Community 15 - "test-logic.js"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.40
Nodes (4): SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 17 - "serve-dist.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 18 - "AutoNumberingConfig.tsx"
Cohesion: 0.12
Nodes (22): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+14 more)

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 22 - "express-rate-limit"
Cohesion: 0.06
Nodes (47): App(), AppLayout(), KanbanBoard(), ProjectHeader(), Header(), Sidebar(), AuthContext, AuthContextType (+39 more)

### Community 23 - "nodemailer"
Cohesion: 0.08
Nodes (47): columns, initialFallbackTasks, statusOrder, TaskCard(), TaskCardProps, TaskDetailModal(), TaskDetailModalProps, UseTasksResult (+39 more)

### Community 28 - "zod"
Cohesion: 0.25
Nodes (7): LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, CustomField, FieldType, LayoutBlock, ModuleSchema

### Community 29 - "useAuth"
Cohesion: 0.29
Nodes (5): EmailTemplateEditor(), ModuleManagerView(), ActiveModules, EmailTemplate, SupportedModule

### Community 30 - "vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs"
Cohesion: 0.10
Nodes (19): dist, node_modules, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+11 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.50
Nodes (3): AutoNumberingConfigView(), AutoNumberingConfig, AutoNumberingRule

### Community 32 - "dependencies"
Cohesion: 0.05
Nodes (39): bcryptjs, bullmq, cors, dotenv, express, express-rate-limit, helmet, ioredis (+31 more)

### Community 33 - "devDependencies"
Cohesion: 0.05
Nodes (36): nodemon, prisma, devDependencies, nodemon, prisma, tsx, @types/bcryptjs, @types/cors (+28 more)

### Community 37 - "test-phase3-api-socket-mcp.js"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.23
Nodes (10): DynamicFieldRenderer(), DynamicFieldRendererProps, formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper() (+2 more)

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

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
- **287 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+282 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `express-rate-limit` to `crm.ts`, `inventoryService.ts`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `settings.ts`, `compilerOptions`, `nodemailer`, `zod`, `useAuth`, `EntityDetailView.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `ProjectsPage()` connect `express-rate-limit` to `useAuth`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `react` connect `useAuth` to `express-rate-limit`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _287 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13157894736842105 - nodes in this community are weakly interconnected._
- **Should `crm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12091038406827881 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._