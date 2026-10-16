import { Router } from 'express';
import {
  getPortfolios,
  createPortfolio,
  getResourceProfiles,
  upsertResourceProfile,
  recalculateFinancials,
  getRisks,
  createRisk,
  updateRisk,
} from '../controllers/ppmController.js';
import {
  getStudioCapacityHeatmap,
  getStudioNetMultiplier,
} from '../controllers/aecProjectController.js';

export const ppmRouter = Router();

// AEC Studio Capacity Heatmap & Net Multiplier Governance
ppmRouter.get('/studio-capacity', getStudioCapacityHeatmap);
ppmRouter.get('/net-multiplier', getStudioNetMultiplier);

// Portfolios
ppmRouter.get('/portfolios', getPortfolios);
ppmRouter.post('/portfolios', createPortfolio);

// Resource Capacity & Profiles
ppmRouter.get('/resources', getResourceProfiles);
ppmRouter.post('/resources', upsertResourceProfile);

// Financials & Variance Recalculation
ppmRouter.post('/financials/:projectId/recalculate', recalculateFinancials);

// Risk Scoring
ppmRouter.get('/risks', getRisks);
ppmRouter.post('/risks', createRisk);
ppmRouter.put('/risks/:id', updateRisk);

export default ppmRouter;
