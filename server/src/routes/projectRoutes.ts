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
import {
  getProjectPhases,
  signOffProjectPhase,
  getDrawingSheets,
  createDrawingSheet,
  getRfiLog,
  createRfi,
  respondToRfi,
  getSubmittalLog,
  getSiteReports,
  createSiteReport,
  getSubConsultantLedger,
} from '../controllers/aecProjectController.js';

export const projectRouter = Router();

// Projects
projectRouter.get('/', getProjects);
projectRouter.get('/:id', getProjectById);
projectRouter.post('/', createProject);
projectRouter.put('/:id', updateProject);
projectRouter.delete('/:id', deleteProject);

// AEC Domain: Phase-Gated Project Hierarchy (SD, DD, CD, CA)
projectRouter.get('/:projectId/phases', getProjectPhases);
projectRouter.post('/:projectId/phases/:phaseId/sign-off', signOffProjectPhase);

// AEC Domain: Drawing Revision Control & Sheet Register
projectRouter.get('/:projectId/drawings', getDrawingSheets);
projectRouter.post('/:projectId/drawings', createDrawingSheet);

// AEC Domain: Construction Administration (RFIs & Submittals)
projectRouter.get('/:projectId/rfis', getRfiLog);
projectRouter.post('/:projectId/rfis', createRfi);
projectRouter.put('/:projectId/rfis/:rfiId/respond', respondToRfi);
projectRouter.get('/:projectId/submittals', getSubmittalLog);

// AEC Domain: Field Observation & Site Reports
projectRouter.get('/:projectId/site-reports', getSiteReports);
projectRouter.post('/:projectId/site-reports', createSiteReport);

// AEC Domain: Sub-Consultant Pass-Through Ledger
projectRouter.get('/:projectId/subconsultants', getSubConsultantLedger);

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
