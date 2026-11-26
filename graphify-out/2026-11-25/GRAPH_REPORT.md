# Graph Report - Shogun Projects  (2026-11-24)

## Corpus Check
- 290 files · ~233,240 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1750 nodes · 3632 edges · 99 communities (86 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96b15d94`
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
- popiaWorker.ts
- bookingRoutes.ts
- EntityListView.tsx
- EntityEditView.tsx
- catalogController.ts
- ConvertDealModal.tsx
- crm.ts
- popiaRoutes.ts
- EntityEditView.tsx
- socket.ts
- mcpRoutes.ts
- DealKanbanBoard.tsx
- SettingsLayout.tsx
- cors
- react
- CustomFieldsPanel.tsx
- MultiAssigneeSelector.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 60 edges
2. `apiClient` - 48 edges
3. `withTenantTx()` - 42 edges
4. `useCurrency()` - 38 edges
5. `createRedisConnection()` - 27 edges
6. `getTenantId()` - 24 edges
7. `Task` - 23 edges
8. `BookingService` - 20 edges
9. `getTenantId()` - 19 edges
10. `sendControllerError()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `TaskCalendarView()` --references--> `react`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → package.json
- `UniversalViewBar()` --references--> `react`  [EXTRACTED]
  src/components/views/UniversalViewBar.tsx → package.json
- `HierarchyProvider()` --references--> `react`  [EXTRACTED]
  src/context/HierarchyContext.tsx → package.json
- `CreateTaskModalProps` --references--> `Task`  [EXTRACTED]
  src/components/dashboard/CreateTaskModal.tsx → src/types/index.ts
- `CustomFieldsPanel()` --calls--> `useCurrency()`  [EXTRACTED]
  src/components/tasks/CustomFieldsPanel.tsx → src/context/CurrencyContext.tsx

## Import Cycles
- None detected.

## Communities (99 total, 13 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.09
Nodes (24): ProfileMatrixTable(), AutoNumberingConfigView(), LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload (+16 more)

### Community 1 - "crm.ts"
Cohesion: 0.17
Nodes (11): AuditTrailEntry, ExpenseCategory, ExpenseEntry, ExpenseStatus, Portfolio, ProjectBudget, ResourceProfile, RiskCategory (+3 more)

### Community 2 - "index.js"
Cohesion: 0.25
Nodes (9): ALL_VIEW_TABS, UniversalViewBarProps, ViewFilterState, ViewGroupBy, ViewMode, ViewSortState, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER (+1 more)

### Community 3 - "index.ts"
Cohesion: 0.17
Nodes (23): useCurrency(), ProjectContext, ProjectContextType, ProjectProviderProps, useProject(), Account360Drawer(), ConvertDealModal(), ConvertDealModalProps (+15 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (32): Account, AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, Contact, ContactEntity, CRMEntity (+24 more)

### Community 5 - "scripts"
Cohesion: 0.14
Nodes (32): COLOR_OPTIONS, ColumnConfigModal(), ColumnConfigModalProps, CreateTaskModal(), CreateTaskModalProps, COLUMN_COLORS, PRIORITY_META, ProjectBoard() (+24 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.13
Nodes (25): WorkflowBuilderModal(), WorkflowBuilderModalProps, WorkflowListView(), LinearRuleBuilderProps, ConditionOperator, SupportedModule, WorkflowAction, WorkflowCondition (+17 more)

### Community 7 - "compilerOptions"
Cohesion: 0.13
Nodes (13): AdvancedRecurrenceModalProps, DEFAULT_RECURRENCE, AVAILABLE_TEAM_MEMBERS, MultiAssigneeSelectorProps, TaskDependenciesPanelProps, AdvancedRecurrenceConfig, CustomFieldOption, CustomFieldValue (+5 more)

### Community 8 - "App.tsx"
Cohesion: 0.06
Nodes (55): createPriceBook(), createProduct(), createTaxInvoice(), deleteProduct(), fulfillDeliverable(), getPriceBooks(), getProductById(), getProducts() (+47 more)

### Community 9 - "settings.ts"
Cohesion: 0.11
Nodes (6): hierarchicalSample, mockSpaces, mockTasks, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER, STATUS_BUCKET_DEFS

### Community 10 - "dependencies"
Cohesion: 0.15
Nodes (6): NodeConfigDrawerProps, ActionNode, ConditionNode, DelayNode, TriggerNode, WorkflowCanvasProps

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
Cohesion: 0.14
Nodes (15): DEFAULT_STATUS_COLUMNS, KanbanBoardProps, statusOrder, TaskCard(), TaskCardProps, TaskCalendarView(), TaskCalendarViewProps, TaskListViewProps (+7 more)

### Community 15 - "settingsRoutes.tsx"
Cohesion: 0.14
Nodes (11): RoleHierarchyTree(), ModuleManagerView(), HubCardProps, SettingsHub(), DataSharingRulesView(), ScheduledCronView(), WebhooksGatewayView(), NotificationDispatcherView() (+3 more)

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.09
Nodes (42): createRedisConnection(), disconnectRedis(), redisConnectionOptions, RedisSslConfig, accountingSyncQueue, DealStageUpdatedPayload, defaultJobOptions, EmailJobPayload (+34 more)

### Community 17 - "serve-dist.js"
Cohesion: 0.15
Nodes (13): AppendPopiaAuditParams, buildSubjectExportCsv(), DEFAULT_POPIA_RETENTION_POLICIES, escapeCsvCell(), PopiaAuditAction, PopiaConsentPurpose, popiaDsrService, PopiaErasureResult (+5 more)

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
Nodes (38): prisma, devDependencies, prisma, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken (+30 more)

### Community 22 - "express-rate-limit"
Cohesion: 0.15
Nodes (10): @prisma/client, @prisma/client, __dirname, __filename, testConnections(), prisma, runAuditVerification(), prisma (+2 more)

### Community 23 - "nodemailer"
Cohesion: 0.09
Nodes (29): AvailabilitySettings(), AvailabilitySettingsProps, DAYS_OF_WEEK, BookingDetailModal(), BookingDetailModalProps, BookingsTable(), BookingsTableProps, BookingTypeManager() (+21 more)

### Community 24 - "postcss.config.js"
Cohesion: 0.10
Nodes (20): src/**/__tests__/*, compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+12 more)

### Community 25 - "vite-env.d.ts"
Cohesion: 0.10
Nodes (39): createDrawingSheet(), createRfi(), createSiteReport(), getDrawingSheets(), getProjectPhases(), getRfiLog(), getSiteReports(), getStudioCapacityHeatmap() (+31 more)

### Community 26 - "tailwind.config.js"
Cohesion: 0.15
Nodes (21): ContactDetailViewProps, EscalateToTaskModal(), EscalateToTaskModalProps, LinkContactModal(), LinkContactModalProps, AVAILABLE_PLATFORMS, ListeningRulesModal(), ListeningRulesModalProps (+13 more)

### Community 27 - "vite.config.ts"
Cohesion: 0.04
Nodes (48): autoprefixer, axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react (+40 more)

### Community 28 - "zod"
Cohesion: 0.11
Nodes (25): AccountingSyncJobPayload, enqueueAccountingSyncJob(), createCheckoutBodySchema, peachWebhookRouter, portalPaymentRouter, clearPeachLocalTokenCache(), computePeachWebhookSignature(), createCheckoutSession() (+17 more)

### Community 29 - "useAuth"
Cohesion: 0.10
Nodes (17): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, publicHtaccess (+9 more)

### Community 30 - "WorkflowCanvas.tsx"
Cohesion: 0.23
Nodes (11): CatalogListView(), CatalogStats, useCatalog(), UseCatalogReturn, PriceBookManager(), ProductModal(), ProductModalProps, BillingFrequency (+3 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.09
Nodes (43): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+35 more)

### Community 32 - "dependencies"
Cohesion: 0.17
Nodes (12): AppLayout(), Header(), Sidebar(), DashboardPage(), LoginPage(), McpServersPage(), ProjectsPage(), renderCatalogRoutes() (+4 more)

### Community 33 - "devDependencies"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 34 - "inventoryService.ts"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 35 - "useCatalog.ts"
Cohesion: 0.22
Nodes (12): AuditReport, runCrmAudit(), emailQueue, evaluateCustomWorkflows(), processDealStageUpdated(), ConditionData, evaluateCondition(), getNestedProperty() (+4 more)

### Community 36 - "Project"
Cohesion: 0.15
Nodes (12): 1. Executive Summary & Core Mission, 2. Architectural Pillars & Core Subsystems, 3.1. Pluggable Module Architecture, 3.2. Dynamic Schema & Layout Customization, 3.3. Enterprise Security & Hierarchy (VTiger / Salesforce Model), 3.4. Hybrid Agentic AI & MCP Integration, 3.5. Financial Scope & Cost/Margin Governance, 3.6. External Stakeholder & Client Portal (+4 more)

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.13
Nodes (22): socialRouter, EscalateTaskPayload, InboundSocialPayload, LinkContactPayload, OutboundReplyPayload, SocialIntent, SocialInteractionModel, SocialInteractionStatus (+14 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.14
Nodes (18): handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, ExternalLlmInvokeFn, GeneratedTasksResult, generateTasksFromMeetingNotes(), setExternalLlmProvider(), summarizeAccountContext() (+10 more)

### Community 40 - "AuthContext.tsx"
Cohesion: 0.16
Nodes (26): createForm(), deleteForm(), formsStore, getFormById(), getForms(), getFormSubmissions(), getInitialForms(), getPublicForm() (+18 more)

### Community 41 - "EntityModuleName"
Cohesion: 0.20
Nodes (9): BackgroundProps, Connection, ControlsProps, Edge, HandleProps, Node, Position, ReactFlowProps (+1 more)

### Community 43 - "scripts"
Cohesion: 0.21
Nodes (11): bankersRound2(), LineItemEditor(), LineItemEditorProps, QUOTE_CURRENCIES, VAT_MODES, QuoteToProjectModal(), QuoteToProjectModalProps, LineItem (+3 more)

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.27
Nodes (7): extractCustomFields(), IdMapper, loadSourceDataset(), normalizeTimestamp(), prisma, runETLMigration(), SourceDataset

### Community 45 - "GanttChart.tsx"
Cohesion: 0.16
Nodes (17): CreateTaskModal(), CreateTaskModalProps, MilestoneStatus, ProjectDeliverable, ProjectMilestone, RecurrenceRule, SupportedQuoteCurrency, Task (+9 more)

### Community 47 - "test-crm-conversion.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.16
Nodes (11): ConvertLeadModal(), ConvertLeadModalProps, RelatedListsNav(), SubPanelTab, BBBEE_RECOGNITION_MAP, SaComplianceBadgeBar(), SaComplianceBadgeBarProps, useEntityRecord() (+3 more)

### Community 49 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 50 - "package.json"
Cohesion: 0.26
Nodes (9): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper(), InlineEditWrapperProps (+1 more)

### Community 52 - "package.json"
Cohesion: 0.13
Nodes (19): getRedisClient(), buildRedactionRedisKey(), isValidLuhn(), isValidSouthAfricanId(), loadVaultRecord(), localEphemeralVault, persistVaultRecord(), PiiRedactorOptions (+11 more)

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
Cohesion: 0.20
Nodes (9): MODULE_LABELS, PopiaAuditLogEntry, PopiaExpiryAction, PopiaGovernanceView(), PopiaModuleName, PopiaRetentionPolicy, PopiaSubjectType, RETENTION_PRESETS (+1 more)

### Community 62 - "LineItemEditor.tsx"
Cohesion: 0.22
Nodes (14): TaskMindMapView(), TaskMindMapViewProps, HierarchyContext, HierarchyContextType, useHierarchy(), hierarchyService, Folder, HierarchyBreadcrumbItem (+6 more)

### Community 63 - "zod"
Cohesion: 0.25
Nodes (8): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, EntityEditView(), EntityListView(), MODULE_SCHEMAS, FieldDefinition, PicklistOption

### Community 64 - "helmet"
Cohesion: 0.08
Nodes (24): app, authLimiter, defaultDevOrigins, envOrigins, runRecurringTasksCron(), createFolder(), createList(), createSpace() (+16 more)

### Community 65 - "AdminWorkflowView.tsx"
Cohesion: 0.33
Nodes (4): __dirname, __filename, prisma, TEST_LOGINS

### Community 66 - "RiskDeliverablesView.tsx"
Cohesion: 0.18
Nodes (8): analyzeSentimentAndIntent(), mockDatabase, NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, PRAISE_KEYWORDS, PURCHASE_KEYWORDS, simulateInboundIngestion(), SUPPORT_KEYWORDS

### Community 67 - "DynamicFieldRenderer.tsx"
Cohesion: 0.17
Nodes (11): CustomFieldsPanel(), CustomFieldsPanelProps, DEFAULT_DEFINITIONS, CurrencyContext, CurrencyContextType, CurrencyOption, CurrencyProviderProps, FormatCurrencyOptions (+3 more)

### Community 74 - "EntityListView.tsx"
Cohesion: 0.17
Nodes (11): useAuth(), RealtimeRoomOptions, useRealtimeRoom(), SchedulerPage(), TenantUserRecord, UserManagementView(), EmailTemplateEditor(), OutgoingEmailConfig() (+3 more)

### Community 81 - "popiaWorker.ts"
Cohesion: 0.23
Nodes (14): RFC-4122, executeRightToErasure(), exportSubjectData(), scrubCustomFieldsPii(), POPIA_TENANT_NAMESPACE_BYTES, PopiaRlsTxOptions, toTenantUuid(), withPopiaRlsTx() (+6 more)

### Community 82 - "bookingRoutes.ts"
Cohesion: 0.13
Nodes (22): createBooking(), createBookingType(), createPublicBooking(), deleteBooking(), deleteBookingType(), getAvailability(), getBookingById(), getPublicBookingTypeMeta() (+14 more)

### Community 83 - "EntityListView.tsx"
Cohesion: 0.08
Nodes (19): __dirname, __filename, __dirname, __filename, __dirname, __filename, __dirname, __filename (+11 more)

### Community 84 - "EntityEditView.tsx"
Cohesion: 0.10
Nodes (33): RFC-1918, APPROVED_SA_S3_REGIONS, bootResidencyAudit, DataResidencyRegion, EnvConfig, envSchema, evaluateDataResidency(), extractHostname() (+25 more)

### Community 85 - "catalogController.ts"
Cohesion: 0.13
Nodes (30): convertLead(), createAccount(), createContact(), createDeal(), createLead(), deleteAccount(), deleteContact(), deleteDeal() (+22 more)

### Community 86 - "ConvertDealModal.tsx"
Cohesion: 0.17
Nodes (11): tests/**/*, ./tsconfig.json, compilerOptions, noEmit, rootDir, exclude, extends, include (+3 more)

### Community 87 - "crm.ts"
Cohesion: 0.18
Nodes (14): Account360DrawerProps, fallbackAccounts, UseAccountsResult, fallbackContacts, UseContactsResult, Account, AccountStatus, AccountTier (+6 more)

### Community 88 - "popiaRoutes.ts"
Cohesion: 0.20
Nodes (9): consentMutationSchema, dsrEraseSchema, dsrExportSchema, INFORMATION_OFFICER_ROLES, popiaRouter, putPoliciesBodySchema, requireInformationOfficerOrAdmin(), retentionPolicyItemSchema (+1 more)

### Community 89 - "EntityEditView.tsx"
Cohesion: 0.17
Nodes (13): Account360Summary, EntityHeader(), EntityHeaderProps, EntityLookupModal(), EntityLookupModalProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps (+5 more)

### Community 90 - "socket.ts"
Cohesion: 0.16
Nodes (15): disconnectDatabase(), env, app, handleShutdown(), server, handleShutdown(), server, AuthenticatedSocket (+7 more)

### Community 91 - "mcpRoutes.ts"
Cohesion: 0.32
Nodes (20): createChangeRequest(), createDocument(), evaluateWorkflowRules(), generateInvoice(), getAnalyticsMetrics(), getClientPortalData(), getCriticalPath(), getDocuments() (+12 more)

### Community 92 - "DealKanbanBoard.tsx"
Cohesion: 0.26
Nodes (10): projectManagementService, ClientChangeRequestItem, CriticalPathData, PmAnalyticsMetrics, ProjectDocumentItem, ProjectInvoiceItem, ResourceWorkloadItem, TimesheetItem (+2 more)

### Community 93 - "SettingsLayout.tsx"
Cohesion: 0.28
Nodes (6): SettingsHeader(), SettingsHeaderProps, SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 94 - "cors"
Cohesion: 0.40
Nodes (7): formatSaQuoteCurrency(), ClientPortalInvoicesPage(), InvoicePaymentModal(), InvoicePaymentModalProps, SA_PAYMENT_RAILS, SaPaymentRail, TaxInvoice

### Community 96 - "react"
Cohesion: 0.12
Nodes (16): react, react, App(), UniversalViewBar(), AuthContext, AuthContextType, AuthProvider(), AuthProviderProps (+8 more)

### Community 97 - "CustomFieldsPanel.tsx"
Cohesion: 0.31
Nodes (8): CurrencyProvider(), formatCurrencyAmount(), parseCurrency(), SUPPORTED_CURRENCIES, AuditTrailView(), CompanyBrandingView(), CurrencyFiscalView(), CompanyDetails

## Knowledge Gaps
- **542 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+537 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `EntityEditView.tsx` to `AuthContext.tsx`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `compilerOptions`, `LayoutEditor.tsx`, `settingsRoutes.tsx`, `settingsRoutes.tsx`, `nodemailer`, `tailwind.config.js`, `WorkflowCanvas.tsx`, `dependencies`, `scripts`, `GanttChart.tsx`, `seed-and-test-crm.ts`, `bcryptjs`, `LineItemEditor.tsx`, `zod`, `DynamicFieldRenderer.tsx`, `EntityListView.tsx`, `crm.ts`, `DealKanbanBoard.tsx`, `cors`, `react`, `CustomFieldsPanel.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `EntityListView.tsx` to `dependencies`, `react`, `AuthContext.tsx`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `scripts`, `GanttChart.tsx`, `settingsRoutes.tsx`, `seed-and-test-crm.ts`, `nodemailer`, `EntityEditView.tsx`, `tailwind.config.js`, `bcryptjs`, `SettingsLayout.tsx`, `LineItemEditor.tsx`, `zod`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `vite.config.ts`, `settingsRoutes.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _542 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09359605911330049 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.14482029598308668 - nodes in this community are weakly interconnected._