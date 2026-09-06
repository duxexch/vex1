import React, { useState, useRef, useEffect } from 'react';
import { Language, UserProfile, AppBranding } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { AppIconRenderer } from './AppIconRenderer';
import {
  ShieldCheck,
  Phone,
  Settings,
  Globe,
  Download,
  ShieldAlert,
  Bell,
  Sliders,
  Check,
} from 'lucide-react';

interface HeaderProps {
  userId: string;
  userProfile: UserProfile | null;
  lang: Language;
  themeMode?: string;
  appBranding: AppBranding;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenAdminDashboard: () => void;
  onOpenResponsibleGaming: () => void;
  onToggleTheme?: () => void;
  onSelectLang: (lang: Language) => void;
  onOpenPhoneModal: () => void;
  onOpenSettings: () => void;
  onOpenSecurityAnalysis: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

const LANGUAGES: { code: Language; label: string; flag: string; short: string }[] = [
  { code: 'ar', label: 'العربية', flag: '🇸🇦', short: 'عربي' },
  { code: 'en', label: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'es', label: 'Español', flag: '🇪🇸', short: 'ES' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', short: 'RU' },
];

export const Header: React.FC<HeaderProps> = ({
  userId,
  userProfile,
  lang,
  appBranding,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenAdminDashboard,
  onOpenResponsibleGaming,
  onSelectLang,
  onOpenPhoneModal,
  onOpenSettings,
  onOpenSecurityAnalysis,
  canInstallPwa,
  onInstallPwa,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['ar'];
  const isVerified = userProfile?.is_phone_verified;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 safe-area-top shadow-xs select-none">
      <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-1.5">
        {/* Left: Compact Branding & ID */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-lg border border-slate-200 overflow-hidden shadow-xs shrink-0">
            <AppIconRenderer branding={appBranding} size="sm" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
              {appBranding?.appName || t.appName}
            </h1>

            {/* Responsible 18+ Badge */}
            <button
              onClick={onOpenResponsibleGaming}
              className="px-1 py-0.5 rounded bg-amber-50 text-[9px] font-extrabold text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
              title={t.responsibleGamingTitle}
            >
              18+
            </button>

            {/* ID snippet */}
            <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">
              ID: {userId.slice(0, 5)}
            </span>

            {/* Phone Verification Status */}
            <button
              onClick={onOpenPhoneModal}
              className={`inline-flex items-center gap-0.5 h-4 text-[9px] px-1.5 rounded font-bold transition-all active:scale-95 shrink-0 ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
              title={isVerified ? 'Verified Phone' : 'Verify Phone'}
            >
              {isVerified ? (
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ) : (
                <Phone className="w-3 h-3 text-amber-600" />
              )}
              <span className="hidden sm:inline">{isVerified ? (lang === 'ar' ? 'موثق' : 'Verified') : (lang === 'ar' ? 'توثيق' : 'Verify')}</span>
            </button>
          </div>
        </div>

        {/* Right: Icon-Only Compact Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all active:scale-95 border border-slate-200 flex items-center justify-center cursor-pointer"
            title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Admin Dashboard Hub button */}
          <button
            onClick={onOpenAdminDashboard}
            className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title={t.adminDemo}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          </button>

          {/* Security Audit Button */}
          <button
            onClick={onOpenSecurityAnalysis}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title={t.securityTitle}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {/* Multi-Language Switcher */}
          <div ref={langMenuRef} className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="h-8 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
              title={t.languageSelect}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="uppercase">{currentLangObj.short}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-fade-in space-y-0.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onSelectLang(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left rtl:text-right text-xs font-bold flex items-center justify-between transition-colors ${
                      lang === l.code
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PWA Install Button */}
          {canInstallPwa && onInstallPwa && (
            <button
              onClick={onInstallPwa}
              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Install PWA"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
