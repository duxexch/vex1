import React, { useState, useEffect } from 'react';
import { Language, UserProfile } from '../types';
import { vexApi } from '../services/api';
import {
  Phone,
  ShieldCheck,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSuccess: () => void;
  lang?: Language;
}

const COUNTRY_CODES = [
  { code: '+964', country: 'العراق', flag: '🇮🇶' },
  { code: '+20', country: 'مصر', flag: '🇪🇬' },
  { code: '+966', country: 'السعودية', flag: '🇸🇦' },
  { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
  { code: '+962', country: 'الأردن', flag: '🇯🇴' },
  { code: '+965', country: 'الكويت', flag: '🇰🇼' },
  { code: '+968', country: 'عمان', flag: '🇴🇲' },
  { code: '+974', country: 'قطر', flag: '🇶🇦' },
  { code: '+973', country: 'البحرين', flag: '🇧🇭' },
  { code: '+212', country: 'المغرب', flag: '🇲🇦' },
  { code: '+213', country: 'الجزائر', flag: '🇩🇿' },
  { code: '+216', country: 'تونس', flag: '🇹🇳' },
  { code: '+963', country: 'سوريا', flag: '🇸🇾' },
  { code: '+961', country: 'لبنان', flag: '🇱🇧' },
  { code: '+90', country: 'تركيا', flag: '🇹🇷' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+1', country: 'USA/CA', flag: '🇺🇸' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
];

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSuccess,
  lang = 'ar',
}) => {
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [countryCode, setCountryCode] = useState('+964');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    if (userProfile) {
      if (userProfile.country_code) setCountryCode(userProfile.country_code);
      if (userProfile.phone_number) {
        const stripped = userProfile.phone_number.replace(userProfile.country_code, '');
        setPhoneNumber(stripped);
      }
      if (userProfile.telegram_username) {
        setTelegramUsername(userProfile.telegram_username);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await vexApi.linkRealPhoneNumber(phoneNumber, countryCode, telegramUsername);
      setSuccessMessage(res.message);
      setDemoCodeHint(res.otp_code);
      setStep('otp');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await vexApi.verifyPhoneOtp(otpCode);
      setSuccessMessage(res.message);
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل التحقق من الرمز' : 'Invalid verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const fullCurrentPhone = `${countryCode} ${phoneNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-auto max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {isAr ? 'توثيق وربط رقم الهاتف' : 'Phone Verification & Security'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr ? 'حفظ الرقم في السيرفر وتفعيل فك التجميد والتحويلات' : 'Link phone to enable balance unlock & transfers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'input' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAr ? 'بروتوكول الأمان وحفظ الرقم' : 'Security & Anti-Sybil Protection'}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isAr
                    ? 'يتم إرسال رقم هاتفك الحقيقي إلى السيرفر لتخزينه في قاعدة البيانات ومنع تكرار الحسابات الوهمية (Anti-Sybil).'
                    : 'Your verified phone number is encrypted and stored to protect against unauthorized multi-accounting.'}
                </p>
              </div>

              {/* Country & Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'رقم الهاتف الحقيقي:' : 'Phone Number:'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-32 px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder={isAr ? 'مثال: 7712345678' : 'e.g. 7712345678'}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Optional Telegram Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'معرف تيليجرام (اختياري للربط السريع):' : 'Telegram Username (optional):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {loading ? (
                  <span>{isAr ? 'جارٍ الإرسال...' : 'Sending Code...'}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'إرسال رمز التحقق (OTP)' : 'Send Verification OTP'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1 text-center">
                <p className="text-xs text-emerald-900 font-bold">
                  {isAr ? 'تم إرسال رمز التحقق بنجاح إلى الرقم:' : 'Verification code sent to:'}
                </p>
                <p className="text-sm font-mono font-black text-emerald-800" dir="ltr">
                  {fullCurrentPhone}
                </p>
                {demoCodeHint && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-700 flex items-center justify-center gap-1.5 font-medium">
                    <span>{isAr ? 'الرمز التجريبي السريع:' : 'Instant OTP Hint:'}</span>
                    <strong className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                      {demoCodeHint}
                    </strong>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 text-center">
                  {isAr ? 'أدخل رمز التحقق (4 أرقام):' : 'Enter 4-digit OTP Code:'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl tracking-widest font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 4}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {loading ? (
                  <span>{isAr ? 'جارٍ التحقق...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد وحفظ الرقم في قاعدة البيانات' : 'Confirm & Link Number'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-slate-500 hover:text-slate-800 font-bold"
                >
                  {isAr ? '← تعديل الرقم' : '← Change number'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={cooldown > 0}
                  className="text-emerald-700 hover:text-emerald-800 font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  {cooldown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إعادة إرسال' : 'Resend Code'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                {isAr ? 'تم ربط وتوثيق الرقم بنجاح!' : 'Phone Linked Successfully!'}
              </h4>
              <p className="text-xs text-slate-500">
                {isAr ? 'تم حفظ بياناتك وتفعيل صلاحيات التحويل وفك التجميد.' : 'Your security profile has been updated.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
