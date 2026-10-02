import { useState, useEffect, useCallback, lazy, Suspense, Component, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Socket } from 'socket.io-client';
import {
  Building2,
  Wallet as WalletIcon,
  TrendingUp,
  ArrowRightLeft,
  ShieldCheck,
  Trophy,
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
import { detectUserRegionalCurrency } from './utils/currency';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CompaniesTab } from './components/CompaniesTab';
const WalletTab = lazy(() => import('./components/WalletTab').then(m => ({ default: m.WalletTab })));
const ReferralsTab = lazy(() => import('./components/ReferralsTab').then(m => ({ default: m.ReferralsTab })));
const TransfersTab = lazy(() => import('./components/TransfersTab').then(m => ({ default: m.TransfersTab })));
const ActivityTab = lazy(() => import('./components/ActivityTab').then(m => ({ default: m.ActivityTab })));
const AiSportsHubTab = lazy(() => import('./components/AiSportsHubTab').then(m => ({ default: m.AiSportsHubTab })));
const UnluckyWallTab = lazy(() => import('./components/UnluckyWallTab').then(m => ({ default: m.UnluckyWallTab })));
const LotteryTab = lazy(() => import('./components/LotteryTab').then(m => ({ default: m.LotteryTab })));
const RegisterModal = lazy(() => import('./components/RegisterModal').then(m => ({ default: m.RegisterModal })));
const CompensationRequestModal = lazy(() =>
  import('./components/CompensationRequestModal').then(m => ({ default: m.CompensationRequestModal })),
);
const CompanyDetailsModal = lazy(() =>
  import('./components/CompanyDetailsModal').then(m => ({ default: m.CompanyDetailsModal })),
);
const PhoneVerificationModal = lazy(() =>
  import('./components/PhoneVerificationModal').then(m => ({ default: m.PhoneVerificationModal })),
);
const SecurityAndSettingsModal = lazy(() =>
  import('./components/SecurityAndSettingsModal').then(m => ({ default: m.SecurityAndSettingsModal })),
);
const SecurityAnalysisModal = lazy(() =>
  import('./components/SecurityAnalysisModal').then(m => ({ default: m.SecurityAnalysisModal })),
);
const NotificationCenterModal = lazy(() =>
  import('./components/NotificationCenterModal').then(m => ({ default: m.NotificationCenterModal })),
);
const AdminDashboardModal = lazy(() =>
  import('./components/AdminDashboardModal').then(m => ({ default: m.AdminDashboardModal })),
);
const AiMatchAnalysisModal = lazy(() =>
  import('./components/AiMatchAnalysisModal').then(m => ({ default: m.AiMatchAnalysisModal })),
);
const ResponsibleGamingModal = lazy(() =>
  import('./components/ResponsibleGamingModal').then(m => ({ default: m.ResponsibleGamingModal })),
);
const LegalTermsModal = lazy(() => import('./components/LegalTermsModal').then(m => ({ default: m.LegalTermsModal })));
const DirectDepositUnfreezeModal = lazy(() =>
  import('./components/DirectDepositUnfreezeModal').then(m => ({ default: m.DirectDepositUnfreezeModal })),
);
const FinancialRequestModal = lazy(() =>
  import('./components/FinancialRequestModal').then(m => ({ default: m.FinancialRequestModal })),
);
import { Toast } from './components/Toast';
import { NotificationToast } from './components/NotificationToast';
import { playNotificationSound, vibrateNotificationPattern } from './services/notificationSound';
const IosInstallModal = lazy(() => import('./components/IosInstallModal').then(m => ({ default: m.IosInstallModal })));
import { GoldenHourBanner } from './components/GoldenHourBanner';

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  declare props: { children: ReactNode; fallback: ReactNode };
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Section crashed:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const ALL_TABS: TabType[] = ['companies', 'wallets', 'transfers', 'referrals', 'activity', 'ai-sports', 'unlucky-wall', 'lottery'];

const tabFromUrl = (): TabType => {
  try {
    const p = new URLSearchParams(window.location.search).get('tab');
    if (p && (ALL_TABS as string[]).includes(p)) return p as TabType;
  } catch {
  }
  return 'companies';
};

export default function App() {
  const { lang, setLang, t } = useTranslation();

  // Idle-preload lazy tab chunks so switching sections never hits a missing/stale chunk
  useEffect(() => {
    const preload = () => {
      const noop = () => {};
      void import('./components/ActivityTab').catch(noop);
      void import('./components/AiSportsHubTab').catch(noop);
      void import('./components/UnluckyWallTab').catch(noop);
      void import('./components/LotteryTab').catch(noop);
    };
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(preload, { timeout: 8000 });
    else setTimeout(preload, 6000);
  }, []);
  const [userId, setUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [themeMode] = useState<ThemeMode>('light');
  const [activeTab, setActiveTabState] = useState<TabType>(() => tabFromUrl());
  const setActiveTab = (tab: TabType) => {
    const safeTab = (ALL_TABS as string[]).includes(tab) ? tab : 'companies';
    setActiveTabState(safeTab);
    try {
      const url = new URL(window.location.href);
      if (safeTab === 'companies') url.searchParams.delete('tab');
      else url.searchParams.set('tab', safeTab);
      const target = url.pathname + url.search + url.hash;
      const current = window.location.pathname + window.location.search + window.location.hash;
      if (target !== current) window.history.pushState({ tab: safeTab }, '', target);
    } catch {
    }
  };

  useEffect(() => {
    const syncTabFromUrl = () => setActiveTabState(tabFromUrl());
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);
  const [displayCurrency, setDisplayCurrency] = useState<string>(() => {
    return localStorage.getItem('vex_display_currency') || detectUserRegionalCurrency();
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
  const [notifToast, setNotifToast] = useState<AppNotification | null>(null);

  // OS-level notification when the tab is hidden/backgrounded (SW-first for Android Chrome).
  // FCM-originated messages are skipped — the service worker already displays those.
  const showNativeNotification = useCallback(async (notif: AppNotification) => {
    if (typeof document !== 'undefined' && !document.hidden) return;
    if (notif.data?.source === 'fcm') return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const title = (notif.translations && notif.translations[lang]?.title) || notif.title;
    const body = (notif.translations && notif.translations[lang]?.message) || notif.message;
    try {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: notif.id,
          lang,
          dir: lang === 'ar' ? 'rtl' : 'ltr',
        });
        return;
      }
    } catch {
      /* fall through to page-level Notification */
    }
    try {
      new Notification(title, { body, icon: '/icon-192.svg', tag: notif.id });
    } catch {
      /* unsupported (e.g. Android Chrome requires SW) */
    }
  }, [lang]);

  // Single pipeline for every incoming notification: dedupe → list → rich toast →
  // sound → vibration → OS notification when tab is hidden.
  const presentNotification = useCallback(
    (notif: AppNotification) => {
      if (!notif || !notif.id) return;
      setNotifications((prev) =>
        prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]
      );
      setNotifToast(notif);
      const urgent =
        notif.category === 'security' ||
        notif.category === 'compensation' ||
        notif.category === 'lottery';
      playNotificationSound(urgent ? 'urgent' : 'default');
      vibrateNotificationPattern();
      void showNativeNotification(notif);
    },
    [showNativeNotification]
  );

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
  const [depositUnfreezeModalOpen, setDepositUnfreezeModalOpen] = useState(false);
  const [financialRequest, setFinancialRequest] = useState<{
    type: 'deposit' | 'withdraw' | 'prize_claim';
    prefill?: { ticket_id?: string; draw_id?: string; amount?: number; company_id?: string; company_name?: string };
  } | null>(null);

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
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [iosInstallModalOpen, setIosInstallModalOpen] = useState<boolean>(false);
  const [iosBannerDismissed, setIosBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('vex_ios_banner_dismissed') === 'true';
  });

  const dismissIosBanner = () => {
    setIosBannerDismissed(true);
    localStorage.setItem('vex_ios_banner_dismissed', 'true');
  };

  const isIosDevice = () => {
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  };

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
    if (isIosDevice() && !isStandalone) {
      setIosInstallModalOpen(true);
      return;
    }
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredInstallPrompt(null);
      }
    } else {
      showToast(lang === 'ar' ? 'افتح قائمة المتصفح واختر "إضافة إلى الشاشة الرئيسية"' : 'Open browser menu and select "Add to Home Screen"');
    }
  };

  // Initialize User ID, Standalone detection & Admin Route
  useEffect(() => {
    // Strictly enforce light mode
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('vex_theme');

    const uid = vexApi.getUserId();
    setUserId(uid);

    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;
      setIsStandalone(standalone);

      // Check if URL requests admin (e.g. /admin, #admin, ?admin=true)
      const checkAdminRoute = () => {
        const isHashAdmin = window.location.hash === '#admin';
        const isPathAdmin = window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin');
        const isQueryAdmin = window.location.search.includes('admin=true');
        if (isHashAdmin || isPathAdmin || isQueryAdmin) {
          setAdminDashboardOpen(true);
        } else {
          setAdminDashboardOpen(false);
        }
      };
      checkAdminRoute();
      window.addEventListener('hashchange', checkAdminRoute);
      window.addEventListener('popstate', checkAdminRoute);
      return () => {
        window.removeEventListener('hashchange', checkAdminRoute);
        window.removeEventListener('popstate', checkAdminRoute);
      };
    }
  }, []);

  // Initialize FCM Push Notifications (deferred off the critical path: idle callback)
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;
    let idleId: number | undefined;
    let timerId: number | undefined;
    const start = () => {
      if (disposed) return;
      import('./services/firebaseClient')
        .then(({ requestFCMToken, onForegroundMessage }) => {
          if (disposed) return;
          requestFCMToken().then((token) => {
            if (token) {
              console.log('FCM Token registered:', token);
            }
          });
          unsubscribe = onForegroundMessage((payload) => {
            console.log('Foreground push notification received:', payload);
            const title = payload.notification?.title || (lang === 'ar' ? 'تحديث طلب التعويض' : 'Compensation Status Update');
            const body = payload.notification?.body || '';
            presentNotification({
              id: `fcm-${Date.now()}`,
              title,
              message: body,
              category: (payload.data?.category as NotificationCategory) || 'compensation',
              timestamp: new Date().toISOString(),
              read: false,
              data: { ...(payload.data || {}), source: 'fcm' },
            });
          });
        })
        .catch(() => {});
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(start, { timeout: 5000 });
    } else {
      timerId = window.setTimeout(start, 4000);
    }

    return () => {
      disposed = true;
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [lang, presentNotification]);

  const handleCloseAdmin = () => {
    setAdminDashboardOpen(false);
    if (window.location.hash === '#admin') {
      window.history.pushState({}, '', window.location.pathname + window.location.search);
    }
    if (window.location.pathname === '/admin' || window.location.pathname.endsWith('/admin')) {
      window.history.pushState({}, '', '/' + window.location.search);
    }
    if (window.location.search.includes('admin=true')) {
      const u = new URL(window.location.href);
      u.searchParams.delete('admin');
      window.history.pushState({}, '', u.pathname + u.search);
    }
  };

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

      // Self-apply any admin-approved financial requests (server once-gate),
      // then refresh wallets only when something actually changed.
      vexApi
        .applyApprovedFinancialRequests()
        .then((applied) => {
          if (applied > 0) {
            vexApi.getWallets().then(setWallets).catch(() => undefined);
          }
        })
        .catch(() => undefined);
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
    vexApi.logUserInteraction('session_start');
  }, [loadData, loadBrandingAndNotifs]);

  // Refresh news when the user opens the news sub-tab (server updates every few minutes)
  const refreshNews = useCallback(() => {
    vexApi
      .getSportsNews()
      .then(setSportsNews)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeTab) {
      vexApi.logUserInteraction(`tab_${activeTab}`);
    }
  }, [activeTab]);

  // Real-time Socket.io Notification & Betting Sync for VPS / Docker with Nginx & Heartbeat
  // Deferred 3s after mount so it never competes with first paint (Lighthouse TBT).
  useEffect(() => {
    let socket: Socket | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | undefined;
    let disposed = false;
    const timer = window.setTimeout(() => {
      import('socket.io-client')
        .then(({ io }) => {
          if (disposed) return;
          socket = io({
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 15000,
          });

          socket.on('connect', () => {
            console.log('⚡ Connected to VEX Real-Time Socket Hub (ID:', socket?.id, ')');
          });

          socket.on('disconnect', (reason) => {
            console.warn('⚠️ Disconnected from Socket Hub:', reason);
          });

          socket.on('connect_error', () => {
            // Graceful handling of transient proxy timeouts
          });

          socket.on('notification', (newNotif: AppNotification) => {
            presentNotification(newNotif);
          });

          // Bridge Telegram verification events to the DOM: PhoneVerificationModal
          // listens on window events, while the server broadcasts over socket.io.
          socket.on('telegram_contact_received', (payload: any) => {
            window.dispatchEvent(new CustomEvent('telegram_contact_received', { detail: payload }));
          });

          socket.on('phone_verified', (payload: any) => {
            window.dispatchEvent(new CustomEvent('phone_verified', { detail: payload }));
          });

          // Heartbeat ping interval to keep Nginx reverse proxy connection alive (every 25 seconds)
          heartbeatInterval = setInterval(() => {
            if (socket?.connected) {
              socket.emit('heartbeat', { timestamp: Date.now() });
            }
          }, 25000);
        })
        .catch(() => {});
    }, 3000);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      socket?.disconnect();
    };
  }, [lang, presentNotification]);

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

  const handleBulkApproveCompensation = async (reqIds: string[]) => {
    await vexApi.bulkApproveCompensationRequests(reqIds);
    await Promise.all([loadData(), loadBrandingAndNotifs()]);
  };

  const handleRejectCompensation = async (reqId: string, reason: string) => {
    await vexApi.rejectCompensationRequest(reqId, reason);
    await Promise.all([loadData(), loadBrandingAndNotifs()]);
  };

  const handleBulkRejectCompensation = async (reqIds: string[], reason: string) => {
    await vexApi.bulkRejectCompensationRequests(reqIds, reason);
    await Promise.all([loadData(), loadBrandingAndNotifs()]);
  };

  const handleBroadcastNotification = async (
    title: string,
    message: string,
    category: NotificationCategory
  ) => {
    const notif = await vexApi.broadcastNotification(title, message, category);
    presentNotification(notif);
  };

  const handleTriggerAiPrediction = async () => {
    const notif = await vexApi.triggerAiAgentBroadcast();
    presentNotification(notif);
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

  // Unread badge in the browser tab title — restores the plain title at zero
  useEffect(() => {
    const stripped = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = unreadNotificationsCount > 0
      ? `(${Math.min(unreadNotificationsCount, 99)}) ${stripped}`
      : stripped;
  }, [unreadNotificationsCount]);

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <GoldenHourBanner lang={lang === 'ar' ? 'ar' : 'en'} />

      {/* Native Mobile Header with Dynamic Branding, Unread Counter, Desktop Nav & Badges */}
      <Header
        userId={userId}
        userProfile={userProfile}
        lang={lang}
        themeMode={themeMode}
        appBranding={appBranding}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setNotifCenterOpen(true)}
        onOpenResponsibleGaming={() => setResponsibleGamingOpen(true)}
        onToggleTheme={handleToggleTheme}
        onSelectLang={(newLang) => setLang(newLang)}
        onOpenPhoneModal={() => setPhoneModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSecurityAnalysis={() => setSecurityAnalysisOpen(true)}
        canInstallPwa={!!deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
        isStandalone={isStandalone}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Top Quick Navigation Bar - Mobile-Only (hidden on md+ where Header Nav is active) */}
      <div className="md:hidden sticky top-[48px] z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-center gap-3">
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
            title={lang === 'ar' ? 'المباريات والتحليل' : lang === 'es' ? 'Partidos & IA' : lang === 'ru' ? 'Мاتчи и ИИ' : 'Matches & AI'}
            className={`w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'ai-sports'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'ai-sports' ? 'text-white' : 'text-emerald-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('lottery')}
            title={lang === 'ar' ? 'اليانصيب والجوائز' : lang === 'es' ? 'Lotería' : lang === 'ru' ? 'Лотерея' : 'Lottery'}
            className={`w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'lottery'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Trophy className={`w-4 h-4 ${activeTab === 'lottery' ? 'text-white' : 'text-amber-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('unlucky-wall')}
            title={lang === 'ar' ? 'مجتمع المنحوسين' : 'Unlucky Wall'}
            className={`w-9 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'unlucky-wall'
                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <svg
              className={`w-4 h-4 ${activeTab === 'unlucky-wall' ? 'text-white' : 'text-emerald-400'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
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

      {/* iOS Install Banner */}
      {isIosDevice() && !isStandalone && !iosBannerDismissed && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md z-40 sticky top-12 select-none">
          <div className="flex items-center gap-2">
            <span className="text-base">📱</span>
            <div>
              <span className="font-bold block">
                {lang === 'ar' ? 'تثبيت التطبيق على آيفون (Safari)' : 'Install App on iPhone (Safari)'}
              </span>
              <span className="text-[11px] text-blue-100">
                {lang === 'ar' ? 'اضغط زر المشاركة (Share) ثم "إضافة إلى الشاشة الرئيسية"' : 'Tap Share button then "Add to Home Screen"'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIosInstallModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'الطريقة' : 'Guide'}
            </button>
            <button
              onClick={dismissIosBanner}
              className="text-white/80 hover:text-white p-1 cursor-pointer font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Fully Responsive Max Width */}
      <div className="flex-1 w-full pb-20 md:pb-12">
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-12">
          {/* Sub-nav switch for Wallets & Referrals */}
          {(activeTab === 'wallets' || activeTab === 'referrals') && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl mb-4 select-none text-xs font-bold max-w-md mx-auto">
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
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl mb-4 select-none text-xs font-bold max-w-md mx-auto">
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

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <ErrorBoundary
              fallback={
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto mt-6">
                  <p className="font-bold text-slate-900 mb-1">
                    {lang === 'ar' ? 'تعذّر تحميل هذا القسم' : 'Could not load this section'}
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    {lang === 'ar' ? 'انتقل إلى قسم آخر أو أعد تحميل الصفحة' : 'Switch to another section or reload the page'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold"
                    >
                      {lang === 'ar' ? 'إعادة التحميل' : 'Reload'}
                    </button>
                    <button
                      onClick={() => setActiveTab('companies')}
                      className="border border-slate-300 px-5 py-2 rounded-xl text-sm font-semibold text-slate-700"
                    >
                      {lang === 'ar' ? 'الشركات' : 'Companies'}
                    </button>
                  </div>
                </div>
              }
            >
            <Suspense fallback={null}>
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
                accounts={accounts}
                userProfile={userProfile}
                onGoToTransfer={handleGoToTransfer}
                onGoToReferral={handleGoToReferral}
                onRequestComp={handleRequestComp}
                onOpenDepositUnfreeze={() => setDepositUnfreezeModalOpen(true)}
                onOpenFinancialRequest={(type) => setFinancialRequest({ type })}
                onOpenPhoneModal={() => setPhoneModalOpen(true)}
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
                onRefreshNews={refreshNews}
                lang={lang}
                userId={userId}
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

            {activeTab === 'unlucky-wall' && (
              <UnluckyWallTab lang={lang} />
            )}

            {activeTab === 'lottery' && (
              <LotteryTab
                lang={lang}
                userId={userId}
                wallets={wallets}
                onRefreshWallets={loadData}
                onCopyToast={showToast}
                onOpenFinancialRequest={(type, prefill) => setFinancialRequest({ type, prefill })}
              />
            )}
            </Suspense>
            </ErrorBoundary>
          </motion.div>

          {/* Footer Legal & Store Compliance Links */}
          <div className="pt-5 pb-2 text-center text-xs text-slate-600 space-y-1.5 border-t border-slate-200 mt-6">
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
            <p className="text-xs text-slate-500">
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

      <ErrorBoundary fallback={null}>
      {/* 2-Step Account Registration Modal */}
      {!!registerModalCompany && (
      <Suspense fallback={null}>
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
      </Suspense>
      )}

      {/* Company Details & Perks Modal */}
      {!!detailsModalCompany && (
      <Suspense fallback={null}>
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
      </Suspense>
      )}

      {/* Compensation Request Modal */}
      {compModalOpen && (
      <Suspense fallback={null}>
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
      </Suspense>
      )}

      {/* Real Phone Number Linking & OTP Modal */}
      {phoneModalOpen && (
      <Suspense fallback={null}>
      <PhoneVerificationModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        userProfile={userProfile}
        onSuccess={loadData}
        lang={lang}
      />
      </Suspense>
      )}

      {/* Security, PIN & Apple Guideline 5.1.1 Account Purge Modal */}
      {settingsOpen && (
      <Suspense fallback={null}>
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
      </Suspense>
      )}

      {/* Security Analysis & Vulnerability Audit Modal */}
      {securityAnalysisOpen && (
      <Suspense fallback={null}>
      <SecurityAnalysisModal
        isOpen={securityAnalysisOpen}
        onClose={() => setSecurityAnalysisOpen(false)}
        lang={lang}
      />
      </Suspense>
      )}

      {/* Notification Center & AI Push Notifications */}
      {notifCenterOpen && (
      <Suspense fallback={null}>
      <NotificationCenterModal
        isOpen={notifCenterOpen}
        onClose={() => setNotifCenterOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={() => handleMarkNotificationRead('all')}
        onSelectNotificationAction={(notif) => {
          if (notif.data?.targetTab) {
            setActiveTab(notif.data.targetTab as any);
            setNotifCenterOpen(false);
          }
        }}
        lang={lang}
      />
      </Suspense>
      )}

      {/* Admin Dashboard Hub (Custom Branding, Approvals, News, Store Compliance) */}
      {adminDashboardOpen && (
      <Suspense fallback={null}>
      <AdminDashboardModal
        isOpen={adminDashboardOpen}
        onClose={handleCloseAdmin}
        appBranding={appBranding}
        branding={appBranding}
        accounts={accounts}
        wallets={wallets}
        onUpdateBranding={handleUpdateBranding}
        requests={requests}
        onApproveRequest={handleApproveCompensation}
        onBulkApproveRequests={handleBulkApproveCompensation}
        onRejectRequest={handleRejectCompensation}
        onBulkRejectRequests={handleBulkRejectCompensation}
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
        onLangChange={setLang}
        onCopyToast={showToast}
        isStandalone={
          typeof window !== 'undefined' &&
          (window.location.pathname === '/admin' ||
            window.location.pathname.endsWith('/admin') ||
            window.location.hash === '#admin' ||
            window.location.search.includes('admin=true'))
        }
      />
      </Suspense>
      )}

      {/* AI Match Analysis Modal (Gemini 3.8 Flash Tactical Prediction) */}
      {!!selectedFixtureForAi && (
      <Suspense fallback={null}>
      <AiMatchAnalysisModal
        fixture={selectedFixtureForAi}
        isOpen={!!selectedFixtureForAi}
        onClose={() => setSelectedFixtureForAi(null)}
        lang={lang}
      />
      </Suspense>
      )}

      {/* Responsible Gaming & Age Gate (+18) Modal */}
      {responsibleGamingOpen && (
      <Suspense fallback={null}>
      <ResponsibleGamingModal
        isOpen={responsibleGamingOpen}
        onClose={() => setResponsibleGamingOpen(false)}
        lang={lang}
      />
      </Suspense>
      )}

      {/* Legal Terms & Privacy Policy (Apple Guideline 5.1.1 & Google Play) */}
      {legalTermsOpen && (
      <Suspense fallback={null}>
      <LegalTermsModal
        isOpen={legalTermsOpen}
        onClose={() => setLegalTermsOpen(false)}
        lang={lang}
      />
      </Suspense>
      )}

      {/* Direct Deposit Unfreeze Modal (1:1 matching deposit unfreeze request) */}
      {depositUnfreezeModalOpen && (
      <Suspense fallback={null}>
      <DirectDepositUnfreezeModal
        isOpen={depositUnfreezeModalOpen}
        onClose={() => setDepositUnfreezeModalOpen(false)}
        wallets={wallets}
        companies={localizedCompanies}
        lang={lang}
        displayCurrency={displayCurrency}
        onSuccess={loadData}
        showToast={showToast}
      />
      </Suspense>
      )}

      {/* Financial Request Modal (deposit / withdraw / manual prize claim) */}
      {financialRequest && (
      <Suspense fallback={null}>
      <FinancialRequestModal
        isOpen={!!financialRequest}
        type={financialRequest.type}
        prefill={financialRequest.prefill}
        onClose={() => setFinancialRequest(null)}
        wallets={wallets}
        companies={localizedCompanies}
        lang={lang}
        displayCurrency={displayCurrency}
        onSuccess={loadData}
        showToast={showToast}
      />
      </Suspense>
      )}

      {/* iOS Safari Install Guide Modal */}
      {iosInstallModalOpen && (
      <Suspense fallback={null}>
      <IosInstallModal
        isOpen={iosInstallModalOpen}
        onClose={() => setIosInstallModalOpen(false)}
        lang={lang}
      />
      </Suspense>
      )}
      </ErrorBoundary>

      {/* Global Copy Success Toast Notification */}
      <Toast message={toastMessage} lang={lang} />

      {/* Rich real-time notification banner (top) */}
      <NotificationToast
        notification={notifToast}
        lang={lang}
        onOpen={(n) => {
          if (!n.read) void handleMarkNotificationRead(n.id);
          setNotifCenterOpen(true);
        }}
        onClose={() => setNotifToast(null)}
      />

      {/* WhatsApp Floating Button */}
      {appBranding.whatsappEnabled && appBranding.whatsappNumber && (
        <a
          href={`https://wa.me/${appBranding.whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/30 flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="WhatsApp"
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
}
