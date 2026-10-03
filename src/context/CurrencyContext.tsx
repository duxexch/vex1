import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES, formatMoney } from '../../shared/money';
import { resolveCountry, resolveCountrySync, type GeoInfo } from '../utils/geo';

const CURRENCY_KEY = 'vex_display_currency';
const MANUAL_KEY = 'vex_currency_manual';

interface CurrencyContextValue {
  /** ISO currency code used for ALL display formatting. */
  currency: string;
  /** Manual user choice from settings (disables auto country-following). */
  manual: boolean;
  /** Last resolved geo info (country may be null before resolution). */
  geo: GeoInfo;
  /** Format a USD amount in the active currency. */
  fmt: (amountInUSD: number) => string;
  /** User picked a currency in settings → persist + stop auto-following. */
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function initialGeo(): GeoInfo {
  try {
    return resolveCountrySync();
  } catch {
    return { country: null, currency: 'USD', source: 'none' };
  }
}

function initialManual(): boolean {
  try {
    return localStorage.getItem(MANUAL_KEY) === '1';
  } catch {
    return false;
  }
}

function initialCurrency(manual: boolean, geo: GeoInfo): string {
  try {
    if (manual) {
      const saved = localStorage.getItem(CURRENCY_KEY);
      if (saved && SUPPORTED_CURRENCIES[saved]) return saved;
    }
    if (geo.currency && SUPPORTED_CURRENCIES[geo.currency]) return geo.currency;
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved && SUPPORTED_CURRENCIES[saved]) return saved;
  } catch {
    // private mode
  }
  return 'USD';
}

/**
 * Global currency context — the single source of truth for how money is
 * displayed. Backed by the visitor's detected country (GeoIP → timezone →
 * locale) unless the user manually picks a currency in settings.
 */
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geo, setGeo] = useState<GeoInfo>(initialGeo);
  const [manual, setManual] = useState<boolean>(initialManual);
  const [currency, setCurrencyState] = useState<string>(() => initialCurrency(initialManual(), initialGeo()));

  // Authoritative country refresh (server GeoIP) — only follows the country
  // while the user has NOT manually chosen a currency.
  useEffect(() => {
    let cancelled = false;
    resolveCountry()
      .then((resolved) => {
        if (cancelled) return;
        setGeo(resolved);
        if (!initialManual() && resolved.currency && SUPPORTED_CURRENCIES[resolved.currency]) {
          setCurrencyState((prev) => (SUPPORTED_CURRENCIES[prev] ? resolved.currency : prev));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_KEY, currency);
    } catch {
      // ignore
    }
  }, [currency]);

  const setCurrency = useCallback((code: string) => {
    if (!SUPPORTED_CURRENCIES[code]) return;
    setCurrencyState(code);
    setManual(true);
    try {
      localStorage.setItem(MANUAL_KEY, '1');
      localStorage.setItem(CURRENCY_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  const fmt = useCallback((amountInUSD: number) => formatMoney(amountInUSD, currency), [currency]);

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, manual, geo, fmt, setCurrency }),
    [currency, manual, geo, fmt, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

/** Access the global currency + fmt() helper. */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Defensive fallback so isolated storybook-ish renders still work.
    return {
      currency: 'USD',
      manual: false,
      geo: { country: null, currency: 'USD', source: 'none' },
      fmt: (amountInUSD: number) => formatMoney(amountInUSD, 'USD'),
      setCurrency: () => undefined,
    };
  }
  return ctx;
}

/** Shorthand: `const fmt = useMoney();` → fmt(12.5) = "E£606.25" */
export function useMoney(): (amountInUSD: number) => string {
  return useCurrency().fmt;
}
