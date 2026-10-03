// ============================================================
// VEX Money — canonical currency model.
// Imported by BOTH the React client (src/) and the Express server
// (server/), so keep this file dependency-free: pure types + pure
// functions only (mirrors shared/lotteryConfig.ts conventions).
//
// All stored amounts in the platform are USD (source of truth);
// these helpers convert + format for *display* in the visitor's
// country currency. Rates are static central constants (admin-editable
// live rates are a documented future step).
// ============================================================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  nameAr: string;
  /** 1 USD = X currency */
  rateToUSD: number;
  /** Displayed decimal places (default 2) */
  decimals?: number;
  /** Symbol goes AFTER the amount (e.g. `1,234 ₽`) */
  suffix?: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', nameAr: 'دولار أمريكي', rateToUSD: 1 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', nameAr: 'يورو', rateToUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', nameAr: 'جنيه إسترليني', rateToUSD: 0.78 },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', nameAr: 'روبل روسي', rateToUSD: 95, decimals: 0, suffix: true },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', nameAr: 'جنيه مصري', rateToUSD: 48.5 },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', rateToUSD: 3.75 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', rateToUSD: 3.6725 },
  KWD: { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', rateToUSD: 0.307, decimals: 3 },
  QAR: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', nameAr: 'ريال قطري', rateToUSD: 3.64 },
  BHD: { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', nameAr: 'دينار بحريني', rateToUSD: 0.376, decimals: 3 },
  OMR: { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', nameAr: 'ريال عماني', rateToUSD: 0.3845, decimals: 3 },
  JOD: { code: 'JOD', symbol: 'JOD', name: 'Jordanian Dinar', nameAr: 'دينار أردني', rateToUSD: 0.709, decimals: 3 },
  LBP: { code: 'LBP', symbol: 'LBP', name: 'Lebanese Pound', nameAr: 'ليرة لبنانية', rateToUSD: 89500, decimals: 0 },
  IQD: { code: 'IQD', symbol: 'IQD', name: 'Iraqi Dinar', nameAr: 'دينار عراقي', rateToUSD: 1310, decimals: 0 },
  YER: { code: 'YER', symbol: 'YER', name: 'Yemeni Rial', nameAr: 'ريال يمني', rateToUSD: 250, decimals: 0 },
  SYP: { code: 'SYP', symbol: 'SYP', name: 'Syrian Pound', nameAr: 'ليرة سورية', rateToUSD: 13000, decimals: 0 },
  MAD: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', nameAr: 'درهم مغربي', rateToUSD: 9.9 },
  DZD: { code: 'DZD', symbol: 'DZD', name: 'Algerian Dinar', nameAr: 'دينار جزائري', rateToUSD: 134, decimals: 0 },
  TND: { code: 'TND', symbol: 'TND', name: 'Tunisian Dinar', nameAr: 'دينار تونسي', rateToUSD: 3.12, decimals: 3 },
  LYD: { code: 'LYD', symbol: 'LYD', name: 'Libyan Dinar', nameAr: 'دينار ليبي', rateToUSD: 4.85, decimals: 3 },
  SDG: { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pound', nameAr: 'جنيه سوداني', rateToUSD: 600, decimals: 0 },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', nameAr: 'شيكل إسرائيلي', rateToUSD: 3.65 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', nameAr: 'ليرة تركية', rateToUSD: 34.2 },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', nameAr: 'هريفنيا أوكرانية', rateToUSD: 41.5 },
  BYN: { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', nameAr: 'روبل بيلاروسي', rateToUSD: 3.27 },
  KZT: { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', nameAr: 'تينغي كازاخي', rateToUSD: 480, decimals: 0 },
  AMD: { code: 'AMD', symbol: '֏', name: 'Armenian Dram', nameAr: 'درام أرميني', rateToUSD: 387, decimals: 0 },
  AZN: { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', nameAr: 'مانات أذربيجاني', rateToUSD: 1.7 },
  GEL: { code: 'GEL', symbol: '₾', name: 'Georgian Lari', nameAr: 'لاري جورجي', rateToUSD: 2.7 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', nameAr: 'نايرا نيجيرية', rateToUSD: 1550, decimals: 0 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', nameAr: 'سيدي غاني', rateToUSD: 15.4 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', nameAr: 'شلن كيني', rateToUSD: 129, decimals: 0 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', nameAr: 'راند جنوب أفريقي', rateToUSD: 18.2 },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', nameAr: 'شلن تنزاني', rateToUSD: 2600, decimals: 0 },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', nameAr: 'روبية باكستانية', rateToUSD: 278, decimals: 0 },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', nameAr: 'تاكا بنغلاديشية', rateToUSD: 120, decimals: 0 },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', nameAr: 'روبية سريلانكية', rateToUSD: 300, decimals: 0 },
  NPR: { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee', nameAr: 'روبية نيبالية', rateToUSD: 140, decimals: 0 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', nameAr: 'روبية هندية', rateToUSD: 83.5, decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', nameAr: 'يوان صيني', rateToUSD: 7.25 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', nameAr: 'دولار هونغ كونغ', rateToUSD: 7.8 },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', nameAr: 'دولار تايواني', rateToUSD: 31.5 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', nameAr: 'ين ياباني', rateToUSD: 150, decimals: 0 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', nameAr: 'وون كوري', rateToUSD: 1350, decimals: 0 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', nameAr: 'روبية إندونيسية', rateToUSD: 15800, decimals: 0 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', nameAr: 'رينغيت ماليزي', rateToUSD: 4.7 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', nameAr: 'بات تايلاندي', rateToUSD: 36 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', nameAr: 'بيزو فلبيني', rateToUSD: 57, decimals: 0 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', nameAr: 'دونغ فيتنامي', rateToUSD: 25500, decimals: 0 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', nameAr: 'دولار سنغافوري', rateToUSD: 1.34 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', nameAr: 'دولار أسترالي', rateToUSD: 1.52 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', nameAr: 'دولار كندي', rateToUSD: 1.37 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', nameAr: 'دولار نيوزيلندي', rateToUSD: 1.66 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', nameAr: 'فرنك سويسري', rateToUSD: 0.88 },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', nameAr: 'كرونة سويدية', rateToUSD: 9.6, decimals: 0, suffix: true },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', nameAr: 'كرونة نرويجية', rateToUSD: 10.2, decimals: 0, suffix: true },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', nameAr: 'كرونة دنماركية', rateToUSD: 6.9, decimals: 0, suffix: true },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', nameAr: 'زلوتي بولندي', rateToUSD: 3.95, suffix: true },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', nameAr: 'كورونا تشيكية', rateToUSD: 23.2, decimals: 0, suffix: true },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', nameAr: 'فورنت مجري', rateToUSD: 370, decimals: 0, suffix: true },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu', nameAr: 'ليو روماني', rateToUSD: 4.58, suffix: true },
  RSD: { code: 'RSD', symbol: 'дин.', name: 'Serbian Dinar', nameAr: 'دينار صربي', rateToUSD: 108, decimals: 0, suffix: true },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', nameAr: 'ريال برازيلي', rateToUSD: 5.45 },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', nameAr: 'بيزو مكسيكي', rateToUSD: 17.2 },
  ARS: { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', nameAr: 'بيزو أرجنتيني', rateToUSD: 1150, decimals: 0 },
  COP: { code: 'COP', symbol: 'CO$', name: 'Colombian Peso', nameAr: 'بيزو كولومبي', rateToUSD: 4100, decimals: 0 },
  CLP: { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', nameAr: 'بيزو تشيلي', rateToUSD: 950, decimals: 0 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', nameAr: 'سول بيروفي', rateToUSD: 3.7 },
  MRU: { code: 'MRU', symbol: 'MRU', name: 'Mauritanian Ouguiya', nameAr: 'أوقية موريتانية', rateToUSD: 40, decimals: 0 },
  DJF: { code: 'DJF', symbol: 'DJF', name: 'Djiboutian Franc', nameAr: 'فرنك جيبوتي', rateToUSD: 177, decimals: 0 },
  SOS: { code: 'SOS', symbol: 'SOS', name: 'Somali Shilling', nameAr: 'شلن صومالي', rateToUSD: 571, decimals: 0 },
  IRR: { code: 'IRR', symbol: 'IRR', name: 'Iranian Rial', nameAr: 'ريال إيراني', rateToUSD: 42000, decimals: 0 },
  ETB: { code: 'ETB', symbol: 'ETB', name: 'Ethiopian Birr', nameAr: 'بير إثيوبي', rateToUSD: 130, decimals: 0 },
  UGX: { code: 'UGX', symbol: 'UGX', name: 'Ugandan Shilling', nameAr: 'شلن أوغندي', rateToUSD: 3600, decimals: 0 },
  USDT: { code: 'USDT', symbol: '₮', name: 'Tether', nameAr: 'تيثر', rateToUSD: 1 },
};

/**
 * ISO-3166-1 alpha-2 → currency code. Anything missing falls back to USD,
 * so extending coverage later is a pure data addition.
 */
export const COUNTRY_CURRENCY: Record<string, string> = {
  // MENA
  EG: 'EGP', SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD', OM: 'OMR',
  JO: 'JOD', LB: 'LBP', IQ: 'IQD', SY: 'SYP', YE: 'YER', PS: 'ILS',
  MA: 'MAD', DZ: 'DZD', TN: 'TND', LY: 'LYD', SD: 'SDG',
  TR: 'TRY', IL: 'ILS',
  // CIS / Caucasus
  RU: 'RUB', UA: 'UAH', BY: 'BYN', KZ: 'KZT', AM: 'AMD', AZ: 'AZN', GE: 'GEL',
  // Europe (EUR zone)
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  PT: 'EUR', GR: 'EUR', IE: 'EUR', FI: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR',
  LV: 'EUR', LT: 'EUR', HR: 'EUR', CY: 'EUR', LU: 'EUR', MT: 'EUR', BG: 'EUR',
  // Europe (national currencies)
  GB: 'GBP', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', RS: 'RSD', CH: 'CHF',
  SE: 'SEK', NO: 'NOK', DK: 'DKK',
  // Africa
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', TZ: 'TZS',
  MR: 'MRU', DJ: 'DJF', SO: 'SOS', ET: 'ETB', UG: 'UGX',
  // Asia
  PK: 'PKR', BD: 'BDT', IN: 'INR', LK: 'LKR', NP: 'NPR', CN: 'CNY', HK: 'HKD',
  TW: 'TWD', JP: 'JPY', KR: 'KRW', ID: 'IDR', MY: 'MYR', TH: 'THB', PH: 'PHP',
  VN: 'VND', SG: 'SGD', IR: 'IRR',
  // Oceania
  AU: 'AUD', NZ: 'NZD',
  // Americas
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN',
};

/**
 * IANA timezone → country (client-side fallback when no server geo is
 * available: file:// previews, blocked requests, first paint before /api/geo).
 */
export const TIMEZONE_COUNTRY: Record<string, string> = {
  'africa/cairo': 'EG', 'africa/casablanca': 'MA', 'africa/algiers': 'DZ',
  'africa/tunis': 'TN', 'africa/tripoli': 'LY', 'africa/khartoum': 'SD',
  'africa/nairobi': 'KE', 'africa/lagos': 'NG', 'africa/accra': 'GH',
  'africa/addis_ababa': 'ET', 'africa/dar_es_salaam': 'TZ', 'africa/kampala': 'UG',
  'africa/johannesburg': 'ZA', 'africa/abidjan': 'CI', 'africa/dakar': 'SN',
  'europe/istanbul': 'TR', 'europe/moscow': 'RU', 'europe/kyiv': 'UA',
  'europe/minsk': 'BY', 'europe/kaliningrad': 'RU', 'asia/yerevan': 'AM',
  'asia/baku': 'AZ', 'asia/tbilisi': 'GE', 'asia/almaty': 'KZ', 'asia/astana': 'KZ',
  'europe/london': 'GB', 'europe/dublin': 'IE', 'europe/lisbon': 'PT',
  'europe/paris': 'FR', 'europe/brussels': 'BE', 'europe/amsterdam': 'NL',
  'europe/berlin': 'DE', 'europe/vienna': 'AT', 'europe/madrid': 'ES',
  'europe/rome': 'IT', 'europe/zurich': 'CH', 'europe/prague': 'CZ',
  'europe/warsaw': 'PL', 'europe/budapest': 'HU', 'europe/bucharest': 'RO',
  'europe/sofia': 'BG', 'europe/athens': 'GR', 'europe/stockholm': 'SE',
  'europe/oslo': 'NO', 'europe/copenhagen': 'DK', 'europe/helsinki': 'FI',
  'europe/tallinn': 'EE', 'europe/riga': 'LV', 'europe/vilnius': 'LT',
  'europe/zagreb': 'HR', 'europe/bratislava': 'SK', 'europe/ljubljana': 'SI',
  'europe/nicosia': 'CY', 'europe/luxembourg': 'LU', 'europe/malta': 'MT',
  'europe/belgrade': 'RS', 'europe/chisinau': 'MD',
  'asia/riyadh': 'SA', 'asia/dubai': 'AE', 'asia/kuwait': 'KW', 'asia/qatar': 'QA',
  'asia/bahrain': 'BH', 'asia/muscat': 'OM', 'asia/amman': 'JO', 'asia/beirut': 'LB',
  'asia/baghdad': 'IQ', 'asia/damascus': 'SY', 'asia/aden': 'YE', 'asia/gaza': 'PS',
  'asia/hebron': 'PS', 'asia/jerusalem': 'IL', 'asia/karachi': 'PK', 'asia/dhaka': 'BD',
  'asia/kolkata': 'IN', 'asia/colombo': 'LK', 'asia/kathmandu': 'NP',
  'asia/shanghai': 'CN', 'asia/chongqing': 'CN', 'asia/hong_kong': 'HK',
  'asia/taipei': 'TW', 'asia/tokyo': 'JP', 'asia/seoul': 'KR', 'asia/jakarta': 'ID',
  'asia/pontianak': 'ID', 'asia/kuala_lumpur': 'MY', 'asia/bangkok': 'TH',
  'asia/manila': 'PH', 'asia/ho_chi_minh': 'VN', 'asia/singapore': 'SG',
  'asia/yangon': 'MM', 'asia/tashkent': 'UZ',
  'australia/sydney': 'AU', 'australia/melbourne': 'AU', 'australia/brisbane': 'AU',
  'australia/perth': 'AU', 'australia/adelaide': 'AU', 'pacific/auckland': 'NZ',
  'america/new_york': 'US', 'america/detroit': 'US', 'america/chicago': 'US',
  'america/denver': 'US', 'america/los_angeles': 'US', 'america/phoenix': 'US',
  'america/anchorage': 'US', 'america/boise': 'US', 'america/indianapolis': 'US',
  'america/toronto': 'CA', 'america/vancouver': 'CA', 'america/edmonton': 'CA',
  'america/winnipeg': 'CA', 'america/halifax': 'CA', 'america/st_johns': 'CA',
  'america/mexico_city': 'MX', 'america/tijuana': 'MX', 'america/cancun': 'MX',
  'america/sao_paulo': 'BR', 'america/fortaleza': 'BR', 'america/manaus': 'BR',
  'america/belem': 'BR', 'america/recife': 'BR',
  'america/bogota': 'CO', 'america/santiago': 'CL', 'america/lima': 'PE',
  'america/caracas': 'VE',
};

/** Currency code for an ISO country (falls back to USD). */
export function currencyForCountry(countryIso?: string | null): string {
  if (!countryIso) return 'USD';
  return COUNTRY_CURRENCY[countryIso.toUpperCase()] || 'USD';
}

/** Whether the currency code exists in the supported table. */
export function isSupportedCurrency(code?: string | null): boolean {
  return !!code && Object.prototype.hasOwnProperty.call(SUPPORTED_CURRENCIES, code.toUpperCase());
}

export function convertCurrency(amountInUSD: number, targetCurrency: string): number {
  const curr = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.USD;
  const value = Number.isFinite(amountInUSD) ? amountInUSD : 0;
  return value * curr.rateToUSD;
}

const groupNumber = (value: number, decimals: number): string => {
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 ? '-' : '';
  return fracPart ? `${sign}${grouped}.${fracPart}` : `${sign}${grouped}`;
};

/**
 * Format a USD amount for display in the target currency.
 * Deterministic (manual grouping) so every browser renders identically —
 * no dependence on Intl locale data availability.
 *
 * formatMoney(1234.5, 'EGP') -> "E£1,234.50"
 * formatMoney(1234,   'RUB') -> "1,234 ₽"
 * formatMoney(1234,   'SAR') -> "SAR 1,234.00"
 */
export function formatMoney(amountInUSD: number, targetCurrency?: string | null): string {
  const code = (targetCurrency || 'USD').toUpperCase();
  const curr = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
  const decimals = curr.decimals ?? 2;
  const converted = convertCurrency(amountInUSD, curr.code);
  const body = groupNumber(converted, decimals);
  if (curr.suffix) return `${body} ${curr.symbol}`;
  // Single-char symbols hug the number ($10); code-style symbols get a space.
  if (curr.symbol.length === 1) return `${curr.symbol}${body}`;
  return `${curr.symbol} ${body}`;
}

/** "1 USD" style compact label (used for currency chips). */
export function currencyLabel(code: string): { symbol: string; nameAr: string; name: string } {
  const curr = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
  return { symbol: curr.symbol, nameAr: curr.nameAr, name: curr.name };
}
