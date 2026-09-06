import React, { useState } from 'react';
import { Company, Language, Wallet, PLATFORM_DOMAIN } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { formatCurrency } from '../utils/currency';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import { WalletTabSkeleton } from './SkeletonLoader';
import { Lock, Unlock, ArrowUpRight, UserPlus, DollarSign, HelpCircle, Wallet2, Copy, Check } from 'lucide-react';

interface WalletTabProps {
  wallets: Wallet[];
  companies: Company[];
  onGoToTransfer: (companyId: string) => void;
  onGoToReferral: (companyId: string) => void;
  onRequestComp: (companyId: string) => void;
  lang: Language;
  isLoading?: boolean;
  displayCurrency: string;
  onCopyToast?: () => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({
  wallets,
  companies,
  onGoToTransfer,
  onGoToReferral,
  onRequestComp,
  lang,
  isLoading = false,
  displayCurrency,
  onCopyToast,
}) => {
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);
  const t = TRANSLATIONS[lang] || TRANSLATIONS['ar'];

  const handleCopyWalletId = (companyId: string) => {
    navigator.clipboard.writeText(companyId);
    setCopiedWalletId(companyId);
    if (onCopyToast) onCopyToast();
    setTimeout(() => setCopiedWalletId(null), 2000);
  };

  if (isLoading || (wallets.length === 0 && isLoading)) {
    return <WalletTabSkeleton />;
  }

  const totalFrozen = wallets.reduce((sum, w) => sum + (Number(w.frozen) || 0), 0);
  const totalAvailable = wallets.reduce((sum, w) => sum + (Number(w.available) || 0), 0);

  const getActiveWalletsText = (count: number) => {
    return `${count} ${t.activeWallets}`;
  };

  const getUnfreezeHint = () => {
    return t.unfreezeHint;
  };

  const getAvailableHint = () => {
    return t.availableHint;
  };

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in select-none">
      {/* Top Total Balance Summary Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs text-slate-900 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Wallet2 className="w-4 h-4" />
            </span>
            <span>
              {t.totalWalletsPrefix} ({PLATFORM_DOMAIN})
            </span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
            {getActiveWalletsText(wallets.length)}
          </span>
        </div>

        {/* Big Balance Counters */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Frozen Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>{t.totalFrozen}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-amber-800 tracking-tight">
              {formatCurrency(totalFrozen, displayCurrency)}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">
              {getUnfreezeHint()}
            </span>
          </div>

          {/* Available Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold mb-1">
              <Unlock className="w-3.5 h-3.5" />
              <span>{t.totalAvailable}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-emerald-700 tracking-tight">
              {formatCurrency(totalAvailable, displayCurrency)}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">
              {getAvailableHint()}
            </span>
          </div>
        </div>

        {/* Explanation Banner */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] sm:text-xs">
            <span className="font-bold text-slate-800">
              {t.balanceProtectionTitle}
            </span>
            {t.frozenInfo}
          </div>
        </div>
      </div>

      {/* Per Company Wallets Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>
            {t.companyWalletsTitle}
          </span>
        </h3>
        <button
          onClick={() => onRequestComp(wallets[0]?.company_id || '')}
          className="h-8 text-xs font-bold text-emerald-700 flex items-center gap-1 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs active:scale-95 transition-all"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{t.requestCompensation}</span>
        </button>
      </div>

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
          <Wallet2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700">
            {lang === 'ar'
              ? 'لا توجد محافظ نشطة بعد'
              : lang === 'es'
              ? 'No hay billeteras activas aún'
              : lang === 'ru'
              ? 'Активных кошельков пока нет'
              : 'No active wallets yet'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'يتم إنشاء المحفظة تلقائياً فور ربط حسابك في المنصة.'
              : lang === 'es'
              ? 'La billetera se crea automáticamente al vincular tu cuenta.'
              : lang === 'ru'
              ? 'Кошелек создается автоматически после привязки аккаунта.'
              : 'Wallets are generated automatically once you link an account.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {wallets.map((wallet) => {
            const company = companies.find((c) => c.id === wallet.company_id);

            return (
              <div
                key={wallet.company_id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
              >
                {/* Company Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-slate-200 p-0.5 bg-slate-50 shrink-0">
                      <CompanyBrandLogo companyName={wallet.company_name} size="md" className="rounded-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {wallet.company_name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {wallet.company_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyWalletId(wallet.company_id)}
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition-colors inline-flex items-center"
                          title={lang === 'ar' ? 'نسخ معرف المحفظة' : 'Copy Wallet ID'}
                          aria-label={lang === 'ar' ? 'نسخ معرف المحفظة' : 'Copy Wallet ID'}
                        >
                          {copiedWalletId === wallet.company_id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 10% quick stat */}
                  <div className="flex items-center gap-1.5">
                    {wallet.pending_locked && wallet.pending_locked > 0 ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        OTP: {formatCurrency(wallet.pending_locked, displayCurrency)}
                      </span>
                    ) : null}
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {lang === 'ar' ? 'متاح للتحويل: ' : lang === 'es' ? 'Transferible: ' : lang === 'ru' ? 'К переводу: ' : 'Transferable: '}
                      {formatCurrency(wallet.frozen * 0.1, displayCurrency)}
                    </span>
                  </div>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mb-0.5">
                      <Lock className="w-3 h-3" />
                      <span>{t.frozenBalance}</span>
                    </div>
                    <span className="text-base font-bold font-mono text-amber-800">
                      {formatCurrency(Number(wallet.frozen), displayCurrency)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mb-0.5">
                      <Unlock className="w-3 h-3" />
                      <span>{t.availableBalance}</span>
                    </div>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      {formatCurrency(Number(wallet.available), displayCurrency)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Unified h-9 */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onGoToTransfer(wallet.company_id)}
                    disabled={wallet.frozen <= 0}
                    className="h-9 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.transferBtn}</span>
                  </button>

                  <button
                    onClick={() => onGoToReferral(wallet.company_id)}
                    className="h-9 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.inviteBtn}</span>
                  </button>

                  <button
                    onClick={() => onRequestComp(wallet.company_id)}
                    className="h-9 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تعويض' : lang === 'es' ? 'Compensar' : lang === 'ru' ? 'Возврат' : 'Comp'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
