import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Building2,
  Wallet as WalletIcon,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Company,
  CompensationAccount,
  CompensationRequest,
  Language,
  Referral,
  TabType,
  Transfer,
  Wallet,
  UserProfile,
  ThemeMode,
  AppBranding,
  AppNotification,
  SportsMatchFixture,
  SportsNewsItem,
  AiMatchAnalysis,
  NotificationCategory,
} from './types';
import { useTranslation } from './i18n';
import { vexApi } from './services/api';
import { recursiveLocalizeCompanies } from './utils/companyTranslator';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CompaniesTab } from './components/CompaniesTab';
import { WalletTab } from './components/WalletTab';
import { ReferralsTab } from './components/ReferralsTab';
import { TransfersTab } from './components/TransfersTab';
import { ActivityTab } from './components/ActivityTab';
import { AiSportsHubTab } from './components/AiSportsHubTab';
import { RegisterModal } from './components/RegisterModal';
import { CompensationRequestModal } from './components/CompensationRequestModal';
import { CompanyDetailsModal } from './components/CompanyDetailsModal';
import { PhoneVerificationModal } from './components/PhoneVerificationModal';
import { SecurityAndSettingsModal } from './components/SecurityAndSettingsModal';
import { SecurityAnalysisModal } from './components/SecurityAnalysisModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AiMatchAnalysisModal } from './components/AiMatchAnalysisModal';
import { ResponsibleGamingModal } from './components/ResponsibleGamingModal';
import { LegalTermsModal } from './components/LegalTermsModal';
import { Toast } from './components/Toast';

export default function App() {
  const { lang, setLang, t } = useTranslation();
  const [userId, setUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [themeMode] = useState<ThemeMode>('light');
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [displayCurrency, setDisplayCurrency] = useState<string>(() => {
    return localStorage.getItem('vex_display_currency') || 'USD';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg?: string) => {
    setToastMessage(msg || 'copied');
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  useEffect(() => {
    localStorage.setItem('vex_display_currency', displayCurrency);
  }, [displayCurrency]);

  // App Branding (Admin controllable)
  const [appBranding, setAppBranding] = useState<AppBranding>({
    appName: 'VEX Deals',
    tagline: 'منصة الولاء والتعويضات والتحليلات الرياضية الذكية',
    iconType: 'preset',
    presetIconId: 'emerald-shield',
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Core Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const localizedCompanies = recursiveLocalizeCompanies(companies, lang);
  const [accounts, setAccounts] = useState<CompensationAccount[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [requests, setRequests] = useState<CompensationRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Modals
  const [registerModalCompany, setRegisterModalCompany] = useState<Company | null>(null);
  const [detailsModalCompany, setDetailsModalCompany] = useState<Company | null>(null);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compModalCompanyId, setCompModalCompanyId] = useState<string | undefined>(undefined);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityAnalysisOpen, setSecurityAnalysisOpen] = useState(false);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [responsibleGamingOpen, setResponsibleGamingOpen] = useState(false);
  const [legalTermsOpen, setLegalTermsOpen] = useState(false);

  // AI Match Analysis & Fixtures
  const [fixtures, setFixtures] = useState<SportsMatchFixture[]>([]);
  const [sportsNews, setSportsNews] = useState<SportsNewsItem[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [selectedFixtureForAi, setSelectedFixtureForAi] = useState<SportsMatchFixture | null>(null);

  // Pre-selected IDs for tab transitions
  const [transferInitialCompanyId, setTransferInitialCompanyId] = useState<string | undefined>(undefined);
  const [referralInitialCompanyId, setReferralInitialCompanyId] = useState<string | undefined>(undefined);

  // PWA Install prompt state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // Initialize PWA install listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  // Initialize User ID (Light Mode Only)
  useEffect(() => {
    // Strictly enforce light mode
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('vex_theme');

    const uid = vexApi.getUserId();
    setUserId(uid);
  }, []);

  // Load app branding & notifications
  const loadBrandingAndNotifs = useCallback(async () => {
    try {
      const [branding, notifs] = await Promise.all([
        vexApi.getAppBranding(),
        vexApi.getNotifications(),
      ]);
      setAppBranding(branding);
      setNotifications(notifs);
    } catch (err) {
      console.warn('Error loading branding or notifications:', err);
    }
  }, []);

  // Load all user data and profile
  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setLoadingFixtures(true);
      const [comps, myAccs, myWallets, myReqs, myRefs, myTrans, profile, sportsFixtures, newsList] = await Promise.all([
        vexApi.getCompanies(),
        vexApi.getMyAccounts(),
        vexApi.getWallets(),
        vexApi.getCompensationRequests(),
        vexApi.getReferrals(),
        vexApi.getTransfers(),
        vexApi.getUserProfile(),
        vexApi.getSportsFixtures(),
        vexApi.getSportsNews(),
      ]);

      setCompanies(comps);
      setAccounts(myAccs);
      setWallets(myWallets);
      setRequests(myReqs);
      setReferrals(myRefs);
      setTransfers(myTrans);
      setUserProfile(profile);
      setFixtures(sportsFixtures);
      setSportsNews(newsList);
      setUserId(vexApi.getUserId());
    } catch (err) {
      console.error('Failed to load VEX data:', err);
    } finally {
      setIsLoadingData(false);
      setLoadingFixtures(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadBrandingAndNotifs();
  }, [loadData, loadBrandingAndNotifs]);

  // Real-time Socket.io Notification & Betting Sync for VPS / Docker with Nginx & Heartbeat
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to VEX Real-Time Socket Hub (ID:', socket.id, ')');
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected from Socket Hub:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('notification', (newNotif: AppNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      showToast(lang === 'ar' ? 'إشعار جديد في الوقت الحقيقي!' : 'New real-time alert!');
    });

    // Heartbeat ping interval to keep Nginx reverse proxy connection alive (every 25 seconds)
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 25000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [lang]);

  // Toggle Language
  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // Toggle Theme: No-op (Light mode enforced)
  const handleToggleTheme = () => {
    document.documentElement.classList.remove('dark');
  };

  // Quick action: Request Compensation for specific company
  const handleRequestComp = (companyId: string) => {
    setCompModalCompanyId(companyId);
    setCompModalOpen(true);
  };

  // Quick action: Transfer for specific company
  const handleGoToTransfer = (companyId: string) => {
    setTransferInitialCompanyId(companyId);
    setActiveTab('transfers');
  };

  // Quick action: Referrals for specific company
  const handleGoToReferral = (companyId: string) => {
    setReferralInitialCompanyId(companyId);
    setActiveTab('referrals');
  };

  // Admin Actions
  const handleUpdateBranding = async (newBranding: AppBranding) => {
    await vexApi.updateAppBranding(newBranding);
    setAppBranding(newBranding);
    if (newBranding.appName) {
      document.title = `${newBranding.appName}${newBranding.tagline ? ` - ${newBranding.tagline}` : ''}`;
    }
  };

  const handleUpdateCompany = async (company: Company) => {
    await vexApi.updateCompany(company);
    await loadData();
  };

  const handleToggleCompanyActive = async (companyId: string) => {
    const updated = await vexApi.toggleCompanyActive(companyId);
    await loadData();
    return updated;
  };

  const handleAddCompany = async (company: Company) => {
    await vexApi.addCompany(company);
    await loadData();
  };

  const handleSyncCompanies = async () => {
    vexApi.syncOfficialCompanies();
    await loadData();
  };

  const handleApproveCompensation = async (reqId: string) => {
    await vexApi.approveCompensationRequest(reqId);
    await Promise.all([loadData(), loadBrandingAndNotifs()]);
  };

  const handleRejectCompensation = async (reqId: string, reason: string) => {
    await vexApi.rejectCompensationRequest(reqId, reason);
    await Promise.all([loadData(), loadBrandingAndNotifs()]);
  };

  const handleBroadcastNotification = async (
    title: string,
    message: string,
    category: NotificationCategory
  ) => {
    const notif = await vexApi.broadcastNotification(title, message, category);
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleTriggerAiPrediction = async () => {
    const notif = await vexApi.triggerAiAgentBroadcast();
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleMarkNotificationRead = async (id: string) => {
    await vexApi.markNotificationAsRead(id);
    if (id === 'all') {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Native Mobile Header with Dynamic Branding, Unread Counter & Store Badges */}
      <Header
        userId={userId}
        userProfile={userProfile}
        lang={lang}
        themeMode={themeMode}
        appBranding={appBranding}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setNotifCenterOpen(true)}
        onOpenAdminDashboard={() => setAdminDashboardOpen(true)}
        onOpenResponsibleGaming={() => setResponsibleGamingOpen(true)}
        onToggleTheme={handleToggleTheme}
        onSelectLang={(newLang) => setLang(newLang)}
        onOpenPhoneModal={() => setPhoneModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSecurityAnalysis={() => setSecurityAnalysisOpen(true)}
        canInstallPwa={!!deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Top Quick Navigation Bar - Ultra Compact Icon-Only Bar */}
      <div className="sticky top-[48px] z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xs">
        <div className="max-w-xl mx-auto px-3 py-1.5 flex items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('companies')}
            title={lang === 'ar' ? 'الشركات' : lang === 'es' ? 'Casas' : lang === 'ru' ? 'Компании' : 'Companies'}
            className={`w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'companies'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'companies' ? 'text-white' : 'text-emerald-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('wallets')}
            title={lang === 'ar' ? 'المحفظة' : lang === 'es' ? 'Billetera' : lang === 'ru' ? 'Кошелек' : 'Wallets'}
            className={`w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'wallets' || activeTab === 'referrals'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <WalletIcon className={`w-4 h-4 ${activeTab === 'wallets' || activeTab === 'referrals' ? 'text-white' : 'text-emerald-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('ai-sports')}
            title={lang === 'ar' ? 'المباريات والتحليل' : lang === 'es' ? 'Partidos & IA' : lang === 'ru' ? 'Матчи и ИИ' : 'Matches & AI'}
            className={`w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'ai-sports'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'ai-sports' ? 'text-white' : 'text-emerald-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            title={lang === 'ar' ? 'التحويلات والسجل' : lang === 'es' ? 'Transferencias' : lang === 'ru' ? 'Переводы' : 'Transfers & Activity'}
            className={`relative w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'transfers' || activeTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <ArrowRightLeft className={`w-4 h-4 ${activeTab === 'transfers' || activeTab === 'activity' ? 'text-white' : 'text-emerald-400'}`} />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-1 ring-slate-900 animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full pb-20">
        <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-3.5 pb-12">
          {/* Sub-nav switch for Wallets & Referrals */}
          {(activeTab === 'wallets' || activeTab === 'referrals') && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl mb-3.5 select-none text-xs font-bold">
              <button
                onClick={() => setActiveTab('wallets')}
                className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'wallets'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ar' ? 'المحافظ والرصيد' : lang === 'es' ? 'Billeteras' : lang === 'ru' ? 'Кошельки' : 'Wallets'}</span>
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'referrals'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ar' ? 'نظام الإحالات (10%)' : lang === 'es' ? 'Referidos (10%)' : lang === 'ru' ? 'Рефералы (10%)' : 'Referrals (10%)'}</span>
              </button>
            </div>
          )}

          {/* Sub-nav switch for Transfers & Activity */}
          {(activeTab === 'transfers' || activeTab === 'activity') && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl mb-3.5 select-none text-xs font-bold">
              <button
                onClick={() => setActiveTab('transfers')}
                className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'transfers'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ar' ? 'تحويل الرصيد' : lang === 'es' ? 'Transferir' : lang === 'ru' ? 'Перевод средств' : 'Transfers'}</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'activity'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ar' ? 'النشاط وسجل الطلبات' : lang === 'es' ? 'Actividad y Solicitudes' : lang === 'ru' ? 'История и Запросы' : 'Activity & Requests'}</span>
              </button>
            </div>
          )}

          {activeTab === 'companies' && (
            <CompaniesTab
              companies={localizedCompanies}
              accounts={accounts}
              branding={appBranding}
              onOpenRegister={(company) => setRegisterModalCompany(company)}
              onOpenDetails={(company) => setDetailsModalCompany(company)}
              onRequestComp={handleRequestComp}
              lang={lang}
              isLoading={isLoadingData}
              onCopyToast={showToast}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletTab
              wallets={wallets}
              companies={localizedCompanies}
              onGoToTransfer={handleGoToTransfer}
              onGoToReferral={handleGoToReferral}
              onRequestComp={handleRequestComp}
              lang={lang}
              isLoading={isLoadingData}
              displayCurrency={displayCurrency}
              onCopyToast={showToast}
            />
          )}

          {activeTab === 'ai-sports' && (
            <AiSportsHubTab
              fixtures={fixtures}
              news={sportsNews}
              loadingFixtures={loadingFixtures}
              onAnalyzeMatch={(fixture) => setSelectedFixtureForAi(fixture)}
              onTriggerAgentBroadcast={handleTriggerAiPrediction}
              lang={lang}
            />
          )}

          {activeTab === 'referrals' && (
            <ReferralsTab
              companies={localizedCompanies}
              referrals={referrals}
              selectedCompanyId={referralInitialCompanyId}
              onRefresh={loadData}
              lang={lang}
              onCopyToast={showToast}
            />
          )}

          {activeTab === 'transfers' && (
            <TransfersTab
              wallets={wallets}
              companies={localizedCompanies}
              transfers={transfers}
              initialCompanyId={transferInitialCompanyId}
              userProfile={userProfile}
              onRefresh={loadData}
              onOpenPhoneModal={() => setPhoneModalOpen(true)}
              lang={lang}
              displayCurrency={displayCurrency}
              isLoading={isLoadingData}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab
              accounts={accounts}
              requests={requests}
              onOpenNewRequest={() => {
                setCompModalCompanyId(undefined);
                setCompModalOpen(true);
              }}
              lang={lang}
              isLoading={isLoadingData}
              onCopyToast={showToast}
            />
          )}

          {/* Footer Legal & Store Compliance Links */}
          <div className="pt-5 pb-2 text-center text-xs text-slate-400 space-y-1.5 border-t border-slate-200 mt-6">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setResponsibleGamingOpen(true)}
                className="hover:text-emerald-600 transition-colors font-semibold"
              >
                {lang === 'ar' ? 'اللعب المسؤول (+18)' : 'Responsible (+18)'}
              </button>
              <span>•</span>
              <button
                onClick={() => setLegalTermsOpen(true)}
                className="hover:text-emerald-600 transition-colors font-semibold"
              >
                {lang === 'ar' ? 'الشروط والخصوصية' : 'Terms'}
              </button>
              <span>•</span>
              <button
                onClick={() => setSecurityAnalysisOpen(true)}
                className="hover:text-emerald-600 transition-colors font-semibold"
              >
                {lang === 'ar' ? 'الأمان' : 'Security'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {appBranding?.appName || 'VEX Deals'} © {new Date().getFullYear()}
            </p>
          </div>
        </main>
      </div>

      {/* Native Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        lang={lang}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* 2-Step Account Registration Modal */}
      <RegisterModal
        company={registerModalCompany}
        isOpen={!!registerModalCompany}
        onClose={() => setRegisterModalCompany(null)}
        onSuccess={() => {
          loadData();
          setActiveTab('activity');
        }}
        lang={lang}
        onCopyToast={showToast}
      />

      {/* Company Details & Perks Modal */}
      <CompanyDetailsModal
        company={detailsModalCompany}
        isOpen={!!detailsModalCompany}
        onClose={() => setDetailsModalCompany(null)}
        onRegisterClick={(comp) => {
          setDetailsModalCompany(null);
          setRegisterModalCompany(comp);
        }}
        lang={lang}
        onCopyToast={showToast}
      />

      {/* Compensation Request Modal */}
      <CompensationRequestModal
        accounts={accounts}
        initialCompanyId={compModalCompanyId}
        isOpen={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        onSuccess={() => {
          loadData();
          setActiveTab('activity');
        }}
        lang={lang}
      />

      {/* Real Phone Number Linking & OTP Modal */}
      <PhoneVerificationModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        userProfile={userProfile}
        onSuccess={loadData}
        lang={lang}
      />

      {/* Security, PIN & Apple Guideline 5.1.1 Account Purge Modal */}
      <SecurityAndSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userProfile={userProfile}
        onOpenPhoneModal={() => setPhoneModalOpen(true)}
        onAccountDeleted={() => {
          loadData();
          setActiveTab('companies');
        }}
        lang={lang}
        canInstallPwa={Boolean(deferredInstallPrompt)}
        onInstallPwa={handleInstallPwa}
        displayCurrency={displayCurrency}
        onDisplayCurrencyChange={setDisplayCurrency}
      />

      {/* Security Analysis & Vulnerability Audit Modal */}
      <SecurityAnalysisModal
        isOpen={securityAnalysisOpen}
        onClose={() => setSecurityAnalysisOpen(false)}
        lang={lang}
      />

      {/* Notification Center & AI Push Notifications */}
      <NotificationCenterModal
        isOpen={notifCenterOpen}
        onClose={() => setNotifCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        lang={lang}
      />

      {/* Admin Dashboard Hub (Custom Branding, Approvals, News, Store Compliance) */}
      <AdminDashboardModal
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
        appBranding={appBranding}
        branding={appBranding}
        accounts={accounts}
        wallets={wallets}
        onUpdateBranding={handleUpdateBranding}
        requests={requests}
        onApproveRequest={handleApproveCompensation}
        onRejectRequest={handleRejectCompensation}
        companies={companies}
        onUpdateCompany={handleUpdateCompany}
        onToggleCompanyActive={handleToggleCompanyActive}
        onAddCompany={handleAddCompany}
        onSyncCompanies={handleSyncCompanies}
        onBroadcastNotification={handleBroadcastNotification}
        onTriggerAiBroadcast={handleTriggerAiPrediction}
        onTriggerAiPrediction={handleTriggerAiPrediction}
        notifications={notifications}
        lang={lang}
        onCopyToast={showToast}
      />

      {/* AI Match Analysis Modal (Gemini 3.8 Flash Tactical Prediction) */}
      <AiMatchAnalysisModal
        fixture={selectedFixtureForAi}
        isOpen={!!selectedFixtureForAi}
        onClose={() => setSelectedFixtureForAi(null)}
        lang={lang}
      />

      {/* Responsible Gaming & Age Gate (+18) Modal */}
      <ResponsibleGamingModal
        isOpen={responsibleGamingOpen}
        onClose={() => setResponsibleGamingOpen(false)}
        lang={lang}
      />

      {/* Legal Terms & Privacy Policy (Apple Guideline 5.1.1 & Google Play) */}
      <LegalTermsModal
        isOpen={legalTermsOpen}
        onClose={() => setLegalTermsOpen(false)}
        lang={lang}
      />

      {/* Global Copy Success Toast Notification */}
      <Toast message={toastMessage} lang={lang} />
    </div>
  );
}
