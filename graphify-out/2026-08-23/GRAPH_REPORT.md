# Graph Report - Shogun Projects  (2026-08-23)

## Corpus Check
- 173 files · ~135,615 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 930 nodes · 1755 edges · 74 communities (62 shown, 12 thin omitted)
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
- EmailTemplateEditor.tsx
- AccessViews.tsx
- CommunicationViews.tsx
- ProfileMatrixTable.tsx
- firebase.ts
- vite.config.ts.timestamp-1787002008127-86f7de7dde652.mjs
- vite.config.ts.timestamp-1787073889189-1c2e905b7f3eb.mjs
- vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs
- EntityDetailView.tsx
- dependencies
- devDependencies
- inventoryService.ts
- DynamicFieldRenderer.tsx
- EntityListView.tsx
- api.ts
- WorkflowBuilderModal.tsx
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
- jsonwebtoken
- @types/bcryptjs
- server.js
- package-cpanel.js
- scripts
- package.json
- lucide-react
- @types/react-dom
- firebase.ts
- EntityEditView.tsx
- GanttChart.tsx
- AuthContext.tsx
- TaskDetailDrawer.tsx
- EmailTemplateEditor.tsx
- migrate.js
- @types/express
- cron-trigger.sh

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 69 edges
2. `db` - 31 edges
3. `Task` - 25 edges
4. `Project` - 22 edges
5. `useProject()` - 17 edges
6. `EntityModuleName` - 16 edges
7. `compilerOptions` - 16 edges
8. `apiClient` - 14 edges
9. `compilerOptions` - 13 edges
10. `TaskStatus` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ProjectsPage()` --references--> `react`  [EXTRACTED]
  src/components/projects/ProjectsPage.tsx → package.json
- `UserManagementView()` --calls--> `useAuth()`  [EXTRACTED]
  src/modules/settings/views/AccessViews.tsx → src/context/AuthContext.tsx
- `EntityLookupModalProps` --references--> `EntityModuleName`  [EXTRACTED]
  src/modules/crm/components/EntityLookupModal.tsx → src/types/crmEntities.ts
- `DependencyManagerProps` --references--> `Task`  [EXTRACTED]
  src/modules/projects/gantt/DependencyManager.tsx → src/types/index.ts
- `TaskDetailDrawerProps` --references--> `Task`  [EXTRACTED]
  src/modules/projects/tasks/TaskDetailDrawer.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (74 total, 12 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.18
Nodes (21): columns, initialFallbackTasks, statusOrder, TaskCard(), TaskCardProps, TaskDetailModal(), TaskDetailModalProps, UseFirestoreTasksResult (+13 more)

### Community 1 - "crm.ts"
Cohesion: 0.09
Nodes (45): ConvertDealModal(), ConvertDealModalProps, CRMDirectory(), DirectoryTab, DealPipeline(), StageColumnConfig, stageConfigs, stageOrder (+37 more)

### Community 2 - "index.js"
Cohesion: 0.06
Nodes (51): app, authLimiter, disconnectDatabase(), createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks() (+43 more)

### Community 3 - "index.ts"
Cohesion: 0.11
Nodes (16): db, manageInventoryDeduction, db, evaluateClientHealth, db, onTaskStatusChange, AccountContextSummary, generateTasksFromMeetingNotes() (+8 more)

### Community 4 - "devDependencies"
Cohesion: 0.12
Nodes (17): antd, axios, clsx, firebase, dependencies, antd, axios, clsx (+9 more)

### Community 5 - "scripts"
Cohesion: 0.07
Nodes (29): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, nodemailer, shogun-projects, devDependencies (+21 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.08
Nodes (40): ExpenseManager(), FinancialDashboard(), ProjectBudgetTracker(), ExtendedBudgetSummary, PortfolioFinancialTotals, useFinancials(), UseFinancialsReturn, PortfolioAnalyticsSummary (+32 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 8 - "App.tsx"
Cohesion: 0.11
Nodes (18): App(), AppLayout(), Header(), Sidebar(), AuthProvider(), ProjectProvider(), MilestoneTracker(), ProjectCosting() (+10 more)

### Community 9 - "settings.ts"
Cohesion: 0.14
Nodes (15): ProfileMatrixTable(), AutoNumberingConfigView(), AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload, CreateTaskActionPayload, FieldName, FieldPermissionLevel (+7 more)

### Community 10 - "dependencies"
Cohesion: 0.07
Nodes (31): Account, AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, Contact, ContactEntity, CRMEntity (+23 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compileOnSave, compilerOptions, module, moduleResolution, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck (+5 more)

### Community 12 - "useAuth"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, typescript (+9 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.18
Nodes (8): LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, PicklistManagerView(), CustomField, FieldType, LayoutBlock, ModuleSchema

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.21
Nodes (8): HubCardProps, SettingsHub(), ScheduledCronView(), WebhooksGatewayView(), AuditTrailView(), CompanyBrandingView(), CurrencyFiscalView(), CompanyDetails

### Community 15 - "test-logic.js"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.28
Nodes (6): SettingsHeader(), SettingsHeaderProps, SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 17 - "serve-dist.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 18 - "EmailTemplateEditor.tsx"
Cohesion: 0.33
Nodes (3): NotificationDispatcherView(), EmailProvider, EmailTemplate

### Community 19 - "AccessViews.tsx"
Cohesion: 0.33
Nodes (3): DataSharingRulesView(), UserManagementView(), ModuleName

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 22 - "firebase.ts"
Cohesion: 0.50
Nodes (3): auth, db, firebaseConfig

### Community 28 - "vite.config.ts.timestamp-1787002008127-86f7de7dde652.mjs"
Cohesion: 0.13
Nodes (20): CatalogListView(), CatalogStats, DEFAULT_MOCK_PRICE_BOOKS, DEFAULT_MOCK_PRODUCTS, useCatalog(), UseCatalogReturn, LineItemEditor(), LineItemEditorProps (+12 more)

### Community 29 - "vite.config.ts.timestamp-1787073889189-1c2e905b7f3eb.mjs"
Cohesion: 0.19
Nodes (16): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+8 more)

### Community 30 - "vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs"
Cohesion: 0.10
Nodes (19): dist, node_modules, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+11 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.17
Nodes (14): ConvertLeadModal(), ConvertLeadModalProps, EntityHeader(), EntityHeaderProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps, RelatedListsNav() (+6 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (17): bcryptjs, cors, dotenv, express, express-rate-limit, helmet, @prisma/client, dependencies (+9 more)

### Community 33 - "devDependencies"
Cohesion: 0.12
Nodes (17): nodemon, prisma, devDependencies, nodemon, prisma, tsx, @types/bcryptjs, @types/cors (+9 more)

### Community 34 - "inventoryService.ts"
Cohesion: 0.16
Nodes (12): adjustProductInventory, calculateLineItemsPricing, CalculatePricingRequest, db, InventoryAdjustmentRequest, InventoryAdjustmentResponse, onProductWritten, calculatePricingBreakdown() (+4 more)

### Community 35 - "DynamicFieldRenderer.tsx"
Cohesion: 0.26
Nodes (9): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper(), InlineEditWrapperProps (+1 more)

### Community 36 - "EntityListView.tsx"
Cohesion: 0.31
Nodes (7): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, FALLBACK_SEEDS, MODULE_SCHEMAS, FieldDefinition, PicklistOption

### Community 37 - "api.ts"
Cohesion: 0.22
Nodes (16): addTimeLog(), createMilestone(), createProject(), createTask(), deleteMilestone(), deleteProject(), deleteTask(), getMilestones() (+8 more)

### Community 38 - "WorkflowBuilderModal.tsx"
Cohesion: 0.27
Nodes (8): WorkflowBuilderModal(), WorkflowBuilderModalProps, WorkflowListView(), ConditionOperator, WorkflowAction, WorkflowCondition, WorkflowRule, WorkflowTriggerType

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

### Community 43 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, migrate, passenger, prisma:generate, prisma:validate, start (+1 more)

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (cPanel Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 45 - "convertLead.ts"
Cohesion: 0.40
Nodes (4): convertLead, ConvertLeadPayload, ConvertLeadResult, db

### Community 48 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 50 - "auth.ts"
Cohesion: 0.50
Nodes (3): setUserCustomClaims, SetUserCustomClaimsRequest, SetUserCustomClaimsResponse

### Community 56 - "@types/bcryptjs"
Cohesion: 0.26
Nodes (13): KanbanBoard(), ProjectHeader(), ProjectsPage(), useAuth(), ProjectContext, ProjectContextType, ProjectProviderProps, useProject() (+5 more)

### Community 58 - "server.js"
Cohesion: 0.40
Nodes (3): __dirname, __filename, server

### Community 60 - "package-cpanel.js"
Cohesion: 0.13
Nodes (14): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, rootDir (+6 more)

### Community 61 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:all, dev, package:cpanel, preview, test, typecheck

### Community 62 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 65 - "firebase.ts"
Cohesion: 0.20
Nodes (10): RoleHierarchyTree(), TenantUserRecord, UserManagementView(), OutgoingEmailConfig(), auth, db, firebaseConfig, functions (+2 more)

### Community 66 - "EntityEditView.tsx"
Cohesion: 0.31
Nodes (5): EntityLookupModal(), EntityLookupModalProps, EntityEditView(), EntityListView(), DEFAULT_MODULE_LAYOUTS

### Community 67 - "GanttChart.tsx"
Cohesion: 0.28
Nodes (6): DependencyConflict, DependencyManager(), DependencyManagerProps, GanttChart(), TaskDetailDrawer(), GanttPage()

### Community 68 - "AuthContext.tsx"
Cohesion: 0.38
Nodes (6): AuthContext, AuthContextType, AuthProviderProps, TenantInfo, UserProfile, UserRole

### Community 69 - "TaskDetailDrawer.tsx"
Cohesion: 0.43
Nodes (5): TaskDetailDrawerProps, TimeTrackerWidget(), TimeTrackerWidgetProps, RecurrenceRule, TimeLog

### Community 70 - "EmailTemplateEditor.tsx"
Cohesion: 0.33
Nodes (4): EmailTemplateEditor(), ModuleManagerView(), ActiveModules, SupportedModule

### Community 71 - "migrate.js"
Cohesion: 0.40
Nodes (4): __dirname, __filename, safeTarget, serverDir

## Knowledge Gaps
- **322 isolated node(s):** `name`, `build`, `build:watch`, `serve`, `shell` (+317 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `@types/bcryptjs` to `AuthContext.tsx`, `crm.ts`, `EntityEditView.tsx`, `GanttChart.tsx`, `AuthContext.tsx`, `EntityListView.tsx`, `useFirestoreCRM.ts`, `TaskDetailDrawer.tsx`, `App.tsx`, `settings.ts`, `firebase.ts`, `WorkflowBuilderModal.tsx`, `EmailTemplateEditor.tsx`, `LayoutEditor.tsx`, `SettingsLayout.tsx`, `AccessViews.tsx`, `vite.config.ts.timestamp-1787002008127-86f7de7dde652.mjs`, `EntityDetailView.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `ProjectsPage()` connect `@types/bcryptjs` to `App.tsx`, `devDependencies`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `react` connect `devDependencies` to `@types/bcryptjs`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `name`, `build`, `build:watch` to the rest of the system?**
  _322 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `crm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09234365867913501 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05704365079365079 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._