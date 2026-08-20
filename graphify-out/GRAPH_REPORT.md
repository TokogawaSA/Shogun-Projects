# Graph Report - .  (2026-08-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 436 nodes · 808 edges · 31 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 39 edges
2. `db` - 22 edges
3. `useProject()` - 17 edges
4. `compilerOptions` - 16 edges
5. `useDeals()` - 11 edges
6. `Deal` - 11 edges
7. `Project` - 11 edges
8. `compilerOptions` - 10 edges
9. `useAccounts()` - 10 edges
10. `Task` - 10 edges

## Surprising Connections (you probably didn't know these)
- `ProjectsPage()` --references--> `react`  [EXTRACTED]
  src/components/projects/ProjectsPage.tsx → package.json
- `UserManagementView()` --calls--> `useAuth()`  [EXTRACTED]
  src/modules/settings/views/AccessViews.tsx → src/context/AuthContext.tsx
- `ProjectContextType` --references--> `Project`  [EXTRACTED]
  src/context/ProjectContext.tsx → src/types/index.ts
- `AppLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/context/AuthContext.tsx
- `ConvertDealModalProps` --references--> `Deal`  [EXTRACTED]
  src/components/crm/ConvertDealModal.tsx → src/types/crm.ts

## Import Cycles
- None detected.

## Communities (31 total, 0 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.11
Nodes (33): App(), columns, initialFallbackTasks, KanbanBoard(), ProjectHeader(), statusOrder, TaskCard(), TaskCardProps (+25 more)

### Community 1 - "crm.ts"
Cohesion: 0.15
Nodes (31): Account360Drawer(), Account360DrawerProps, AccountDirectory(), ContactDirectory(), lifecycleBadges, DealKanbanBoard(), StageColumnConfig, stageConfigs (+23 more)

### Community 2 - "index.js"
Cohesion: 0.07
Nodes (23): admin, scheduler_1, admin, https_1, admin, firestore_1, admin, db (+15 more)

### Community 3 - "index.ts"
Cohesion: 0.09
Nodes (24): evaluateClientHealth, inboundLeadWebhook, onDealStageUpdated, db, onTaskStatusChange, AccountContextSummary, generateTasksFromMeetingNotes(), summarizeAccountContext() (+16 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+21 more)

### Community 5 - "scripts"
Cohesion: 0.07
Nodes (29): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, nodemailer, shogun-projects, devDependencies (+21 more)

### Community 6 - "useFirestoreCRM.ts"
Cohesion: 0.12
Nodes (18): ConvertDealModal(), ConvertDealModalProps, CRMDirectory(), DirectoryTab, DealPipeline(), StageColumnConfig, stageConfigs, stageOrder (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib (+13 more)

### Community 8 - "App.tsx"
Cohesion: 0.14
Nodes (11): AppLayout(), Header(), Sidebar(), CRMAccountsPage(), CRMContactsPage(), CRMDealsPage(), DashboardPage(), GanttPage() (+3 more)

### Community 9 - "settings.ts"
Cohesion: 0.14
Nodes (17): WorkflowBuilderModalProps, AutoNumberingConfigView(), AutoNumberingConfig, AutoNumberingRule, CallWebhookActionPayload, ConditionOperator, CreateTaskActionPayload, FieldName (+9 more)

### Community 10 - "dependencies"
Cohesion: 0.11
Nodes (18): antd, clsx, firebase, lucide-react, dependencies, antd, clsx, firebase (+10 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compileOnSave, compilerOptions, module, moduleResolution, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck (+5 more)

### Community 12 - "useAuth"
Cohesion: 0.21
Nodes (10): useAuth(), RoleHierarchyTree(), TenantUserRecord, UserManagementView(), WorkflowBuilderModal(), WorkflowListView(), OutgoingEmailConfig(), functions (+2 more)

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
Nodes (4): EmailTemplateEditor(), ModuleManagerView(), ActiveModules, SupportedModule

### Community 19 - "AccessViews.tsx"
Cohesion: 0.33
Nodes (3): DataSharingRulesView(), UserManagementView(), ModuleName

### Community 20 - "CommunicationViews.tsx"
Cohesion: 0.33
Nodes (3): NotificationDispatcherView(), EmailProvider, EmailTemplate

### Community 21 - "ProfileMatrixTable.tsx"
Cohesion: 0.40
Nodes (4): ProfileMatrixTable(), FieldPermissionLevel, ModuleCrudPermissions, Profile

### Community 22 - "firebase.ts"
Cohesion: 0.50
Nodes (3): auth, db, firebaseConfig

## Knowledge Gaps
- **154 isolated node(s):** `scheduler_1`, `admin`, `https_1`, `admin`, `firestore_1` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `AuthContext.tsx`, `crm.ts`, `useFirestoreCRM.ts`, `App.tsx`, `settings.ts`, `dependencies`, `LayoutEditor.tsx`, `SettingsLayout.tsx`, `EmailTemplateEditor.tsx`, `AccessViews.tsx`, `ProfileMatrixTable.tsx`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `ProjectsPage()` connect `dependencies` to `AuthContext.tsx`, `App.tsx`, `useAuth`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `scheduler_1`, `admin`, `https_1` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10707070707070707 - nodes in this community are weakly interconnected._
- **Should `crm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14743589743589744 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._