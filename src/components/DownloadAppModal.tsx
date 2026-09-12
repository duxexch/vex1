import React from 'react';
import { X, Download, Smartphone, Shield, Wifi, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  apkUrl?: string;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose, lang, apkUrl }) => {
  if (!isOpen) return null;

  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const content: Record<string, any> = {
    ar: {
      title: 'تحميل تطبيق VEX Deals',
      subtitle: 'ثبّت التطبيق على هاتفك مباشرة من المتصفح',
      androidTitle: 'تحميل APK (أندرويد)',
      androidDesc: 'حمّل ملف APK وتثبيته مباشرة',
      iosTitle: 'تثبيت على آيفون (iOS)',
      iosDesc: 'أضف التطبيق للشاشة الرئيسية من Safari',
      pwaTitle: 'تثبيت من المتصفح',
      pwaDesc: 'اضغط على "إضافة للشاشة الرئيسية" من قائمة المتصفح',
      features: [
        { icon: '🛡️', text: 'آمن ومشفر بالكامل' },
        { icon: '⚡', text: 'سرعة فائقة في التحميل' },
        { icon: '🔔', text: 'إشعارات فورية' },
        { icon: '📱', text: 'يعمل بدون متصفح' },
      ],
      installSteps: {
        android: [
          'اضغط على زر "تحميل APK" أدناه',
          'افتح الملف بعد التحميل',
          'اضغط "تثبيت" عند الطلب',
          'قد تحتاج لتفعيل "مصادر غير معروفة" من الإعدادات',
        ],
        ios: [
          'افتح هذا الرابط في Safari',
          'اضغط زر المشاركة (Share)',
          'اختر "إضافة إلى الشاشة الرئيسية"',
          'اضغط "إضافة" في الأعلى',
        ],
      },
      gotIt: 'تم الفهم',
    },
    en: {
      title: 'Download VEX Deals App',
      subtitle: 'Install the app directly from your browser',
      androidTitle: 'Download APK (Android)',
      androidDesc: 'Download APK file and install directly',
      iosTitle: 'Install on iPhone (iOS)',
      iosDesc: 'Add the app to your Home Screen from Safari',
      pwaTitle: 'Install from Browser',
      pwaDesc: 'Tap "Add to Home Screen" from browser menu',
      features: [
        { icon: '🛡️', text: 'Fully secure & encrypted' },
        { icon: '⚡', text: 'Lightning fast' },
        { icon: '🔔', text: 'Push notifications' },
        { icon: '📱', text: 'Works without browser' },
      ],
      installSteps: {
        android: [
          'Tap "Download APK" below',
          'Open the file after download',
          'Tap "Install" when prompted',
          'Enable "Unknown sources" if needed',
        ],
        ios: [
          'Open this link in Safari',
          'Tap the Share button',
          'Select "Add to Home Screen"',
          'Tap "Add" at the top',
        ],
      },
      gotIt: 'Got it',
    },
  };

  const t = content[lang] || content['ar'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                {t.title}
              </h3>
              <span className="text-[11px] text-emerald-600 font-bold">{t.subtitle}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2">
          {t.features.map((f: any, i: number) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Android Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t.androidTitle}</span>
          </div>
          <div className="space-y-2">
            {t.installSteps.android.map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">{step}</p>
              </div>
            ))}
          </div>
          {apkUrl && (
            <a
              href={apkUrl}
              download
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 no-underline"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تحميل APK' : 'Download APK'}</span>
            </a>
          )}
        </div>

        {/* iOS Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t.iosTitle}</span>
          </div>
          <div className="space-y-2">
            {t.installSteps.ios.map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PWA Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t.pwaTitle}</span>
          </div>
          <p className="text-[11px] text-slate-600">{t.pwaDesc}</p>
        </div>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{t.gotIt}</span>
        </button>
      </div>
    </div>
  );
};
