import React, { useState, useEffect } from 'react';
import { Company, Language, Wallet, PaymentMethod } from '../types';
import { formatCurrency, currencyLabel } from '../utils/currency';
import { vexApi } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { PaymentMethodCard } from './payment/PaymentMethodCard';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Trophy,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  DollarSign,
  Info,
} from 'lucide-react';

export type FinancialRequestModalType = 'deposit' | 'withdraw' | 'prize_claim';

export interface FinancialRequestPrefill {
  ticket_id?: string;
  draw_id?: string;
  amount?: number;
  company_id?: string;
  company_name?: string;
}

interface FinancialRequestModalProps {
  isOpen: boolean;
  type: FinancialRequestModalType;
  onClose: () => void;
  wallets: Wallet[];
  companies: Company[];
  lang: Language;
  displayCurrency: string;
  onSuccess: () => void;
  showToast: (msg: string) => void;
  prefill?: FinancialRequestPrefill;
}

const TYPE_META: Record<
  FinancialRequestModalType,
  { ar: string; en: string; subAr: string; subEn: string; iconBg: string; iconColor: string }
> = {
  deposit: {
    ar: 'طلب إيداع رصيد',
    en: 'Deposit Request',
    subAr: 'سجّل إيداعك وستُضاف قيمته لرصيدك بعد اعتماد الإدارة',
    subEn: 'Log your deposit — credited after admin approval',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
  withdraw: {
    ar: 'طلب سحب رصيد',
    en: 'Withdraw Request',
    subAr: 'اطلب سحب من رصيدك المتاح ويُخصم بعد اعتماد الإدارة',
    subEn: 'Request a withdrawal from available balance after admin approval',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
  },
  prize_claim: {
    ar: 'طلب استلام جائزة يدوي',
    en: 'Manual Prize Claim',
    subAr: 'يراجع الإدارة فوزك ويستلمه بعد التحقق من التذكرة',
    subEn: 'Admin reviews your winning ticket and processes it manually',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
};

export const FinancialRequestModal: React.FC<FinancialRequestModalProps> = ({
  isOpen,
  type,
  onClose,
  wallets,
  companies,
  lang,
  displayCurrency,
  onSuccess,
  showToast,
  prefill,
}) => {
  const isAr = lang === 'ar';
  const meta = TYPE_META[type] || TYPE_META.deposit;
  const { geo } = useCurrency();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPmId, setSelectedPmId] = useState('');
  const [isFetchingMethods, setIsFetchingMethods] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(null);
    setNote('');
    setAccountNumber('');
    setSenderPhone('');
    const defaultCompany =
      (prefill && prefill.company_id) ||
      wallets.find((w) => w.company_id)?.company_id ||
      wallets[0]?.company_id ||
      '';
    setSelectedCompanyId(defaultCompany);
    setAmount(prefill && prefill.amount ? String(prefill.amount) : '');
    if (type === 'deposit' || type === 'withdraw') {
      setIsFetchingMethods(true);
      vexApi
        .getPaymentMethods(geo.country)
        .then((methods) => {
          // Country + global scoping happens inside getPaymentMethods;
          // here we keep only methods relevant to this flow.
          const visible = (methods || []).filter((m) => {
            if (m.is_active === false) return false;
            if (type === 'deposit') return m.type !== 'withdraw';
            return m.type !== 'deposit';
          });
          setPaymentMethods(visible);
          if (visible.length > 0) setSelectedPmId((prev) => prev || visible[0].id);
        })
        .catch(() => undefined)
        .finally(() => setIsFetchingMethods(false));
    }
  }, [isOpen, type, wallets, prefill, geo.country]);

  const currentWallet = wallets.find((w) => w.company_id === selectedCompanyId) || wallets[0];
  const availableBal = currentWallet ? Number(currentWallet.available) || 0 : 0;
  const activePaymentMethods = paymentMethods.filter((pm) => pm.is_active !== false);
  const selectedPm = activePaymentMethods.find((pm) => pm.id === selectedPmId) || activePaymentMethods[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من صفر.' : 'Please enter a valid amount greater than zero.');
      return;
    }
    if (numericAmount > 50000) {
      setError(isAr ? 'الحد الأقصى للمبلغ هو 50000.' : 'Maximum amount is 50000.');
      return;
    }

    if (type === 'withdraw') {
      if (numericAmount > availableBal) {
        setError(
          isAr
            ? `مبلغ السحب (${formatCurrency(numericAmount, displayCurrency)}) يتجاوز رصيدك المتاح (${formatCurrency(availableBal, displayCurrency)}).`
            : `Withdraw amount exceeds your available balance (${formatCurrency(availableBal, displayCurrency)}).`
        );
        return;
      }
      if (!accountNumber.trim()) {
        setError(isAr ? 'يرجى إدخال رقم الحساب/المحفظة الذي ستُحوَّل إليه الأموال.' : 'Please enter the payout account number.');
        return;
      }
    }

    if (type === 'deposit') {
      if (!accountNumber.trim()) {
        setError(isAr ? 'يرجى إدخال رقم حسابك في المنصة.' : 'Please enter your platform account number.');
        return;
      }
      if (!senderPhone.trim()) {
        setError(isAr ? 'يرجى إدخال رقم الهاتف المستخدم في الإيداع.' : 'Please enter the sender phone number.');
        return;
      }
    }

    if (type === 'prize_claim' && !(prefill && prefill.ticket_id)) {
      setError(isAr ? 'معرف تذكرة الجائزة مطلوب.' : 'Prize ticket id is required.');
      return;
    }

    try {
      setLoading(true);
      const result = await vexApi.createFinancialRequest({
        type,
        amount: numericAmount,
        company_id: selectedCompanyId || undefined,
        company_name: currentWallet?.company_name,
        account_number: type === 'prize_claim' ? undefined : accountNumber.trim() || undefined,
        sender_phone: type === 'deposit' ? senderPhone.trim() || undefined : undefined,
        payment_method_name:
          (type === 'deposit' || type === 'withdraw') && selectedPm
            ? isAr
              ? selectedPm.nameAr || selectedPm.name
              : selectedPm.nameEn || selectedPm.name
            : undefined,
        note: note.trim() || undefined,
        ticket_id: prefill && prefill.ticket_id,
        draw_id: prefill && prefill.draw_id,
      });

      if (!result.success) {
        setError(result.error || (isAr ? 'تعذر إرسال الطلب.' : 'Failed to submit request.'));
        return;
      }

      const successMsg = isAr
        ? type === 'deposit'
          ? 'تم إرسال طلب الإيداع بنجاح! سيُضاف الرصيد بعد اعتماد الإدارة.'
          : type === 'withdraw'
          ? 'تم إرسال طلب السحب بنجاح! سيُخصم المبلغ بعد اعتماد الإدارة.'
          : 'تم إرسال طلب استلام الجائزة! سيراجعه الإدارة.'
        : 'Request submitted successfully! It will be processed after admin approval.';
      setSuccess(successMsg);
      showToast(isAr ? 'تم تقديم الطلب بنجاح' : 'Request submitted');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeIcon =
    type === 'deposit' ? (
      <ArrowDownLeft className="w-5 h-5" />
    ) : type === 'withdraw' ? (
      <ArrowUpRight className="w-5 h-5" />
    ) : (
      <Trophy className="w-5 h-5" />
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center font-bold`}>
              {typeIcon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{isAr ? meta.ar : meta.en}</h3>
              <p className="text-[11px] text-slate-500">{isAr ? meta.subAr : meta.subEn}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div
            className={`p-3 rounded-xl border space-y-1 ${
              type === 'withdraw'
                ? 'bg-sky-50/60 border-sky-200/80 text-sky-900'
                : type === 'prize_claim'
                ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
            }`}
          >
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {type === 'deposit'
                  ? isAr
                    ? 'شروط الإيداع:'
                    : 'Deposit terms:'
                  : type === 'withdraw'
                  ? isAr
                    ? 'شروط السحب:'
                    : 'Withdraw terms:'
                  : isAr
                  ? 'شروط استلام الجائزة:'
                  : 'Prize claim terms:'}
              </span>
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">
              {type === 'deposit'
                ? isAr
                  ? 'يراجع الإدارة إيصال الإيداع ورقم الهاتف، وبعد الاعتماد تُضاف قيمة الإيداع إلى رصيدك المتاح تلقائياً.'
                  : 'Admin verifies the receipt and phone; once approved the amount is credited to your available balance automatically.'
                : type === 'withdraw'
                ? isAr
                  ? 'يراجع الإدارة طلبك وبيانات الحساب المحول إليه، وبعد الاعتماد يُخصم المبلغ من رصيدك المتاح تلقائياً.'
                  : 'Admin reviews your request and payout account; once approved the amount is deducted from your available balance automatically.'
                : isAr
                ? 'يتحقق الإدارة من تذكرة الفوز، وبعد الاعتماد تُضاف قيمة الجائزة إلى محفظتك مرة واحدة فقط.'
                : 'Admin verifies the winning ticket; once approved the prize is credited to your wallet exactly once.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'المنصة / المحفظة المستهدفة' : 'Target Company / Wallet'}
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
              >
                {wallets.length === 0 && <option value="">{isAr ? 'لا توجد محافظ' : 'No wallets'}</option>}
                {wallets.map((w) => {
                  const comp = companies.find((c) => c.id === w.company_id);
                  return (
                    <option key={w.company_id} value={w.company_id}>
                      {comp ? (isAr ? comp.name_ar || comp.name : comp.name) : w.company_name} (
                      {isAr ? 'متاح:' : 'Available:'} {formatCurrency(w.available, displayCurrency)})
                    </option>
                  );
                })}
              </select>
            </div>

            {type === 'deposit' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block font-bold text-slate-700">
                  {isAr ? 'اختر وسيلة الدفع للإيداع *' : 'Select Payment Method *'}
                </label>
                {isFetchingMethods ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    {isAr ? 'جاري تحميل وسائل الدفع...' : 'Loading payment methods...'}
                  </div>
                ) : activePaymentMethods.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    {isAr
                      ? 'تنبيه: وسائل الدفع تحت التحديث من الإدارة. يرجى التواصل مع الدعم الفني.'
                      : 'Notice: Payment methods are being updated by administration.'}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activePaymentMethods.map((pm) => {
                        const isSelected = selectedPm?.id === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setSelectedPmId(pm.id)}
                            className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-bold text-xs truncate">
                              {isAr ? pm.nameAr || pm.name : pm.nameEn || pm.name}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    {selectedPm && (
                      <div className="mt-1 animate-fade-in">
                        <PaymentMethodCard
                          method={selectedPm}
                          lang={lang}
                          mode="deposit"
                          onCopyToast={() =>
                            showToast(isAr ? 'تم نسخ بيانات الدفع' : 'Payment details copied')
                          }
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {type === 'withdraw' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block font-bold text-slate-700">
                  {isAr ? 'اختر وسيلة استلام السحب *' : 'Select Withdrawal Method *'}
                </label>
                {isFetchingMethods ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    {isAr ? 'جاري تحميل وسائل الدفع...' : 'Loading payment methods...'}
                  </div>
                ) : activePaymentMethods.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    {isAr
                      ? 'لا توجد وسيلة سحب متاحة لدولتك حاليًا. تواصل مع الدعم الفني.'
                      : 'No withdrawal method available for your country yet. Please contact support.'}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activePaymentMethods.map((pm) => {
                        const isSelected = selectedPm?.id === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setSelectedPmId(pm.id)}
                            className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-violet-50/90 border-violet-500 text-violet-950 shadow-xs ring-1 ring-violet-500'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-bold text-xs truncate">
                              {isAr ? pm.nameAr || pm.name : pm.nameEn || pm.name}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    {selectedPm && (
                      <div className="mt-1 animate-fade-in">
                        <PaymentMethodCard
                          method={selectedPm}
                          lang={lang}
                          mode="withdraw"
                          showAccountAndQr={false}
                          onCopyToast={() =>
                            showToast(isAr ? 'تم نسخ البيانات' : 'Details copied')
                          }
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {type === 'withdraw'
                    ? isAr
                      ? 'مبلغ السحب'
                      : 'Withdraw Amount'
                    : type === 'prize_claim'
                    ? isAr
                      ? 'قيمة الجائزة'
                      : 'Prize Amount'
                    : isAr
                    ? 'مبلغ الإيداع'
                    : 'Deposit Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    readOnly={type === 'prize_claim'}
                    className={`w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                      type === 'prize_claim' ? 'opacity-80' : ''
                    }`}
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold" dir="ltr">
                    {currencyLabel(displayCurrency).symbol}
                  </span>
                </div>
                {type === 'withdraw' && (
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {isAr
                      ? `المتاح الآن: ${formatCurrency(availableBal, displayCurrency)}`
                      : `Available now: ${formatCurrency(availableBal, displayCurrency)}`}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {type === 'deposit'
                    ? isAr
                      ? 'رقم الحساب في المنصة'
                      : 'Platform Account Number'
                    : type === 'withdraw'
                    ? isAr
                      ? 'رقم الحساب للتحويل إليه'
                      : 'Payout Account Number'
                    : isAr
                    ? 'رقم الحساب'
                    : 'Account Number'}
                </label>
                <input
                  type="text"
                  placeholder={type === 'deposit' ? '87654321' : type === 'withdraw' ? 'Wallet / IBAN / Phone' : ''}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={type === 'prize_claim'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            {type === 'deposit' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'رقم الهاتف المرسل منه الإيداع' : 'Sender Phone Number'}
                </label>
                <input
                  type="text"
                  placeholder="+2010xxxxxxxx"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {isAr
                    ? 'يجب أن يطابق رقم هاتفك المرتبط أو رقم الحساب المحول منه.'
                    : 'Must match your registered phone or sending wallet.'}
                </span>
              </div>
            )}

            {type === 'prize_claim' && prefill && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{isAr ? 'تذكرة الفوز:' : 'Winning Ticket:'}</span>
                  <span className="font-bold select-all">{prefill.ticket_id}</span>
                </div>
                {prefill.draw_id && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">{isAr ? 'القرعة:' : 'Draw:'}</span>
                    <span>{prefill.draw_id}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'ملاحظة للإدارة (اختياري)' : 'Note for Admin (optional)'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'TXN-984321 أو تفاصيل إضافية' : 'TXN-984321 or extra details'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'يتم تنفيذ المبالغ يدوياً من قبل الإدارة بعد المراجعة، ويُطبَّق تعديل المحفظة مرة واحدة فقط لكل طلب معتمد.'
                  : 'Amounts are processed manually by the admin after review; each approved request applies its balance change exactly once.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                type === 'withdraw'
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : type === 'prize_claim'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <span>{isAr ? 'جاري إرسال الطلب...' : 'Submitting...'}</span>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {isAr
                      ? type === 'deposit'
                        ? 'إرسال طلب الإيداع'
                        : type === 'withdraw'
                        ? 'إرسال طلب السحب'
                        : 'إرسال طلب استلام الجائزة'
                      : type === 'deposit'
                      ? 'Submit Deposit Request'
                      : type === 'withdraw'
                      ? 'Submit Withdraw Request'
                      : 'Submit Prize Claim'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
