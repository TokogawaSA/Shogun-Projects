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

// Deliverable Fulfillment & Inventory Deduction
catalogRouter.post('/deliverables/:id/fulfill', fulfillDeliverable);

export default catalogRouter;
