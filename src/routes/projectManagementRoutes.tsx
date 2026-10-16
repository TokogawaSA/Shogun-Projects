import { Route } from 'react-router-dom';
import { ProjectWorkspace } from '../modules/projects';

export const renderPmRoutes = () => [
  <Route key="pm-hub" path="/pm" element={<ProjectWorkspace />} />,
  <Route key="pm-hub-id" path="/pm/:id" element={<ProjectWorkspace />} />,
  <Route key="pm-hub-domain" path="/pm/*" element={<ProjectWorkspace />} />,
];

export default renderPmRoutes;
