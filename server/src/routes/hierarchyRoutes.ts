import { Router } from 'express';
import {
  getHierarchyTree,
  createSpace,
  createFolder,
  createList,
  nestTask,
} from '../controllers/hierarchyController.js';

export const hierarchyRouter = Router();

hierarchyRouter.get('/tree', getHierarchyTree);
hierarchyRouter.post('/spaces', createSpace);
hierarchyRouter.post('/folders', createFolder);
hierarchyRouter.post('/lists', createList);
hierarchyRouter.post('/tasks/nest', nestTask);

