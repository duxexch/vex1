import React, { useState } from 'react';
import { Company, CompensationAccount, Language, AppBranding } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import { CompaniesTabSkeleton } from './SkeletonLoader';
import { getCompanyTheme } from '../data/companyThemes';
import { getLocalizedCompany } from '../utils/companyTranslator';
import {
  Copy,
  Check,
  Download,
  Info,
  Search,
  ShieldCheck,
  Clock,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Edit3,
  HelpCircle,
  CheckCircle2,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Star,
} from 'lucide-react';

interface CompaniesTabProps {
  companies: Company[];
  accounts: CompensationAccount[];
  onOpenRegister: (company: Company) => void;
  onOpenDetails: (company: Company) => void;
  onRequestComp: (companyId: string) => void;
  lang: Language;
  branding?: AppBranding;
  isLoading?: boolean;
  onCopyToast?: () => void;
}

export const CompaniesTab: React.FC<CompaniesTabProps> = ({
  companies,
  accounts,
  onOpenRegister,
  onOpenDetails,
  onRequestComp,
  lang,
  branding,
  isLoading = false,
  onCopyToast,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllPartners, setShowAllPartners] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterCategory, setFilterCategory] = useState<'all' | 'registered' | 'apps'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vex_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS['ar'];
  const isAr = lang === 'ar';

  if (isLoading || (companies.length === 0 && isLoading)) {
    return <CompaniesTabSkeleton />;
  }

  const toggleFavorite = (companyId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(companyId);
      const newFavs = isFav ? prev.filter(id => id !== companyId) : [...prev, companyId];
      try {
        localStorage.setItem('vex_favorites', JSON.stringify(newFavs));
      } catch {}
      return newFavs;
    });
  };

  const handleCopyPromo = (company: Company) => {
    navigator.clipboard.writeText(company.promo_code);
    setCopiedId(company.id);
    if (onCopyToast) onCopyToast();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Check if exclusive single-brand mode is active
  const isExclusive =
    branding?.exclusiveMode &&
    branding?.targetCompanyId &&
    branding.targetCompanyId !== 'all';

  const exclusiveCompany = isExclusive
    ? companies.find((c) => c.id === branding.targetCompanyId && c.is_active)
    : null;

  const exclusiveTheme = exclusiveCompany
    ? getCompanyTheme(exclusiveCompany.id, exclusiveCompany.name, exclusiveCompany.color)
    : null;

  // Filter companies matching search & category
  const filtered = companies.filter((c) => {
    if (!c.is_active) return false;
    const userAccount = accounts.find((a) => a.company_id === c.id);
    if (filterCategory === 'registered' && !userAccount) return false;
    if (filterCategory === 'apps' && !c.app_link) return false;

    const loc = getLocalizedCompany(c, lang);
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      loc.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q) ||
      c.promo_code.toLowerCase().includes(q)
    );
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0; // maintain previous order
  });

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* ------------------------------------------------------------- */}
      {/* EXCLUSIVE SINGLE-BRAND HERO VIEW                              */}
      {/* ------------------------------------------------------------- */}
      {exclusiveCompany && exclusiveTheme ? (
        <div className="space-y-4">
          <div
            className="rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${exclusiveTheme.secondaryColor || '#0f172a'} 0%, ${exclusiveCompany.color} 50%, ${exclusiveTheme.accentColor || '#38bdf8'} 100%)`,
            }}
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black backdrop-blur-md">
                  <Award className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  {isAr ? exclusiveTheme.heroBadgeAr : exclusiveTheme.heroBadgeEn}
                </span>

                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-black/30 border border-white/15 text-white/90">
                  {isAr ? 'وضع الشريك الحصري 100%' : '100% Exclusive Mode'}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <CompanyBrandLogo
                  companyName={exclusiveCompany.name}
                  size="xl"
                  className="ring-4 ring-white/30 shadow-lg"
                />
                <div className="space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                    {isAr ? exclusiveTheme.appNameAr : exclusiveTheme.appNameEn}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 font-medium leading-snug max-w-sm">
                    {isAr ? exclusiveTheme.taglineAr : exclusiveTheme.taglineEn}
                  </p>
                </div>
              </div>

              {/* Promo Code Box */}
              <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex items-center justify-between gap-3 shadow-inner">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-white/80 block font-medium">
                    {isAr ? 'كود الوكالة المعتمد للبونص وحماية الخسائر:' : 'Official Agency Code for Cashback:'}
                  </span>
                  <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                    {exclusiveCompany.promo_code}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyPromo(exclusiveCompany)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black flex items-center gap-1.5 transition-transform active:scale-95 shadow-md cursor-pointer"
                >
                  {copiedId === exclusiveCompany.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-700" />
                      <span>{isAr ? 'نسخ الكود' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Toggle other partners in exclusive mode */}
          <div className="text-center pt-1">
            <button
              onClick={() => setShowAllPartners(!showAllPartners)}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-colors inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <span>
                {isAr
                  ? `استعراض باقي الشركات (${companies.length - 1} منصة)`
                  : `View other partners (${companies.length - 1})`}
              </span>
              {showAllPartners ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* ========================================================= */}
          {/* RICH COMPANY SECTIONS & GUIDES (DEDICATED WEBSITE PORTAL) */}
          {/* ========================================================= */}
          {(() => {
            const customSite = branding?.companyCustomWebsites?.[exclusiveCompany.id];
            const promo = customSite?.promoCode || exclusiveCompany.promo_code;
            const affLink = customSite?.affiliateLink || exclusiveCompany.affiliate_link;
            const appLink = customSite?.appDownloadLink || exclusiveCompany.app_link;

            return (
              <div className="space-y-4 pt-2">
                {/* Quick Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <a
                    href={affLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {isAr ? 'التسجيل وفتح الحساب الرسمي' : 'Official Account Registration'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? `سجل بالكود (${promo}) للبونص` : `Register with code (${promo})`}
                      </p>
                    </div>
                  </a>

                  <a
                    href={appLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-500 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {isAr ? 'تحميل تطبيق الموبايل الرسمي' : 'Download Official Mobile App'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'تطبيق سريع وآمن لأندرويد وآيفون' : 'Fast & secure app for Android/iOS'}
                      </p>
                    </div>
                  </a>

                  <button
                    onClick={() => onRequestComp(exclusiveCompany.id)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500 transition-all flex items-center gap-3 group text-left w-full cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {isAr ? 'طلب حماية الخسائر والاسترداد' : 'Request Cashback & Protection'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'استرداد نقدي فوري على خسائر رهاناتك' : 'Instant cashback on losses'}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Section 1: About & Overview */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                      <Info className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr
                        ? customSite?.sections?.overview?.titleAr || `نبذة عن منصة ${exclusiveCompany.name} ومميزات الوكالة الحصرية`
                        : customSite?.sections?.overview?.titleEn || `About ${exclusiveCompany.name} & Exclusive Agency Perks`}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isAr
                      ? customSite?.sections?.overview?.contentAr || `${exclusiveCompany.description} تعتبر المنصة من أهم الشركاء المعتمدين لدينا، حيث نوفر لجميع اللاعبين المسجلين عبر كود الوكالة (${promo}) ميزات استثنائية تشمل بونص ترحيبي مضاعف، حماية خسائر أسبوعية، وسرعة فائقة في عمليات الإيداع والسحب.`
                      : customSite?.sections?.overview?.contentEn || `${exclusiveCompany.description} As our certified official partner, players registering with agency code (${promo}) receive exceptional privileges including doubled welcome bonuses, weekly loss protection, and priority deposits/withdrawals.`}
                  </p>
                </div>

                {/* Section 2: Registration Guide */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr
                        ? customSite?.sections?.registrationGuide?.titleAr || 'دليل التسجيل وتفعيل كود البرومو خطوة بخطوة'
                        : customSite?.sections?.registrationGuide?.titleEn || 'Step-by-Step Registration & Promo Code Guide'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1.5">
                      <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">1</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'الدخول عبر رابط الوكالة المعتمد' : 'Open Official Link'}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {isAr ? 'اضغط على زر التسجيل الرسمي للانتقال مباشرة للموقع الآمن.' : 'Click official registration to access secure portal.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1.5">
                      <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">2</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'إدخال كود البرومو بدقة' : 'Enter Promo Code'}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {isAr ? `تأكد من كتابة الكود (${promo}) في خانة الكود الدعائي.` : `Ensure code (${promo}) is entered in referral field.`}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1.5">
                      <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">3</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'ربط الحساب وبدء الاستفادة' : 'Link & Claim Benefits'}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {isAr ? 'سجل رقم حسابك في المنصة هنا لتفعيل حماية الخسائر والبونص فوراً.' : 'Register account number here to activate loss protection instantly.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Cashback & Protection Policy */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr
                        ? customSite?.sections?.cashbackPolicy?.titleAr || 'سياسة حماية الخسائر والاسترداد النقدي (Cashback)'
                        : customSite?.sections?.cashbackPolicy?.titleEn || 'Cashback & Loss Protection Policy'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isAr
                      ? customSite?.sections?.cashbackPolicy?.contentAr || `نوفر لك في VEX Deals شبكة أمان متكاملة؛ ففي حال واجهتك خسائر في رهاناتك عبر منصة ${exclusiveCompany.name}، يمكنك تقديم رقم الحساب وقسيمة الرهان عبر قسم المحفظة والتعويضات لاسترداد جزء كبير من الخسائر وفق جدول التعويضات المعتمد للوكالة.`
                      : customSite?.sections?.cashbackPolicy?.contentEn || `VEX Deals provides an integrated safety net. If you experience losses on ${exclusiveCompany.name}, submit your account ID and bet slip in the compensation wallet to recover a substantial percentage according to official agency terms.`}
                  </p>
                </div>

                {/* Section 4: FAQ */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? 'الأسئلة الشائعة حول الوكالة والبونص' : 'Frequently Asked Questions (FAQ)'}
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <strong className="block text-slate-900 dark:text-white font-bold mb-1">
                        {isAr ? 'كيف أتأكد أن حسابي مرتبط بوكالتنا بنجاح؟' : 'How do I confirm my account is linked?'}
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        {isAr ? 'بمجرد التسجيل باستخدام كود البرومو وإدخال رقم الحساب في قسم الحسابات، يتم التحقق الآلي من ارتباط حسابك بالوكالة.' : 'Once registered with the promo code and account number entered in accounts tab, automated verification confirms agency linkage.'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <strong className="block text-slate-900 dark:text-white font-bold mb-1">
                        {isAr ? 'متى يتم صرف تعويضات الخسائر والاسترداد النقدي؟' : 'When are cashback compensations paid out?'}
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        {isAr ? 'يتم مراجعة الطلبات والتحقق من قسائم الرهان خلال 24 ساعة وصرف الأرصدة مباشرة إلى محفظتك.' : 'Requests and bet slips are reviewed within 24 hours with funds credited directly to your wallet.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* MULTI-BRAND PLATFORM HERO BANNER                              */
        /* ------------------------------------------------------------- */
        <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                  {t.verifiedPartners}
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {companies.filter((c) => c.is_active).length} {t.activeCount}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.companyCardSubtitle}
            </p>

            {/* Search bar and Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchCompanyPlaceholder}
                  className="w-full h-10 pr-9 pl-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* View Switcher & Filter Pills */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterCategory === 'all'
                        ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('registered')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterCategory === 'registered'
                        ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? 'حساباتي' : 'Linked'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('apps')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterCategory === 'apps'
                        ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? 'تطبيقات' : 'Apps'}
                  </button>
                </div>

                {/* View Mode Switcher (Grid vs Table) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={isAr ? 'عرض البطاقات المتوازنة' : 'Grid View'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={isAr ? 'عرض الجدول الاحترافي للكمبيوتر' : 'Table View'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* COMPANIES LIST - ADAPTIVE GRID OR DESKTOP TABLE VIEW          */}
      {/* ------------------------------------------------------------- */}
      {(!exclusiveCompany || showAllPartners) && (
        <>
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 shadow-2xs">
              {isAr ? 'لم يتم العثور على شركات تطابق معايير البحث.' : 'No partner companies match your criteria.'}
            </div>
          ) : viewMode === 'table' ? (
            /* ========================================================= */
            /* DESKTOP & TABLET PROFESSIONAL DATA TABLE VIEW             */
            /* ========================================================= */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 text-start">{isAr ? 'الشركة والمنصة' : 'Company'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'كود البرومو المعتمد' : 'Promo Code'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'حالة الحساب' : 'Account Status'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'حماية التعويض' : 'Protection'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات السريعة' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedFiltered
                      .filter((c) => (exclusiveCompany && !showAllPartners ? c.id === exclusiveCompany.id : true))
                      .map((company) => {
                        const userAccount = accounts.find((a) => a.company_id === company.id);
                        const isRegistered = userAccount?.status === 'active';
                        const isPending = userAccount?.status === 'pending';
                        const loc = getLocalizedCompany(company, lang);

                        return (
                          <tr key={company.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Company Branding */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl border border-slate-200/80 p-0.5 bg-slate-50 shrink-0 shadow-2xs">
                                  <CompanyBrandLogo companyName={company.name} size="md" className="rounded-lg" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleFavorite(company.id); }}
                                      className="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                                    >
                                      <Star
                                        className={`w-3.5 h-3.5 ${favorites.includes(company.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                                      />
                                    </button>
                                    <span className="font-bold text-slate-900 text-sm">{loc.name}</span>
                                    {company.badge && (
                                      <span
                                        className="text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0"
                                        style={{
                                          backgroundColor: `${company.color}15`,
                                          borderColor: `${company.color}35`,
                                          color: company.color,
                                        }}
                                      >
                                        {company.badge}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{loc.description}</span>
                                </div>
                              </div>
                            </td>

                            {/* Promo Code with Copy */}
                            <td className="py-3 px-4">
                              <div
                                onClick={() => handleCopyPromo(company)}
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border cursor-pointer hover:shadow-2xs transition-all"
                                style={{
                                  backgroundColor: `${company.color}08`,
                                  borderColor: `${company.color}30`,
                                }}
                                title={t.copyPromo}
                              >
                                <span className="font-mono font-black text-xs" style={{ color: company.color }}>
                                  {company.promo_code}
                                </span>
                                {copiedId === company.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                                )}
                              </div>
                            </td>

                            {/* Account Status */}
                            <td className="py-3 px-4">
                              {userAccount ? (
                                <div className="space-y-0.5">
                                  <span className="font-mono font-bold text-xs text-slate-900 block">
                                    {userAccount.account_number}
                                  </span>
                                  {isRegistered ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      <span>{t.registeredBadge}</span>
                                    </span>
                                  ) : isPending ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>{t.pendingBadge}</span>
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onOpenRegister(company)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                                >
                                  {t.linkAccount}
                                </button>
                              )}
                            </td>

                            {/* Protection Perk */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isAr ? 'حماية خسائر فورية' : 'Loss Cashback'}</span>
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center justify-center gap-1.5">
                                <a
                                  href={company.affiliate_link || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-8 px-2.5 rounded-lg text-xs font-bold text-white transition-transform active:scale-95 flex items-center gap-1 shadow-2xs"
                                  style={{ backgroundColor: company.color }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{isAr ? 'الموقع' : 'Site'}</span>
                                </a>

                                {company.app_link && (
                                  <a
                                    href={company.app_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="h-8 px-2 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
                                    title={t.appBtn}
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                  </a>
                                )}

                                {isRegistered && (
                                  <button
                                    type="button"
                                    onClick={() => onRequestComp(company.id)}
                                    className="h-8 px-2.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors cursor-pointer"
                                    style={{
                                      color: company.color,
                                      borderColor: `${company.color}40`,
                                      backgroundColor: `${company.color}10`,
                                    }}
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'تعويض' : 'Claim'}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onOpenDetails(company)}
                                  className="h-8 px-2 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center transition-colors cursor-pointer"
                                  title={t.detailsBtn}
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* BALANCED RESPONSIVE GRID VIEW (4 COLUMNS ON XL SCREENS)   */
            /* ========================================================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedFiltered
                .filter((c) => (exclusiveCompany && !showAllPartners ? c.id === exclusiveCompany.id : true))
                .map((company) => {
                  const userAccount = accounts.find((a) => a.company_id === company.id);
                  const isRegistered = userAccount?.status === 'active';
                  const isPending = userAccount?.status === 'pending';
                  const loc = getLocalizedCompany(company, lang);

                  return (
                    <div
                      key={company.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between relative overflow-hidden h-full group"
                    >
                      {/* Top Color Accent Line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: company.color }}
                      />

                      <div className="space-y-3">
                        {/* Header: Logo, Name, Badge & Status */}
                        <div className="flex items-start justify-between gap-2.5 pt-0.5">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(company.id); }}
                              className="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer shrink-0 -ml-1 p-1"
                            >
                              <Star
                                className={`w-4 h-4 ${favorites.includes(company.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                              />
                            </button>
                            <div className="rounded-xl border border-slate-200/80 p-0.5 bg-slate-50 shrink-0 shadow-2xs">
                              <CompanyBrandLogo
                                companyName={company.name}
                                size="md"
                                className="rounded-lg"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-black text-slate-900 text-sm tracking-tight truncate">
                                {loc.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                                {loc.description}
                              </p>
                            </div>
                          </div>

                          {company.badge && (
                            <span
                              className="text-[9px] font-black px-2 py-0.5 rounded-md border leading-tight shrink-0"
                              style={{
                                backgroundColor: `${company.color}12`,
                                borderColor: `${company.color}35`,
                                color: company.color,
                              }}
                            >
                              {company.badge}
                            </span>
                          )}
                        </div>

                        {/* Promo Code Box */}
                        <div
                          onClick={() => handleCopyPromo(company)}
                          className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-2xs hover:shadow-xs"
                          style={{
                            backgroundColor: `${company.color}08`,
                            borderColor: `${company.color}25`,
                          }}
                          title={t.copyPromo}
                        >
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                              {t.promoCode}
                            </span>
                            <span
                              className="font-mono font-black text-xs tracking-wider block"
                              style={{ color: company.color }}
                            >
                              {company.promo_code}
                            </span>
                          </div>
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white shadow-2xs border"
                            style={{ borderColor: `${company.color}35` }}
                          >
                            {copiedId === company.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </div>
                        </div>

                        {/* Account Status / ID Box */}
                        {userAccount ? (
                          <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between shadow-2xs text-xs">
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                                {t.accountLabel}
                              </span>
                              <span className="font-mono font-bold text-slate-900 text-[11px] block truncate">
                                {userAccount.account_number}
                              </span>
                            </div>
                            {isRegistered ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>{t.registeredBadge}</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{t.pendingBadge}</span>
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
                            <span className="text-[11px] font-medium">{t.notRegisteredBadge}</span>
                            <button
                              type="button"
                              onClick={() => onOpenRegister(company)}
                              className="h-6 px-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-[11px] hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                            >
                              {t.linkAccount}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: 2x2 Grid with balanced heights */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                        <a
                          href={company.affiliate_link || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 text-white shadow-2xs cursor-pointer"
                          style={{ backgroundColor: company.color }}
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{t.registerAndSite}</span>
                        </a>

                        <a
                          href={company.app_link || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 active:scale-95 bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3 h-3 shrink-0 text-slate-600" />
                          <span>{t.appBtn}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => (isRegistered ? onRequestComp(company.id) : onOpenRegister(company))}
                          className="h-8 px-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isRegistered ? (
                            <>
                              <PlusCircle className="w-3 h-3 text-emerald-600" />
                              <span className="truncate">{t.requestCompensation}</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3 h-3 text-slate-600" />
                              <span className="truncate">{t.linkAccount}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDetails(company)}
                          className="h-8 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Info className="w-3 h-3 text-slate-400" />
                          <span>{t.detailsBtn}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
