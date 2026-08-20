import React from 'react';
import { DealKanbanBoard } from '../modules/crm/components/DealKanbanBoard';

export const CRMDealsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <DealKanbanBoard />
    </div>
  );
};

export default CRMDealsPage;
