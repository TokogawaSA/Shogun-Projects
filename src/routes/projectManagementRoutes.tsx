import { Route } from 'react-router-dom';
import { ProjectManagementHub } from '../modules/projects';

export const renderPmRoutes = () => [
  <Route key="pm-hub" path="/pm" element={<ProjectManagementHub />} />,
  <Route key="pm-hub-domain" path="/pm/*" element={<ProjectManagementHub />} />,
];
