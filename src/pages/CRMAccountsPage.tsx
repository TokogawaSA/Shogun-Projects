import React from 'react';
import { AccountDirectory } from '../modules/crm/components/AccountDirectory';

export const CRMAccountsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AccountDirectory />
    </div>
  );
};

export default CRMAccountsPage;
