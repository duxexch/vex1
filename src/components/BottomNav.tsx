import React from 'react';
import { Language, TabType } from '../types';
import { Building2, Wallet, TrendingUp, ArrowRightLeft } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  lang: Language;
  pendingRequestsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  lang,
  pendingRequestsCount = 0,
}) => {
  const getTooltip = (id: TabType) => {
    switch (id) {
      case 'companies':
        return lang === 'ar' ? 'الشركات' : lang === 'es' ? 'Casas' : lang === 'ru' ? 'Компании' : 'Companies';
      case 'wallets':
        return lang === 'ar' ? 'المحفظة' : lang === 'es' ? 'Billetera' : lang === 'ru' ? 'Кошелек' : 'Wallets';
      case 'ai-sports':
        return lang === 'ar' ? 'المباريات' : lang === 'es' ? 'Partidos' : lang === 'ru' ? 'Матчи и ИИ' : 'Sports';
      case 'transfers':
        return lang === 'ar' ? 'التحويلات' : lang === 'es' ? 'Transferencias' : lang === 'ru' ? 'Переводы' : 'Transfers';
      default:
        return '';
    }
  };

  const items = [
    {
      id: 'companies' as TabType,
      tooltip: getTooltip('companies'),
      icon: Building2,
      isActive: activeTab === 'companies',
    },
    {
      id: 'wallets' as TabType,
      tooltip: getTooltip('wallets'),
      icon: Wallet,
      isActive: activeTab === 'wallets' || activeTab === 'referrals',
    },
    {
      id: 'ai-sports' as TabType,
      tooltip: getTooltip('ai-sports'),
      icon: TrendingUp,
      isActive: activeTab === 'ai-sports',
    },
    {
      id: 'transfers' as TabType,
      tooltip: getTooltip('transfers'),
      icon: ArrowRightLeft,
      isActive: activeTab === 'transfers' || activeTab === 'activity',
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
  ];

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 w-full flex justify-around items-center select-none py-2 px-2"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div className="w-full flex justify-around items-center max-w-2xl mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              id={`nav-icon-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              title={item.tooltip}
              aria-label={item.tooltip}
              className={`relative flex items-center justify-center w-14 h-12 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                active
                  ? 'text-emerald-700 bg-emerald-50 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform duration-150 ${
                  active ? 'stroke-[2.5] scale-110 text-emerald-700' : 'stroke-[1.9]'
                }`}
              />

              {/* Active Indicator Bar */}
              {active && (
                <span className="absolute bottom-1 w-5 h-1 bg-emerald-600 rounded-full" />
              )}

              {/* Notification Badge */}
              {item.badge && (
                <span className="absolute top-1 right-2 min-w-[16px] h-[16px] px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
