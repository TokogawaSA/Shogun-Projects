/**
 * Products & Services Catalog Route Registry
 * Multi-Tenant Antigravity 2.0 Ecosystem
 * 
 * Routes:
 * - /catalog             -> CatalogListView (Searchable product & service items matrix)
 * - /catalog/price-books -> PriceBookManager (Custom price book tiers & rule engine)
 * - /catalog/quotes      -> LineItemEditor (Interactive quote builder & line items matrix)
 * - /catalog/quotes/:id  -> LineItemEditor (Specific quote editor)
 */

import { Route } from 'react-router-dom';
import { CatalogListView } from '../modules/catalog/CatalogListView';
import { PriceBookManager } from '../modules/catalog/PriceBookManager';
import { LineItemEditor } from '../modules/catalog/lineItems/LineItemEditor';

export const renderCatalogRoutes = () => {
  return (
    <>
      <Route path="/catalog" element={<CatalogListView />} />
      <Route path="/catalog/price-books" element={<PriceBookManager />} />
      <Route path="/catalog/quotes" element={<LineItemEditor />} />
      <Route path="/catalog/quotes/:id" element={<LineItemEditor />} />
    </>
  );
};

export default renderCatalogRoutes;
