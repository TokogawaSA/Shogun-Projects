import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '../services/api';

export interface CurrencyOption {
  value: string;
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { value: 'USD ($)', code: 'USD', symbol: '$', label: 'USD ($) - United States Dollar' },
  { value: 'EUR (€)', code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { value: 'GBP (£)', code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { value: 'JPY (¥)', code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { value: 'ZAR (R)', code: 'ZAR', symbol: 'R', label: 'ZAR (R) - South African Rand' },
  { value: 'CAD ($)', code: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD ($)', code: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
  { value: 'CHF (CHF)', code: 'CHF', symbol: 'CHF', label: 'CHF (CHF) - Swiss Franc' },
  { value: 'INR (₹)', code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { value: 'CNY (¥)', code: 'CNY', symbol: '¥', label: 'CNY (¥) - Chinese Yuan' },
  { value: 'AED (AED)', code: 'AED', symbol: 'AED', label: 'AED (AED) - UAE Dirham' },
  { value: 'BRL (R$)', code: 'BRL', symbol: 'R$', label: 'BRL (R$) - Brazilian Real' },
  { value: 'SEK (kr)', code: 'SEK', symbol: 'kr', label: 'SEK (kr) - Swedish Krona' },
  { value: 'SGD ($)', code: 'SGD', symbol: '$', label: 'SGD ($) - Singapore Dollar' },
  { value: 'NZD ($)', code: 'NZD', symbol: '$', label: 'NZD ($) - New Zealand Dollar' },
];

const LOCAL_STORAGE_KEY_CURRENCY = 'shogun_system_currency';
const LOCAL_STORAGE_KEY_FISCAL = 'shogun_system_fiscal_start';

export interface ParsedCurrency {
  code: string;
  symbol: string;
  raw: string;
}

/**
 * Parses any currency string like "USD ($)", "EUR", "ZAR (R)", "€", etc.
 */
export function parseCurrency(raw?: string | null): ParsedCurrency {
  if (!raw || typeof raw !== 'string') {
    return { code: 'USD', symbol: '$', raw: 'USD ($)' };
  }

  const trimmed = raw.trim();

  // 1. Exact match with supported list (case-insensitive)
  const exact = SUPPORTED_CURRENCIES.find(
    (c) => c.value.toLowerCase() === trimmed.toLowerCase() || c.code.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) {
    return { code: exact.code, symbol: exact.symbol, raw: exact.value };
  }

  // 2. Pattern: "CODE (SYMBOL)" e.g. "EUR (€)" or "ZAR (R)"
  const codeParenMatch = trimmed.match(/^([A-Za-z]{3})\s*\(([^)]+)\)$/);
  if (codeParenMatch) {
    return { code: codeParenMatch[1].toUpperCase(), symbol: codeParenMatch[2].trim(), raw: trimmed };
  }

  // 3. Extract symbol inside parentheses: "(€)"
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const symbol = parenMatch[1].trim();
    const codeMatch = trimmed.match(/^[A-Za-z]{3}/);
    const code = codeMatch ? codeMatch[0].toUpperCase() : 'USD';
    return { code, symbol, raw: trimmed };
  }

  // 4. Just a 3-letter code: "EUR", "GBP", "USD", "ZAR", etc.
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    const code = trimmed.toUpperCase();
    const match = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    return { code, symbol: match ? match.symbol : '$', raw: trimmed };
  }

  // 5. Just a symbol: "$", "€", "£", "¥", "R"
  if (trimmed === '€') return { code: 'EUR', symbol: '€', raw: 'EUR (€)' };
  if (trimmed === '£') return { code: 'GBP', symbol: '£', raw: 'GBP (£)' };
  if (trimmed === '¥') return { code: 'JPY', symbol: '¥', raw: 'JPY (¥)' };
  if (trimmed === 'R') return { code: 'ZAR', symbol: 'R', raw: 'ZAR (R)' };
  if (trimmed === '$') return { code: 'USD', symbol: '$', raw: 'USD ($)' };

  return { code: 'USD', symbol: '$', raw: trimmed };
}

export interface FormatCurrencyOptions {
  decimals?: number;
  showCode?: boolean;
  compact?: boolean;
  fallback?: string;
}

/**
 * Universal standalone currency formatter.
 */
export function formatCurrencyAmount(
  amount: number | string | null | undefined,
  currencySetting?: string | ParsedCurrency,
  options: FormatCurrencyOptions = {}
): string {
  if (amount === null || amount === undefined || amount === '') {
    return options.fallback ?? '—';
  }

  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) {
    return String(amount);
  }

  const parsed = typeof currencySetting === 'string'
    ? parseCurrency(currencySetting)
    : currencySetting || { code: 'USD', symbol: '$', raw: 'USD ($)' };

  const symbol = parsed.symbol || '$';
  const code = parsed.code || 'USD';

  // Compact mode: e.g. $1.5M, $45K
  if (options.compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1_000_000_000) {
      return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1)}B`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
    }
    return `${sign}${symbol}${abs.toLocaleString(undefined, {
      minimumFractionDigits: options.decimals ?? 0,
      maximumFractionDigits: options.decimals ?? 2,
    })}`;
  }

  // Fraction logic: show decimals if explicit or if number has fractional pennies
  const hasDecimals = num % 1 !== 0;
  let minDecimals = 0;
  let maxDecimals = code === 'JPY' ? 0 : 2;

  if (options.decimals !== undefined) {
    minDecimals = options.decimals;
    maxDecimals = options.decimals;
  } else if (hasDecimals) {
    minDecimals = 2;
    maxDecimals = 2;
  }

  const formattedNum = num.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  if (options.showCode) {
    return `${symbol}${formattedNum} ${code}`;
  }

  return `${symbol}${formattedNum}`;
}

export interface CurrencyContextType {
  currency: string; // e.g. "USD ($)" or "EUR (€)"
  currencyCode: string; // e.g. "USD", "EUR", "ZAR"
  currencySymbol: string; // e.g. "$", "€", "R"
  fiscalYearStart: string; // e.g. "January"
  loading: boolean;
  supportedCurrencies: CurrencyOption[];
  formatCurrency: (
    amount: number | string | null | undefined,
    optsOrOverride?: FormatCurrencyOptions | string
  ) => string;
  updateCurrency: (newCurrency: string, newFiscalYearStart?: string) => void;
  refreshCurrency: () => Promise<void>;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // Initialize immediately from localStorage for zero flash of default currency
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_CURRENCY) || 'USD ($)';
  });
  const [fiscalYearStart, setFiscalYearStartState] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_FISCAL) || 'January';
  });
  const [loading, setLoading] = useState<boolean>(true);

  const parsed = parseCurrency(currency);

  const refreshCurrency = useCallback(async () => {
    try {
      const data = await apiClient.get<any>('/settings/system').catch(() => null);
      if (data?.companyDetails) {
        if (data.companyDetails.currency) {
          setCurrencyState(data.companyDetails.currency);
          localStorage.setItem(LOCAL_STORAGE_KEY_CURRENCY, data.companyDetails.currency);
        }
        if (data.companyDetails.fiscalYearStart) {
          setFiscalYearStartState(data.companyDetails.fiscalYearStart);
          localStorage.setItem(LOCAL_STORAGE_KEY_FISCAL, data.companyDetails.fiscalYearStart);
        }
      }
    } catch (err) {
      console.warn('[CurrencyContext] Failed to load system currency:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCurrency();

    // Listen for cross-tab or in-app updates
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY_CURRENCY && e.newValue) {
        setCurrencyState(e.newValue);
      }
      if (e.key === LOCAL_STORAGE_KEY_FISCAL && e.newValue) {
        setFiscalYearStartState(e.newValue);
      }
    };

    const handleCustomUpdate = (e: any) => {
      if (e.detail?.currency) {
        setCurrencyState(e.detail.currency);
      }
      if (e.detail?.fiscalYearStart) {
        setFiscalYearStartState(e.detail.fiscalYearStart);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('shogun-currency-updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('shogun-currency-updated', handleCustomUpdate);
    };
  }, [refreshCurrency]);

  const updateCurrency = useCallback((newCurrency: string, newFiscalYearStart?: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(LOCAL_STORAGE_KEY_CURRENCY, newCurrency);

    if (newFiscalYearStart) {
      setFiscalYearStartState(newFiscalYearStart);
      localStorage.setItem(LOCAL_STORAGE_KEY_FISCAL, newFiscalYearStart);
    }

    // Broadcast in-app event so all listening components update synchronously
    window.dispatchEvent(
      new CustomEvent('shogun-currency-updated', {
        detail: { currency: newCurrency, fiscalYearStart: newFiscalYearStart },
      })
    );
  }, []);

  const formatCurrency = useCallback(
    (
      amount: number | string | null | undefined,
      optsOrOverride?: FormatCurrencyOptions | string
    ): string => {
      if (typeof optsOrOverride === 'string') {
        const overrideParsed = parseCurrency(optsOrOverride);
        // If caller passed 'USD' (the legacy default) but corporate base currency is configured as EUR, GBP, ZAR, etc.,
        // prioritize the active corporate currency.
        if (overrideParsed.code === 'USD' && parsed.code !== 'USD') {
          return formatCurrencyAmount(amount, parsed);
        }
        return formatCurrencyAmount(amount, optsOrOverride);
      }
      return formatCurrencyAmount(amount, parsed, optsOrOverride);
    },
    [parsed]
  );

  const value: CurrencyContextType = {
    currency,
    currencyCode: parsed.code,
    currencySymbol: parsed.symbol,
    fiscalYearStart,
    loading,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    formatCurrency,
    updateCurrency,
    refreshCurrency,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Provide safe fallback if accessed outside provider
    const fallbackCurrency = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENCY) || 'USD ($)';
    const parsed = parseCurrency(fallbackCurrency);
    return {
      currency: fallbackCurrency,
      currencyCode: parsed.code,
      currencySymbol: parsed.symbol,
      fiscalYearStart: localStorage.getItem(LOCAL_STORAGE_KEY_FISCAL) || 'January',
      loading: false,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      formatCurrency: (amount, optsOrOverride) => {
        if (typeof optsOrOverride === 'string') {
          return formatCurrencyAmount(amount, optsOrOverride);
        }
        return formatCurrencyAmount(amount, parsed, optsOrOverride);
      },
      updateCurrency: () => {},
      refreshCurrency: async () => {},
    };
  }
  return context;
};

export default CurrencyContext;
