/**
 * Dynamic CRM Entity Management Route Registry (VTiger-Style)
 * Mounts standard routes for Leads, Accounts, Contacts, and Deals.
 * 
 * Pathway:
 * - /crm/:module          -> EntityListView (Generic filterable list with mass actions)
 * - /crm/:module/new      -> EntityEditView (Create Mode)
 * - /crm/:module/:id      -> EntityDetailView (Summary & 2-Column Collapsible Blocks)
 * - /crm/:module/:id/edit -> EntityEditView (Edit Mode)
 */

import { Route } from 'react-router-dom';
import { EntityListView } from '../modules/crm/pages/EntityListView';
import { EntityDetailView } from '../modules/crm/pages/EntityDetailView';
import { EntityEditView } from '../modules/crm/pages/EntityEditView';

export const renderCrmRoutes = () => {
  return (
    <>
      {/* 1. Create New Entity Route (Higher priority before :id param) */}
      <Route path="/crm/:module/new" element={<EntityEditView />} />

      {/* 2. Edit Existing Entity Route */}
      <Route path="/crm/:module/:id/edit" element={<EntityEditView />} />

      {/* 3. Entity Detail View Route (Summary & Collapsible Blocks) */}
      <Route path="/crm/:module/:id" element={<EntityDetailView />} />

      {/* 4. Entity List View Route (Default Module Table) */}
      <Route path="/crm/:module" element={<EntityListView />} />

      {/* 5. Root /crm alias defaults to /crm/leads or /crm/accounts */}
      <Route path="/crm" element={<EntityListView />} />
    </>
  );
};

export default renderCrmRoutes;
