# Graph Report - Shogun Projects  (2026-10-26)

## Corpus Check
- 241 files · ~183,376 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1420 nodes · 2781 edges · 84 communities (71 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `019b3272`
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
- DynamicFieldRenderer.tsx
- socket.io
- cron-trigger.sh
- EntityListView.tsx
- scripts
- WorkflowBuilderModal.tsx
- crmTools.ts
- react
- MassEditModal.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 57 edges
2. `apiClient` - 44 edges
3. `useCurrency()` - 38 edges
4. `getTenantId()` - 23 edges
5. `Task` - 23 edges
6. `withTenantTx()` - 21 edges
7. `BookingService` - 20 edges
8. `Booking` - 19 edges
9. `createRedisConnection()` - 17 edges
10. `getTenantId()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `TaskCalendarView()` --references--> `react`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → package.json
- `UniversalViewBar()` --references--> `react`  [EXTRACTED]
  src/components/views/UniversalViewBar.tsx → package.json
- `HierarchyProvider()` --references--> `react`  [EXTRACTED]
  src/context/HierarchyContext.tsx → package.json
- `CustomFieldsPanel()` --calls--> `useCurrency()`  [EXTRACTED]
  src/components/tasks/CustomFieldsPanel.tsx → src/context/CurrencyContext.tsx
- `TaskCalendarViewProps` --references--> `Task`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (84 total, 13 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.07
Nodes (49): authLimiter, defaultDevOrigins, envOrigins, createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks() (+41 more)

### Community 1 - "crm.ts"
Cohesion: 0.17
Nodes (11): AuditTrailEntry, ExpenseCategory, ExpenseEntry, ExpenseStatus, Portfolio, ProjectBudget, ResourceProfile, RiskCategory (+3 more)

### Community 2 - "index.js"
Cohesion: 0.25
Nodes (9): ALL_VIEW_TABS, UniversalViewBarProps, ViewFilterState, ViewGroupBy, ViewMode, ViewSortState, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER (+1 more)

### Community 3 - "index.ts"
Cohesion: 0.10
Nodes (36): ProjectContext, ProjectContextType, ProjectProviderProps, useProject(), Account360Drawer(), Account360DrawerProps, ConvertDealModal(), ConvertDealModalProps (+28 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (32): Account, AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, Contact, ContactEntity, CRMEntity (+24 more)

### Community 5 - "scripts"
Cohesion: 0.15
Nodes (31): COLOR_OPTIONS, ColumnConfigModal(), ColumnConfigModalProps, CreateTaskModal(), CreateTaskModalProps, COLUMN_COLORS, PRIORITY_META, ProjectBoard() (+23 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.09
Nodes (25): AutoNumberingConfigView(), LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, ActiveModules, AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload (+17 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (18): AdvancedRecurrenceModalProps, DEFAULT_RECURRENCE, CustomFieldsPanel(), CustomFieldsPanelProps, DEFAULT_DEFINITIONS, AVAILABLE_TEAM_MEMBERS, MultiAssigneeSelectorProps, TaskDependenciesPanelProps (+10 more)

### Community 8 - "App.tsx"
Cohesion: 0.26
Nodes (10): projectManagementService, ClientChangeRequestItem, CriticalPathData, PmAnalyticsMetrics, ProjectDocumentItem, ProjectInvoiceItem, ResourceWorkloadItem, TimesheetItem (+2 more)

### Community 9 - "settings.ts"
Cohesion: 0.11
Nodes (6): hierarchicalSample, mockSpaces, mockTasks, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER, STATUS_BUCKET_DEFS

### Community 10 - "dependencies"
Cohesion: 0.08
Nodes (30): WorkflowBuilderModal(), WorkflowBuilderModalProps, LinearRuleBuilderProps, NodeConfigDrawerProps, ActionNode, ConditionNode, DelayNode, TriggerNode (+22 more)

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
Cohesion: 0.15
Nodes (15): CreateTaskModalProps, DEFAULT_STATUS_COLUMNS, KanbanBoardProps, statusOrder, TaskCard(), TaskCardProps, TaskListViewProps, BASE_TEAM_MEMBERS (+7 more)

### Community 15 - "test-logic.js"
Cohesion: 0.13
Nodes (13): ProfileMatrixTable(), RoleHierarchyTree(), WorkflowListView(), EmailTemplateEditor(), ModuleManagerView(), HubCardProps, SettingsHub(), DataSharingRulesView() (+5 more)

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.19
Nodes (11): defaultJobOptions, emailQueue, enqueueEmailJob(), enqueueScheduledJob(), getEmailQueue(), getScheduledJobsQueue(), getSocialAnalysisQueue(), queueSocialInteraction() (+3 more)

### Community 17 - "serve-dist.js"
Cohesion: 0.21
Nodes (16): useCurrency(), CatalogListView(), CatalogStats, useCatalog(), UseCatalogReturn, LineItemEditor(), LineItemEditorProps, QuoteToProjectModal() (+8 more)

### Community 18 - "AutoNumberingConfig.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 19 - "helmet"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.12
Nodes (17): bcryptjs, bullmq, dotenv, express, express-rate-limit, jsonwebtoken, dependencies, bcryptjs (+9 more)

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.05
Nodes (36): prisma, devDependencies, prisma, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken (+28 more)

### Community 22 - "express-rate-limit"
Cohesion: 0.15
Nodes (10): @prisma/client, @prisma/client, __dirname, __filename, testConnections(), prisma, runAuditVerification(), prisma (+2 more)

### Community 23 - "nodemailer"
Cohesion: 0.10
Nodes (28): AvailabilitySettings(), AvailabilitySettingsProps, DAYS_OF_WEEK, BookingDetailModal(), BookingDetailModalProps, BookingsTable(), BookingsTableProps, BookingTypeManager() (+20 more)

### Community 24 - "postcss.config.js"
Cohesion: 0.10
Nodes (20): dist, node_modules, src/**/__tests__/*, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib (+12 more)

### Community 25 - "vite-env.d.ts"
Cohesion: 0.06
Nodes (61): createDrawingSheet(), createRfi(), createSiteReport(), getDrawingSheets(), getProjectPhases(), getRfiLog(), getSiteReports(), getStudioCapacityHeatmap() (+53 more)

### Community 26 - "tailwind.config.js"
Cohesion: 0.15
Nodes (21): ContactDetailViewProps, EscalateToTaskModal(), EscalateToTaskModalProps, LinkContactModal(), LinkContactModalProps, AVAILABLE_PLATFORMS, ListeningRulesModal(), ListeningRulesModalProps (+13 more)

### Community 27 - "vite.config.ts"
Cohesion: 0.04
Nodes (48): autoprefixer, axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react (+40 more)

### Community 28 - "zod"
Cohesion: 0.15
Nodes (10): __dirname, __filename, app, disconnectDatabase(), app, handleShutdown(), server, handleShutdown() (+2 more)

### Community 29 - "useAuth"
Cohesion: 0.12
Nodes (15): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, rootDir (+7 more)

### Community 30 - "vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs"
Cohesion: 0.17
Nodes (17): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+9 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.18
Nodes (27): createOrUpdateEmailTemplate(), createOrUpdateProfile(), createOrUpdateRole(), createOrUpdateUser(), createWorkflowRule(), DEFAULT_ACTIVE_MODULES, DEFAULT_AUTO_NUMBERING, DEFAULT_COMPANY_DETAILS (+19 more)

### Community 32 - "dependencies"
Cohesion: 0.13
Nodes (16): AppLayout(), Header(), Sidebar(), ProjectWorkspace(), SchedulerPage(), DashboardPage(), LoginPage(), McpServersPage() (+8 more)

### Community 33 - "devDependencies"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 34 - "inventoryService.ts"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 35 - "useCatalog.ts"
Cohesion: 0.20
Nodes (15): AuditReport, runCrmAudit(), DealStageUpdatedPayload, TaskStatusChangedPayload, createWorkflowWorker(), evaluateCustomWorkflows(), processDealStageUpdated(), processTaskStatusChanged() (+7 more)

### Community 36 - "Project"
Cohesion: 0.15
Nodes (12): 1. Executive Summary & Core Mission, 2. Architectural Pillars & Core Subsystems, 3.1. Pluggable Module Architecture, 3.2. Dynamic Schema & Layout Customization, 3.3. Enterprise Security & Hierarchy (VTiger / Salesforce Model), 3.4. Hybrid Agentic AI & MCP Integration, 3.5. Financial Scope & Cost/Margin Governance, 3.6. External Stakeholder & Client Portal (+4 more)

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.13
Nodes (23): broadcastToTenant(), EscalateTaskPayload, InboundSocialPayload, LinkContactPayload, OutboundReplyPayload, SocialIntent, SocialInteractionModel, SocialInteractionStatus (+15 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.31
Nodes (8): enqueueWorkflowEvent(), getWorkflowQueue(), UpdateDealInput, updateDealWithEvents(), UpdateTaskInput, updateTaskWithEvents(), TenantTransactionCallback, withTenantTx()

### Community 40 - "AuthContext.tsx"
Cohesion: 0.16
Nodes (26): createForm(), deleteForm(), formsStore, getFormById(), getForms(), getFormSubmissions(), getInitialForms(), getPublicForm() (+18 more)

### Community 41 - "EntityModuleName"
Cohesion: 0.20
Nodes (9): BackgroundProps, Connection, ControlsProps, Edge, HandleProps, Node, Position, ReactFlowProps (+1 more)

### Community 43 - "scripts"
Cohesion: 0.28
Nodes (6): SettingsHeader(), SettingsHeaderProps, SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.27
Nodes (7): extractCustomFields(), IdMapper, loadSourceDataset(), normalizeTimestamp(), prisma, runETLMigration(), SourceDataset

### Community 45 - "GanttChart.tsx"
Cohesion: 0.16
Nodes (15): LineItem, MilestoneStatus, ProductOrServiceType, ProjectDeliverable, ProjectMilestone, QuoteStatus, RecurrenceRule, Task (+7 more)

### Community 47 - "test-crm-conversion.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.18
Nodes (15): createRedisConnection(), disconnectRedis(), getRedisClient(), redisConnectionOptions, EmailJobPayload, QUEUE_NAMES, ScheduledJobPayload, createEmailWorker() (+7 more)

### Community 49 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 50 - "package.json"
Cohesion: 0.13
Nodes (18): App(), AuthProvider(), CurrencyContext, CurrencyContextType, CurrencyOption, CurrencyProvider(), CurrencyProviderProps, formatCurrencyAmount() (+10 more)

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
Cohesion: 0.43
Nodes (5): AuthenticatedSocket, broadcastGanttUpdate(), broadcastKanbanUpdate(), broadcastToProject(), initSocketServer()

### Community 62 - "LineItemEditor.tsx"
Cohesion: 0.22
Nodes (14): TaskMindMapView(), TaskMindMapViewProps, HierarchyContext, HierarchyContextType, useHierarchy(), hierarchyService, Folder, HierarchyBreadcrumbItem (+6 more)

### Community 63 - "zod"
Cohesion: 0.16
Nodes (15): ConvertLeadModal(), ConvertLeadModalProps, EntityHeader(), EntityHeaderProps, EntityLookupModalProps, EntitySummaryWidgetProps, RelatedListsNav(), RelatedListsNavProps (+7 more)

### Community 64 - "helmet"
Cohesion: 0.15
Nodes (20): createBooking(), createBookingType(), createPublicBooking(), deleteBooking(), deleteBookingType(), getAvailability(), getBookingById(), getPublicBookingTypeMeta() (+12 more)

### Community 65 - "AdminWorkflowView.tsx"
Cohesion: 0.33
Nodes (4): __dirname, __filename, prisma, TEST_LOGINS

### Community 66 - "RiskDeliverablesView.tsx"
Cohesion: 0.18
Nodes (8): analyzeSentimentAndIntent(), mockDatabase, NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, PRAISE_KEYWORDS, PURCHASE_KEYWORDS, simulateInboundIngestion(), SUPPORT_KEYWORDS

### Community 67 - "DynamicFieldRenderer.tsx"
Cohesion: 0.26
Nodes (9): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper(), InlineEditWrapperProps (+1 more)

### Community 74 - "EntityListView.tsx"
Cohesion: 0.12
Nodes (23): CreateTaskModal(), AuthContext, AuthContextType, AuthProviderProps, TenantInfo, useAuth(), Account360Summary, RealtimeRoomOptions (+15 more)

### Community 81 - "crmTools.ts"
Cohesion: 0.33
Nodes (7): handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, GeneratedTasksResult, generateTasksFromMeetingNotes(), summarizeAccountContext(), mcpRouter

### Community 82 - "react"
Cohesion: 0.29
Nodes (6): react, react, TaskCalendarView(), TaskCalendarViewProps, UniversalViewBar(), HierarchyProvider()

### Community 83 - "MassEditModal.tsx"
Cohesion: 0.40
Nodes (5): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, FieldDefinition, PicklistOption

## Knowledge Gaps
- **440 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `EntityListView.tsx` to `index.ts`, `scripts`, `useFirestoreCRM.ts`, `App.tsx`, `dependencies`, `compilerOptions`, `LayoutEditor.tsx`, `settingsRoutes.tsx`, `test-logic.js`, `serve-dist.js`, `package.json`, `MassEditModal.tsx`, `nodemailer`, `tailwind.config.js`, `LineItemEditor.tsx`, `zod`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `EntityListView.tsx` to `dependencies`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `scripts`, `test-logic.js`, `serve-dist.js`, `react`, `nodemailer`, `tailwind.config.js`, `LineItemEditor.tsx`, `zod`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `vite.config.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _440 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06533575317604355 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10404040404040404 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._