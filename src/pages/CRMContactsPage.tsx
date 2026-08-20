import React from 'react';
import { ContactDirectory } from '../modules/crm/components/ContactDirectory';

export const CRMContactsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <ContactDirectory />
    </div>
  );
};

export default CRMContactsPage;
