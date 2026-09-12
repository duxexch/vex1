import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';
import { Clock, Ticket, Trophy, Zap, ChevronDown, ChevronUp, Plus, Minus, ShoppingCart, History, RotateCcw } from 'lucide-react';

interface LotteryTabProps {
  lang: Language;
}

interface LotteryTicket {
  id: string;
  uid: string;
  numbers: number[];
  status: 'pending' | 'win' | 'lose';
  drawn: number[] | null;
  matches: number;
  prize: number;
}

interface DrawTypeInfo {
  name: string;
  icon: string;
  ticket_price: number;
  duration: number;
  multiplier: number;
  draw_time: number;
  tickets_sold: number;
  max_tickets: number;
  tickets_available: number;
  participants_count: number;
  prize_pool: number;
  jackpot_estimate: number;
  drawn: number[] | null;
  rollover: number;
  my_tickets: LotteryTicket[];
  history: any[];
}

interface LotteryState {
  enabled: boolean;
  draw_types: {
    hourly?: DrawTypeInfo;
    daily?: DrawTypeInfo;
    weekly?: DrawTypeInfo;
  };
}

export const LotteryTab: React.FC<LotteryTabProps> = ({ lang }) => {
  const [state, setState] = useState<LotteryState | null>(null);
  const [selectedType, setSelectedType] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [ticketCount, setTicketCount] = useState(1);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState('--:--:--');

  const t = (ar: string, en: string, ru?: string) => {
    if (lang === 'ar') return ar;
    if (lang === 'ru') return ru || en;
    return en;
  };

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/lottery/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to fetch lottery state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, [fetchState]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const drawInfo = state?.draw_types?.[selectedType];
    if (!drawInfo?.draw_time) return;

    timerRef.current = setInterval(() => {
      const diff = Math.max(0, drawInfo.draw_time - Date.now() / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = Math.floor(diff % 60);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      if (diff <= 0) {
        clearInterval(timerRef.current!);
        fetchState();
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state?.draw_types?.[selectedType]?.draw_time, selectedType, fetchState]);

  const handleBuy = async () => {
    setBuying(true);
    try {
      const res = await fetch('/api/lottery/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: ticketCount, draw_type: selectedType, uid: 'user_' + Date.now() }),
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
        setTicketCount(1);
      }
    } catch (err) {
      console.error('Buy failed:', err);
    } finally {
      setBuying(false);
    }
  };

  const drawInfo = state?.draw_types?.[selectedType];
  const drawTypes: { key: keyof typeof state.draw_types; icon: string; name: string }[] = [
    { key: 'hourly', icon: '⏰', name: t('ساعة', 'Hourly', 'Часовой') },
    { key: 'daily', icon: '📅', name: t('يومي', 'Daily', 'Ежедневный') },
    { key: 'weekly', icon: '🏆', name: t('أسبوعي', 'Weekly', 'Еженедельный') },
  ];

  const fmtAmount = (n: number) => n?.toLocaleString() || '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">{t('جارٍ التحميل...', 'Loading...', 'Загрузка...')}</p>
        </div>
      </div>
    );
  }

  if (!state?.enabled) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 font-bold">{t('اليانصيب معطّل حالياً', 'Lottery is currently disabled', 'Лотерея отключена')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4">
      {/* Draw Type Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {drawTypes.map((dt) => {
          const info = state.draw_types[dt.key];
          return (
            <button
              key={dt.key}
              onClick={() => setSelectedType(dt.key as any)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                selectedType === dt.key
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="text-2xl">{dt.icon}</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{dt.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{info?.tickets_sold || 0} {t('تذكرة', 'tickets', 'билетов')}</div>
            </button>
          );
        })}
      </div>

      {/* Timer */}
      <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-500 mb-1">{t('السحب التالي', 'Next Draw', 'Следующий розыгрыш')}</div>
        <div className="text-3xl font-black text-yellow-500 font-mono">{countdown}</div>
        {drawInfo?.rollover > 0 && (
          <div className="text-xs text-yellow-500 mt-1 font-bold">
            🔄 {t('Rollover:', 'Rollover:', 'Перенос:')} {fmtAmount(drawInfo.rollover)}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-sm font-black text-yellow-500 font-mono">{fmtAmount(drawInfo?.prize_pool || 0)}</div>
          <div className="text-[9px] text-slate-500">{t('الجائزة', 'Prize', 'Приз')}</div>
        </div>
        <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-sm font-black text-slate-900 dark:text-white font-mono">{drawInfo?.tickets_sold || 0}</div>
          <div className="text-[9px] text-slate-500">{t('مباعة', 'Sold', 'Продано')}</div>
        </div>
        <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-sm font-black text-slate-900 dark:text-white font-mono">{drawInfo?.participants_count || 0}</div>
          <div className="text-[9px] text-slate-500">{t('مشاركين', 'Players', 'Игроков')}</div>
        </div>
        <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-sm font-black text-emerald-500 font-mono">{drawInfo?.tickets_available || 0}</div>
          <div className="text-[9px] text-slate-500">{t('متاحة', 'Left', 'Осталось')}</div>
        </div>
      </div>

      {/* Prize Tiers */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-xs font-black text-yellow-500">{t('🏆 درجات الجوائز', '🏆 Prize Tiers', '🏆 Уровни призов')}</div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/20 text-yellow-500 font-mono">5/5</span>
          <span className="flex-1 text-xs text-slate-700 dark:text-slate-300">{t('جائزة كبرى', 'Jackpot', 'Джекпот')}</span>
          <span className="text-xs font-black text-yellow-500 font-mono">{fmtAmount(drawInfo?.jackpot_estimate || 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 font-mono">4/5</span>
          <span className="flex-1 text-xs text-slate-700 dark:text-slate-300">{t('جائزة ثانية', 'Secondary', 'Второй приз')}</span>
          <span className="text-xs font-black text-blue-400 font-mono">{fmtAmount((drawInfo?.prize_pool || 0) * 0.35)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-400 font-mono">3/5</span>
          <span className="flex-1 text-xs text-slate-700 dark:text-slate-300">{t('جائزة صغيرة', 'Small', 'Малый приз')}</span>
          <span className="text-xs font-black text-slate-400 font-mono">{fmtAmount((drawInfo?.prize_pool || 0) * 0.15)}</span>
        </div>
      </div>

      {/* My Tickets */}
      <div>
        <div className="text-xs font-black text-slate-500 mb-2">{t('🎟️ تذاكري', '🎟️ My Tickets', '🎟️ Мои билеты')}</div>
        <div className="grid grid-cols-2 gap-2">
          {(drawInfo?.my_tickets || []).map((ticket) => (
            <div
              key={ticket.id}
              className={`p-3 rounded-xl border ${
                ticket.status === 'win'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : ticket.status === 'lose'
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-500 font-mono">#{ticket.id.substring(0, 12)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  ticket.status === 'win' ? 'bg-emerald-500/20 text-emerald-500'
                  : ticket.status === 'lose' ? 'bg-red-500/10 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {ticket.status === 'win' ? t('فوز', 'WIN', 'ВЫИГРЫШ')
                    : ticket.status === 'lose' ? t('خسارة', 'LOSE', 'ПРОИГРЫШ')
                    : t('انتظار', 'PENDING', 'ОЖИДАНИЕ')}
                </span>
              </div>
              <div className="flex gap-1 justify-center flex-wrap">
                {ticket.numbers.map((n, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black font-mono border ${
                      ticket.drawn?.includes(n)
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {n}
                  </div>
                ))}
              </div>
              {ticket.status === 'win' && ticket.prize > 0 && (
                <div className="text-center mt-2 text-sm font-black text-emerald-500">+{fmtAmount(ticket.prize)}</div>
              )}
              {ticket.drawn && (
                <div className="text-center mt-2 text-[10px] text-slate-500">
                  {t('تطابق', 'Match', 'Совпадений')}: {ticket.matches}/5
                </div>
              )}
            </div>
          ))}
        </div>
        {(!drawInfo?.my_tickets || drawInfo.my_tickets.length === 0) && (
          <div className="text-center py-6 text-slate-400 text-xs">
            {t('لا توجد تذاكر بعد — اشترِ بالأسفل', 'No tickets yet — buy below', 'Билетов пока нет — купите ниже')}
          </div>
        )}
      </div>

      {/* Buy Section */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg font-black text-slate-600 dark:text-slate-300 active:scale-90"
          >
            <Minus className="w-5 h-5" />
          </button>
          <span className="text-3xl font-black text-yellow-500 font-mono min-w-[40px] text-center">{ticketCount}</span>
          <button
            onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg font-black text-slate-600 dark:text-slate-300 active:scale-90"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('إجمالي المطلوب', 'Total', 'Итого')}</span>
          <span className="text-xl font-black text-yellow-500 font-mono">{fmtAmount((drawInfo?.ticket_price || 50) * ticketCount)}</span>
        </div>

        <button
          onClick={handleBuy}
          disabled={buying}
          className="w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {buying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('جارٍ الشراء...', 'Buying...', 'Покупка...')}
            </>
          ) : (
            <>
              <Ticket className="w-4 h-4" />
              {t('شراء بالرصيد', 'Buy with Balance', 'Купить за баланс')}
            </>
          )}
        </button>
      </div>

      {/* History */}
      {drawInfo?.history && drawInfo.history.length > 0 && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs font-black text-slate-500 flex items-center gap-1">
            <History className="w-3 h-3" />
            {t('السحب السابقة', 'Past Draws', 'Прошлые розыгрыши')}
          </div>
          {drawInfo.history.slice().reverse().slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex gap-1">
                {(h.winning_numbers || []).map((n: number, j: number) => (
                  <div key={j} className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-[9px] font-black text-yellow-600 font-mono">
                    {n}
                  </div>
                ))}
              </div>
              <div className="flex-1 text-right">
                <span className="text-[10px] text-slate-500">{fmtAmount(h.prize_pool)}</span>
                <span className="text-[10px] text-slate-400 mx-1">•</span>
                <span className="text-[10px] text-slate-500">{h.tickets_sold} {t('تذكرة', 't', 'б')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
