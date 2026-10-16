# Graph Report - Shogun Projects  (2026-10-16)

## Corpus Check
- 209 files · ~157,717 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1267 nodes · 2450 edges · 86 communities (72 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `57ff6723`
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
- postcss.config.js
- vite-env.d.ts
- tailwind.config.js
- vite.config.ts
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
- ecosystem.config.cjs
- package.json
- test-crm-conversion.js
- package.json
- graphify.md
- graphify.md
- seed-and-test-crm.ts
- server.js
- test-phase3.ts
- server.js
- bcryptjs
- package-cpanel.js
- tailwindcss
- LineItemEditor.tsx
- zod
- helmet
- AdminWorkflowView.tsx
- RiskDeliverablesView.tsx
- WorkflowCanvas.tsx
- socket.io
- cron-trigger.sh
- EntityListView.tsx
- LayoutEditor.tsx
- scripts
- WorkflowBuilderModal.tsx
- package.json
- MultiAssigneeSelector.tsx
- EntityEditView.tsx
- @types/react-dom
- zod

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 53 edges
2. `apiClient` - 37 edges
3. `getTenantId()` - 23 edges
4. `Task` - 23 edges
5. `text()` - 21 edges
6. `frame()` - 20 edges
7. `badge()` - 18 edges
8. `withTenantTx()` - 18 edges
9. `getTenantId()` - 16 edges
10. `EntityModuleName` - 16 edges

## Surprising Connections (you probably didn't know these)
- `TaskCalendarView()` --references--> `react`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → package.json
- `WebFormBuilderModal()` --indirect_call--> `text()`  [INFERRED]
  src/modules/settings/forms/WebFormBuilderModal.tsx → scripts/generate_pen_designs.cjs
- `UniversalViewBar()` --references--> `react`  [EXTRACTED]
  src/components/views/UniversalViewBar.tsx → package.json
- `HierarchyProvider()` --references--> `react`  [EXTRACTED]
  src/context/HierarchyContext.tsx → package.json
- `TaskMindMapViewProps` --references--> `Task`  [EXTRACTED]
  src/components/views/TaskMindMapView.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (86 total, 14 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.07
Nodes (44): authLimiter, createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks(), getProductById(), getProducts() (+36 more)

### Community 1 - "crm.ts"
Cohesion: 0.17
Nodes (11): AuditTrailEntry, ExpenseCategory, ExpenseEntry, ExpenseStatus, Portfolio, ProjectBudget, ResourceProfile, RiskCategory (+3 more)

### Community 2 - "index.js"
Cohesion: 0.25
Nodes (9): ALL_VIEW_TABS, UniversalViewBarProps, ViewFilterState, ViewGroupBy, ViewMode, ViewSortState, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER (+1 more)

### Community 3 - "index.ts"
Cohesion: 0.11
Nodes (33): ProjectContext, ProjectContextType, ProjectProviderProps, Account360Drawer(), Account360DrawerProps, ConvertDealModal(), DealKanbanBoard(), StageColumnConfig (+25 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (32): Account, AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, Contact, ContactEntity, CRMEntity (+24 more)

### Community 5 - "scripts"
Cohesion: 0.15
Nodes (31): COLOR_OPTIONS, ColumnConfigModal(), ColumnConfigModalProps, CreateTaskModal(), CreateTaskModalProps, COLUMN_COLORS, PRIORITY_META, ProjectBoard() (+23 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.11
Nodes (19): ProfileMatrixTable(), EmailTemplateEditor(), AutoNumberingConfigView(), AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload, CreateTaskActionPayload, EmailProvider (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.13
Nodes (14): AdvancedRecurrenceModalProps, DEFAULT_RECURRENCE, CustomFieldsPanelProps, DEFAULT_DEFINITIONS, TaskDependenciesPanelProps, AdvancedRecurrenceConfig, CustomFieldDefinition, CustomFieldOption (+6 more)

### Community 8 - "App.tsx"
Cohesion: 0.26
Nodes (10): projectManagementService, ClientChangeRequestItem, CriticalPathData, PmAnalyticsMetrics, ProjectDocumentItem, ProjectInvoiceItem, ResourceWorkloadItem, TimesheetItem (+2 more)

### Community 9 - "settings.ts"
Cohesion: 0.11
Nodes (6): hierarchicalSample, mockSpaces, mockTasks, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER, STATUS_BUCKET_DEFS

### Community 10 - "dependencies"
Cohesion: 0.15
Nodes (19): LinearRuleBuilderProps, ConditionOperator, SupportedModule, WorkflowAction, WorkflowCondition, WorkflowTriggerType, WorkflowActionCallWebhookData, WorkflowActionCreateRecordData (+11 more)

### Community 11 - "compilerOptions"
Cohesion: 0.13
Nodes (19): aecService, AecDiscipline, AecPhase, AecStaffRole, AecTask, DrawingSheet, FeeModel, NetMultiplierReport (+11 more)

### Community 12 - "useAuth"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.13
Nodes (29): FormSubmissionsModal(), FormSubmissionsModalProps, WebFormBuilderModal(), WebFormBuilderModalProps, WebFormsManagementView(), PublicWebFormPage(), addStoredSubmission(), DEFAULT_ENTERPRISE_FORMS (+21 more)

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.13
Nodes (17): CreateTaskModalProps, DEFAULT_STATUS_COLUMNS, KanbanBoardProps, statusOrder, TaskCard(), TaskCardProps, TaskCalendarView(), TaskCalendarViewProps (+9 more)

### Community 15 - "test-logic.js"
Cohesion: 0.13
Nodes (13): ModuleManagerView(), HubCardProps, SettingsHub(), DataSharingRulesView(), ScheduledCronView(), WebhooksGatewayView(), NotificationDispatcherView(), PicklistManagerView() (+5 more)

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.17
Nodes (13): createRedisConnection(), getRedisClient(), redisConnectionOptions, DealStageUpdatedPayload, defaultJobOptions, emailQueue, enqueueEmailJob(), enqueueScheduledJob() (+5 more)

### Community 17 - "serve-dist.js"
Cohesion: 0.24
Nodes (11): CatalogListView(), CatalogStats, useCatalog(), UseCatalogReturn, LineItemEditor(), PriceBookManager(), ProductModal(), ProductModalProps (+3 more)

### Community 18 - "AutoNumberingConfig.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 19 - "helmet"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.12
Nodes (17): bcryptjs, bullmq, dotenv, express, express-rate-limit, helmet, jsonwebtoken, dependencies (+9 more)

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.05
Nodes (36): prisma, devDependencies, prisma, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken (+28 more)

### Community 22 - "express-rate-limit"
Cohesion: 0.15
Nodes (10): @prisma/client, @prisma/client, __dirname, __filename, testConnections(), prisma, runAuditVerification(), prisma (+2 more)

### Community 23 - "nodemailer"
Cohesion: 0.17
Nodes (17): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+9 more)

### Community 24 - "postcss.config.js"
Cohesion: 0.10
Nodes (19): dist, node_modules, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+11 more)

### Community 25 - "vite-env.d.ts"
Cohesion: 0.09
Nodes (38): createDrawingSheet(), createRfi(), createSiteReport(), getDrawingSheets(), getProjectPhases(), getRfiLog(), getSiteReports(), getStudioCapacityHeatmap() (+30 more)

### Community 26 - "tailwind.config.js"
Cohesion: 0.29
Nodes (30): buildCrmLeadsPage(), buildDashboardPage(), buildLoginPage(), buildMcpServersPage(), buildPpmFinancialsPage(), buildPpmPortfolioPage(), buildPpmRisksPage(), buildProgramCard() (+22 more)

### Community 27 - "vite.config.ts"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, typescript (+9 more)

### Community 28 - "zod"
Cohesion: 0.19
Nodes (9): app, disconnectDatabase(), disconnectRedis(), app, handleShutdown(), server, handleShutdown(), server (+1 more)

### Community 29 - "useAuth"
Cohesion: 0.13
Nodes (14): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, rootDir (+6 more)

### Community 30 - "vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs"
Cohesion: 0.17
Nodes (22): convertLead(), createAccount(), createContact(), createDeal(), createLead(), deleteAccount(), deleteContact(), deleteDeal() (+14 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.18
Nodes (27): createOrUpdateEmailTemplate(), createOrUpdateProfile(), createOrUpdateRole(), createOrUpdateUser(), createWorkflowRule(), DEFAULT_ACTIVE_MODULES, DEFAULT_AUTO_NUMBERING, DEFAULT_COMPANY_DETAILS (+19 more)

### Community 32 - "dependencies"
Cohesion: 0.06
Nodes (52): App(), AppLayout(), CreateTaskModal(), Header(), Sidebar(), TaskMindMapView(), TaskMindMapViewProps, AuthContext (+44 more)

### Community 33 - "devDependencies"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 34 - "inventoryService.ts"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 35 - "useCatalog.ts"
Cohesion: 0.22
Nodes (14): AuditReport, runCrmAudit(), TaskStatusChangedPayload, createWorkflowWorker(), evaluateCustomWorkflows(), processDealStageUpdated(), processTaskStatusChanged(), ConditionData (+6 more)

### Community 36 - "Project"
Cohesion: 0.15
Nodes (12): 1. Executive Summary & Core Mission, 2. Architectural Pillars & Core Subsystems, 3.1. Pluggable Module Architecture, 3.2. Dynamic Schema & Layout Customization, 3.3. Enterprise Security & Hierarchy (VTiger / Salesforce Model), 3.4. Hybrid Agentic AI & MCP Integration, 3.5. Financial Scope & Cost/Margin Governance, 3.6. External Stakeholder & Client Portal (+4 more)

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.12
Nodes (17): axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react, react-dom (+9 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.17
Nodes (14): handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, GeneratedTasksResult, generateTasksFromMeetingNotes(), summarizeAccountContext(), enqueueWorkflowEvent(), mcpRouter (+6 more)

### Community 40 - "AuthContext.tsx"
Cohesion: 0.17
Nodes (25): createForm(), deleteForm(), formsStore, getFormById(), getForms(), getFormSubmissions(), getInitialForms(), getPublicForm() (+17 more)

### Community 41 - "EntityModuleName"
Cohesion: 0.20
Nodes (9): BackgroundProps, Connection, ControlsProps, Edge, HandleProps, Node, Position, ReactFlowProps (+1 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (4): SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.27
Nodes (7): extractCustomFields(), IdMapper, loadSourceDataset(), normalizeTimestamp(), prisma, runETLMigration(), SourceDataset

### Community 45 - "GanttChart.tsx"
Cohesion: 0.16
Nodes (15): ConvertDealModalProps, MilestoneStatus, ProductOrServiceType, ProjectDeliverable, ProjectMilestone, RecurrenceRule, Task, TimeLog (+7 more)

### Community 47 - "test-crm-conversion.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.23
Nodes (11): EmailJobPayload, QUEUE_NAMES, ScheduledJobPayload, createEmailWorker(), interpolateTemplateTokens(), sendEmailMessage(), ClientHealthReport, createHealthCheckWorker() (+3 more)

### Community 49 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 50 - "package.json"
Cohesion: 0.15
Nodes (6): NodeConfigDrawerProps, ActionNode, ConditionNode, DelayNode, TriggerNode, WorkflowCanvasProps

### Community 53 - "graphify.md"
Cohesion: 0.40
Nodes (3): __dirname, __filename, prisma

### Community 54 - "graphify.md"
Cohesion: 0.40
Nodes (4): __dirname, __filename, safeTarget, serverDir

### Community 55 - "seed-and-test-crm.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, prisma

### Community 56 - "server.js"
Cohesion: 0.40
Nodes (3): __dirname, __filename, server

### Community 59 - "bcryptjs"
Cohesion: 0.36
Nodes (5): AuthenticatedSocket, broadcastGanttUpdate(), broadcastKanbanUpdate(), broadcastToProject(), initSocketServer()

### Community 62 - "LineItemEditor.tsx"
Cohesion: 0.39
Nodes (6): LineItemEditorProps, QuoteToProjectModal(), QuoteToProjectModalProps, LineItem, Quote, QuoteStatus

### Community 63 - "zod"
Cohesion: 0.22
Nodes (12): EntityHeader(), EntityHeaderProps, EntityLookupModalProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps, RelatedListsNav(), RelatedListsNavProps (+4 more)

### Community 64 - "helmet"
Cohesion: 0.26
Nodes (9): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper(), InlineEditWrapperProps (+1 more)

### Community 65 - "AdminWorkflowView.tsx"
Cohesion: 0.33
Nodes (4): __dirname, __filename, prisma, TEST_LOGINS

### Community 66 - "RiskDeliverablesView.tsx"
Cohesion: 0.67
Nodes (3): react, react, UniversalViewBar()

### Community 67 - "WorkflowCanvas.tsx"
Cohesion: 0.24
Nodes (6): Account360Summary, ConvertLeadModal(), ConvertLeadModalProps, UseEntityRecordResult, api, apiClient

### Community 74 - "EntityListView.tsx"
Cohesion: 0.25
Nodes (8): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, EntityEditView(), EntityListView(), MODULE_SCHEMAS, FieldDefinition, PicklistOption

### Community 78 - "LayoutEditor.tsx"
Cohesion: 0.25
Nodes (7): LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, CustomField, FieldType, LayoutBlock, ModuleSchema

### Community 79 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:all, dev, package:cpanel, preview, test, typecheck

### Community 80 - "WorkflowBuilderModal.tsx"
Cohesion: 0.50
Nodes (6): WorkflowBuilderModal(), WorkflowBuilderModalProps, WorkflowListView(), WorkflowRule, convertDAGToLinear(), convertLinearToDAG()

### Community 81 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 82 - "MultiAssigneeSelector.tsx"
Cohesion: 0.50
Nodes (3): AVAILABLE_TEAM_MEMBERS, MultiAssigneeSelectorProps, TaskAssigneeAllocation

## Knowledge Gaps
- **398 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+393 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `WorkflowCanvas.tsx` to `dependencies`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `App.tsx`, `EntityListView.tsx`, `compilerOptions`, `LayoutEditor.tsx`, `settingsRoutes.tsx`, `LayoutEditor.tsx`, `WorkflowBuilderModal.tsx`, `serve-dist.js`, `test-logic.js`, `EntityEditView.tsx`, `LineItemEditor.tsx`, `zod`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `dependencies` to `index.ts`, `scripts`, `useFirestoreCRM.ts`, `EntityListView.tsx`, `LayoutEditor.tsx`, `test-logic.js`, `WorkflowBuilderModal.tsx`, `EntityEditView.tsx`, `LineItemEditor.tsx`, `zod`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `react` connect `RiskDeliverablesView.tsx` to `dependencies`, `DynamicFieldRenderer.tsx`, `settingsRoutes.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `text()` (e.g. with `generate_pen_designs.cjs` and `WebFormBuilderModal()`) actually correct?**
  _`text()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _398 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07474600870827286 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11097560975609756 - nodes in this community are weakly interconnected._