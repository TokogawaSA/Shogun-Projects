# Graph Report - Shogun Projects  (2026-11-26)

## Corpus Check
- 299 files · ~247,803 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1848 nodes · 4146 edges · 99 communities (83 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d17cf0c`
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
- apply-rls-payments.ts
- LineItemEditor.tsx
- zod
- XeroAdapter
- AdminWorkflowView.tsx
- RiskDeliverablesView.tsx
- cors
- helmet
- cron-trigger.sh
- ioredis
- nodemailer
- WorkflowBuilderModal.tsx
- socket.io
- bookingRoutes.ts
- EntityListView.tsx
- EntityEditView.tsx
- catalogController.ts
- ConvertDealModal.tsx
- scripts
- popiaRoutes.ts
- package.json
- socket.ts
- mcpRoutes.ts
- DealKanbanBoard.tsx
- SettingsLayout.tsx
- RedactionRedisStore
- react
- @types/react-dom
- Shogun Projects: South African Market Localization & Sovereignty Addendum (`SA_LOCALIZATION_SPEC.md`)

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 66 edges
2. `withTenantTx()` - 54 edges
3. `apiClient` - 50 edges
4. `useCurrency()` - 28 edges
5. `createRedisConnection()` - 27 edges
6. `getTenantId()` - 24 edges
7. `InvoiceSystemView()` - 22 edges
8. `Task` - 22 edges
9. `sendCatalogError()` - 20 edges
10. `getTenantId()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TaskCalendarView()` --references--> `react`  [EXTRACTED]
  src/components/views/TaskCalendarView.tsx → package.json
- `UniversalViewBar()` --references--> `react`  [EXTRACTED]
  src/components/views/UniversalViewBar.tsx → package.json
- `HierarchyProvider()` --references--> `react`  [EXTRACTED]
  src/context/HierarchyContext.tsx → package.json
- `ProjectContextType` --references--> `Project`  [EXTRACTED]
  src/context/ProjectContext.tsx → src/types/index.ts
- `QuoteToProjectModalProps` --references--> `Quote`  [EXTRACTED]
  src/modules/catalog/lineItems/QuoteToProjectModal.tsx → src/types/catalogAndProjects.ts

## Import Cycles
- None detected.

## Communities (99 total, 16 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.09
Nodes (25): ProfileMatrixTable(), AutoNumberingConfigView(), LayoutEditor(), PicklistEditorModal(), PicklistEditorModalProps, AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload (+17 more)

### Community 1 - "crm.ts"
Cohesion: 0.17
Nodes (11): AuditTrailEntry, ExpenseCategory, ExpenseEntry, ExpenseStatus, Portfolio, ProjectBudget, ResourceProfile, RiskCategory (+3 more)

### Community 2 - "index.js"
Cohesion: 0.25
Nodes (9): ALL_VIEW_TABS, UniversalViewBarProps, ViewFilterState, ViewGroupBy, ViewMode, ViewSortState, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER (+1 more)

### Community 3 - "index.ts"
Cohesion: 0.12
Nodes (13): MultiAssigneeSelectorProps, Account360Summary, ConvertLeadModal(), ConvertLeadModalProps, UseEntityRecordResult, AccountingProvider, VatCodeMap, ActivityItem (+5 more)

### Community 4 - "devDependencies"
Cohesion: 0.08
Nodes (29): AccountEntity, AccountEntityType, AccountRating, BaseCRMEntity, ContactEntity, CRMEntity, CRMFieldType, DealEntity (+21 more)

### Community 5 - "scripts"
Cohesion: 0.10
Nodes (57): TaskCalendarView(), BASE_TEAM_MEMBERS, TaskWorkloadView(), COLOR_OPTIONS, ColumnConfigModal(), ColumnConfigModalProps, CreateTaskModal(), CreateTaskModalProps (+49 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.13
Nodes (25): WorkflowBuilderModal(), WorkflowBuilderModalProps, WorkflowListView(), LinearRuleBuilderProps, ConditionOperator, SupportedModule, WorkflowAction, WorkflowCondition (+17 more)

### Community 7 - "compilerOptions"
Cohesion: 0.18
Nodes (10): AdvancedRecurrenceModalProps, DEFAULT_RECURRENCE, TaskDependenciesPanelProps, AdvancedRecurrenceConfig, CustomFieldOption, CustomFieldValue, DependencyRelationType, RecurrenceFrequency (+2 more)

### Community 8 - "App.tsx"
Cohesion: 0.06
Nodes (68): convertQuoteToTaxInvoice(), createPriceBook(), createProduct(), createTaxInvoice(), deleteProduct(), deleteQuote(), deleteTaxInvoice(), extractInvoiceMetaPayload() (+60 more)

### Community 9 - "settings.ts"
Cohesion: 0.11
Nodes (6): hierarchicalSample, mockSpaces, mockTasks, PRIORITY_BUCKET_DEFS, PRIORITY_ORDER, STATUS_BUCKET_DEFS

### Community 10 - "dependencies"
Cohesion: 0.16
Nodes (15): EntityHeader(), EntityHeaderProps, ActivityItem, EntitySummaryWidget(), EntitySummaryWidgetProps, RelatedListsNav(), RelatedListsNavProps, SubPanelTab (+7 more)

### Community 11 - "compilerOptions"
Cohesion: 0.13
Nodes (19): aecService, AecDiscipline, AecPhase, AecStaffRole, AecTask, DrawingSheet, FeeModel, NetMultiplierReport (+11 more)

### Community 12 - "useAuth"
Cohesion: 0.07
Nodes (22): circularChain, cycleRes, enterprisePriceBook, enterprisePricing, evaluateLowStockStatus(), inv1, inv2, inv3 (+14 more)

### Community 13 - "LayoutEditor.tsx"
Cohesion: 0.16
Nodes (25): FormSubmissionsModal(), FormSubmissionsModalProps, WebFormBuilderModal(), WebFormBuilderModalProps, PublicWebFormPage(), formService, ConditionalActionType, ConditionOperator (+17 more)

### Community 14 - "settingsRoutes.tsx"
Cohesion: 0.11
Nodes (27): CreateTaskModal(), CreateTaskModalProps, DEFAULT_STATUS_COLUMNS, KanbanBoardProps, statusOrder, TaskCard(), TaskCardProps, TaskCalendarViewProps (+19 more)

### Community 15 - "settingsRoutes.tsx"
Cohesion: 0.10
Nodes (18): RoleHierarchyTree(), WebFormsManagementView(), MODULE_LABELS, PopiaAuditLogEntry, PopiaExpiryAction, PopiaGovernanceView(), PopiaModuleName, PopiaRetentionPolicy (+10 more)

### Community 16 - "SettingsLayout.tsx"
Cohesion: 0.12
Nodes (17): axios, clsx, lucide-react, dependencies, axios, clsx, lucide-react, react-dom (+9 more)

### Community 17 - "serve-dist.js"
Cohesion: 0.13
Nodes (23): RFC-4122, appendPopiaAuditLog(), AppendPopiaAuditParams, buildSubjectExportCsv(), DEFAULT_POPIA_RETENTION_POLICIES, escapeCsvCell(), executeRightToErasure(), exportSubjectData() (+15 more)

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
Cohesion: 0.05
Nodes (72): createDrawingSheet(), createRfi(), createSiteReport(), getDrawingSheets(), getProjectPhases(), getRfiLog(), getSiteReports(), getStudioCapacityHeatmap() (+64 more)

### Community 26 - "tailwind.config.js"
Cohesion: 0.17
Nodes (20): EscalateToTaskModal(), EscalateToTaskModalProps, LinkContactModal(), LinkContactModalProps, AVAILABLE_PLATFORMS, ListeningRulesModal(), ListeningRulesModalProps, SocialListeningHub() (+12 more)

### Community 27 - "vite.config.ts"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, typescript (+9 more)

### Community 28 - "zod"
Cohesion: 0.12
Nodes (24): AccountingSyncJobPayload, clearPeachLocalTokenCache(), computePeachWebhookSignature(), createCheckoutSession(), CreatePeachCheckoutOptions, generateMerchantTransactionId(), getPeachEndpoints(), getPeachOAuthToken() (+16 more)

### Community 29 - "useAuth"
Cohesion: 0.10
Nodes (17): backendStaging, backendZip, clientDist, __dirname, __filename, frontendZip, htaccessPath, publicHtaccess (+9 more)

### Community 30 - "WorkflowCanvas.tsx"
Cohesion: 0.09
Nodes (76): CatalogListView(), ContextualBillingPanel(), ContextualBillingPanelProps, DocumentPartiesAndDatesSection(), DocumentPartiesAndDatesSectionProps, DocumentPreviewCard(), DocumentPreviewCardProps, useCatalog() (+68 more)

### Community 31 - "EntityDetailView.tsx"
Cohesion: 0.09
Nodes (44): runTests(), generateToken(), getMe(), inviteUser(), inviteUserSchema, login(), loginSchema, register() (+36 more)

### Community 32 - "dependencies"
Cohesion: 0.10
Nodes (23): Sidebar(), AuthContext, AuthContextType, AuthProviderProps, TenantInfo, useAuth(), RealtimeRoomOptions, useRealtimeRoom() (+15 more)

### Community 33 - "devDependencies"
Cohesion: 0.18
Nodes (7): builtTree, contextMap, evaluateAllConditions(), evaluateCondition(), flatRolesSample, resolvedOutput, sampleDeal

### Community 34 - "inventoryService.ts"
Cohesion: 0.17
Nodes (3): gateway, mockAccountData, MockSocketGateway

### Community 35 - "useCatalog.ts"
Cohesion: 0.18
Nodes (16): AuditReport, runCrmAudit(), DealStageUpdatedPayload, emailQueue, TaskStatusChangedPayload, createWorkflowWorker(), evaluateCustomWorkflows(), processDealStageUpdated() (+8 more)

### Community 36 - "Project"
Cohesion: 0.15
Nodes (12): 1. Executive Summary & Core Mission, 2. Architectural Pillars & Core Subsystems, 3.1. Pluggable Module Architecture, 3.2. Dynamic Schema & Layout Customization, 3.3. Enterprise Security & Hierarchy (VTiger / Salesforce Model), 3.4. Hybrid Agentic AI & MCP Integration, 3.5. Financial Scope & Cost/Margin Governance, 3.6. External Stakeholder & Client Portal (+4 more)

### Community 38 - "DynamicFieldRenderer.tsx"
Cohesion: 0.13
Nodes (23): socialRouter, broadcastToTenant(), EscalateTaskPayload, InboundSocialPayload, LinkContactPayload, OutboundReplyPayload, SocialIntent, SocialInteractionModel (+15 more)

### Community 39 - "settingsController.ts"
Cohesion: 0.23
Nodes (9): handleGenerateTasks(), handleSummarizeAccount(), AccountContextSummary, ExternalLlmInvokeFn, GeneratedTasksResult, generateTasksFromMeetingNotes(), setExternalLlmProvider(), summarizeAccountContext() (+1 more)

### Community 40 - "AuthContext.tsx"
Cohesion: 0.16
Nodes (25): createForm(), deleteForm(), formsStore, getFormById(), getForms(), getFormSubmissions(), getPublicForm(), getTenantForms() (+17 more)

### Community 41 - "EntityModuleName"
Cohesion: 0.20
Nodes (9): BackgroundProps, Connection, ControlsProps, Edge, HandleProps, Node, Position, ReactFlowProps (+1 more)

### Community 43 - "scripts"
Cohesion: 0.09
Nodes (19): app, authLimiter, defaultDevOrigins, envOrigins, runRecurringTasksCron(), accountingRouter, calendarRouter, catalogRouter (+11 more)

### Community 44 - "Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition"
Cohesion: 0.27
Nodes (7): extractCustomFields(), IdMapper, loadSourceDataset(), normalizeTimestamp(), prisma, runETLMigration(), SourceDataset

### Community 45 - "GanttChart.tsx"
Cohesion: 0.24
Nodes (11): AppLayout(), Header(), useProject(), ProjectWorkspace(), McpServersPage(), ProjectsPage(), renderCatalogRoutes(), renderCrmRoutes() (+3 more)

### Community 47 - "test-crm-conversion.js"
Cohesion: 0.33
Nodes (5): __dirname, distDir, __filename, MIME_TYPES, server

### Community 48 - "seed-and-test-crm.ts"
Cohesion: 0.33
Nodes (8): ALLOWED_MCP_AGENTS, enforceOffshoreAiConsentGuard(), executeGuardedMcpTool(), mcpRouter, resolveClientIp(), resolveMcpActorAgent(), PopiaActorAgent, isOffshoreAiProcessingAllowed()

### Community 49 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (4): Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition, Architectural Stack Matrix (Consolidated PostgreSQL Edition), Multi-Tenancy & Security Directives, Operational Control Model

### Community 50 - "package.json"
Cohesion: 0.12
Nodes (23): CustomFieldsPanel(), CustomFieldsPanelProps, DEFAULT_DEFINITIONS, CurrencyContext, CurrencyContextType, CurrencyOption, CurrencyProvider(), CurrencyProviderProps (+15 more)

### Community 52 - "package.json"
Cohesion: 0.17
Nodes (17): buildRedactionRedisKey(), isValidLuhn(), isValidSouthAfricanId(), loadVaultRecord(), localEphemeralVault, persistVaultRecord(), PiiRedactorOptions, PiiTokenCategory (+9 more)

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
Cohesion: 0.15
Nodes (6): NodeConfigDrawerProps, ActionNode, ConditionNode, DelayNode, TriggerNode, WorkflowCanvasProps

### Community 60 - "package-cpanel.js"
Cohesion: 0.26
Nodes (9): DynamicFieldRenderer(), formatDate(), getBadgeClasses(), toInputDate(), EntityBlocksViewer(), EntityBlocksViewerProps, InlineEditWrapper(), InlineEditWrapperProps (+1 more)

### Community 61 - "apply-rls-payments.ts"
Cohesion: 0.27
Nodes (8): DynamicFieldRendererProps, MassEditModal(), MassEditModalProps, EntityEditView(), EntityListView(), MODULE_SCHEMAS, FieldDefinition, PicklistOption

### Community 62 - "LineItemEditor.tsx"
Cohesion: 0.14
Nodes (19): App(), AuthProvider(), HierarchyContext, HierarchyContextType, HierarchyProvider(), ProjectContext, ProjectContextType, ProjectProvider() (+11 more)

### Community 63 - "zod"
Cohesion: 0.29
Nodes (8): CatalogStats, UseCatalogReturn, ProductModal(), ProductModalProps, BillingFrequency, PriceBook, ProductOrService, ProductOrServiceType

### Community 64 - "XeroAdapter"
Cohesion: 0.31
Nodes (8): createFolder(), createList(), createSpace(), DEFAULT_CLICK_APPS, DEFAULT_SPACE_STATUSES, getHierarchyTree(), nestTask(), hierarchyRouter

### Community 65 - "AdminWorkflowView.tsx"
Cohesion: 0.33
Nodes (4): __dirname, __filename, prisma, TEST_LOGINS

### Community 66 - "RiskDeliverablesView.tsx"
Cohesion: 0.18
Nodes (8): analyzeSentimentAndIntent(), mockDatabase, NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, PRAISE_KEYWORDS, PURCHASE_KEYWORDS, simulateInboundIngestion(), SUPPORT_KEYWORDS

### Community 82 - "bookingRoutes.ts"
Cohesion: 0.13
Nodes (23): createBooking(), createBookingType(), createPublicBooking(), deleteBooking(), deleteBookingType(), getAvailability(), getBookingById(), getPublicBookingTypeMeta() (+15 more)

### Community 83 - "EntityListView.tsx"
Cohesion: 0.07
Nodes (18): __dirname, __filename, __dirname, __filename, __dirname, __filename, __dirname, __filename (+10 more)

### Community 84 - "EntityEditView.tsx"
Cohesion: 0.11
Nodes (32): RFC-1918, APPROVED_SA_S3_REGIONS, DataResidencyRegion, EnvConfig, envSchema, evaluateDataResidency(), extractHostname(), isApprovedSouthAfricanHost() (+24 more)

### Community 85 - "catalogController.ts"
Cohesion: 0.08
Nodes (46): parseEnv(), createRedisConnection(), disconnectRedis(), getRedisClient(), getRedisOptions(), getRedisSslConfig(), redisConnectionOptions, RedisSslConfig (+38 more)

### Community 86 - "ConvertDealModal.tsx"
Cohesion: 0.17
Nodes (11): tests/**/*, ./tsconfig.json, compilerOptions, noEmit, rootDir, exclude, extends, include (+3 more)

### Community 87 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:all, dev, package:cpanel, preview, test, typecheck

### Community 88 - "popiaRoutes.ts"
Cohesion: 0.18
Nodes (10): consentMutationSchema, dsrEraseSchema, dsrExportSchema, INFORMATION_OFFICER_ROLES, popiaRouter, putPoliciesBodySchema, requireInformationOfficerOrAdmin(), retentionPolicyItemSchema (+2 more)

### Community 89 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 90 - "socket.ts"
Cohesion: 0.24
Nodes (10): disconnectDatabase(), bootResidencyAudit, env, app, handleShutdown(), server, handleShutdown(), server (+2 more)

### Community 91 - "mcpRoutes.ts"
Cohesion: 0.10
Nodes (63): cascadeProjectSchedule(), createChangeRequest(), createDocument(), evaluateWorkflowRules(), generateInvoice(), getAnalyticsMetrics(), getClientPortalData(), getCriticalPath() (+55 more)

### Community 92 - "DealKanbanBoard.tsx"
Cohesion: 0.26
Nodes (10): projectManagementService, ClientChangeRequestItem, CriticalPathData, PmAnalyticsMetrics, ProjectDocumentItem, ProjectInvoiceItem, ResourceWorkloadItem, TimesheetItem (+2 more)

### Community 93 - "SettingsLayout.tsx"
Cohesion: 0.28
Nodes (6): SettingsHeader(), SettingsHeaderProps, SETTINGS_CATEGORIES, SettingsCategory, SettingsSidebar(), SettingsLayout()

### Community 96 - "react"
Cohesion: 0.67
Nodes (3): react, react, UniversalViewBar()

## Knowledge Gaps
- **554 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+549 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `dependencies` to `AuthContext.tsx`, `index.ts`, `scripts`, `useFirestoreCRM.ts`, `dependencies`, `GanttChart.tsx`, `settingsRoutes.tsx`, `settingsRoutes.tsx`, `package.json`, `nodemailer`, `SettingsLayout.tsx`, `WorkflowCanvas.tsx`, `tailwind.config.js`, `apply-rls-payments.ts`, `LineItemEditor.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `apiClient` connect `index.ts` to `dependencies`, `AuthContext.tsx`, `scripts`, `useFirestoreCRM.ts`, `dependencies`, `compilerOptions`, `GanttChart.tsx`, `settingsRoutes.tsx`, `settingsRoutes.tsx`, `LayoutEditor.tsx`, `package.json`, `nodemailer`, `LineItemEditor.tsx`, `tailwind.config.js`, `DealKanbanBoard.tsx`, `apply-rls-payments.ts`, `WorkflowCanvas.tsx`, `zod`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `SettingsLayout.tsx`, `scripts`, `LineItemEditor.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _554 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07586206896551724 - nodes in this community are weakly interconnected._