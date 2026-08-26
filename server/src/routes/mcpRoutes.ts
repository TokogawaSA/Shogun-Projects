import { Router } from 'express';
import { handleSummarizeAccount, handleGenerateTasks } from '../controllers/mcpController.js';

export const mcpRouter = Router();

// MCP Agentic AI tool execution endpoints
mcpRouter.post('/summarize-account', handleSummarizeAccount);
mcpRouter.post('/generate-tasks', handleGenerateTasks);

export default mcpRouter;
