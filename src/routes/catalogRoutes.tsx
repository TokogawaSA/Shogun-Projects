/**
 * Products & Services Catalog Route Registry
 * Multi-Tenant Antigravity 2.0 Ecosystem
 *
 * Routes:
 * - /catalog               -> CatalogListView (Searchable product & service items matrix)
 * - /catalog/quotes        -> QuoteBuilder (Interactive quote builder & line items matrix)
 * - /catalog/quotes/:id    -> QuoteBuilder (Specific quote editor)
 * - /catalog/invoices      -> InvoiceSystemView (Invoices register & KPI dashboard)
 * - /catalog/invoices/new  -> InvoiceSystemView (Create tax invoice)
 * - /catalog/invoices/:id  -> InvoiceSystemView (Invoice editor & print preview)
 */

import { Navigate, Route } from 'react-router-dom';
import { CatalogListView } from '../modules/catalog/CatalogListView';
import { QuoteBuilder } from '../modules/catalog/QuoteBuilder';
import { InvoiceSystemView } from '../modules/catalog/invoices/InvoiceSystemView';

export const renderCatalogRoutes = () => {
  return (
    <>
      <Route path="/catalog" element={<CatalogListView />} />
      <Route path="/catalog/price-books" element={<Navigate to="/catalog" replace />} />
      <Route path="/catalog/quotes" element={<QuoteBuilder />} />
      <Route path="/catalog/quotes/:id" element={<QuoteBuilder />} />
      <Route path="/catalog/invoices" element={<InvoiceSystemView />} />
      <Route path="/catalog/invoices/new" element={<InvoiceSystemView />} />
      <Route path="/catalog/invoices/:id" element={<InvoiceSystemView />} />
    </>
  );
};

export default renderCatalogRoutes;
