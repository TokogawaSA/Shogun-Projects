/**
 * Legacy PPM Route Aliases (Forwarding to Unified Projects & Portfolio Engine)
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import { Route, Navigate } from 'react-router-dom';
import { ProjectWorkspace } from '../modules/projects';
import { ProjectsPage } from '../pages/ProjectsPage';

export const renderPpmRoutes = () => {
  return (
    <>
      {/* Unified Project Workspace */}
      <Route path="/ppm" element={<ProjectWorkspace />} />
      <Route path="/ppm/studio" element={<ProjectWorkspace />} />
      <Route path="/ppm/studio/*" element={<ProjectWorkspace />} />

      {/* Portfolio Overview Forwarders */}
      <Route path="/ppm/portfolio" element={<ProjectsPage />} />
      <Route path="/ppm/portfolio/*" element={<ProjectsPage />} />

      {/* Legacy Fallbacks */}
      <Route path="/ppm/resources" element={<Navigate to="/pm" replace />} />
      <Route path="/ppm/resources/*" element={<Navigate to="/pm" replace />} />
      <Route path="/ppm/financials" element={<Navigate to="/pm" replace />} />
      <Route path="/ppm/financials/*" element={<Navigate to="/pm" replace />} />
      <Route path="/ppm/risks" element={<Navigate to="/pm" replace />} />
      <Route path="/ppm/risks/*" element={<Navigate to="/pm" replace />} />
    </>
  );
};

export default renderPpmRoutes;
