import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  Check,
  QrCode,
  X,
  Download,
  RefreshCw,
  Smartphone,
  Landmark,
  Bitcoin,
  Zap,
  Wallet,
  User,
} from 'lucide-react';
import { PaymentMethod, Language } from '../../types';
import { flagEmoji, countryByIso } from '../../data/countries';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  lang: Language;
  /** Which flow the card is shown in — tints the accent + wording. */
  mode?: 'deposit' | 'withdraw';
  /** Parent toast hook (optional): called after a successful copy. */
  onCopyToast?: () => void;
  /**
   * Withdraw flows receive money INTO the user's own account, so the
   * platform's account number / QR are hidden (header + instructions only).
   * Default true (deposit flows).
   */
  showAccountAndQr?: boolean;
}

/**
 * Clipboard write that also works on insecure origins (http://…) and older
 * browsers where navigator.clipboard is unavailable: falls back to a hidden
 * textarea + document.execCommand('copy').
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function badgeIcon(badge?: string) {
  const b = (badge || '').toLowerCase();
  if (b.includes('فودافون') || b.includes('اتصالات') || b.includes('أورانج') || b.includes('وي باي') || b.includes('محفظة')) return Smartphone;
  if (b.includes('ipn') || b.includes('لحظي')) return Zap;
  if (b.includes('بنك') || b.includes('iban') || b.includes('ميزة')) return Landmark;
  if (b.includes('usdt') || b.includes('رقمية') || b.includes('crypto')) return Bitcoin;
  return Wallet;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  lang,
  mode = 'deposit',
  onCopyToast,
  showAccountAndQr = true,
}) => {
  const isAr = lang === 'ar';
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrGenerating, setQrGenerating] = useState(false);

  const Icon = badgeIcon(method.badge);
  const name = isAr ? method.nameAr || method.name : method.nameEn || method.name;
  const instructions = isAr
    ? method.instructionsAr || method.instructions
    : method.instructionsEn || method.instructions;
  const accountValue = method.accountNumber || '';
  const qrPayload = (method.qr_payload || method.accountNumber || '').trim();
  const countryName = method.country_iso
    ? countryByIso(method.country_iso)?.[isAr ? 'nameAr' : 'nameEn'] || method.country_iso
    : null;
  const isWithdrawMode = mode === 'withdraw';

  const accent = isWithdrawMode
    ? 'text-violet-600 dark:text-violet-400'
    : 'text-emerald-600 dark:text-emerald-400';
  const accentBg = isWithdrawMode
    ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/60'
    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';

  const handleCopy = async (key: string, text: string) => {
    if (!text) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      if (onCopyToast) onCopyToast();
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 2000);
    }
  };

  // Generate the QR data URL when the overlay opens.
  useEffect(() => {
    if (!showQr || !qrPayload) return;
    let mounted = true;
    setQrGenerating(true);
    QRCode.toDataURL(qrPayload, {
      width: 360,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (mounted) {
          setQrDataUrl(url);
          setQrGenerating(false);
        }
      })
      .catch(() => {
        if (mounted) setQrGenerating(false);
      });
    return () => {
      mounted = false;
    };
  }, [showQr, qrPayload]);

  const accountLabel = isWithdrawMode
    ? isAr
      ? 'استلم على'
      : 'Receive on'
    : isAr
      ? 'حوّل إلى'
      : 'Send to';

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b ${accentBg} flex items-start justify-between gap-3`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl border flex items-center justify-center bg-white dark:bg-slate-950 ${
              isWithdrawMode
                ? 'border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400'
                : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {method.logoUrl ? (
              <img
                src={method.logoUrl}
                alt={name}
                className="w-7 h-7 object-contain rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white break-words">
                {name}
              </span>
              {method.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                  {method.badge}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-bold">
              {method.scope !== 'global' && countryName && (
                <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {flagEmoji(method.country_iso)} {countryName}
                </span>
              )}
              {method.scope === 'global' && (
                <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  🌍 {isAr ? 'متاحة للجميع' : 'Global'}
                </span>
              )}
              {method.currency && (
                <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  {method.currency}
                </span>
              )}
            </div>
          </div>
        </div>

        {showAccountAndQr && qrPayload && (
          <button
            type="button"
            onClick={() => setShowQr(true)}
            className={`shrink-0 px-2.5 py-2 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${accentBg} ${accent} hover:brightness-95`}
            aria-label={isAr ? 'عرض رمز QR' : 'Show QR code'}
          >
            <QrCode className="w-4 h-4" />
            <span>QR</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Account / wallet row */}
        {showAccountAndQr && accountValue && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {accountLabel}:
            </span>
            <div className="flex items-stretch gap-2">
              <div
                className="flex-1 min-w-0 p-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[13px] text-slate-900 dark:text-white break-all select-all leading-relaxed"
                dir="ltr"
              >
                {accountValue}
              </div>
              <button
                type="button"
                onClick={() => handleCopy('account', accountValue)}
                className={`shrink-0 w-11 min-h-[44px] rounded-xl border font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  copiedKey === 'account'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600'
                }`}
                aria-label={isAr ? 'نسخ رقم الحساب' : 'Copy account number'}
                title={isAr ? 'نسخ' : 'Copy'}
              >
                {copiedKey === 'account' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-[9px] leading-none">
                  {copiedKey === 'account' ? (isAr ? 'تم' : 'OK') : isAr ? 'نسخ' : 'Copy'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Holder row */}
        {showAccountAndQr && method.holderName && (
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                {isAr ? 'اسم صاحب الحساب' : 'Account holder'}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white break-words">
                {method.holderName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('holder', method.holderName || '')}
              className={`shrink-0 p-2 rounded-lg border transition-colors cursor-pointer ${
                copiedKey === 'holder'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600'
              }`}
              aria-label={isAr ? 'نسخ اسم صاحب الحساب' : 'Copy holder name'}
            >
              {copiedKey === 'holder' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Min / Max */}
        {(method.minDeposit || method.maxDeposit) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {method.minDeposit ? (
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {isAr ? 'الحد الأدنى' : 'Min'}: {method.minDeposit} {method.currency || 'USD'}
              </span>
            ) : null}
            {method.maxDeposit ? (
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {isAr ? 'الحد الأقصى' : 'Max'}: {method.maxDeposit} {method.currency || 'USD'}
              </span>
            ) : null}
          </div>
        )}

        {/* Instructions */}
        {instructions && (
          <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${accentBg} text-slate-700 dark:text-slate-200`}>
            <span className={`font-extrabold block mb-1 ${accent}`}>
              {isAr ? '📋 التعليمات:' : '📋 Instructions:'}
            </span>
            {instructions}
          </div>
        )}
      </div>

      {/* QR overlay */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-black text-xs text-slate-900 dark:text-white">{name}</span>
              <button
                type="button"
                onClick={() => setShowQr(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                {qrGenerating ? (
                  <div className="w-52 h-52 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-bold">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                    <span>{isAr ? 'جارٍ توليد الرمز...' : 'Generating QR...'}</span>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR — ${name}`} className="w-52 h-52 max-w-full object-contain" />
                ) : (
                  <div className="w-52 flex items-center justify-center text-slate-400 text-xs p-4 break-all font-mono" dir="ltr">
                    {qrPayload}
                  </div>
                )}
              </div>
              <div className="w-full flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy('qr', qrPayload)}
                  className={`flex-1 min-h-[40px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                    copiedKey === 'qr'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {copiedKey === 'qr' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey === 'qr' ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ البيانات' : 'Copy payload'}
                </button>
                {qrDataUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `vex-qr-${(method.id || 'pm').replace(/[^a-z0-9_-]/gi, '')}.png`;
                      link.href = qrDataUrl;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    aria-label={isAr ? 'تحميل رمز QR' : 'Download QR'}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">{isAr ? 'تحميل' : 'Save'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodCard;
