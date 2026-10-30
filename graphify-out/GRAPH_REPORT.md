# Graph Report - Shogun Projects  (2026-10-30)

## Corpus Check
- 241 files · ~185,167 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1425 nodes · 2835 edges · 89 communities (76 shown, 13 thin omitted)
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
- settingsRoutes.tsx
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
- WorkflowCanvas.tsx
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
- EntityListView.tsx
- EntityEditView.tsx
- MultiAssigneeSelector.tsx
- ConvertDealModal.tsx
- EntityBlocksViewer.tsx
- zod

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 57 edges
2. `apiClient` - 44 edges
3. `useCurrency()` - 40 edges
4. `getTenantId()` - 24 edges
5. `Task` - 23 edges
6. `withTenantTx()` - 21 edges
7. `BookingService` - 20 edges
8. `getTenantId()` - 19 edges
9. `sendControllerError()` - 19 edges
10. `Booking` - 19 edges

## Surprising Connections (you probably didn't know these)
- `TaskCalendarView()` --references--> `react`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → package.json
- `UniversalViewBar()` --references--> `react`  [EXTRACTED]
  src/components/views/UniversalViewBar.tsx → package.json
- `HierarchyProvider()` --references--> `react`  [EXTRACTED]
  src/context/HierarchyContext.tsx → package.json
- `TaskCalendarViewProps` --references--> `Task`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → src/types/index.ts
- `TaskMindMapViewProps` --references--> `Task`  [EXTRACTED]
  src/components/views/TaskMindMapView.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (89 total, 13 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.10
Nodes (41): authLimiter, defaultDevOrigins, envOrigins, runRecurringTasksCron(), createFolder(), createList(), createSpace(), DEFAULT_CLICK_APPS (+33 more)

### Community 1 - "crm.ts"
Cohesion: 0.17
Nodes (11): AuditTrailEntry, ExpenseCategory, ExpenseEntry, ExpenseStatus, Portfolio, ProjectBudget, ResourceProfile, RiskCategory (+3 more)

### Community 2 - "index.js"
Cohesion: 0.25
Nodes (9): ALL_VIEW_TABS, UniversalViewBarProps, ViewFilterState, ViewGroupBy, ViewMode, ViewSortState, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER (+1 more)

### Community 3 - "index.ts"
Cohesion: 0.15
Nodes (22): DealKanbanBoard(), StageColumnConfig, stageConfigs, stageOrder, ProjectClientBadge(), fallbackAccounts, useAccounts(), UseAccountsResult (+14 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (32): Account, AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, Contact, ContactEntity, CRMEntity (+24 more)

### Community 5 - "scripts"
Cohesion: 0.15
Nodes (31): COLOR_OPTIONS, ColumnConfigModal(), ColumnConfigModalProps, CreateTaskModal(), CreateTaskModalProps, COLUMN_COLORS, PRIORITY_META, ProjectBoard() (+23 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.09
Nodes (24): ProfileMatrixTable(), AutoNumberingConfigView(), LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload (+16 more)

### Community 7 - "compilerOptions"
Cohesion: 0.18
Nodes (10): AdvancedRecurrenceModalProps, DEFAULT_RECURRENCE, TaskDependenciesPanelProps, AdvancedRecurrenceConfig, CustomFieldOption, CustomFieldValue, DependencyRelationType, RecurrenceFrequency (+2 more)

### Community 8 - "App.tsx"
Cohesion: 0.26
Nodes (10): projectManagementService, ClientChangeRequestItem, CriticalPathData, PmAnalyticsMetrics, ProjectDocumentItem, ProjectInvoiceItem, ResourceWorkloadItem, TimesheetItem (+2 more)

### Community 9 - "settings.ts"
Cohesion: 0.11
Nodes (6): hierarchicalSample, mockSpaces, mockTasks, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER, STATUS_BUCKET_DEFS

### Community 10 - "dependencies"
Cohesion: 0.13
Nodes (25): WorkflowBuilderModal(), WorkflowBuilderModalProps, WorkflowListView(), LinearRuleBuilderProps, ConditionOperator, SupportedModule, WorkflowAction, WorkflowCondition (+17 more)

### Community 11 - "compilerOptions"
Cohesion: 0.13
Nodes (19): aecService, AecDiscipline, AecPhase, AecStaffRole, AecTask, DrawingSheet, FeeModel, NetMultiplierReport (+11 more)

### Community 12 - "useAuth"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.13
Nodes (28): FormSubmissionsModal(), FormSubmissionsModalProps, WebFormBuilderModal(), WebFormBuilderModalProps, PublicWebFormPage(), addStoredSubmission(), DEFAULT_ENTERPRISE_FORMS, formService (+20 more)

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.16
Nodes (14): CreateTaskModalProps, DEFAULT_STATUS_COLUMNS, KanbanBoardProps, statusOrder, TaskCard(), TaskCardProps, TaskListViewProps, BASE_TEAM_MEMBERS (+6 more)

### Community 15 - "settingsRoutes.tsx"
Cohesion: 0.13
Nodes (12): EmailTemplateEditor(), ModuleManagerView(), WebFormsManagementView(), HubCardProps, SettingsHub(), DataSharingRulesView(), ScheduledCronView(), WebhooksGatewayView() (+4 more)

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.13
Nodes (20): createRedisConnection(), getRedisClient(), redisConnectionOptions, defaultJobOptions, emailQueue, enqueueEmailJob(), enqueueScheduledJob(), getEmailQueue() (+12 more)

### Community 17 - "serve-dist.js"
Cohesion: 0.22
Nodes (12): CatalogListView(), CatalogStats, useCatalog(), UseCatalogReturn, LineItemEditor(), PriceBookManager(), ProductModal(), ProductModalProps (+4 more)

### Community 18 - "AutoNumberingConfig.tsx"
Cohesion: 0.09
Nodes (16): bottleneckMap, engineerProfile, finSummary, mockPortfolio, mockProjectRisks, mockProjectSummaries, portSnapshot, riskEvaluation1 (+8 more)

### Community 19 - "helmet"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module (+13 more)

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.12
Nodes (17): bcryptjs, bullmq, cors, dotenv, express, express-rate-limit, jsonwebtoken, dependencies (+9 more)

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
Nodes (62): createDrawingSheet(), createRfi(), createSiteReport(), getDrawingSheets(), getProjectPhases(), getRfiLog(), getSiteReports(), getStudioCapacityHeatmap() (+54 more)

### Community 26 - "tailwind.config.js"
Cohesion: 0.15
Nodes (21): ContactDetailViewProps, EscalateToTaskModal(), EscalateToTaskModalProps, LinkContactModal(), LinkContactModalProps, AVAILABLE_PLATFORMS, ListeningRulesModal(), ListeningRulesModalProps (+13 more)

### Community 27 - "vite.config.ts"
Cohesion: 0.04
Nodes (48): autoprefixer, axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react (+40 more)

### Community 28 - "zod"
Cohesion: 0.12
Nodes (14): __dirname, __filename, app, disconnectDatabase(), app, handleShutdown(), server, handleShutdown() (+6 more)

### Community 29 - "useAuth"
Cohesion: 0.12
Nodes (16): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, rootDir (+8 more)

### Community 30 - "WorkflowCanvas.tsx"
Cohesion: 0.15
Nodes (6): NodeConfigDrawerProps, ActionNode, ConditionNode, DelayNode, TriggerNode, WorkflowCanvasProps

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.09
Nodes (44): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+36 more)

### Community 32 - "dependencies"
Cohesion: 0.14
Nodes (16): App(), AppLayout(), Header(), AuthProvider(), ProjectProvider(), queryClient, ProjectWorkspace(), DashboardPage() (+8 more)

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
Nodes (23): socialRouter, broadcastToTenant(), EscalateTaskPayload, InboundSocialPayload, LinkContactPayload, OutboundReplyPayload, SocialIntent, SocialInteractionModel (+15 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.18
Nodes (14): handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, GeneratedTasksResult, generateTasksFromMeetingNotes(), summarizeAccountContext(), enqueueWorkflowEvent(), mcpRouter (+6 more)

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
Cohesion: 0.23
Nodes (12): CreateTaskModal(), TaskMindMapView(), TaskMindMapViewProps, useHierarchy(), Task, AgentType, Lead, LeadStatus (+4 more)

### Community 47 - "test-crm-conversion.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.29
Nodes (9): disconnectRedis(), EmailJobPayload, createEmailWorker(), interpolateTemplateTokens(), sendEmailMessage(), RunningWorkers, startWorkers(), stopWorkers() (+1 more)

### Community 49 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 50 - "package.json"
Cohesion: 0.15
Nodes (20): CustomFieldsPanel(), CustomFieldsPanelProps, DEFAULT_DEFINITIONS, CurrencyContext, CurrencyContextType, CurrencyOption, CurrencyProvider(), CurrencyProviderProps (+12 more)

### Community 52 - "package.json"
Cohesion: 0.21
Nodes (11): LineItemEditorProps, QuoteToProjectModal(), QuoteToProjectModalProps, LineItem, MilestoneStatus, ProjectDeliverable, ProjectMilestone, Quote (+3 more)

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
Cohesion: 0.26
Nodes (10): ProjectContext, ProjectContextType, ProjectProviderProps, useProject(), Account360Drawer(), Account360DrawerProps, ProjectClientBadgeProps, UseContactsResult (+2 more)

### Community 62 - "LineItemEditor.tsx"
Cohesion: 0.30
Nodes (11): HierarchyContext, HierarchyContextType, hierarchyService, Folder, HierarchyBreadcrumbItem, HierarchyScope, HierarchyTreeResponse, Space (+3 more)

### Community 63 - "zod"
Cohesion: 0.14
Nodes (16): Account360Summary, ConvertLeadModal(), ConvertLeadModalProps, EntityHeader(), EntityHeaderProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps (+8 more)

### Community 64 - "helmet"
Cohesion: 0.14
Nodes (21): createBooking(), createBookingType(), createPublicBooking(), deleteBooking(), deleteBookingType(), getAvailability(), getBookingById(), getPublicBookingTypeMeta() (+13 more)

### Community 65 - "AdminWorkflowView.tsx"
Cohesion: 0.33
Nodes (4): __dirname, __filename, prisma, TEST_LOGINS

### Community 66 - "RiskDeliverablesView.tsx"
Cohesion: 0.18
Nodes (8): analyzeSentimentAndIntent(), mockDatabase, NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, PRAISE_KEYWORDS, PURCHASE_KEYWORDS, simulateInboundIngestion(), SUPPORT_KEYWORDS

### Community 67 - "DynamicFieldRenderer.tsx"
Cohesion: 0.39
Nodes (6): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), InlineEditWrapper(), InlineEditWrapperProps

### Community 74 - "EntityListView.tsx"
Cohesion: 0.12
Nodes (19): Sidebar(), AuthContext, AuthContextType, AuthProviderProps, TenantInfo, useAuth(), RealtimeRoomOptions, useRealtimeRoom() (+11 more)

### Community 81 - "crmTools.ts"
Cohesion: 0.47
Nodes (9): createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks(), getProductById(), getProducts(), sendCatalogError() (+1 more)

### Community 82 - "react"
Cohesion: 0.29
Nodes (6): react, react, TaskCalendarView(), TaskCalendarViewProps, UniversalViewBar(), HierarchyProvider()

### Community 83 - "EntityListView.tsx"
Cohesion: 0.25
Nodes (8): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, EntityEditView(), EntityListView(), MODULE_SCHEMAS, FieldDefinition, PicklistOption

### Community 84 - "EntityEditView.tsx"
Cohesion: 0.43
Nodes (5): EntityLookupModal(), EntityLookupModalProps, RelatedListsNavProps, DEFAULT_MODULE_LAYOUTS, EntityModuleName

### Community 85 - "MultiAssigneeSelector.tsx"
Cohesion: 0.50
Nodes (3): AVAILABLE_TEAM_MEMBERS, MultiAssigneeSelectorProps, TaskAssigneeAllocation

### Community 86 - "ConvertDealModal.tsx"
Cohesion: 0.60
Nodes (4): ConvertDealModal(), ConvertDealModalProps, Deal, Organization

### Community 87 - "EntityBlocksViewer.tsx"
Cohesion: 0.67
Nodes (3): EntityBlocksViewer(), EntityBlocksViewerProps, BlockLayout

## Knowledge Gaps
- **442 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+437 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `zod` to `index.ts`, `scripts`, `useFirestoreCRM.ts`, `App.tsx`, `dependencies`, `compilerOptions`, `LayoutEditor.tsx`, `settingsRoutes.tsx`, `settingsRoutes.tsx`, `serve-dist.js`, `nodemailer`, `tailwind.config.js`, `dependencies`, `GanttChart.tsx`, `package.json`, `package.json`, `bcryptjs`, `LineItemEditor.tsx`, `EntityListView.tsx`, `EntityListView.tsx`, `EntityEditView.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `EntityListView.tsx` to `dependencies`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `dependencies`, `scripts`, `GanttChart.tsx`, `settingsRoutes.tsx`, `react`, `EntityListView.tsx`, `package.json`, `EntityEditView.tsx`, `nodemailer`, `tailwind.config.js`, `LineItemEditor.tsx`, `zod`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `vite.config.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _442 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0975177304964539 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._