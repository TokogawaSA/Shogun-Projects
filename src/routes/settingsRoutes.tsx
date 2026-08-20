import { Route } from 'react-router-dom';
import { SettingsLayout } from '../modules/settings/SettingsLayout';
import { SettingsHub } from '../modules/settings/SettingsHub';

// 1. Access Control Modules (Phase 5)
import { UserManagementView } from '../modules/settings/access/UserManagementView';
import { RoleHierarchyTree } from '../modules/settings/access/RoleHierarchyTree';
import { ProfileMatrixTable } from '../modules/settings/access/ProfileMatrixTable';
import { DataSharingRulesView } from '../modules/settings/views/AccessViews';

// 2. Module Customization Modules (Phase 5)
import { ModuleManagerView } from '../modules/settings/customization/ModuleManagerView';
import { LayoutEditor } from '../modules/settings/customization/LayoutEditor';
import { PicklistManagerView } from '../modules/settings/views/CustomizationViews';
import { AutoNumberingConfigView } from '../modules/settings/customization/AutoNumberingConfig';

// 3. Automation Engine Modules (Phase 6)
import { WorkflowListView } from '../modules/settings/automation/WorkflowListView';
import {
  ScheduledCronView,
  WebhooksGatewayView,
} from '../modules/settings/views/AutomationViews';

// 4. Communication Gateway Modules (Phase 6)
import { OutgoingEmailConfig } from '../modules/settings/communication/OutgoingEmailConfig';
import { EmailTemplateEditor } from '../modules/settings/communication/EmailTemplateEditor';
import { NotificationDispatcherView } from '../modules/settings/views/CommunicationViews';

// 5. System Configuration Modules
import {
  CompanyBrandingView,
  CurrencyFiscalView,
  AuditTrailView,
} from '../modules/settings/views/SystemViews';

export const renderSettingsRoutes = () => (
  <Route path="/settings" element={<SettingsLayout />}>
    <Route index element={<SettingsHub />} />

    {/* 1. Users & Access Control */}
    <Route path="access/users" element={<UserManagementView />} />
    <Route path="access/roles" element={<RoleHierarchyTree />} />
    <Route path="access/profiles" element={<ProfileMatrixTable />} />
    <Route path="access/sharing" element={<DataSharingRulesView />} />
    <Route path="access" element={<UserManagementView />} />
    <Route path="access/*" element={<UserManagementView />} />

    {/* 2. Module Customization */}
    <Route path="customization/modules" element={<ModuleManagerView />} />
    <Route path="customization/layouts" element={<LayoutEditor />} />
    <Route path="customization/picklists" element={<PicklistManagerView />} />
    <Route path="customization/numbering" element={<AutoNumberingConfigView />} />
    <Route path="customization" element={<ModuleManagerView />} />
    <Route path="customization/*" element={<ModuleManagerView />} />

    {/* 3. Automation Engine */}
    <Route path="automation/workflows" element={<WorkflowListView />} />
    <Route path="automation/cron" element={<ScheduledCronView />} />
    <Route path="automation/webhooks" element={<WebhooksGatewayView />} />
    <Route path="automation" element={<WorkflowListView />} />
    <Route path="automation/*" element={<WorkflowListView />} />

    {/* 4. Communication Gateway */}
    <Route path="communication/email" element={<OutgoingEmailConfig />} />
    <Route path="communication/templates" element={<EmailTemplateEditor />} />
    <Route path="communication/notifications" element={<NotificationDispatcherView />} />
    <Route path="communication" element={<OutgoingEmailConfig />} />
    <Route path="communication/*" element={<OutgoingEmailConfig />} />

    {/* 5. System Configuration */}
    <Route path="system/company" element={<CompanyBrandingView />} />
    <Route path="system/fiscal" element={<CurrencyFiscalView />} />
    <Route path="system/audit" element={<AuditTrailView />} />
    <Route path="system" element={<CompanyBrandingView />} />
    <Route path="system/*" element={<CompanyBrandingView />} />

    {/* Catch-all */}
    <Route path="*" element={<SettingsHub />} />
  </Route>
);
