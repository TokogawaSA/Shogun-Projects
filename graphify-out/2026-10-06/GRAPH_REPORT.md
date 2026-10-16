# Graph Report - Shogun Projects  (2026-10-06)

## Corpus Check
- 247 files · ~192,962 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1326 nodes · 2780 edges · 74 communities (62 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
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
- AuthContext.tsx
- zod
- socket.io
- cron-trigger.sh
- ProjectCosting.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 69 edges
2. `apiClient` - 48 edges
3. `Task` - 38 edges
4. `getTenantId()` - 23 edges
5. `Project` - 23 edges
6. `useProject()` - 21 edges
7. `frame()` - 20 edges
8. `text()` - 20 edges
9. `badge()` - 18 edges
10. `withTenantTx()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `TaskCalendarView()` --references--> `react`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → package.json
- `HierarchyProvider()` --references--> `react`  [EXTRACTED]
  src/context/HierarchyContext.tsx → package.json
- `ProjectsPage()` --references--> `react`  [EXTRACTED]
  src/pages/ProjectsPage.tsx → package.json
- `CreateHierarchyModal()` --references--> `react`  [EXTRACTED]
  src/components/hierarchy/CreateHierarchyModal.tsx → package.json
- `TaskMindMapViewProps` --references--> `Task`  [EXTRACTED]
  src/components/views/TaskMindMapView.tsx → src/types/index.ts

## Import Cycles
- 2-file cycle: `src/modules/ppm/studio/StudioGovernanceHub.tsx -> src/modules/ppm/studio/index.ts -> src/modules/ppm/studio/StudioGovernanceHub.tsx`

## Communities (74 total, 12 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.14
Nodes (28): createPriceBook(), createProduct(), deleteProduct(), fulfillDeliverable(), getPriceBooks(), getProductById(), getProducts(), updateProduct() (+20 more)

### Community 1 - "crm.ts"
Cohesion: 0.08
Nodes (40): ExpenseManager(), FinancialDashboard(), ProjectBudgetTracker(), ExtendedBudgetSummary, PortfolioFinancialTotals, useFinancials(), UseFinancialsReturn, PortfolioAnalyticsSummary (+32 more)

### Community 2 - "index.js"
Cohesion: 0.25
Nodes (14): UniversalViewBar(), UniversalViewBarProps, VIEW_TABS, useTasks(), TaskBoardPage(), ViewFilterState, ViewGroupBy, ViewMode (+6 more)

### Community 3 - "index.ts"
Cohesion: 0.12
Nodes (30): Account360Drawer(), Account360DrawerProps, ConvertDealModal(), ConvertDealModalProps, DealKanbanBoard(), StageColumnConfig, stageConfigs, stageOrder (+22 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (42): DynamicFieldRenderer(), DynamicFieldRendererProps, formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper() (+34 more)

### Community 5 - "scripts"
Cohesion: 0.11
Nodes (23): ConvertLeadModal(), ConvertLeadModalProps, EntityHeader(), EntityHeaderProps, EntityLookupModal(), EntityLookupModalProps, ActivityItem, EntitySummaryWidget() (+15 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.08
Nodes (27): ProfileMatrixTable(), EmailTemplateEditor(), AutoNumberingConfigView(), LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, AutoNumberingConfig, AutoNumberingRule (+19 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (21): AdvancedRecurrenceModal(), AdvancedRecurrenceModalProps, DEFAULT_RECURRENCE, CustomFieldsPanel(), CustomFieldsPanelProps, DEFAULT_DEFINITIONS, AVAILABLE_TEAM_MEMBERS, MultiAssigneeSelector() (+13 more)

### Community 8 - "App.tsx"
Cohesion: 0.09
Nodes (34): AVAILABLE_MODULES, getProjectModuleSettings(), ModuleDefinition, PresetDefinition, PRESETS, PresetType, ProjectModuleKey, ProjectModuleSettings (+26 more)

### Community 9 - "settings.ts"
Cohesion: 0.11
Nodes (6): hierarchicalSample, mockSpaces, mockTasks, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER, STATUS_BUCKET_DEFS

### Community 10 - "dependencies"
Cohesion: 0.08
Nodes (30): WorkflowBuilderModal(), WorkflowBuilderModalProps, LinearRuleBuilderProps, NodeConfigDrawerProps, ActionNode, ConditionNode, DelayNode, TriggerNode (+22 more)

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (52): AecRiskRegisterView(), StudioCapacityHeatmapView(), StudioCapacityHeatmapViewProps, StudioGovernanceHub(), StudioNetMultiplierView(), StudioNetMultiplierViewProps, StudioPortfolioDashboard(), StudioPortfolioDashboardProps (+44 more)

### Community 12 - "useAuth"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.17
Nodes (22): convertLead(), createAccount(), createContact(), createDeal(), createLead(), deleteAccount(), deleteContact(), deleteDeal() (+14 more)

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.22
Nodes (11): DEFAULT_STATUS_COLUMNS, KanbanBoard(), KanbanBoardProps, statusOrder, TaskCard(), TaskCardProps, TaskListView(), TaskListViewProps (+3 more)

### Community 15 - "test-logic.js"
Cohesion: 0.09
Nodes (19): RoleHierarchyTree(), TenantUserRecord, UserManagementView(), WorkflowListView(), OutgoingEmailConfig(), ModuleManagerView(), HubCardProps, SettingsHub() (+11 more)

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.13
Nodes (19): createRedisConnection(), getRedisClient(), redisConnectionOptions, DealStageUpdatedPayload, defaultJobOptions, EmailJobPayload, emailQueue, enqueueEmailJob() (+11 more)

### Community 17 - "serve-dist.js"
Cohesion: 0.14
Nodes (19): CatalogListView(), CatalogStats, DEFAULT_MOCK_PRICE_BOOKS, DEFAULT_MOCK_PRODUCTS, useCatalog(), UseCatalogReturn, LineItemEditor(), LineItemEditorProps (+11 more)

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
Cohesion: 0.12
Nodes (22): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+14 more)

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
Cohesion: 0.04
Nodes (48): autoprefixer, axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react (+40 more)

### Community 28 - "zod"
Cohesion: 0.20
Nodes (11): disconnectDatabase(), disconnectRedis(), app, handleShutdown(), server, handleShutdown(), server, createEmailWorker() (+3 more)

### Community 29 - "useAuth"
Cohesion: 0.13
Nodes (14): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, rootDir (+6 more)

### Community 30 - "vite.config.ts.timestamp-1787143040639-27d7f1ed9db03.mjs"
Cohesion: 0.16
Nodes (10): app, authLimiter, runRecurringTasksCron(), crmRouter, cronRouter, mcpRouter, ppmRouter, projectManagementRouter (+2 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.18
Nodes (27): createOrUpdateEmailTemplate(), createOrUpdateProfile(), createOrUpdateRole(), createOrUpdateUser(), createWorkflowRule(), DEFAULT_ACTIVE_MODULES, DEFAULT_AUTO_NUMBERING, DEFAULT_COMPANY_DETAILS (+19 more)

### Community 32 - "dependencies"
Cohesion: 0.13
Nodes (20): AppLayout(), Header(), Sidebar(), useAuth(), RealtimeRoomOptions, useRealtimeRoom(), QuoteToProjectModal(), EntityEditView() (+12 more)

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
Cohesion: 0.11
Nodes (24): CreateTaskModal(), ProjectHeader(), ProjectContext, ProjectContextType, ProjectProviderProps, useProject(), Account360Summary, fallbackDeals (+16 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.29
Nodes (8): enqueueWorkflowEvent(), UpdateDealInput, updateDealWithEvents(), UpdateTaskInput, TenantTransactionCallback, withTenantTx(), interpolateTemplateTokens(), sendEmailMessage()

### Community 40 - "AuthContext.tsx"
Cohesion: 0.22
Nodes (13): AuthContextType, MilestoneStatus, ProjectDeliverable, RecurrenceRule, Task, AgentType, Lead, LeadStatus (+5 more)

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
Cohesion: 0.19
Nodes (10): react, react, BLUEPRINTS, COLOR_PALETTES, CreateHierarchyModal(), HierarchyBreadcrumbs(), HierarchySidebarTree(), TaskMindMapView() (+2 more)

### Community 47 - "test-crm-conversion.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.39
Nodes (6): handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, GeneratedTasksResult, generateTasksFromMeetingNotes(), summarizeAccountContext()

### Community 49 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 50 - "package.json"
Cohesion: 0.30
Nodes (11): HierarchyContext, HierarchyContextType, hierarchyService, Folder, HierarchyBreadcrumbItem, HierarchyScope, HierarchyTreeResponse, Space (+3 more)

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
Cohesion: 0.31
Nodes (8): createFolder(), createList(), createSpace(), DEFAULT_CLICK_APPS, DEFAULT_SPACE_STATUSES, getHierarchyTree(), nestTask(), hierarchyRouter

### Community 62 - "AuthContext.tsx"
Cohesion: 0.22
Nodes (8): App(), AuthContext, AuthProvider(), AuthProviderProps, TenantInfo, HierarchyProvider(), ProjectProvider(), queryClient

### Community 85 - "ProjectCosting.tsx"
Cohesion: 0.13
Nodes (16): CreateTaskModalProps, TaskCalendarView(), TaskCalendarViewProps, BASE_TEAM_MEMBERS, TaskWorkloadView(), TaskWorkloadViewProps, UserWorkloadData, DependencyConflict (+8 more)

## Knowledge Gaps
- **374 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+369 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `DynamicFieldRenderer.tsx` to `crm.ts`, `index.js`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `App.tsx`, `dependencies`, `compilerOptions`, `settingsRoutes.tsx`, `test-logic.js`, `serve-dist.js`, `package.json`, `AuthContext.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `dependencies` to `crm.ts`, `index.ts`, `scripts`, `DynamicFieldRenderer.tsx`, `useFirestoreCRM.ts`, `scripts`, `test-logic.js`, `package.json`, `AuthContext.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `react` connect `GanttChart.tsx` to `DynamicFieldRenderer.tsx`, `vite.config.ts`, `ProjectCosting.tsx`, `AuthContext.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _374 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1431451612903226 - nodes in this community are weakly interconnected._
- **Should `crm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07985480943738657 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11711711711711711 - nodes in this community are weakly interconnected._