/**
 * Simple Project Management System
 * Antigravity 2.0 Ecosystem
 */

// Core Workspace Hub
export { ProjectWorkspace } from './ProjectWorkspace';
export { default } from './ProjectWorkspace';

// Views & Components
export { ProjectBoard } from './components/ProjectBoard';
export { ProjectTaskList } from './components/ProjectTaskList';
export { ProjectMilestones } from './components/ProjectMilestones';
export { ProjectOverview } from './components/ProjectOverview';
export { TaskDetailModal } from './components/TaskDetailModal';
export { CreateTaskModal } from './components/CreateTaskModal';
export { ColumnConfigModal } from './components/ColumnConfigModal';

// Services & Types
export { projectService } from './services/projectService';
export * from './types';
