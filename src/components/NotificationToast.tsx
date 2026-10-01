import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Bot, Trophy, Sparkles, Bell, Wallet, ShieldCheck, Newspaper } from 'lucide-react';
import type { AppNotification, Language } from '../types';

interface NotificationToastProps {
  notification: AppNotification | null;
  lang: Language;
  onOpen: (notification: AppNotification) => void;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 6000;

function categoryStyle(category: AppNotification['category']) {
  switch (category) {
    case 'ai_prediction':
      return { icon: Bot, accent: 'text-purple-600', bar: 'bg-purple-600', ring: 'border-purple-300', chip: 'bg-purple-100 text-purple-700', labelAr: 'توقع ذكي', labelEn: 'AI Prediction' };
    case 'sports_news':
      return { icon: Newspaper, accent: 'text-blue-600', bar: 'bg-blue-600', ring: 'border-blue-300', chip: 'bg-blue-100 text-blue-700', labelAr: 'أخبار ومباريات', labelEn: 'Sports Alert' };
    case 'compensation':
      return { icon: Sparkles, accent: 'text-emerald-600', bar: 'bg-emerald-600', ring: 'border-emerald-300', chip: 'bg-emerald-100 text-emerald-700', labelAr: 'تعويضات', labelEn: 'Compensation' };
    case 'transfer':
      return { icon: Wallet, accent: 'text-cyan-600', bar: 'bg-cyan-600', ring: 'border-cyan-300', chip: 'bg-cyan-100 text-cyan-700', labelAr: 'تحويلات', labelEn: 'Transfer' };
    case 'security':
      return { icon: ShieldCheck, accent: 'text-amber-600', bar: 'bg-amber-600', ring: 'border-amber-300', chip: 'bg-amber-100 text-amber-800', labelAr: 'أمان', labelEn: 'Security' };
    case 'lottery':
      return { icon: Trophy, accent: 'text-amber-500', bar: 'bg-amber-500', ring: 'border-amber-300', chip: 'bg-amber-100 text-amber-800', labelAr: 'اليانصيب', labelEn: 'Lottery' };
    default:
      return { icon: Bell, accent: 'text-slate-600', bar: 'bg-slate-600', ring: 'border-slate-300', chip: 'bg-slate-100 text-slate-700', labelAr: 'نظام VEX', labelEn: 'System' };
  }
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, lang, onOpen, onClose }) => {
  const isAr = lang === 'ar';
  const [progress, setProgress] = useState(100);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  // Keep the latest onClose without putting it in effect deps (identity changes on
  // every App re-render and would restart the countdown each time)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!notification) {
      setProgress(100);
      return;
    }
    startRef.current = Date.now();
    setProgress(100);
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        onCloseRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [notification]);

  const style = notification ? categoryStyle(notification.category) : null;
  const Icon = style ? style.icon : Bell;
  const title = notification
    ? (notification.translations && notification.translations[lang]?.title) || notification.title
    : '';
  const message = notification
    ? (notification.translations && notification.translations[lang]?.message) || notification.message
    : '';

  return (
    <AnimatePresence>
      {notification && style && (
        <motion.div
          key={notification.id}
        initial={{ opacity: 0, y: -28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        dir={isAr ? 'rtl' : 'ltr'}
        role="alert"
        aria-live="assertive"
        className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100vw-1.5rem)] max-w-md pointer-events-auto"
      >
        <div
          className={`relative overflow-hidden rounded-2xl border ${style.ring} bg-white shadow-2xl shadow-slate-900/20 cursor-pointer`}
          onClick={() => {
            onOpen(notification);
            onClose();
          }}
        >
          <div className="flex items-start gap-3 p-3.5">
            <div className={`p-2 rounded-xl bg-white border ${style.ring} shadow-xs shrink-0`}>
              <Icon className={`w-5 h-5 ${style.accent}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${style.chip}`}>
                  {isAr ? style.labelAr : style.labelEn}
                </span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(notification.timestamp).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-1">{title}</p>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-0.5">{message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Auto-dismiss progress bar */}
          <div className="h-1 w-full bg-slate-100">
            <div className={`h-full ${style.bar}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
