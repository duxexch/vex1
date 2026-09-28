export interface BrandThemeConfig {
  companyId: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  gradient: string;
  cardBorderColor: string;
  appNameAr: string;
  appNameEn: string;
  taglineAr: string;
  taglineEn: string;
  heroBadgeAr: string;
  heroBadgeEn: string;
  exclusivePerksAr: string[];
  exclusivePerksEn: string[];
}

export const COMPANY_THEMES: Record<string, BrandThemeConfig> = {
  // 1XBET
  CMP1XB001: {
    companyId: 'CMP1XB001',
    brandName: '1XBET',
    primaryColor: '#0d579b',
    secondaryColor: '#093b74',
    accentColor: '#00a2f4',
    textColor: '#ffffff',
    gradient: 'from-[#093b74] via-[#0d579b] to-[#1572cf]',
    cardBorderColor: 'rgba(13, 87, 155, 0.4)',
    appNameAr: '1XBET VIP Club',
    appNameEn: '1XBET VIP Club',
    taglineAr: 'تطبيق المكافآت والتعويضات لعملاء 1XBET',
    taglineEn: 'VIP Rewards & Loss-Back Club for 1XBET',
    heroBadgeAr: 'منصة الكاش باك والتعويضات لـ 1XBET',
    heroBadgeEn: '1XBET Loyalty & Compensation Partner',
    exclusivePerksAr: [
      'استرداد بنسبة مئوية كأرصدة مجمدة تفك تلقائياً',
      'كود برومو (vexwallet) يمنح بونص إيداع إضافي 130%',
      'سحب وأرصدة عبر المحافظ الإلكترونية والعملات الرقمية',
      'تحليلات تكتيكية مباشرة لجميع مباريات 1XBET بواسطة AI',
    ],
    exclusivePerksEn: [
      'Percentage-based compensation into an auto-unfreezing wallet',
      'Promo code (vexwallet) unlocking 130% deposit bonus',
      'Withdrawals to local & crypto wallets',
      'Direct AI tactical match predictions integrated with live odds',
    ],
  },

  // MELBET
  CMPMLB002: {
    companyId: 'CMPMLB002',
    brandName: 'MELBET',
    primaryColor: '#f59e0b',
    secondaryColor: '#18181b',
    accentColor: '#fbbf24',
    textColor: '#ffffff',
    gradient: 'from-[#18181b] via-[#27272a] to-[#78350f]',
    cardBorderColor: 'rgba(245, 158, 11, 0.4)',
    appNameAr: 'MELBET Elite Rewards',
    appNameEn: 'MELBET Elite Rewards',
    taglineAr: 'نادي كاش باك وتعويضات مالبينت MELBET',
    taglineEn: 'MELBET Cashback & VIP Player Hub',
    heroBadgeAr: 'بوابة ولاء واسترداد لاعبي MELBET',
    heroBadgeEn: 'MELBET Loss-Back & VIP Gateway',
    exclusivePerksAr: [
      'كاش باك أسبوعي على جميع الرهانات الرياضية',
      'كود الترويج (ml_3154096) لبونص الإيداع الأول',
      'فك التجميد اليومي بمعدل 10% لكل رهان نشط',
      'احتمالات فوز وتغطية الدوريات الكبرى مع الذكاء الاصطناعي',
    ],
    exclusivePerksEn: [
      'Weekly cashback on all sports & esports betting slips',
      'Promo code (ml_3154096) for a first deposit match',
      'Fast daily unfreezing rate (10% per active qualified bet)',
      'Market odds backed by Gemini statistical modeling',
    ],
  },

  // BETJAM
  CMPBJ003: {
    companyId: 'CMPBJ003',
    brandName: 'BETJAM',
    primaryColor: '#8b5cf6',
    secondaryColor: '#4c1d95',
    accentColor: '#c084fc',
    textColor: '#ffffff',
    gradient: 'from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]',
    cardBorderColor: 'rgba(139, 92, 246, 0.4)',
    appNameAr: 'BETJAM VIP Lounge',
    appNameEn: 'BETJAM VIP Lounge',
    taglineAr: 'تطبيق المكافآت التنافسية وحماية الأرصدة للاعبي BETJAM',
    taglineEn: 'Competitive Rewards & Account Protection for BETJAM',
    heroBadgeAr: 'النادي الملكي لكاش باك BETJAM',
    heroBadgeEn: 'Royal BETJAM Cashback Network',
    exclusivePerksAr: [
      'تعويض على التذاكر غير الموفقة مع فك رصيد سلس',
      'كود برومو (VEDO2002) لمزايا اللاعبين',
      'واجهة تحويل محمية برمز PIN مشفر',
    ],
    exclusivePerksEn: [
      'Loss rebate on unlucky bet slips with seamless unfreeze',
      'Promo code (VEDO2002) for member perks',
      'PIN-secured wallet-to-wallet transactions',
    ],
  },

  // MOSTBET
  CMPMB004: {
    companyId: 'CMPMB004',
    brandName: 'MOSTBET',
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    accentColor: '#f59e0b',
    textColor: '#ffffff',
    gradient: 'from-[#991b1b] via-[#dc2626] to-[#ea580c]',
    cardBorderColor: 'rgba(220, 38, 38, 0.4)',
    appNameAr: 'MOSTBET Star Rewards',
    appNameEn: 'MOSTBET Star Rewards',
    taglineAr: 'بوابة موستبيت MOSTBET للتعويضات والمدفوعات',
    taglineEn: 'MOSTBET Gateway for Cashback & Payouts',
    heroBadgeAr: 'تطبيق النجوم لـ MOSTBET',
    heroBadgeEn: 'MOSTBET Star Rewards',
    exclusivePerksAr: [
      'بونص ترحيبي يصل لـ 125% مع كود (vedo2002)',
      'سحب لجميع المحافظ الإلكترونية والعملات الرقمية',
      'تأمين كامل على الرهانات الرياضية المجمعة (Acca Insurance)',
    ],
    exclusivePerksEn: [
      '125% Welcome Bonus with promo code (vedo2002)',
      'Payout processing to all local and crypto e-wallets',
      'Accumulator bet insurance and comprehensive loss coverage',
    ],
  },

  // XPARI
  CMPXP005: {
    companyId: 'CMPXP005',
    brandName: 'XPARI',
    primaryColor: '#06b6d4',
    secondaryColor: '#0e7490',
    accentColor: '#67e8f9',
    textColor: '#ffffff',
    gradient: 'from-[#0e7490] via-[#0891b2] to-[#06b6d4]',
    cardBorderColor: 'rgba(6, 182, 212, 0.4)',
    appNameAr: 'XPARI Pro Rewards',
    appNameEn: 'XPARI Pro Rewards',
    taglineAr: 'تطبيق إكس باري XPARI للتحليلات الإحصائية واسترداد النقود',
    taglineEn: 'XPARI Advanced Sports Analytics & High-Rebate Club',
    heroBadgeAr: 'شريك الاسترداد لـ XPARI',
    heroBadgeEn: 'XPARI Rebate Partner',
    exclusivePerksAr: [
      'كاش باك وتغطية شاملة للرياضات الإلكترونية',
      'كود التفعيل (vedo2002) لربط الحساب بنظام التأمين',
      'تحليلات تكتيكية في الوقت الفعلي مع نسب فوز',
    ],
    exclusivePerksEn: [
      'Esports rebate tier with live score integrations',
      'Activation promo (vedo2002) for account insurance',
      'Real-time tactical intelligence powered by modern AI',
    ],
  },

  // BIZBET
  CMPBB006: {
    companyId: 'CMPBB006',
    brandName: 'BIZBET',
    primaryColor: '#059669',
    secondaryColor: '#064e3b',
    accentColor: '#34d399',
    textColor: '#ffffff',
    gradient: 'from-[#064e3b] via-[#059669] to-[#10b981]',
    cardBorderColor: 'rgba(5, 150, 105, 0.4)',
    appNameAr: 'BIZBET Fast Cashback',
    appNameEn: 'BIZBET Fast Cashback',
    taglineAr: 'منصة بيزبِت BIZBET المتطورة للمكافآت والتعويضات السريعة',
    taglineEn: 'BIZBET Next-Gen Cashback & Player Compensation',
    heroBadgeAr: 'منظومة الأمان والولاء لـ BIZBET',
    heroBadgeEn: 'BIZBET Player Loyalty System',
    exclusivePerksAr: [
      'تشفير بنكي عالي الأمان لحماية حسابات اللاعبين',
      'كود (bi_9258) يتيح الدخول التلقائي في سحوبات أسبوعية',
      'دعم مباشر على مدار 24 ساعة',
    ],
    exclusivePerksEn: [
      'Bank-grade encryption guarding member balances and payouts',
      'Promo (bi_9258) enabling automatic prize entries',
      '24/7 dedicated support for claim handling',
    ],
  },

  // LINEBET
  CMPLB007: {
    companyId: 'CMPLB007',
    brandName: 'LINEBET',
    primaryColor: '#15803d',
    secondaryColor: '#14532d',
    accentColor: '#84cc16',
    textColor: '#ffffff',
    gradient: 'from-[#14532d] via-[#15803d] to-[#16a34a]',
    cardBorderColor: 'rgba(21, 128, 61, 0.4)',
    appNameAr: 'LINEBET VIP Green',
    appNameEn: 'LINEBET VIP Green',
    taglineAr: 'نادي الولاء والاسترداد لمراهنات لاين بيت LINEBET',
    taglineEn: 'VIP Loyalty & Cashback App for LINEBET',
    heroBadgeAr: 'تطبيق الولاء لـ LINEBET',
    heroBadgeEn: 'LINEBET Loyalty App',
    exclusivePerksAr: [
      'أسعار واحتمالات مع كاش باك على التذاكر',
      'كود الترويج (VEDO2002) عند التسجيل',
      'تطبيق خفيف وفائق السرعة متوافق مع كافة الهواتف الذكية',
    ],
    exclusivePerksEn: [
      'Competitive match odds with rebate on unsettled bets',
      'Promo code (VEDO2002) for new registrations',
      'Ultra-lightweight and battery-efficient mobile application',
    ],
  },

  // GOOOBET
  CMPGB008: {
    companyId: 'CMPGB008',
    brandName: 'GOOOBET',
    primaryColor: '#ca8a04',
    secondaryColor: '#854d0e',
    accentColor: '#facc15',
    textColor: '#ffffff',
    gradient: 'from-[#854d0e] via-[#ca8a04] to-[#eab308]',
    cardBorderColor: 'rgba(202, 138, 4, 0.4)',
    appNameAr: 'GOOOBET Gold Club',
    appNameEn: 'GOOOBET Gold Club',
    taglineAr: 'تطبيق المكافآت الذهبي وتأمين التذاكر لـ GOOOBET',
    taglineEn: 'GOOOBET Golden Rewards & Bet Slip Protection',
    heroBadgeAr: 'النادي الذهبي لكاش باك GOOOBET',
    heroBadgeEn: 'GOOOBET Golden Cashback Club',
    exclusivePerksAr: [
      'تعويضات واسترداد الأرصدة المجمدة',
      'كود برومو ذهبي (Vex) لتنشيط الحسابات المميزة',
      'إحصائيات متقدمة وجدول مباريات يومي مدعوم بالذكاء الاصطناعي',
    ],
    exclusivePerksEn: [
      'Loss recovery plan with expedited unfreeze rates',
      'Golden promo code (Vex) for VIP privilege tiers',
      'Comprehensive match statistics with daily AI-backed fixtures',
    ],
  },
};

// Fallback theme builder for custom companies added by admin
export function getCompanyTheme(companyId: string, companyName?: string, customColor?: string): BrandThemeConfig {
  if (COMPANY_THEMES[companyId]) {
    return COMPANY_THEMES[companyId];
  }

  const name = (companyName || '').toUpperCase();
  if (name.includes('MOSTBET') || name.includes('MOST') || name.includes('موست')) {
    return COMPANY_THEMES['CMPMB004'];
  }
  if (name.includes('XPARI') || name.includes('XP') || name.includes('اكس') || name.includes('اكسباري')) {
    return COMPANY_THEMES['CMPXP005'];
  }
  if (name.includes('BIZBET') || name.includes('BIZ') || name.includes('باز') || name.includes('بيز') || name.includes('بيزبِت')) {
    return COMPANY_THEMES['CMPBB006'];
  }
  if (name.includes('1XBET') || name.includes('1X') || name.includes('وان')) {
    return COMPANY_THEMES['CMP1XB001'];
  }
  if (name.includes('MELBET') || name.includes('ميل')) {
    return COMPANY_THEMES['CMPMLB002'];
  }
  if (name.includes('BETJAM') || name.includes('جام')) {
    return COMPANY_THEMES['CMPBJ003'];
  }
  if (name.includes('LINEBET') || name.includes('لاين')) {
    return COMPANY_THEMES['CMPLB007'];
  }
  if (name.includes('GOOOBET') || name.includes('GOOO') || name.includes('قو') || name.includes('جو')) {
    return COMPANY_THEMES['CMPGB008'];
  }

  const displayName = name || 'Bookmaker';
  const color = customColor || '#0d579b';

  return {
    companyId,
    brandName: name,
    primaryColor: color,
    secondaryColor: '#1e293b',
    accentColor: '#38bdf8',
    textColor: '#ffffff',
    gradient: `from-[${color}] to-slate-900`,
    cardBorderColor: `${color}66`,
    appNameAr: `${name} VIP Rewards`,
    appNameEn: `${name} VIP Rewards`,
    taglineAr: `تطبيق الولاء والتعويضات لعملاء ${name}`,
    taglineEn: `Loyalty & Cashback Application for ${name}`,
    heroBadgeAr: `منصة الكاش باك والتعويضات لـ ${name}`,
    heroBadgeEn: `${name} Loyalty & Compensation Partner`,
    exclusivePerksAr: [
      'استرداد وتأمين الحسابات لدى المنصة الشريكة',
      'أكواد ترويجية للحصول على بونص الإيداع',
      'سحب وأرصدة سريعة بنظام المحفظة الموحدة',
    ],
    exclusivePerksEn: [
      'Account compensation & loss recovery',
      'Promo codes for available deposit bonuses',
      'Payout execution with PIN protection',
    ],
  };
}
