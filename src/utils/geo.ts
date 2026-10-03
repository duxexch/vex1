// Client-side country resolution with a progressive fallback chain:
//   1. window.__VEX_GEO            (injected by the server's SSR shell)
//   2. GET /api/geo                (GeoIP server-side; cached 24h)
//   3. timezone / locale guess     (offline-safe, works from file:// too)
// All values are ISO-3166-1 alpha-2 ('EG', 'SA', ...).

import { TIMEZONE_COUNTRY, currencyForCountry } from '../../shared/money';

export interface GeoInfo {
  country: string | null;
  currency: string;
  source: 'ssr' | 'api' | 'tz' | 'locale' | 'none';
}

declare global {
  interface Window {
    __VEX_GEO?: { country?: string | null; currency?: string; source?: string };
  }
}

const CACHE_KEY = 'vex_geo_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface GeoCache {
  t: number;
  country: string | null;
  source: string;
}

const normalize = (c?: string | null): string | null => {
  if (!c) return null;
  const up = c.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(up) || up === 'ZZ' || up === 'XX') return null;
  return up;
};

function tzCountry(): string | null {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    return TIMEZONE_COUNTRY[tz] || null;
  } catch {
    return null;
  }
}

function localeCountry(): string | null {
  try {
    const locales = [navigator.language, ...(navigator.languages || [])].filter(Boolean) as string[];
    for (const loc of locales) {
      const low = loc.toLowerCase();
      const region = low.split('-')[1];
      if (region && region.length === 2 && /^[a-z]{2}$/.test(region)) return region.toUpperCase();
      if (low === 'ru' || low.startsWith('ru-')) return 'RU';
      if (low === 'tr' || low.startsWith('tr-')) return 'TR';
      if (low === 'ar' || low.startsWith('ar-')) return null; // ar spans many countries
      if (low === 'zh' || low.startsWith('zh-')) return 'CN';
      if (low === 'ja' || low.startsWith('ja-')) return 'JP';
      if (low === 'ko' || low.startsWith('ko-')) return 'KR';
      if (low === 'hi' || low.startsWith('hi-')) return 'IN';
      if (low === 'pt' || low.startsWith('pt-br')) return low.startsWith('pt-br') ? 'BR' : 'PT';
    }
  } catch {
    // ignore
  }
  return null;
}

function readSsrGeo(): GeoInfo | null {
  try {
    const g = typeof window !== 'undefined' ? window.__VEX_GEO : undefined;
    if (g && normalize(g.country)) {
      const country = normalize(g.country)!;
      return { country, currency: g.currency || currencyForCountry(country), source: 'ssr' };
    }
  } catch {
    // ignore
  }
  return null;
}

function readCache(): GeoInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoCache;
    if (!parsed || typeof parsed.t !== 'number' || Date.now() - parsed.t > CACHE_TTL_MS) return null;
    const country = normalize(parsed.country);
    if (!country) return null;
    return { country, currency: currencyForCountry(country), source: 'api' };
  } catch {
    return null;
  }
}

function writeCache(country: string | null, source: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), country, source }));
  } catch {
    // quota / private mode — ignore
  }
}

/**
 * Best-effort country WITHOUT awaiting the network (safe for first paint).
 * Order: SSR injection → 24h cache → timezone → locale.
 */
export function resolveCountrySync(): GeoInfo {
  const ssr = readSsrGeo();
  if (ssr) return ssr;
  const cached = readCache();
  if (cached) return cached;
  const tz = tzCountry();
  if (tz) {
    return { country: tz, currency: currencyForCountry(tz), source: 'tz' };
  }
  const loc = localeCountry();
  if (loc) {
    return { country: loc, currency: currencyForCountry(loc), source: 'locale' };
  }
  return { country: null, currency: 'USD', source: 'none' };
}

/**
 * Authoritative resolution: server GeoIP when reachable, else local guess.
 * Never throws; the local guess is used as the immediate value while the
 * network answer refreshes in the background.
 */
export async function resolveCountry(): Promise<GeoInfo> {
  const immediate = resolveCountrySync();
  if (immediate.source === 'ssr') return immediate;
  try {
    const res = await fetch('/api/geo', { headers: { accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as { country?: string | null; currency?: string };
      const country = normalize(data.country);
      if (country) {
        writeCache(country, 'api');
        return { country, currency: data.currency || currencyForCountry(country), source: 'api' };
      }
      writeCache(null, 'api');
    }
  } catch {
    // offline / blocked — keep local guess
  }
  return immediate;
}
