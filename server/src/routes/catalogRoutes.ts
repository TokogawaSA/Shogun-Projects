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
  getQuoteById,
  upsertQuote,
  deleteQuote,
  convertQuoteToTaxInvoice,
  getTaxInvoices,
  getTaxInvoiceById,
  createTaxInvoice,
  updateTaxInvoice,
  deleteTaxInvoice,
  recordTaxInvoicePayment,
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
catalogRouter.get('/quotes/:id', getQuoteById);
catalogRouter.post('/quotes', upsertQuote);
catalogRouter.put('/quotes/:id', upsertQuote);
catalogRouter.delete('/quotes/:id', deleteQuote);
catalogRouter.post('/quotes/:id/convert-to-invoice', convertQuoteToTaxInvoice);

catalogRouter.get('/tax-invoices', getTaxInvoices);
catalogRouter.get('/tax-invoices/:id', getTaxInvoiceById);
catalogRouter.post('/tax-invoices', createTaxInvoice);
catalogRouter.put('/tax-invoices/:id', updateTaxInvoice);
catalogRouter.delete('/tax-invoices/:id', deleteTaxInvoice);
catalogRouter.post('/tax-invoices/:id/payments', recordTaxInvoicePayment);

// Deliverable Fulfillment & Inventory Deduction
catalogRouter.post('/deliverables/:id/fulfill', fulfillDeliverable);

export default catalogRouter;
