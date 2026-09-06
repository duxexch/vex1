import React, { useState } from 'react';
import { CompensationAccount, CompensationRequest, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { ActivityTabSkeleton } from './SkeletonLoader';
import { ShieldCheck, Clock, XCircle, CheckCircle2, DollarSign, PlusCircle, Ticket, Copy, Check } from 'lucide-react';

interface ActivityTabProps {
  accounts: CompensationAccount[];
  requests: CompensationRequest[];
  onOpenNewRequest: () => void;
  lang: Language;
  isLoading?: boolean;
  onCopyToast?: () => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
  accounts,
  requests,
  onOpenNewRequest,
  lang,
  isLoading = false,
  onCopyToast,
}) => {
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const t = TRANSLATIONS[lang] || TRANSLATIONS['ar'];

  const handleCopyAccount = (accNum: string, accId: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccountId(accId);
    if (onCopyToast) onCopyToast();
    setTimeout(() => setCopiedAccountId(null), 2000);
  };

  if (isLoading) {
    return <ActivityTabSkeleton />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return {
          label: lang === 'ar' ? 'تم الإيداع والاعتماد' : lang === 'es' ? 'Aprobado' : lang === 'ru' ? 'Одобрено' : 'Approved',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'pending':
        return {
          label: lang === 'ar' ? 'قيد التدقيق الفوري' : lang === 'es' ? 'En Revisión' : lang === 'ru' ? 'На проверке' : 'Under Review',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'rejected':
      default:
        return {
          label: lang === 'ar' ? 'مرفوض' : lang === 'es' ? 'Rechazado' : lang === 'ru' ? 'Отклонено' : 'Rejected',
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
        };
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in select-none">
      {/* Quick Action Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-slate-900">
          {lang === 'ar'
            ? 'النشاط وسجل الحسابات'
            : lang === 'es'
            ? 'Actividad y Cuentas'
            : lang === 'ru'
            ? 'Активность и Счета'
            : 'Activity & History'}
        </h2>
        <button
          onClick={onOpenNewRequest}
          className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.requestCompensation}</span>
        </button>
      </div>

      {/* 1. Registered Accounts Section */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          {t.myAccountsTitle} ({accounts.length})
        </h3>

        {accounts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 shadow-xs">
            {lang === 'ar'
              ? 'لم تسجل أي حساب بعد. توجه لتبويب «الشركات» لربط حسابك.'
              : lang === 'es'
              ? 'No has vinculado ninguna cuenta. Ve a la pestaña «Casas».'
              : lang === 'ru'
              ? 'Счета пока не привязаны. Перейдите во вкладку «Компании».'
              : 'No accounts registered yet. Go to the "Partners" tab to link your ID.'}
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => {
              const badge = getStatusBadge(acc.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={acc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-800">
                      {acc.company_name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {acc.company_name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <span>
                          {lang === 'ar' ? 'رقم الحساب:' : lang === 'es' ? 'ID Cuenta:' : lang === 'ru' ? 'Номер счета:' : 'Account ID:'}{' '}
                          <strong className="text-slate-800">{acc.account_number}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(acc.account_number, acc.id)}
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition-colors inline-flex items-center"
                          title={lang === 'ar' ? 'نسخ رقم الحساب' : 'Copy Account ID'}
                          aria-label={lang === 'ar' ? 'نسخ رقم الحساب' : 'Copy Account ID'}
                        >
                          {copiedAccountId === acc.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.classes}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Compensation Requests Section */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          {t.requestsHistoryTitle} ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 shadow-xs">
            {lang === 'ar'
              ? 'لا توجد طلبات تعويض سابقة.'
              : lang === 'es'
              ? 'No hay solicitudes de reembolso anteriores.'
              : lang === 'ru'
              ? 'Предыдущих запросов на компенсацию нет.'
              : 'No previous compensation requests.'}
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const badge = getStatusBadge(req.status);
              const BadgeIcon = badge.icon;
              const currencyStr = req.currency || 'USD';

              return (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {req.company_name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                          <span>
                            ID: <span className="font-mono font-bold text-slate-800">{req.account_number}</span>
                          </span>
                          {req.bet_slip_id && (
                            <span className="flex items-center gap-0.5 text-indigo-700 font-mono font-bold">
                              <Ticket className="w-3 h-3" />
                              <span>#{req.bet_slip_id}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left">
                      <span className="text-sm font-bold font-mono text-emerald-700 block">
                        {Number(req.amount).toFixed(2)} {currencyStr}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  </div>

                  {/* Status & Reviewer Note */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.classes}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {req.note && (
                      <span className="text-[11px] text-slate-500 italic max-w-[200px] truncate">
                        «{req.note}»
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
