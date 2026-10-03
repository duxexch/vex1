import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Ticket, 
  Sparkles, 
  Play, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Gift, 
  DollarSign,
  Clock,
  RotateCcw,
  Save,
  Timer,
  Power
} from 'lucide-react';
import { 
  Language, 
  LotteryDraw, 
  LotteryTicket, 
  LotteryStats,
  LotteryDrawType,
  LotteryIntervalId
} from '../../types';
import { lotteryService } from '../../services/lotteryService';
import { maxLossCap } from '../../../shared/lotteryConfig';

const intervalLabelAr = (minutes: number): string => {
  if (minutes < 60) return `كل ${minutes} دقيقة`;
  if (minutes < 1440) {
    const h = minutes / 60;
    return `كل ${h % 1 === 0 ? h : h.toFixed(1)} ساعة`;
  }
  if (minutes < 10080) {
    const d = minutes / 1440;
    return `كل ${d % 1 === 0 ? d : d.toFixed(1)} يوم`;
  }
  const w = minutes / 10080;
  return `كل ${w % 1 === 0 ? w : w.toFixed(1)} أسبوع`;
};

const intervalLabelEn = (minutes: number): string => {
  if (minutes < 60) return `Every ${minutes} min`;
  if (minutes < 1440) {
    const h = minutes / 60;
    return `Every ${h % 1 === 0 ? h : h.toFixed(1)} hours`;
  }
  if (minutes < 10080) {
    const d = minutes / 1440;
    return `Every ${d % 1 === 0 ? d : d.toFixed(1)} days`;
  }
  const w = minutes / 10080;
  return `Every ${w % 1 === 0 ? w : w.toFixed(1)} weeks`;
};

interface LotteryAdminManagerProps {
  lang: Language;
  onToast?: (msg: string) => void;
}

export const LotteryAdminManager: React.FC<LotteryAdminManagerProps> = ({
  lang,
  onToast,
}) => {
  const isAr = lang === 'ar';

  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const [allTickets, setAllTickets] = useState<LotteryTicket[]>([]);
  const [activeDraw, setActiveDraw] = useState<LotteryDraw | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cadence draw types (hourly / 5h / 15h / daily / weekly / monthly)
  const [drawTypes, setDrawTypes] = useState<LotteryDrawType[]>([]);
  const [typeDrafts, setTypeDrafts] = useState<
    Record<string, { enabled: boolean; ticketPrice: number; baseJackpot: number }>
  >({});
  const [isSavingTypeId, setIsSavingTypeId] = useState<string | null>(null);
  const [isCreatingTypeId, setIsCreatingTypeId] = useState<string | null>(null);

  // Search & Filter
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'winners' | 'pending'>('all');

  // New Draw Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newDrawTypeId, setNewDrawTypeId] = useState<'' | LotteryIntervalId>('');
  const [newDrawTitleAr, setNewDrawTitleAr] = useState<string>('');
  const [newDrawTitleEn, setNewDrawTitleEn] = useState<string>('');
  const [newDrawTicketPrice, setNewDrawTicketPrice] = useState<number>(1.0);
  const [newDrawJackpot, setNewDrawJackpot] = useState<number>(15000.0);
  const [newDrawCloseDays, setNewDrawCloseDays] = useState<number>(7);
  const [isCreatingDraw, setIsCreatingDraw] = useState<boolean>(false);

  // Instant Draw Trigger Modal state
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
  const [triggerTargetId, setTriggerTargetId] = useState<string | null>(null);
  const [manualWinningMain, setManualWinningMain] = useState<string>('');
  const [manualWinningLucky, setManualWinningLucky] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [triggerResult, setTriggerResult] = useState<{
    winningMain: number[];
    winningLucky: number[];
    totalWinners: number;
    totalPayout: number;
  } | null>(null);

  // Airdrop Free Ticket Modal
  const [showAirdropModal, setShowAirdropModal] = useState<boolean>(false);
  const [airdropUserId, setAirdropUserId] = useState<string>('');
  const [airdropCount, setAirdropCount] = useState<number>(1);

  // Load Admin Data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const fetchedDraws = await lotteryService.getDraws();
      setDraws(fetchedDraws);
      const current = fetchedDraws.find((d) => d.status === 'open' || d.status === 'drawing') || fetchedDraws[0] || null;
      setActiveDraw(current);

      const types = await lotteryService.getDrawTypes();
      setDrawTypes(types);
      setTypeDrafts(
        Object.fromEntries(
          types.map((t) => [t.id, { enabled: t.enabled, ticketPrice: t.ticketPrice, baseJackpot: t.baseJackpot }])
        )
      );

      const fetchedStats = lotteryService.getStats();
      setStats(fetchedStats);

      // Server-side ticket registry (all users); falls back to local mirror when offline
      const tickets = await lotteryService.getAllTickets();
      setAllTickets(tickets);
    } catch (err) {
      console.error('Error loading lottery admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const activeDraws = draws.filter(
    (d) => d.status === 'open' || d.status === 'closed' || d.status === 'drawing'
  );

  const triggerTarget = draws.find((d) => d.id === triggerTargetId) || null;

  const activeOfType = (typeId: LotteryIntervalId): LotteryDraw | undefined =>
    draws.find((d) => d.typeId === typeId && (d.status === 'open' || d.status === 'closed' || d.status === 'drawing'));

  const setTypeDraft = (id: string, patch: Partial<{ enabled: boolean; ticketPrice: number; baseJackpot: number }>) => {
    setTypeDrafts((prev) => {
      const base = prev[id] || { enabled: true, ticketPrice: 1, baseJackpot: 100 };
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  const handleSaveDrawType = async (id: LotteryIntervalId) => {
    const draft = typeDrafts[id];
    if (!draft) return;
    setIsSavingTypeId(id);
    try {
      const res = await lotteryService.updateDrawTypes([
        { id, enabled: draft.enabled, ticketPrice: draft.ticketPrice, baseJackpot: draft.baseJackpot },
      ]);
      setDrawTypes(res.drawTypes);
      if (onToast) {
        onToast(isAr ? `تم حفظ إعدادات ${id} وجدولة السحب التلقائي.` : `Saved ${id} type settings & auto schedule.`);
      }
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save draw type');
    } finally {
      setIsSavingTypeId(null);
    }
  };

  const handleCreateForType = async (typeId: LotteryIntervalId) => {
    setIsCreatingTypeId(typeId);
    try {
      const created = await lotteryService.createDraw({ typeId });
      if (onToast) {
        onToast(isAr ? `تم إنشاء ${created.id} (${typeId}) بنجاح!` : `Draw ${created.id} (${typeId}) created!`);
      }
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create draw');
    } finally {
      setIsCreatingTypeId(null);
    }
  };

  // Handle Create Draw
  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDraw(true);
    try {
      const isTypeCreate = Boolean(newDrawTypeId);
      const closeDate = new Date(Date.now() + newDrawCloseDays * 86400000).toISOString();
      const created = await lotteryService.createDraw({
        typeId: newDrawTypeId || undefined,
        titleAr: newDrawTitleAr || (isTypeCreate ? undefined : `سحب VEX الأسبوعي الكبرى #${(draws[0]?.drawNumber || 88) + 1}`),
        titleEn: newDrawTitleEn || (isTypeCreate ? undefined : `VEX Weekly Mega Draw #${(draws[0]?.drawNumber || 88) + 1}`),
        ticketPrice: newDrawTicketPrice,
        initialJackpot: newDrawJackpot,
        closeAt: isTypeCreate ? undefined : closeDate,
      });

      if (onToast) {
        onToast(isAr ? `تم إنشاء وجدولة ${created.id} بنجاح!` : `Draw ${created.id} created successfully!`);
      }
      setShowCreateModal(false);
      setNewDrawTypeId('');
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create draw');
    } finally {
      setIsCreatingDraw(false);
    }
  };

  const handleSelectCreateType = (value: '' | LotteryIntervalId) => {
    setNewDrawTypeId(value);
    if (!value) return;
    const type = drawTypes.find((t) => t.id === value);
    if (type) {
      setNewDrawTicketPrice(type.ticketPrice);
      setNewDrawJackpot(type.baseJackpot);
    }
  };

  // Handle Trigger Draw Now
  const handleTriggerDraw = async () => {
    const target = draws.find((d) => d.id === triggerTargetId) || null;
    if (!target) return;
    setIsTriggering(true);
    try {
      let forced = undefined;
      if (manualWinningMain.trim() && manualWinningLucky.trim()) {
        const main = manualWinningMain.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        const lucky = manualWinningLucky.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        if (main.length === 5 && lucky.length === 2) {
          forced = { mainNumbers: main, luckyNumbers: lucky };
        }
      }

      const res = await lotteryService.triggerDraw(target.id, forced);
      setTriggerResult(res);
      if (onToast) {
        onToast(
          isAr 
            ? `تم إجراء السحب! عدد الفائزين: ${res.totalWinners} - إجمالي الجوائز: $${res.totalPayout}`
            : `Draw Completed! Winners: ${res.totalWinners} - Payout: $${res.totalPayout}`
        );
      }
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error triggering draw');
    } finally {
      setIsTriggering(false);
    }
  };

  // Handle Airdrop Free Compassion Ticket (server-authoritative)
  const handleAirdrop = async () => {
    if (!airdropUserId.trim()) return;
    try {
      await lotteryService.airdropFreeTickets(airdropUserId.trim(), airdropCount);
      if (onToast) {
        onToast(
          isAr
            ? `تم إهداء ${airdropCount} تذكرة مجانية للمستخدم ${airdropUserId}!`
            : `Awarded ${airdropCount} free ticket(s) to ${airdropUserId}!`
        );
      }
      setShowAirdropModal(false);
      setAirdropUserId('');
    } catch (err: any) {
      alert(err.message || 'Failed to airdrop tickets');
    }
  };

  // Filtered tickets
  const filteredTickets = allTickets.filter((t) => {
    const matchesSearch = 
      t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.userId.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.drawId.toLowerCase().includes(ticketSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (ticketFilter === 'winners') {
      return (t.prizeWon || 0) > 0;
    }
    if (ticketFilter === 'pending') {
      const d = draws.find((dr) => dr.id === t.drawId);
      return d?.status === 'open';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900">
              {isAr ? 'غرفة عمليات إدارة اليانصيب والسحوبات' : 'Lottery Operations & Prize Engine'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr 
              ? 'ستة أنواع سحب تلقائية (كل ساعة، 5 ساعات، 15 ساعة، يومي، أسبوعي، شهري) بنظام ربح مستقل لكل نوع.'
              : 'Six automated draw cadences (hourly, 5h, 15h, daily, weekly, monthly), each with its own prize economy.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAirdropModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'إهداء تذاكر مجانية' : 'Airdrop Tickets'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنشاء سحب جديد' : 'New Draw'}</span>
          </button>

          <button
            type="button"
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            title={isAr ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">{isAr ? 'الجائزة الكبرى النشطة' : 'Active Jackpot'}</span>
          <span className="text-base sm:text-lg font-black text-amber-600 font-mono">
            ${activeDraw ? activeDraw.jackpotAmount.toLocaleString() : '0.00'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">{isAr ? 'التذاكر المباعة' : 'Tickets Sold'}</span>
          <span className="text-base sm:text-lg font-black text-indigo-600 font-mono">
            {stats?.totalTicketsSold || allTickets.length}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">{isAr ? 'إجمالي الجوائز الموزعة' : 'Total Payouts'}</span>
          <span className="text-base sm:text-lg font-black text-emerald-600 font-mono">
            ${(stats?.totalPrizesPaid || 0).toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">{isAr ? 'تذاكر تكافل معوضة' : 'Solidarity Tickets'}</span>
          <span className="text-base sm:text-lg font-black text-purple-600 font-mono">
            {stats?.compassionTicketsAwarded || 0}
          </span>
        </div>
      </div>

      {/* Cadence Draw Types — schedule/prize economy per type */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Timer className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-black text-slate-900">
            {isAr ? 'أنواع السحب الدورية (تلقائي مستمر)' : 'Cadence Draw Types (Fully Automated)'}
          </h3>
          <span className="text-xs font-bold text-slate-400">({drawTypes.length})</span>
        </div>

        {drawTypes.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {isAr ? 'جاري تحميل الأنواع...' : 'Loading draw types...'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {drawTypes.map((t) => {
              const draft = typeDrafts[t.id] || { enabled: t.enabled, ticketPrice: t.ticketPrice, baseJackpot: t.baseJackpot };
              const live = activeOfType(t.id);
              const intervalText = isAr ? intervalLabelAr(t.intervalMinutes) : intervalLabelEn(t.intervalMinutes);
              return (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-3 space-y-2.5 transition ${
                    draft.enabled ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-slate-900">{isAr ? t.nameAr : t.nameEn}</h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                          {t.intervalMinutes} {isAr ? 'د' : 'm'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{intervalText}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTypeDraft(t.id, { enabled: !draft.enabled })}
                      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                        draft.enabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                      }`}
                      title={isAr ? 'تفعيل/تعطيل النوع' : 'Toggle type'}
                    >
                      <Power className="w-3 h-3" />
                      {draft.enabled ? (isAr ? 'مفعّل' : 'ON') : isAr ? 'متعطّل' : 'OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isAr ? 'سعر التذكرة ($)' : 'Ticket ($)'}
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={draft.ticketPrice}
                        onChange={(e) => setTypeDraft(t.id, { ticketPrice: parseFloat(e.target.value) || 0.05 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isAr ? 'الجائزة الكبرى ($)' : 'Jackpot ($)'}
                      </label>
                      <input
                        type="number"
                        step="50"
                        min="1"
                        value={draft.baseJackpot}
                        onChange={(e) => setTypeDraft(t.id, { baseJackpot: parseFloat(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-2 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase block">
                      {isAr ? 'نظام الربح' : 'Prize System'}
                    </span>
                    {t.tiers.map((tier) => (
                      <div key={tier.id} className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-slate-600 font-bold truncate">{isAr ? tier.nameAr : tier.nameEn}</span>
                        <span className="font-mono font-black text-slate-900 shrink-0">
                          {tier.fixedPrize !== undefined
                            ? `$${tier.fixedPrize.toLocaleString()}`
                            : tier.id === 'tier1_jackpot'
                              ? `$${draft.baseJackpot.toLocaleString()}`
                              : `${tier.sharePercent}% ≥ $${(tier.guaranteedAmount || 0).toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1" title={isAr ? 'قاعدة B: أقصى خسارة مسموحة لكل سحب = 0.5 × الجاكيت الأساسي' : 'Rule B: max house loss per draw = 0.5 x base jackpot'}>
                      <span className="text-[9px] font-black text-slate-400 uppercase">
                        {isAr ? 'حد الخسارة (التغطية)' : 'Max Loss (Coverage)'}
                      </span>
                      <span className="font-mono font-black text-[10px] text-emerald-600">
                        ≤ ${maxLossCap(draft.baseJackpot).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 truncate">
                      {live
                        ? `${isAr ? 'نشط:' : 'Live:'} ${live.id} • ${new Date(live.closeAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : isAr
                          ? 'لا يوجد سحب نشط لهذا النوع'
                          : 'No active draw for this type'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveDrawType(t.id)}
                      disabled={isSavingTypeId === t.id}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer"
                    >
                      {isSavingTypeId === t.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      {isAr ? 'حفظ' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateForType(t.id)}
                      disabled={isCreatingTypeId === t.id}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black bg-amber-500 text-amber-950 hover:bg-amber-400 disabled:opacity-60 transition cursor-pointer"
                    >
                      {isCreatingTypeId === t.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      {isAr ? 'إنشاء سحب' : 'Create Draw'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Draw Management Table (all cadence types) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">
              {isAr ? 'السحوبات النشطة (كل الأنواع)' : 'Active Draws (All Types)'}
            </h3>
            <span className="text-xs font-bold text-slate-400">({activeDraws.length})</span>
          </div>
        </div>

        {activeDraws.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {isAr ? 'لا توجد سحوبات نشطة حالياً.' : 'No active draws right now.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold">{isAr ? 'السحب' : 'Draw'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'التذكرة' : 'Ticket'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'الجائزة' : 'Jackpot'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'المجمع' : 'Pool'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'مباعة' : 'Sold'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'الإغلاق' : 'Closes'}</th>
                  <th className="p-2.5 font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeDraws.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{d.id}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                          {d.typeId || 'legacy'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[220px]">
                        {isAr ? d.titleAr : d.titleEn}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          d.status === 'open'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'closed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {d.status === 'open' ? (isAr ? 'مفتوح' : 'Open') : d.status === 'closed' ? (isAr ? 'مغلق' : 'Closed') : d.status}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono font-bold">${d.ticketPrice.toFixed(2)}</td>
                    <td className="p-2.5 font-mono font-black text-amber-600">${d.jackpotAmount.toLocaleString()}</td>
                    <td className="p-2.5 font-mono">${d.totalPool.toLocaleString()}</td>
                    <td className="p-2.5 font-mono text-indigo-700">{d.ticketsSoldCount}</td>
                    <td className="p-2.5 text-[11px] font-bold text-slate-600">
                      {new Date(d.closeAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        {d.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => {
                              setTriggerTargetId(d.id);
                              setManualWinningMain('');
                              setManualWinningLucky('');
                              setTriggerResult(null);
                              setShowTriggerModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            {isAr ? 'سحب' : 'Draw'}
                          </button>
                        )}
                        <span className="px-1.5 py-1 text-slate-400" title={d.provablyFair.serverSeedHash}>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeDraw && (
          <div className="bg-slate-900 text-slate-300 p-2.5 rounded-xl text-[10px] font-mono flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate">
              {activeDraw.id} — Pre-committed SHA256: {activeDraw.provablyFair.serverSeedHash}
            </span>
            <span className="text-emerald-400 font-bold shrink-0">{isAr ? 'مشفر ونزيه' : 'Provably Fair'}</span>
          </div>
        )}
      </div>

      {/* Ticket Explorer Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">
              {isAr ? 'سجل تذاكر المشتركين' : 'Participant Tickets Explorer'}
            </h3>
            <span className="text-xs font-bold text-slate-400">({filteredTickets.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder={isAr ? 'بحث برقم التذكرة أو المشترك...' : 'Search ticket or user ID...'}
                className="text-xs px-2.5 py-1.5 pl-8 rounded-xl border border-slate-200 w-44 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value as any)}
              className="text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">{isAr ? 'كافة التذاكر' : 'All Tickets'}</option>
              <option value="winners">{isAr ? 'الفائزة فقط' : 'Winners Only'}</option>
              <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending Only'}</option>
            </select>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {isAr ? 'لا توجد تذاكر تطابق معايير البحث.' : 'No tickets matching search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold">{isAr ? 'رقم التذكرة' : 'Ticket ID'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'الأرقام' : 'Balls'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'الحالة والنتيجة' : 'Status'}</th>
                  <th className="p-2.5 font-bold">{isAr ? 'الجائزة' : 'Prize'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTickets.slice(0, 15).map((t) => {
                  const isWinner = (t.prizeWon || 0) > 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{t.id}</td>
                      <td className="p-2.5 font-mono text-slate-600">{t.userId}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1 font-mono">
                          {t.mainNumbers.map((n) => (
                            <span key={`t-num-${n}`} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold text-[10px]">
                              {n}
                            </span>
                          ))}
                          <span className="text-slate-300">+</span>
                          {t.luckyNumbers.map((n) => (
                            <span key={`t-luck-${n}`} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              ★{n}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-[11px]">
                        {t.paymentMethod === 'compassion_free_ticket' ? (
                          <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            {isAr ? 'تكافل مجانية' : 'Solidarity'}
                          </span>
                        ) : (
                          <span className="text-slate-700 font-medium">
                            ${t.pricePaid.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {isWinner ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {isAr ? 'فائزة' : 'Winner'}
                            {t.isClaimed ? (isAr ? ' • مطالَب ✓' : ' • Claimed ✓') : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {t.matchedMainCount !== undefined ? (isAr ? 'غير فائزة' : 'No Win') : (isAr ? 'نشطة' : 'Active')}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-black font-mono">
                        {isWinner ? (
                          <span className="text-emerald-600">+${t.prizeWon?.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* MODAL: CREATE NEW DRAW                                      */}
      {/* ----------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {isAr ? 'جدولة وإنشاء سحب يانصيب جديد' : 'Schedule New Lottery Draw'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDraw} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'نوع السحب (الدورة):' : 'Draw Type (Cadence):'}
                </label>
                <select
                  value={newDrawTypeId}
                  onChange={(e) => handleSelectCreateType(e.target.value as '' | LotteryIntervalId)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="">{isAr ? 'مخصص (يدوي)' : 'Custom (manual)'}</option>
                  {drawTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.nameAr : t.nameEn} — {isAr ? intervalLabelAr(t.intervalMinutes) : intervalLabelEn(t.intervalMinutes)}
                    </option>
                  ))}
                </select>
                {newDrawTypeId && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAr
                      ? 'سيُنشأ السحب بدورة النوع المحدد وإغلاق تلقائي بعد انتهائها، ثم يعاد إنشاؤه تلقائياً.'
                      : 'The draw uses the type cadence, closes automatically, then is recreated automatically.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'عنوان السحب (عربي):' : 'Title (Arabic):'}
                </label>
                <input
                  type="text"
                  value={newDrawTitleAr}
                  onChange={(e) => setNewDrawTitleAr(e.target.value)}
                  placeholder="سحب VEX الأسبوعي الكبرى"
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'عنوان السحب (إنجليزي):' : 'Title (English):'}
                </label>
                <input
                  type="text"
                  value={newDrawTitleEn}
                  onChange={(e) => setNewDrawTitleEn(e.target.value)}
                  placeholder="VEX Weekly Mega Draw"
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'سعر التذكرة ($):' : 'Ticket Price ($):'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newDrawTicketPrice}
                    onChange={(e) => setNewDrawTicketPrice(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الجائزة الكبرى المبدئية ($):' : 'Initial Jackpot ($):'}
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={newDrawJackpot}
                    onChange={(e) => setNewDrawJackpot(parseFloat(e.target.value) || 15000)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {!newDrawTypeId && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'مدة فتح التذاكر (بالأيام):' : 'Duration (Days):'}
                  </label>
                  <input
                    type="number"
                    value={newDrawCloseDays}
                    onChange={(e) => setNewDrawCloseDays(parseInt(e.target.value, 10) || 7)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDraw}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700"
                >
                  {isCreatingDraw ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'تأكيد الإنشاء' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: TRIGGER DRAW NOW                                     */}
      {/* ----------------------------------------------------------- */}
      {showTriggerModal && triggerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? `إجراء السحب الفوري لـ ${triggerTarget.id}` : `Execute Draw for ${triggerTarget.id}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTriggerModal(false);
                  setTriggerResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            {triggerResult ? (
              <div className="space-y-3 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  {isAr ? 'تم سحب الأرقام وتوزيع الجوائز بنجاح!' : 'Draw Executed & Winners Rewarded!'}
                </h4>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    {isAr ? 'الكرات الفائزة المسحوبة:' : 'Drawn Winning Balls:'}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 font-mono">
                    {triggerResult.winningMain.map((n) => (
                      <span key={`win-${n}`} className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                        {n}
                      </span>
                    ))}
                    <span className="text-slate-300 font-bold">+</span>
                    {triggerResult.winningLucky.map((n) => (
                      <span key={`win-l-${n}`} className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center">
                        ★{n}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-slate-600 pt-1">
                    {isAr ? `الفائزين: ${triggerResult.totalWinners}` : `Winners: ${triggerResult.totalWinners}`} | {isAr ? `الجوائز: $${triggerResult.totalPayout}` : `Payout: $${triggerResult.totalPayout}`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowTriggerModal(false);
                    setTriggerResult(null);
                  }}
                  className="w-full py-2.5 rounded-xl font-black text-xs bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  {isAr
                    ? 'سيقوم النظام بالسحب الآلي المشفر النزيه (Provably Fair) ومطابقة جميع التذاكر المسجلة وتوزيع الأرباح على حسابات الفائزين فوراً.'
                    : 'System will cryptographically draw winning balls, match all tickets, and automatically credit winner balances.'}
                </p>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 block text-[11px]">
                    {isAr ? 'خيارات متقدمة: إدخال كرات محددة يدوياً (اختياري)' : 'Optional: Override specific balls'}
                  </span>
                  <div>
                    <label className="text-[10px] text-amber-800 block mb-0.5">
                      {isAr ? '5 أرقام رئيسية (مفصولة بفواصل، مثل: 7, 14, 23, 38, 45):' : '5 Main numbers (comma separated):'}
                    </label>
                    <input
                      type="text"
                      value={manualWinningMain}
                      onChange={(e) => setManualWinningMain(e.target.value)}
                      placeholder="7, 14, 23, 38, 45"
                      className="w-full p-1.5 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-800 block mb-0.5">
                      {isAr ? 'رقمين ذهبيين (مثل: 3, 9):' : '2 Lucky numbers (e.g. 3, 9):'}
                    </label>
                    <input
                      type="text"
                      value={manualWinningLucky}
                      onChange={(e) => setManualWinningLucky(e.target.value)}
                      placeholder="3, 9"
                      className="w-full p-1.5 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerDraw}
                  disabled={isTriggering}
                  className="w-full py-2.5 rounded-xl font-black text-xs bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isTriggering ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isAr ? 'جاري سحب الكرات والمطابقة...' : 'Executing Draw...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isAr ? 'تأكيد وإجراء السحب الرسمي' : 'Confirm & Run Official Draw'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: AIRDROP FREE COMPASSION TICKETS                       */}
      {/* ----------------------------------------------------------- */}
      {showAirdropModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? 'إهداء تذاكر تكافل مجانية' : 'Airdrop Solidarity Tickets'}
                </h3>
              </div>
              <button
                onClick={() => setShowAirdropModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'معرف المستخدم (User ID):' : 'Target User ID:'}
                </label>
                <input
                  type="text"
                  value={airdropUserId}
                  onChange={(e) => setAirdropUserId(e.target.value)}
                  placeholder="WCm5x8k2ab3f"
                  className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'عدد التذاكر الممنوحة:' : 'Number of Free Tickets:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={airdropCount}
                  onChange={(e) => setAirdropCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAirdropModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleAirdrop}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-amber-950 font-black hover:bg-amber-400 shadow-xs"
                >
                  {isAr ? 'منح التذاكر الآن' : 'Award Tickets'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
