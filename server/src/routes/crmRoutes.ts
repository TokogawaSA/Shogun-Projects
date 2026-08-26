import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
} from '../controllers/crmController.js';

export const crmRouter = Router();

// Leads
crmRouter.get('/leads', getLeads);
crmRouter.get('/leads/:id', getLeadById);
crmRouter.post('/leads', createLead);
crmRouter.put('/leads/:id', updateLead);
crmRouter.delete('/leads/:id', deleteLead);
crmRouter.post('/leads/:id/convert', convertLead);

// Accounts
crmRouter.get('/accounts', getAccounts);
crmRouter.get('/accounts/:id', getAccountById);
crmRouter.post('/accounts', createAccount);
crmRouter.put('/accounts/:id', updateAccount);
crmRouter.delete('/accounts/:id', deleteAccount);

// Contacts
crmRouter.get('/contacts', getContacts);
crmRouter.get('/contacts/:id', getContactById);
crmRouter.post('/contacts', createContact);
crmRouter.put('/contacts/:id', updateContact);
crmRouter.delete('/contacts/:id', deleteContact);

// Deals
crmRouter.get('/deals', getDeals);
crmRouter.get('/deals/:id', getDealById);
crmRouter.post('/deals', createDeal);
crmRouter.put('/deals/:id', updateDeal);
crmRouter.delete('/deals/:id', deleteDeal);

export default crmRouter;
