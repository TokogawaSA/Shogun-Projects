import { SageSouthAfricaAdapter } from './SageSouthAfricaAdapter.js';
import { XeroAdapter } from './XeroAdapter.js';
import type { AccountingAdapter, AccountingProvider } from './AccountingAdapter.js';

export * from './AccountingAdapter.js';
export * from './accountingCrypto.js';
export * from './SageSouthAfricaAdapter.js';
export * from './XeroAdapter.js';

export function createAccountingAdapter(
  provider: AccountingProvider,
  fetchImpl?: typeof fetch
): AccountingAdapter {
  if (provider === 'XERO') {
    return new XeroAdapter({ fetchImpl });
  }
  return new SageSouthAfricaAdapter({ fetchImpl });
}
