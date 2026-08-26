import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTimeLog,
} from '../controllers/projectController.js';

export const projectRouter = Router();

// Projects
projectRouter.get('/', getProjects);
projectRouter.get('/:id', getProjectById);
projectRouter.post('/', createProject);
projectRouter.put('/:id', updateProject);
projectRouter.delete('/:id', deleteProject);

// Milestones
projectRouter.get('/:projectId/milestones', getMilestones);
projectRouter.post('/:projectId/milestones', createMilestone);
projectRouter.put('/milestones/:id', updateMilestone);
projectRouter.delete('/milestones/:id', deleteMilestone);

// Tasks
projectRouter.get('/tasks/all', getTasks);
projectRouter.get('/tasks/:id', getTaskById);
projectRouter.post('/tasks', createTask);
projectRouter.put('/tasks/:id', updateTask);
projectRouter.delete('/tasks/:id', deleteTask);

// Time Logging & Recursive Rollup
projectRouter.post('/:projectId/tasks/:taskId/time-logs', addTimeLog);

export default projectRouter;
