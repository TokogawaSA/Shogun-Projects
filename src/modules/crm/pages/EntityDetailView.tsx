/**
 * Unified Entity Detail & Summary View Component (VTiger-Style)
 * Displays EntityHeader with action toolbar, RelatedListsNav tabs,
 * EntitySummaryWidget key metrics banner, and 2-column collapsible EntityBlocksViewer.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EntityModuleName } from '../../../types/crmEntities';
import { useEntityRecord } from '../hooks/useEntityRecord';
import { DEFAULT_MODULE_LAYOUTS } from '../utils/moduleLayouts';
import { EntityHeader } from '../components/EntityHeader';
import { RelatedListsNav, SubPanelTab } from '../components/RelatedListsNav';
import { EntitySummaryWidget } from '../components/EntitySummaryWidget';
import { EntityBlocksViewer } from '../components/EntityBlocksViewer';
import { ConvertLeadModal } from '../components/ConvertLeadModal';
import { SaComplianceBadgeBar } from '../components/SaComplianceBadgeBar';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const EntityDetailView: React.FC = () => {
  const { module: routeModule, id: recordId } = useParams<{ module: string; id: string }>();
  const navigate = useNavigate();

  // Validate module
  const currentModule: EntityModuleName = (
    ['leads', 'accounts', 'contacts', 'deals'].includes(routeModule || '')
      ? routeModule
      : 'leads'
  ) as EntityModuleName;

  // REST API synchronization hook
  const { record, loading, error, updateField } = useEntityRecord(currentModule, recordId);

  // Sub-panel tab state
  const [activeTab, setActiveTab] = useState<SubPanelTab>('summary');
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);

  const layoutBlocks = DEFAULT_MODULE_LAYOUTS[currentModule] || DEFAULT_MODULE_LAYOUTS.leads;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading {currentModule.slice(0, -1)} details...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 inline-block">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-base font-semibold">Record Not Found</h2>
          <p className="text-xs text-rose-400/80 mt-1">
            {error?.message || `Could not find ${currentModule.slice(0, -1)} record with ID: ${recordId}`}
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate(`/crm/${currentModule}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {currentModule}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-slate-950 text-slate-100 space-y-6 animate-fadeIn">
      {/* 1. Entity Header Banner */}
      <EntityHeader
        moduleName={currentModule}
        recordId={recordId || ''}
        record={record}
        onOpenConvertLead={() => setIsConvertModalOpen(true)}
        onOpenAddTask={() => {
          setActiveTab('tasks');
        }}
      />

      {/* South African B2B Compliance Badge Bar for Juristic Client Accounts */}
      {currentModule === 'accounts' && <SaComplianceBadgeBar record={record} />}

      {/* 2. Sub-Panel Navigation Tabs */}
      <RelatedListsNav
        moduleName={currentModule}
        recordId={recordId || ''}
        record={record}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 3. Main Content Switching Area */}
      <div className="flex-1 min-h-0 space-y-6">
        {/* Tab 1: Summary View (Metric Cards + High-Level Blocks + Activity Stream) */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            <EntitySummaryWidget moduleName={currentModule} record={record} />
            <EntityBlocksViewer
              blocks={layoutBlocks.slice(0, 1)}
              record={record}
              onUpdateField={updateField}
            />
          </div>
        )}

        {/* Tab 2: Full Details View (2-Column Collapsible Blocks with Live Inline Edit) */}
        {activeTab === 'details' && (
          <div className="animate-fadeIn">
            <EntityBlocksViewer
              blocks={layoutBlocks}
              record={record}
              onUpdateField={updateField}
            />
          </div>
        )}

        {/* Tab 5: Dedicated Activity Stream */}
        {activeTab === 'activities' && (
          <div className="animate-fadeIn">
            <EntitySummaryWidget moduleName={currentModule} record={record} />
          </div>
        )}
      </div>

      {/* Convert Lead Modal */}
      {currentModule === 'leads' && (
        <ConvertLeadModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          lead={record}
          onConversionSuccess={() => {
            setIsConvertModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default EntityDetailView;
