// Shared payment-method scoping helpers — used by the client
// (paymentMethodsService / api.ts / UI) and the server (GET/POST
// /api/payment-methods) so both sides agree on what "visible in country X"
// means.
import type { PaymentMethod } from '../src/types';
import { currencyForCountry } from './money';

/**
 * Fill scope/country/currency/type defaults. Legacy records (written before
 * the country-scope feature) are the Egyptian set → normalized to EG.
 */
export function normalizePaymentMethod(m: PaymentMethod): PaymentMethod {
  const legacy = !m.scope && !m.country_iso;
  const scope: 'global' | 'country' = m.scope === 'global' ? 'global' : 'country';
  const country_iso = (m.country_iso || (legacy ? 'EG' : '')).toUpperCase() || undefined;
  return {
    ...m,
    scope,
    country_iso: scope === 'country' ? country_iso : undefined,
    type: m.type || 'both',
    currency: m.currency || (country_iso ? currencyForCountry(country_iso) : undefined),
    is_active: m.is_active !== false,
  };
}

/** Active methods the given visitor should see: their country's + globals. */
export function filterPaymentMethodsForCountry(
  methods: PaymentMethod[],
  countryIso?: string | null
): PaymentMethod[] {
  const active = methods.filter((m) => m.is_active !== false);
  const country = countryIso ? countryIso.toUpperCase() : null;
  if (!country) return active; // no geo → legacy behavior: show everything
  return active.filter(
    (m) =>
      (m.scope || (m.country_iso ? 'country' : 'global')) === 'global' ||
      (m.country_iso || '').toUpperCase() === country
  );
}
