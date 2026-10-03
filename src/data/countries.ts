// Country picker data for the admin payment-method form.
// ISO codes match COUNTRY_CURRENCY in shared/money.ts so selecting a country
// auto-fills its default currency.

export interface CountryOption {
  iso: string;
  nameAr: string;
  nameEn: string;
  currency: string;
}

/** 🇪🇬 style emoji from an ISO-3166-1 alpha-2 code (pure Unicode math). */
export function flagEmoji(iso?: string | null): string {
  if (!iso || iso.length !== 2) return '🌐';
  const code = iso.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(code).map((c) => 127397 + c.charCodeAt(0))
  );
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { iso: 'EG', nameAr: 'مصر', nameEn: 'Egypt', currency: 'EGP' },
  { iso: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', currency: 'SAR' },
  { iso: 'AE', nameAr: 'الإمارات', nameEn: 'United Arab Emirates', currency: 'AED' },
  { iso: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', currency: 'KWD' },
  { iso: 'QA', nameAr: 'قطر', nameEn: 'Qatar', currency: 'QAR' },
  { iso: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', currency: 'BHD' },
  { iso: 'OM', nameAr: 'عُمان', nameEn: 'Oman', currency: 'OMR' },
  { iso: 'JO', nameAr: 'الأردن', nameEn: 'Jordan', currency: 'JOD' },
  { iso: 'IQ', nameAr: 'العراق', nameEn: 'Iraq', currency: 'IQD' },
  { iso: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon', currency: 'LBP' },
  { iso: 'SY', nameAr: 'سوريا', nameEn: 'Syria', currency: 'SYP' },
  { iso: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine', currency: 'ILS' },
  { iso: 'YE', nameAr: 'اليمن', nameEn: 'Yemen', currency: 'YER' },
  { iso: 'LY', nameAr: 'ليبيا', nameEn: 'Libya', currency: 'LYD' },
  { iso: 'TN', nameAr: 'تونس', nameEn: 'Tunisia', currency: 'TND' },
  { iso: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria', currency: 'DZD' },
  { iso: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', currency: 'MAD' },
  { iso: 'SD', nameAr: 'السودان', nameEn: 'Sudan', currency: 'SDG' },
  { iso: 'MR', nameAr: 'موريتانيا', nameEn: 'Mauritania', currency: 'MRU' },
  { iso: 'DJ', nameAr: 'جيبوتي', nameEn: 'Djibouti', currency: 'DJF' },
  { iso: 'SO', nameAr: 'الصومال', nameEn: 'Somalia', currency: 'SOS' },
  { iso: 'TR', nameAr: 'تركيا', nameEn: 'Turkey', currency: 'TRY' },
  { iso: 'IR', nameAr: 'إيران', nameEn: 'Iran', currency: 'IRR' },
  { iso: 'PK', nameAr: 'باكستان', nameEn: 'Pakistan', currency: 'PKR' },
  { iso: 'IN', nameAr: 'الهند', nameEn: 'India', currency: 'INR' },
  { iso: 'BD', nameAr: 'بنغلاديش', nameEn: 'Bangladesh', currency: 'BDT' },
  { iso: 'ID', nameAr: 'إندونيسيا', nameEn: 'Indonesia', currency: 'IDR' },
  { iso: 'MY', nameAr: 'ماليزيا', nameEn: 'Malaysia', currency: 'MYR' },
  { iso: 'PH', nameAr: 'الفلبين', nameEn: 'Philippines', currency: 'PHP' },
  { iso: 'TH', nameAr: 'تايلاند', nameEn: 'Thailand', currency: 'THB' },
  { iso: 'VN', nameAr: 'فيتنام', nameEn: 'Vietnam', currency: 'VND' },
  { iso: 'CN', nameAr: 'الصين', nameEn: 'China', currency: 'CNY' },
  { iso: 'JP', nameAr: 'اليابان', nameEn: 'Japan', currency: 'JPY' },
  { iso: 'KR', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea', currency: 'KRW' },
  { iso: 'RU', nameAr: 'روسيا', nameEn: 'Russia', currency: 'RUB' },
  { iso: 'UA', nameAr: 'أوكرانيا', nameEn: 'Ukraine', currency: 'UAH' },
  { iso: 'BY', nameAr: 'بيلاروسيا', nameEn: 'Belarus', currency: 'BYN' },
  { iso: 'KZ', nameAr: 'كازاخستان', nameEn: 'Kazakhstan', currency: 'KZT' },
  { iso: 'AZ', nameAr: 'أذربيجان', nameEn: 'Azerbaijan', currency: 'AZN' },
  { iso: 'GE', nameAr: 'جورجيا', nameEn: 'Georgia', currency: 'GEL' },
  { iso: 'AM', nameAr: 'أرمينيا', nameEn: 'Armenia', currency: 'AMD' },
  { iso: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', currency: 'EUR' },
  { iso: 'FR', nameAr: 'فرنسا', nameEn: 'France', currency: 'EUR' },
  { iso: 'GB', nameAr: 'بريطانيا', nameEn: 'United Kingdom', currency: 'GBP' },
  { iso: 'IT', nameAr: 'إيطاليا', nameEn: 'Italy', currency: 'EUR' },
  { iso: 'ES', nameAr: 'إسبانيا', nameEn: 'Spain', currency: 'EUR' },
  { iso: 'PT', nameAr: 'البرتغال', nameEn: 'Portugal', currency: 'EUR' },
  { iso: 'NL', nameAr: 'هولندا', nameEn: 'Netherlands', currency: 'EUR' },
  { iso: 'BE', nameAr: 'بلجيكا', nameEn: 'Belgium', currency: 'EUR' },
  { iso: 'AT', nameAr: 'النمسا', nameEn: 'Austria', currency: 'EUR' },
  { iso: 'GR', nameAr: 'اليونان', nameEn: 'Greece', currency: 'EUR' },
  { iso: 'IE', nameAr: 'أيرلندا', nameEn: 'Ireland', currency: 'EUR' },
  { iso: 'PL', nameAr: 'بولندا', nameEn: 'Poland', currency: 'PLN' },
  { iso: 'RO', nameAr: 'رومانيا', nameEn: 'Romania', currency: 'RON' },
  { iso: 'CZ', nameAr: 'التشيك', nameEn: 'Czechia', currency: 'CZK' },
  { iso: 'SE', nameAr: 'السويد', nameEn: 'Sweden', currency: 'SEK' },
  { iso: 'NO', nameAr: 'النرويج', nameEn: 'Norway', currency: 'NOK' },
  { iso: 'DK', nameAr: 'الدنمارك', nameEn: 'Denmark', currency: 'DKK' },
  { iso: 'CH', nameAr: 'سويسرا', nameEn: 'Switzerland', currency: 'CHF' },
  { iso: 'US', nameAr: 'الولايات المتحدة', nameEn: 'United States', currency: 'USD' },
  { iso: 'CA', nameAr: 'كندا', nameEn: 'Canada', currency: 'CAD' },
  { iso: 'MX', nameAr: 'المكسيك', nameEn: 'Mexico', currency: 'MXN' },
  { iso: 'BR', nameAr: 'البرازيل', nameEn: 'Brazil', currency: 'BRL' },
  { iso: 'AR', nameAr: 'الأرجنتين', nameEn: 'Argentina', currency: 'ARS' },
  { iso: 'CL', nameAr: 'تشيلي', nameEn: 'Chile', currency: 'CLP' },
  { iso: 'CO', nameAr: 'كولومبيا', nameEn: 'Colombia', currency: 'COP' },
  { iso: 'NG', nameAr: 'نيجيريا', nameEn: 'Nigeria', currency: 'NGN' },
  { iso: 'GH', nameAr: 'غانا', nameEn: 'Ghana', currency: 'GHS' },
  { iso: 'KE', nameAr: 'كينيا', nameEn: 'Kenya', currency: 'KES' },
  { iso: 'ET', nameAr: 'إثيوبيا', nameEn: 'Ethiopia', currency: 'ETB' },
  { iso: 'TZ', nameAr: 'تنزانيا', nameEn: 'Tanzania', currency: 'TZS' },
  { iso: 'UG', nameAr: 'أوغندا', nameEn: 'Uganda', currency: 'UGX' },
  { iso: 'ZA', nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', currency: 'ZAR' },
  { iso: 'AU', nameAr: 'أستراليا', nameEn: 'Australia', currency: 'AUD' },
  { iso: 'NZ', nameAr: 'نيوزيلندا', nameEn: 'New Zealand', currency: 'NZD' },
  { iso: 'IL', nameAr: 'إسرائيل', nameEn: 'Israel', currency: 'ILS' },
];

export function countryByIso(iso?: string | null): CountryOption | undefined {
  if (!iso) return undefined;
  return COUNTRY_OPTIONS.find((c) => c.iso === iso.toUpperCase());
}
