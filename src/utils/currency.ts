// Backwards-compatible client facade over shared/money.ts.
// Existing imports (formatCurrency, SUPPORTED_CURRENCIES, ...) keep working;
// new code should prefer the CurrencyContext hook (useMoney) or shared/money.

import {
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  TIMEZONE_COUNTRY,
  convertCurrency,
  currencyForCountry,
  currencyLabel,
  formatMoney,
} from '../../shared/money';

export type { CurrencyInfo };
export { SUPPORTED_CURRENCIES, convertCurrency, currencyLabel };

export function formatCurrency(amountInUSD: number, targetCurrency: string): string {
  return formatMoney(amountInUSD, targetCurrency);
}

/** Country guessed from timezone (shared map) or locale region/language. */
export function detectUserCountry(): string | null {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    const fromTz = TIMEZONE_COUNTRY[tz];
    if (fromTz) return fromTz;

    const locale = (navigator.language || '').toLowerCase();
    const region = locale.split('-')[1];
    if (region && region.length === 2 && COUNTRY_HAS_CURRENCY(region.toUpperCase())) {
      return region.toUpperCase();
    }
    // Language heuristics for region-less locales (ru, tr, ...).
    const lang = locale.split('-')[0];
    const byLang: Record<string, string> = {
      ru: 'RU', tr: 'TR', uk: 'UA', kk: 'KZ', ar: 'EG', fa: 'IR',
      ja: 'JP', ko: 'KR', zh: 'CN', hi: 'IN', de: 'DE', fr: 'FR',
      es: 'ES', pt: 'PT', it: 'IT', pl: 'PL', nl: 'NL', sv: 'SE',
      nb: 'NO', da: 'DK', fi: 'FI', cs: 'CZ', hu: 'HU', ro: 'RO',
      el: 'GR', th: 'TH', vi: 'VN', id: 'ID', ms: 'MY', he: 'IL',
    };
    return byLang[lang] || null;
  } catch {
    return null;
  }
}

function COUNTRY_HAS_CURRENCY(iso: string): boolean {
  // Any ISO code either maps explicitly or falls back to USD — both fine.
  return iso.length === 2 && /^[a-z]{2}$/i.test(iso);
}

/** Legacy helper: best-guess display currency without any server geo. */
export function detectUserRegionalCurrency(): string {
  try {
    const country = detectUserCountry();
    if (country) return currencyForCountry(country);
    const locale = (navigator.language || '').toLowerCase();
    if (locale.includes('ar-eg')) return 'EGP';
    if (locale.includes('ar-sa')) return 'SAR';
    if (locale.startsWith('ru')) return 'RUB';
    if (
      locale.startsWith('de') || locale.startsWith('fr') || locale.startsWith('es') ||
      locale.startsWith('it') || locale.startsWith('nl') || locale.startsWith('pt') ||
      locale.startsWith('el')
    ) {
      return 'EUR';
    }
  } catch {
    // fallback
  }
  return 'USD';
}
