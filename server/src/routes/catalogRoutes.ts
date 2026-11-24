import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getPriceBooks,
  createPriceBook,
  fulfillDeliverable,
  getQuotes,
  upsertQuote,
  getTaxInvoices,
  createTaxInvoice,
} from '../controllers/catalogController.js';

export const catalogRouter = Router();

// Products & Services
catalogRouter.get('/products', getProducts);
catalogRouter.get('/products/:id', getProductById);
catalogRouter.post('/products', createProduct);
catalogRouter.put('/products/:id', updateProduct);
catalogRouter.delete('/products/:id', deleteProduct);

// Price Books
catalogRouter.get('/price-books', getPriceBooks);
catalogRouter.post('/price-books', createPriceBook);

// SARS VAT Multi-Currency Quotes & Tax Invoices
catalogRouter.get('/quotes', getQuotes);
catalogRouter.post('/quotes', upsertQuote);
catalogRouter.put('/quotes/:id', upsertQuote);
catalogRouter.get('/tax-invoices', getTaxInvoices);
catalogRouter.post('/tax-invoices', createTaxInvoice);

// Deliverable Fulfillment & Inventory Deduction
catalogRouter.post('/deliverables/:id/fulfill', fulfillDeliverable);

export default catalogRouter;
