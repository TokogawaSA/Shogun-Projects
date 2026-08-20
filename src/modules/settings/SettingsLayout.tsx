import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsSidebar } from './components/SettingsSidebar';

export const SettingsLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const isHubLanding = location.pathname === '/settings';

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950">
      {/* Collapsible Sub-Navigation Sidebar */}
      <SettingsSidebar />

      {/* Main Settings Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SettingsHeader
          searchQuery={searchQuery}
          onSearchChange={isHubLanding ? setSearchQuery : undefined}
        />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
