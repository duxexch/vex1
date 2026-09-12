import React, { useState, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { Ticket, CheckCircle2, XCircle, Plus, RefreshCw, Eye, AlertTriangle, Settings } from 'lucide-react';

interface LotteryAdminPanelProps {
  lang: Language;
}

export const LotteryAdminPanel: React.FC<LotteryAdminPanelProps> = ({ lang }) => {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [manualNumbers, setManualNumbers] = useState<string>('');
  const [addingManual, setAddingManual] = useState(false);
  const [config, setConfig] = useState<any>(null);

  const t = (ar: string, en: string, ru?: string) => {
    if (lang === 'ar') return ar;
    if (lang === 'ru') return ru || en;
    return en;
  };

  const fetchState = useCallback(async () => {
    try {
      const [stateRes, configRes] = await Promise.all([
        fetch('/api/lottery/state?uid=admin'),
        fetch('/api/lottery/config').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (stateRes.ok) setState(await stateRes.json());
      if (configRes) setConfig(configRes.config || configRes);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const handleApprove = async (purchaseId: string) => {
    try {
      await fetch(`/api/lottery/approve/${purchaseId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      fetchState();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (purchaseId: string) => {
    try {
      await fetch(`/api/lottery/reject/${purchaseId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'مرفوض من الإدارة' }) });
      fetchState();
    } catch (err) { console.error(err); }
  };

  const handleManualTicket = async () => {
    const nums = manualNumbers.split(/[,\s]+/).map(Number).filter(n => n >= 1 && n <= 30);
    if (nums.length !== 5) return alert(t('أدخل 5 أرقام من 1-30', 'Enter 5 numbers from 1-30', 'Введите 5 чисел от 1-30'));
    setAddingManual(true);
    try {
      const res = await fetch('/api/lottery/manual-ticket', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_type: selectedType, numbers: nums, uid: 'admin_manual' }),
      });
      const data = await res.json();
      if (data.success) { setManualNumbers(''); fetchState(); }
      else alert(data.error || 'Error');
    } catch (err) { alert('Error'); }
    finally { setAddingManual(false); }
  };

  const handleDraw = async (drawType: string) => {
    if (!confirm(t('تأكيد السحب؟', 'Confirm draw?', 'Подтвердить розыгрыш?'))) return;
    try {
      const res = await fetch(`/api/lottery/draw/${drawType}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) { alert(t('تم السحب بنجاح!', 'Draw completed!', 'Розыгрыш завершён!')); fetchState(); }
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      await fetch('/api/lottery/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) });
      fetchState();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-5 text-center text-sm text-slate-500">Loading...</div>;

  const pendingPurchases = (state?.pending_purchases || []).filter((p: any) => p.status === 'pending');
  const drawTypes = [
    { key: 'hourly', icon: '⏰', name: t('ساعة', 'Hourly', 'Часовой'), price: 50 },
    { key: 'daily', icon: '📅', name: t('يومي', 'Daily', 'Ежедневный'), price: 100 },
    { key: 'weekly', icon: '🏆', name: t('أسبوعي', 'Weekly', 'Еженедельный'), price: 250 },
  ];

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-yellow-500" />
            {t('إدارة اليانصيب', 'Lottery Admin', 'Управление лотереей')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('إدارة طلبات الشراء، التذاكر اليدوية، والسحب', 'Manage purchase requests, manual tickets, and draws', 'Управление заявками, ручными билетами и розыгрышами')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleToggle(!config?.enabled)} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${config?.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {config?.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {config?.enabled ? t('مفعّل', 'Enabled', 'Вкл') : t('معطّل', 'Disabled', 'Выкл')}
          </button>
          <button onClick={fetchState} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"><RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>
        </div>
      </div>

      {/* Pending Purchases */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            {t('طلبات الشراء المعلقة', 'Pending Purchase Requests', 'Ожидающие заявки')}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600">{pendingPurchases.length}</span>
          </h4>
        </div>
        {pendingPurchases.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{t('لا توجد طلبات معلقة', 'No pending requests', 'Нет ожидающих заявок')}</p>
        ) : pendingPurchases.map((p: any) => (
          <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-slate-500">#{p.id}</div>
              <div className="text-xs font-bold text-yellow-600">{fmtAmount(p.total_cost)}</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>🎟️ {p.ticket_count} {t('تذكرة', 'tickets', 'билетов')}</span>
              <span>•</span>
              <span>{p.draw_type === 'hourly' ? '⏰ ساعة' : p.draw_type === 'daily' ? '📅 يومي' : '🏆 أسبوعي'}</span>
              <span>•</span>
              <span className="font-mono text-[10px]">{p.uid}</span>
            </div>
            <div className="flex gap-1">
              {p.numbers.map((nums: number[], i: number) => (
                <div key={i} className="flex gap-0.5">
                  {nums.map((n, j) => <span key={j} className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black font-mono">{n}</span>)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{p.payment_method_id}</span>
              <span>•</span>
              <span>{p.transfer_wallet}</span>
              <span>•</span>
              <span>{new Date(p.created_at).toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(p.id)} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('تأكيد', 'Approve', 'Одобрить')}
              </button>
              <button onClick={() => handleReject(p.id)} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {t('رفض', 'Reject', 'Отклонить')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Draw Type Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {drawTypes.map(dt => (
            <button key={dt.key} onClick={() => setSelectedType(dt.key as any)}
              className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${selectedType === dt.key ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
              <div className="text-xl">{dt.icon}</div>
              <div className="text-xs font-black text-slate-900 dark:text-white">{dt.name}</div>
              <div className="text-[10px] text-slate-500">{dt.price}</div>
            </button>
          ))}
        </div>

        {/* Stats for selected type */}
        {state?.draw_types?.[selectedType] && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-sm font-black text-yellow-500">{state.draw_types[selectedType].tickets_sold || 0}</div>
              <div className="text-[8px] text-slate-500">{t('مباعة', 'Sold', 'Продано')}</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-sm font-black text-blue-500">{state.draw_types[selectedType].manual_tickets || 0}</div>
              <div className="text-[8px] text-slate-500">{t('يدوية', 'Manual', 'Ручные')}</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-sm font-black text-emerald-500">{(state.draw_types[selectedType].tickets_sold || 0) - (state.draw_types[selectedType].manual_tickets || 0)}</div>
              <div className="text-[8px] text-slate-500">{t('شراء', 'Auto', 'Авто')}</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-sm font-black text-purple-500">{state.draw_types[selectedType].prize_pool || 0}</div>
              <div className="text-[8px] text-slate-500">{t('الجائزة', 'Pool', 'Пул')}</div>
            </div>
          </div>
        )}

        {/* Manual Ticket Input */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            {t('إضافة تذكرة يدوياً', 'Add Manual Ticket', 'Добавить билет вручную')}
          </h4>
          <div className="flex gap-2">
            <input type="text" value={manualNumbers} onChange={(e) => setManualNumbers(e.target.value)}
              placeholder={t('5,12,18,23,30', '5,12,18,23,30', '5,12,18,23,30')}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white" />
            <button onClick={handleManualTicket} disabled={addingManual}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
              {addingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {t('إضافة', 'Add', 'Добавить')}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">{t('أدخل 5 أرقام مفصولة بفواصل (1-30) - الأرقام لا تتكرر مع أي تذكرة أخرى', 'Enter 5 comma-separated numbers (1-30) - numbers must not duplicate any existing ticket', 'Введите 5 чисел через запятую (1-30) - числа не должны дублироваться')}</p>
        </div>

        {/* Draw Button */}
        <button onClick={() => handleDraw(selectedType)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black text-sm flex items-center justify-center gap-2">
          <Ticket className="w-4 h-4" />
          {t(`سحب ${selectedType === 'hourly' ? 'الساعة' : selectedType === 'daily' ? 'اليومي' : 'الأسبوعي'}`, `Draw ${selectedType}`, `Розыгрыш ${selectedType}`)}
        </button>
      </div>

      {/* Sold Numbers */}
      {state?.draw_types?.[selectedType]?.sold_numbers && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            {t('جميع الأرقام المباعة', 'All Sold Numbers', 'Все проданные номера')}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{state.draw_types[selectedType].sold_numbers.length}</span>
          </h4>
          <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
            {state.draw_types[selectedType].sold_numbers.map((sn: any) => (
              <div key={sn.id} className={`p-1.5 rounded-lg border text-center text-[10px] ${sn.source === 'manual' ? 'border-blue-400 bg-blue-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="font-mono font-black text-slate-700 dark:text-slate-300">{sn.numbers.join(', ')}</div>
                <div className="text-slate-400">{sn.source === 'manual' ? '📝' : '💳'} {sn.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function fmtAmount(n: number) { return n?.toLocaleString() || '0'; }
