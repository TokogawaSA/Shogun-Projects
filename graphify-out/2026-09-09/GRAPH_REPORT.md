# Graph Report - Shogun Projects  (2026-09-01)

## Corpus Check
- 170 files · ~125,329 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 924 nodes · 1762 edges · 57 communities (49 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78703d0f`
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
- useCatalog.ts
- Project
- test-phase3-api-socket-mcp.js
- DynamicFieldRenderer.tsx
- settingsController.ts
- AuthContext.tsx
- EntityModuleName
- LineItemEditor.tsx
- scripts
- Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition
- GanttChart.tsx
- inspect-db.ts
- test-crm-conversion.js
- seed-and-test-crm.ts
- graphify.md
- graphify.md
- server.js
- package-cpanel.js
- migrate.js
- cron-trigger.sh

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 61 edges
2. `apiClient` - 45 edges
3. `Task` - 24 edges
4. `Project` - 21 edges
5. `withTenantTx()` - 16 edges
6. `EntityModuleName` - 16 edges
7. `compilerOptions` - 16 edges
8. `createRedisConnection()` - 14 edges
9. `useProject()` - 14 edges
10. `scripts` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ProjectsPage()` --references--> `react`  [EXTRACTED]
  src/pages/ProjectsPage.tsx → package.json
- `EntitySummaryWidgetProps` --references--> `EntityModuleName`  [EXTRACTED]
  src/modules/crm/components/EntitySummaryWidget.tsx → src/types/crmEntities.ts
- `ProjectClientBadgeProps` --references--> `Project`  [EXTRACTED]
  src/modules/crm/components/ProjectClientBadge.tsx → src/types/index.ts
- `RelatedListsNavProps` --references--> `EntityModuleName`  [EXTRACTED]
  src/modules/crm/components/RelatedListsNav.tsx → src/types/crmEntities.ts
- `DependencyManagerProps` --references--> `Task`  [EXTRACTED]
  src/modules/projects/gantt/DependencyManager.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (57 total, 8 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.18
Nodes (10): Account360Summary, UseEntityRecordResult, TaskDetailDrawerProps, TimeTrackerWidget(), TimeTrackerWidgetProps, TenantUserRecord, api, apiClient (+2 more)

### Community 1 - "crm.ts"
Cohesion: 0.11
Nodes (31): Account360Drawer(), Account360DrawerProps, ConvertDealModal(), ConvertDealModalProps, DealKanbanBoard(), StageColumnConfig, stageConfigs, stageOrder (+23 more)

### Community 2 - "index.js"
Cohesion: 0.06
Nodes (46): app, authLimiter, disconnectDatabase(), createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks() (+38 more)

### Community 3 - "index.ts"
Cohesion: 0.13
Nodes (17): ProfileMatrixTable(), AutoNumberingConfigView(), AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload, CreateTaskActionPayload, EmailProvider, FieldName (+9 more)

### Community 4 - "devDependencies"
Cohesion: 0.17
Nodes (22): convertLead(), createAccount(), createContact(), createDeal(), createLead(), deleteAccount(), deleteContact(), deleteDeal() (+14 more)

### Community 5 - "scripts"
Cohesion: 0.23
Nodes (9): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, EntityEditView(), EntityListView(), FALLBACK_SEEDS, MODULE_SCHEMAS, FieldDefinition (+1 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.08
Nodes (40): ExpenseManager(), FinancialDashboard(), ProjectBudgetTracker(), ExtendedBudgetSummary, PortfolioFinancialTotals, useFinancials(), UseFinancialsReturn, PortfolioAnalyticsSummary (+32 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 9 - "settings.ts"
Cohesion: 0.20
Nodes (10): ConvertLeadModal(), ConvertLeadModalProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps, RelatedListsNav(), RelatedListsNavProps, SubPanelTab (+2 more)

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
Cohesion: 0.08
Nodes (44): createRedisConnection(), disconnectRedis(), getRedisClient(), redisConnectionOptions, handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, GeneratedTasksResult (+36 more)

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.13
Nodes (13): RoleHierarchyTree(), HubCardProps, SettingsHub(), DataSharingRulesView(), ScheduledCronView(), WebhooksGatewayView(), NotificationDispatcherView(), PicklistManagerView() (+5 more)

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
Cohesion: 0.12
Nodes (22): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+14 more)

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 22 - "express-rate-limit"
Cohesion: 0.12
Nodes (19): AppLayout(), Header(), Sidebar(), useAuth(), RealtimeRoomOptions, useRealtimeRoom(), MilestoneTracker(), ProjectCosting() (+11 more)

### Community 23 - "nodemailer"
Cohesion: 0.18
Nodes (21): columns, initialFallbackTasks, statusOrder, TaskCard(), TaskCardProps, TaskDetailModal(), TaskDetailModalProps, UseTasksResult (+13 more)

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
Cohesion: 0.12
Nodes (15): @prisma/client, @prisma/client, extractCustomFields(), IdMapper, loadSourceDataset(), normalizeTimestamp(), prisma, runETLMigration() (+7 more)

### Community 32 - "dependencies"
Cohesion: 0.04
Nodes (44): bcryptjs, bullmq, cors, dotenv, express, express-rate-limit, helmet, ioredis (+36 more)

### Community 33 - "devDependencies"
Cohesion: 0.10
Nodes (21): nodemon, prisma, devDependencies, nodemon, prisma, tsx, @types/bcryptjs, @types/cors (+13 more)

### Community 35 - "useCatalog.ts"
Cohesion: 0.19
Nodes (14): CatalogListView(), CatalogStats, DEFAULT_MOCK_PRICE_BOOKS, DEFAULT_MOCK_PRODUCTS, useCatalog(), UseCatalogReturn, LineItemEditor(), PriceBookManager() (+6 more)

### Community 36 - "Project"
Cohesion: 0.29
Nodes (10): KanbanBoard(), ProjectHeader(), ProjectContext, ProjectContextType, ProjectProviderProps, useProject(), useTasks(), ProjectsPage() (+2 more)

### Community 37 - "test-phase3-api-socket-mcp.js"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.26
Nodes (9): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper(), InlineEditWrapperProps (+1 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.38
Nodes (11): createWorkflowRule(), deleteWorkflowRule(), getEmailConfig(), getEmailTemplates(), getModuleSchemas(), getProfiles(), getRoles(), getTenantId() (+3 more)

### Community 40 - "AuthContext.tsx"
Cohesion: 0.21
Nodes (10): App(), AuthContext, AuthContextType, AuthProvider(), AuthProviderProps, TenantInfo, ProjectProvider(), queryClient (+2 more)

### Community 41 - "EntityModuleName"
Cohesion: 0.33
Nodes (6): EntityHeader(), EntityHeaderProps, EntityLookupModal(), EntityLookupModalProps, DEFAULT_MODULE_LAYOUTS, EntityModuleName

### Community 42 - "LineItemEditor.tsx"
Cohesion: 0.39
Nodes (6): LineItemEditorProps, QuoteToProjectModal(), QuoteToProjectModalProps, LineItem, Quote, QuoteStatus

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 45 - "GanttChart.tsx"
Cohesion: 0.33
Nodes (5): DependencyConflict, DependencyManager(), DependencyManagerProps, GanttChart(), TaskDetailDrawer()

### Community 46 - "inspect-db.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, prisma

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, prisma

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
- **294 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `express-rate-limit` to `AuthContext.tsx`, `crm.ts`, `inventoryService.ts`, `index.ts`, `Project`, `scripts`, `useFirestoreCRM.ts`, `AuthContext.tsx`, `EntityModuleName`, `LineItemEditor.tsx`, `settings.ts`, `compilerOptions`, `GanttChart.tsx`, `settingsRoutes.tsx`, `SettingsLayout.tsx`, `nodemailer`, `zod`, `useAuth`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `ProjectsPage()` connect `Project` to `useAuth`, `express-rate-limit`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `react` connect `useAuth` to `Project`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `crm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1141025641025641 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059562841530054644 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12631578947368421 - nodes in this community are weakly interconnected._