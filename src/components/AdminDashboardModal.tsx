import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Company,
  CompanyApiConfig,
  CompanyApiIntegrationType,
  CompensationRequest,
  CompensationAccount,
  Wallet,
  AppBranding,
  Language,
  PLATFORM_DOMAIN,
  AppNotification,
} from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import { CompanyApiIntegration } from './CompanyApiIntegration';
import { IntegrationTester } from './IntegrationTester';
import { IntegrationHealthDashboard } from './IntegrationHealthDashboard';
import { COMPANY_THEMES, getCompanyTheme } from '../data/companyThemes';
import { autoTranslateCompany } from '../utils/companyTranslator';
import { vexApi } from '../services/api';
import { generateDefaultCompanyApiMethods } from '../data/defaultApiMethods';
import {
  GLOBAL_PROJECT_ASO,
  PRECOMPUTED_COMPANY_ASO,
  generateCompanyAsoSuite,
  CompanyAsoSuite,
} from '../data/asoStrategy';
import {
  X,
  Check,
  CheckCircle2,
  Sliders,
  Send,
  Upload,
  Palette,
  ShieldCheck,
  Bot,
  Sparkles,
  Search,
  Copy,
  ExternalLink,
  Download,
  Building2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit3,
  FileText,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
  Globe,
  Smartphone,
  Laptop,
  Image as ImageIcon,
  FileCode,
  Code,
  Share2,
  Trash2,
  Eye,
  CheckCheck,
  Maximize2,
  SunMedium,
  Moon,
  Monitor,
  CheckCircle,
  Save,
  Cpu,
  Key,
  Lock,
  Server,
  Activity,
  Radio,
  Menu,
  PanelLeftClose,
  Terminal,
  Bell,
} from 'lucide-react';
import {
  ICON_PRESETS,
  getPresetSvg,
  processUploadedIconFile,
  rasterizeToPngDataUrl,
  generateManifestObject,
  applyBrandingToDocument,
  downloadStringAsFile,
  generateHtmlSnippet,
  svgToDataUrl,
} from '../utils/dynamicManifest';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies?: Company[];
  requests?: CompensationRequest[];
  accounts?: CompensationAccount[];
  wallets?: Wallet[];
  appBranding?: AppBranding;
  branding?: AppBranding;
  onUpdateBranding: (newBranding: AppBranding) => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onRejectRequest: (requestId: string, reason: string) => Promise<void>;
  onUpdateCompany: (company: Company) => Promise<void>;
  onBroadcastNotification: (title: string, message: string, category: any) => Promise<void>;
  onTriggerAiBroadcast?: () => Promise<void>;
  onTriggerAiPrediction?: () => Promise<void>;
  onToggleCompanyActive?: (companyId: string) => Promise<boolean>;
  onAddCompany?: (company: Company) => Promise<void>;
  onSyncCompanies?: () => Promise<void>;
  notifications?: AppNotification[];
  lang: Language;
  onCopyToast?: () => void;
}

const DEFAULT_BRANDING: AppBranding = {
  appName: 'VEX Deals',
  tagline: 'منصة الولاء والتعويضات والتحليلات الرياضية الذكية',
  iconType: 'preset',
  presetIconId: 'emerald-shield',
  customIconUrl: '',
  targetCompanyId: 'all',
  exclusiveMode: false,
};

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  companies = [],
  requests = [],
  accounts = [],
  wallets = [],
  appBranding,
  branding,
  onUpdateBranding,
  onApproveRequest,
  onRejectRequest,
  onUpdateCompany,
  onBroadcastNotification,
  onTriggerAiBroadcast,
  onTriggerAiPrediction,
  onToggleCompanyActive,
  onAddCompany,
  onSyncCompanies,
  notifications = [],
  lang,
  onCopyToast,
}) => {
  const isAr = lang === 'ar';
  const effectiveBranding = appBranding || branding || DEFAULT_BRANDING;

  type AdminTab =
    | 'dedicated_brand'
    | 'companies'
    | 'company_api'
    | 'integration_tester'
    | 'integration_health'
    | 'aso_suite'
    | 'branding'
    | 'compensation'
    | 'ai_agent'
    | 'broadcast'
    | 'notifications'
    | 'compliance';

  const [activeTab, setActiveTab] = useState<AdminTab>('dedicated_brand');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [apiPreselectedCompanyId, setApiPreselectedCompanyId] = useState<string | undefined>(undefined);

  // Single-Brand Mode State
  const [searchBrand, setSearchBrand] = useState('');
  const [selectedBrandForPreview, setSelectedBrandForPreview] = useState<string>(
    effectiveBranding.targetCompanyId || 'all'
  );
  const [modeApplying, setModeApplying] = useState(false);
  const [modeAppliedSuccess, setModeAppliedSuccess] = useState(false);

  // Companies Management State
  const [companySearch, setCompanySearch] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null);
  const [companySavedSuccess, setCompanySavedSuccess] = useState<string | null>(null);
  const [syncingCompanies, setSyncingCompanies] = useState(false);
  const [syncCompaniesSuccess, setSyncCompaniesSuccess] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    promo_code: '',
    affiliate_link: '',
    app_link: '',
    description: '',
    color: '#0d579b',
    is_active: true,
  });

  // Company API Integration Configuration State
  const [configuringApiCompany, setConfiguringApiCompany] = useState<Company | null>(null);
  const [tempApiConfig, setTempApiConfig] = useState<CompanyApiConfig | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{
    success: boolean;
    statusText: string;
    latencyMs: number;
    message: string;
  } | null>(null);
  const [savingApiConfig, setSavingApiConfig] = useState(false);
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);

  // New Company API Config State (during Add Company)
  const [newCompanyApiEnabled, setNewCompanyApiEnabled] = useState(true);
  const [newCompanyApiConfig, setNewCompanyApiConfig] = useState<Partial<CompanyApiConfig>>({
    enabled: true,
    integration_type: 'rest_api',
    endpoint_url: '',
    api_key: '',
    secret_key: '',
    merchant_id: '',
    account_id_param: 'player_id',
    min_transfer_amount: 1,
    max_transfer_amount: 5000,
    allow_available_only: true,
    auto_payout: true,
    test_mode: false,
  });

  // ASO Suite State
  const [asoTargetMode, setAsoTargetMode] = useState<'global' | 'company'>('global');
  const [asoSelectedCompanyId, setAsoSelectedCompanyId] = useState<string>(
    companies[0]?.id || 'CMP1XB001'
  );
  const [copiedAsoField, setCopiedAsoField] = useState<string | null>(null);

  // Company Website Sections Customizer State
  const activeDedicatedComp = companies.find((c) => c.id === effectiveBranding.targetCompanyId);
  const currentCustomSite = effectiveBranding.targetCompanyId && effectiveBranding.targetCompanyId !== 'all'
    ? effectiveBranding.companyCustomWebsites?.[effectiveBranding.targetCompanyId]
    : undefined;

  const [editSitePromo, setEditSitePromo] = useState(currentCustomSite?.promoCode || activeDedicatedComp?.promo_code || '');
  const [editSiteAffLink, setEditSiteAffLink] = useState(currentCustomSite?.affiliateLink || activeDedicatedComp?.affiliate_link || '');
  const [editSiteAppDownload, setEditSiteAppDownload] = useState(currentCustomSite?.appDownloadLink || activeDedicatedComp?.app_link || '');
  const [editSiteOverviewAr, setEditSiteOverviewAr] = useState(currentCustomSite?.sections?.overview?.contentAr || activeDedicatedComp?.description || '');
  const [editSiteOverviewEn, setEditSiteOverviewEn] = useState(currentCustomSite?.sections?.overview?.contentEn || activeDedicatedComp?.description || '');
  const [savingWebsiteSections, setSavingWebsiteSections] = useState(false);
  const [websiteSectionsSavedSuccess, setWebsiteSectionsSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeDedicatedComp) {
      const site = effectiveBranding.companyCustomWebsites?.[activeDedicatedComp.id];
      setEditSitePromo(site?.promoCode || activeDedicatedComp.promo_code);
      setEditSiteAffLink(site?.affiliateLink || activeDedicatedComp.affiliate_link);
      setEditSiteAppDownload(site?.appDownloadLink || activeDedicatedComp.app_link);
      setEditSiteOverviewAr(site?.sections?.overview?.contentAr || activeDedicatedComp.description);
      setEditSiteOverviewEn(site?.sections?.overview?.contentEn || activeDedicatedComp.description);
    }
  }, [effectiveBranding.targetCompanyId, effectiveBranding.companyCustomWebsites, companies]);

  const handleSaveCompanyWebsiteSections = async () => {
    if (!effectiveBranding.exclusiveMode || !effectiveBranding.targetCompanyId || effectiveBranding.targetCompanyId === 'all') return;
    setSavingWebsiteSections(true);
    try {
      const compId = effectiveBranding.targetCompanyId;
      const existingSites = effectiveBranding.companyCustomWebsites || {};
      const updatedSites = {
        ...existingSites,
        [compId]: {
          promoCode: editSitePromo,
          affiliateLink: editSiteAffLink,
          appDownloadLink: editSiteAppDownload,
          sections: {
            overview: {
              titleAr: 'نبذة عن الشركة ومميزات الوكالة الحصرية',
              titleEn: 'About & Exclusive Agency Perks',
              subtitleAr: '',
              subtitleEn: '',
              contentAr: editSiteOverviewAr,
              contentEn: editSiteOverviewEn,
              enabled: true,
            },
            cashbackPolicy: {
              titleAr: 'سياسة حماية الخسائر والاسترداد النقدي',
              titleEn: 'Cashback & Loss Protection Policy',
              subtitleAr: '',
              subtitleEn: '',
              contentAr: 'نوفر لك في VEX Deals شبكة أمان متكاملة؛ ففي حال واجهتك خسائر في رهاناتك عبر المنصة، يمكنك تقديم رقم الحساب وقسيمة الرهان عبر قسم المحفظة والتعويضات لاسترداد جزء كبير من الخسائر.',
              contentEn: 'VEX Deals provides an integrated safety net. Submit your account ID and bet slip in the compensation wallet to recover a substantial percentage.',
              enabled: true,
            }
          }
        }
      };

      const updatedBranding: AppBranding = {
        ...effectiveBranding,
        companyCustomWebsites: updatedSites,
        updatedAt: new Date().toISOString(),
      };
      await onUpdateBranding(updatedBranding);
      setWebsiteSectionsSavedSuccess(true);
      setTimeout(() => setWebsiteSectionsSavedSuccess(false), 3000);
    } finally {
      setSavingWebsiteSections(false);
    }
  };

  // General Branding & High-Res App Icon Form
  const [editAppName, setEditAppName] = useState(effectiveBranding.appName || 'VEX Deals');
  const [editTagline, setEditTagline] = useState(effectiveBranding.tagline || '');
  const [editMetaDescription, setEditMetaDescription] = useState(effectiveBranding.metaDescription || '');
  const [editMetaKeywords, setEditMetaKeywords] = useState(effectiveBranding.metaKeywords || '');
  const [editContactEmail, setEditContactEmail] = useState(effectiveBranding.contactEmail || '');
  const [editSupportPhone, setEditSupportPhone] = useState(effectiveBranding.supportPhone || '');
  const [editIconType, setEditIconType] = useState<'preset' | 'custom' | 'upload'>(
    effectiveBranding.iconType || 'preset'
  );
  const [editPresetIconId, setEditPresetIconId] = useState(
    effectiveBranding.presetIconId || 'emerald-shield'
  );
  const [editCustomUrl, setEditCustomUrl] = useState(effectiveBranding.customIconUrl || '');
  const [editUploadedData, setEditUploadedData] = useState(effectiveBranding.uploadedIconData || '');
  const [editIconResolution, setEditIconResolution] = useState<{ width: number; height: number }>(
    effectiveBranding.iconResolution || { width: 512, height: 512 }
  );
  const [editThemeColor, setEditThemeColor] = useState(effectiveBranding.themeColor || '#10b981');
  const [editShape, setEditShape] = useState<'circle' | 'rounded' | 'squircle'>('circle');
  const [showMaskableSafeZone, setShowMaskableSafeZone] = useState(false);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('all');
  const [previewDevice, setPreviewDevice] = useState<'android' | 'ios' | 'tab' | 'store'>('android');
  const [showManifestJsonViewer, setShowManifestJsonViewer] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [copiedManifestSnippet, setCopiedManifestSnippet] = useState(false);
  const [downloadingAsset, setDownloadingAsset] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSavedSuccess, setBrandingSavedSuccess] = useState(false);

  // Synchronize state when props update
  useEffect(() => {
    const b = appBranding || branding || DEFAULT_BRANDING;
    setEditAppName(b.appName || 'VEX Deals');
    setEditTagline(b.tagline || '');
    setEditMetaDescription(b.metaDescription || '');
    setEditMetaKeywords(b.metaKeywords || '');
    setEditContactEmail(b.contactEmail || '');
    setEditSupportPhone(b.supportPhone || '');
    setEditIconType(b.iconType || 'preset');
    setEditPresetIconId(b.presetIconId || 'emerald-shield');
    setEditCustomUrl(b.customIconUrl || '');
    setEditUploadedData(b.uploadedIconData || '');
    if (b.iconResolution) setEditIconResolution(b.iconResolution);
    if (b.themeColor) setEditThemeColor(b.themeColor);
    if (b.targetCompanyId) {
      setSelectedBrandForPreview(b.targetCompanyId);
    }
  }, [appBranding, branding]);

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<string>('ai_prediction');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Reject Modal State
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('رقم الرهان غير مسجل ضمن كود وكالتنا');

  // Stats calculation
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const totalApprovedAmount = approvedRequests.reduce((acc, r) => acc + (r.amount || 0), 0);

  // --------------------------------------------------------------------------
  // Handlers: Brand Mode Transformation
  // --------------------------------------------------------------------------
  const handleApplySingleCompanyMode = async (company: Company) => {
    setModeApplying(true);
    try {
      const theme = getCompanyTheme(company.id, company.name, company.color);
      const updated: AppBranding = {
        appName: theme.appNameAr,
        tagline: theme.taglineAr,
        iconType: 'preset',
        presetIconId: 'emerald-shield',
        customIconUrl: company.logo_url || '',
        targetCompanyId: company.id,
        exclusiveMode: true,
        updatedAt: new Date().toISOString(),
      };
      await onUpdateBranding(updated);
      setSelectedBrandForPreview(company.id);
      setModeAppliedSuccess(true);
      setTimeout(() => setModeAppliedSuccess(false), 3000);
    } finally {
      setModeApplying(false);
    }
  };

  const handleApplyAllCompaniesMode = async () => {
    setModeApplying(true);
    try {
      const updated: AppBranding = {
        appName: 'VEX Deals',
        tagline: 'منصة الولاء والتعويضات والتحليلات الرياضية الذكية',
        iconType: 'preset',
        presetIconId: 'emerald-shield',
        customIconUrl: '',
        targetCompanyId: 'all',
        exclusiveMode: false,
        updatedAt: new Date().toISOString(),
      };
      await onUpdateBranding(updated);
      setSelectedBrandForPreview('all');
      setModeAppliedSuccess(true);
      setTimeout(() => setModeAppliedSuccess(false), 3000);
    } finally {
      setModeApplying(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Company Editing & Toggling
  // --------------------------------------------------------------------------
  const handleToggleActive = async (company: Company) => {
    const updated = { ...company, is_active: !company.is_active };
    await onUpdateCompany(updated);
  };

  const handleSaveCompanyEdit = async (company: Company) => {
    setSavingCompanyId(company.id);
    try {
      const translated = autoTranslateCompany(company);
      await onUpdateCompany(translated);
      setCompanySavedSuccess(company.id);
      setTimeout(() => setCompanySavedSuccess(null), 2500);
      setEditingCompany(null);
    } finally {
      setSavingCompanyId(null);
    }
  };

  const handleOpenApiConfig = (comp: Company) => {
    setConfiguringApiCompany(comp);
    const existing = comp.api_config;
    setTempApiConfig(
      existing
        ? { ...existing }
        : {
            enabled: true,
            integration_type: 'rest_api',
            endpoint_url: `https://api.${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/v1/agent/deposit`,
            api_key: '',
            secret_key: '',
            merchant_id: '',
            webhook_url: '',
            account_id_param: 'player_id',
            min_transfer_amount: 1,
            max_transfer_amount: 5000,
            allow_available_only: true,
            auto_payout: true,
            test_mode: false,
            last_test_status: 'untested',
          }
    );
    setApiTestResult(null);
  };

  const handleTestApiConnection = async () => {
    if (!configuringApiCompany || !tempApiConfig) return;
    setTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await vexApi.testCompanyApiConnection(
        configuringApiCompany.id,
        tempApiConfig
      );
      setApiTestResult({
        success: res.success,
        statusText: res.statusText,
        latencyMs: res.latencyMs,
        message: res.message,
      });
      setTempApiConfig({
        ...tempApiConfig,
        last_test_status: 'success',
        last_test_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setApiTestResult({
        success: false,
        statusText: 'Failed',
        latencyMs: 0,
        message: err.message || 'فشل فحص الاتصال ببوابة الـ API',
      });
      setTempApiConfig({
        ...tempApiConfig,
        last_test_status: 'failed',
        last_test_at: new Date().toISOString(),
      });
    } finally {
      setTestingApi(false);
    }
  };

  const handleSaveApiConfig = async () => {
    if (!configuringApiCompany || !tempApiConfig) return;
    setSavingApiConfig(true);
    try {
      const updated: Company = {
        ...configuringApiCompany,
        api_config: {
          ...tempApiConfig,
          allow_available_only: true, // Always enforce available balance only
        },
      };
      await onUpdateCompany(updated);
      setApiSaveSuccess(true);
      setTimeout(() => {
        setApiSaveSuccess(false);
        setConfiguringApiCompany(null);
      }, 1000);
    } finally {
      setSavingApiConfig(false);
    }
  };

  const handleCreateNewCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.promo_code) return;

    const generatedEndpoint =
      newCompanyApiConfig.endpoint_url?.trim() ||
      `https://api.${newCompany.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}.com/v1/agent/deposit`;

    const baseCompany: Company = {
      id: `CMP${Date.now().toString(36).toUpperCase()}`,
      name: newCompany.name.trim(),
      type: 'bookmaker',
      details: newCompany.description?.trim() || `شركة مراهنات رياضية شريكة`,
      show_in_comp: true,
      promo_code: newCompany.promo_code.trim(),
      affiliate_link: newCompany.affiliate_link?.trim() || `https://${newCompany.name.toLowerCase()}.com`,
      app_link: newCompany.app_link?.trim() || `https://${newCompany.name.toLowerCase()}.com/mobile`,
      description: newCompany.description?.trim() || `شركة مراهنات رياضية شريكة`,
      color: newCompany.color || '#0d579b',
      is_active: true,
      api_config: newCompanyApiEnabled
        ? {
            enabled: true,
            integration_type: newCompanyApiConfig.integration_type || 'rest_api',
            endpoint_url: generatedEndpoint,
            api_key: newCompanyApiConfig.api_key?.trim() || '',
            secret_key: newCompanyApiConfig.secret_key?.trim() || '',
            merchant_id: newCompanyApiConfig.merchant_id?.trim() || '',
            webhook_url: newCompanyApiConfig.webhook_url?.trim() || '',
            account_id_param: newCompanyApiConfig.account_id_param?.trim() || 'player_id',
            min_transfer_amount: Number(newCompanyApiConfig.min_transfer_amount) || 1,
            max_transfer_amount: Number(newCompanyApiConfig.max_transfer_amount) || 5000,
            allow_available_only: true, // STRICT CONSTRAINT: available only
            auto_payout: newCompanyApiConfig.auto_payout ?? true,
            test_mode: newCompanyApiConfig.test_mode ?? false,
            last_test_status: 'untested',
          }
        : undefined,
    };

    // Initialize multi-protocol integration suite (REST, Webhook, OAuth) with available-only policy
    const defaultMethods = generateDefaultCompanyApiMethods(baseCompany);
    if (newCompanyApiEnabled) {
      defaultMethods[0] = {
        ...defaultMethods[0],
        enabled: true,
        endpoint_url: generatedEndpoint,
        api_key: newCompanyApiConfig.api_key?.trim() || defaultMethods[0].api_key,
        secret_key: newCompanyApiConfig.secret_key?.trim() || defaultMethods[0].secret_key,
        method_type: (newCompanyApiConfig.integration_type as any) || 'rest_api',
        account_id_param: newCompanyApiConfig.account_id_param?.trim() || 'player_id',
        min_transfer_amount: Number(newCompanyApiConfig.min_transfer_amount) || 1,
        max_transfer_amount: Number(newCompanyApiConfig.max_transfer_amount) || 5000,
        test_mode: newCompanyApiConfig.test_mode ?? false,
        allow_available_only: true,
      };
    }
    baseCompany.api_methods = defaultMethods;

    const companyToSave = autoTranslateCompany(baseCompany);

    if (onAddCompany) {
      await onAddCompany(companyToSave);
    } else {
      await onUpdateCompany(companyToSave);
    }

    setShowAddCompanyModal(false);
    setNewCompany({
      name: '',
      promo_code: '',
      affiliate_link: '',
      app_link: '',
      description: '',
      color: '#0d579b',
      is_active: true,
    });
    setNewCompanyApiEnabled(true);
    setNewCompanyApiConfig({
      enabled: true,
      integration_type: 'rest_api',
      endpoint_url: '',
      api_key: '',
      secret_key: '',
      merchant_id: '',
      account_id_param: 'player_id',
      min_transfer_amount: 1,
      max_transfer_amount: 5000,
      allow_available_only: true,
      auto_payout: true,
      test_mode: false,
    });
  };

  const handleSyncOfficialCompanies = async () => {
    if (!onSyncCompanies) return;
    setSyncingCompanies(true);
    try {
      await onSyncCompanies();
      setSyncCompaniesSuccess(true);
      setTimeout(() => setSyncCompaniesSuccess(false), 2500);
    } finally {
      setSyncingCompanies(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: ASO Copy Helper
  // --------------------------------------------------------------------------
  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAsoField(fieldId);
    if (onCopyToast) onCopyToast();
    setTimeout(() => setCopiedAsoField(null), 2000);
  };

  const exportAsoAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------------------------------
  // Handlers: Branding, High-Res Icon & Broadcast
  // --------------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    if ('dataTransfer' in e && e.dataTransfer.files?.length) {
      file = e.dataTransfer.files[0];
    } else if ('target' in e && (e.target as HTMLInputElement).files?.length) {
      file = (e.target as HTMLInputElement).files![0];
    }
    if (!file) return;

    setIsProcessingUpload(true);
    setUploadErrorMessage(null);
    try {
      const processed = await processUploadedIconFile(file);
      setEditUploadedData(processed.dataUrl);
      setEditIconResolution({ width: processed.width, height: processed.height });
      setEditIconType('upload');
    } catch (err: any) {
      setUploadErrorMessage(err?.message || 'فشل في قراءة ومعالجة ملف الصورة.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      let highResAssets = undefined;
      if (editIconType === 'upload' && editUploadedData) {
        try {
          const icon192Png = await rasterizeToPngDataUrl(editUploadedData, 192);
          const icon512Png = await rasterizeToPngDataUrl(editUploadedData, 512);
          highResAssets = {
            icon192: icon192Png,
            icon512: icon512Png,
            appleTouch: icon512Png,
            favicon: icon192Png,
            maskable: icon512Png,
          };
        } catch (e) {
          console.warn('Could not generate raster png data:', e);
        }
      }

      const updated: AppBranding = {
        ...effectiveBranding,
        appName: editAppName.trim() || 'VEX Deals',
        tagline: editTagline.trim(),
        metaDescription: editMetaDescription.trim(),
        metaKeywords: editMetaKeywords.trim(),
        contactEmail: editContactEmail.trim(),
        supportPhone: editSupportPhone.trim(),
        iconType: editIconType,
        presetIconId: editPresetIconId,
        customIconUrl: editCustomUrl.trim(),
        uploadedIconData: editUploadedData,
        iconResolution: editIconResolution,
        highResAssets: highResAssets,
        themeColor: editThemeColor,
        updatedAt: new Date().toISOString(),
      };

      await onUpdateBranding(updated);
      applyBrandingToDocument(updated);

      setBrandingSavedSuccess(true);
      setTimeout(() => setBrandingSavedSuccess(false), 3000);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleDownloadManifest = () => {
    const currentBrandingState: AppBranding = {
      appName: editAppName || 'VEX Deals',
      tagline: editTagline || '',
      metaDescription: editMetaDescription,
      metaKeywords: editMetaKeywords,
      contactEmail: editContactEmail,
      supportPhone: editSupportPhone,
      iconType: editIconType,
      presetIconId: editPresetIconId,
      customIconUrl: editCustomUrl,
      uploadedIconData: editUploadedData,
      themeColor: editThemeColor,
    };
    const manifestObj = generateManifestObject(currentBrandingState);
    downloadStringAsFile(JSON.stringify(manifestObj, null, 2), 'manifest.json', 'application/manifest+json');
  };

  const handleCopyHtmlSnippet = () => {
    const currentBrandingState: AppBranding = {
      appName: editAppName || 'VEX Deals',
      tagline: editTagline || '',
      iconType: editIconType,
      presetIconId: editPresetIconId,
      customIconUrl: editCustomUrl,
      uploadedIconData: editUploadedData,
      themeColor: editThemeColor,
    };
    const snippet = generateHtmlSnippet(currentBrandingState);
    navigator.clipboard.writeText(snippet);
    setCopiedManifestSnippet(true);
    if (onCopyToast) onCopyToast();
    setTimeout(() => setCopiedManifestSnippet(false), 2500);
  };

  const handleDownloadIconAsset = async (size: number) => {
    setDownloadingAsset(`icon-${size}`);
    try {
      const appName = editAppName || 'VEX Deals';
      if (editIconType === 'upload' && editUploadedData) {
        const png = await rasterizeToPngDataUrl(editUploadedData, size);
        const a = document.createElement('a');
        a.href = png;
        a.download = `app-icon-${size}x${size}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (editIconType === 'custom' && editCustomUrl) {
        const png = await rasterizeToPngDataUrl(editCustomUrl, size);
        const a = document.createElement('a');
        a.href = png;
        a.download = `app-icon-${size}x${size}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const svgString = getPresetSvg(editPresetIconId, appName, size);
        downloadStringAsFile(svgString, `app-icon-${size}x${size}.svg`, 'image/svg+xml');
      }
    } finally {
      setTimeout(() => setDownloadingAsset(null), 800);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcastSending(true);
    try {
      await onBroadcastNotification(broadcastTitle, broadcastMessage, broadcastCategory);
      setBroadcastSent(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSent(false), 2500);
    } finally {
      setBroadcastSending(false);
    }
  };

  // Filtered companies for brand mode search
  const filteredBrands = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchBrand.toLowerCase()) ||
      c.promo_code.toLowerCase().includes(searchBrand.toLowerCase())
  );

  // Selected company for ASO pack
  const selectedAsoCompany = companies.find((c) => c.id === asoSelectedCompanyId) || companies[0];
  const companyAsoSuite: CompanyAsoSuite = selectedAsoCompany
    ? PRECOMPUTED_COMPANY_ASO[selectedAsoCompany.id] ||
      generateCompanyAsoSuite(
        selectedAsoCompany.id,
        selectedAsoCompany.name,
        selectedAsoCompany.promo_code,
        selectedAsoCompany.app_link || ''
      )
    : PRECOMPUTED_COMPANY_ASO['CMP1XB001'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-5xl my-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Admin Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      {isAr ? 'لوحة التحكم الإدارية ونظام التخصيص الذكي' : 'VEX Admin Control Hub'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 font-mono">
                      SUPER ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تخصيص الشركة الواحدة، إدارة الشركات، خطة الـ ASO، وثيمات البراند'
                      : 'Single-Brand Mode, Company Manager, ASO Engine & Real-time Themes'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dashboard Layout: Collapsible Sidebar + Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Collapsible Vertical Sidebar */}
              <div
                className={`bg-slate-50 dark:bg-slate-950 border-r dark:border-slate-800 border-slate-200 transition-all duration-300 flex flex-col shrink-0 ${
                  isSidebarOpen ? 'w-64 sm:w-72' : 'w-16'
                }`}
              >
                <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  {isSidebarOpen && (
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 truncate">
                      {isAr ? 'أقسام لوحة التحكم' : 'Control Hub'}
                    </span>
                  )}
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors mx-auto"
                    title={isAr ? 'إغلاق/فتح القائمة' : 'Toggle Sidebar'}
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {[
                    {
                      id: 'dedicated_brand',
                      label: isAr ? 'تخصيص شركة واحدة (Exclusive)' : 'Single-Brand Mode',
                      icon: Award,
                    },
                    { id: 'companies', label: isAr ? 'إدارة وتعديل الشركات' : 'Manage Companies', icon: Building2 },
                    {
                      id: 'company_api',
                      label: isAr ? 'تكاملات API الشركات' : 'Company API Integrations',
                      icon: Cpu,
                    },
                    {
                      id: 'integration_tester',
                      label: isAr ? 'أداة فحص الويب هوك (Tester)' : 'Integration Tester',
                      icon: Terminal,
                    },
                    {
                      id: 'integration_health',
                      label: isAr ? 'صحة التكاملات (Health 24h)' : 'Integration Health (24h)',
                      icon: Activity,
                    },
                    { id: 'aso_suite', label: isAr ? 'خطة ASO المتكاملة' : 'ASO Suite', icon: Sparkles },
                    { id: 'branding', label: isAr ? 'أيقونات عالية الدقة و Manifest' : 'Icons & Manifest', icon: Palette },
                    {
                      id: 'compensation',
                      label: isAr
                        ? `طلبات التعويض (${pendingRequests.length})`
                        : `Compensation (${pendingRequests.length})`,
                      icon: ShieldCheck,
                    },
                    { id: 'ai_agent', label: isAr ? 'وكيل الذكاء الاصطناعي' : 'AI Match Agent', icon: Bot },
                    { id: 'broadcast', label: isAr ? 'بث الإشعارات والرسائل' : 'Push Alerts', icon: Send },
                    { id: 'notifications', label: isAr ? 'مركز الإشعارات الفورية' : 'Notifications Hub', icon: Bell },
                    { id: 'compliance', label: isAr ? 'امتثال المتاجر' : 'Store Compliance', icon: FileText },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AdminTab)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                        title={!isSidebarOpen ? tab.label : undefined}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        {isSidebarOpen && <span className="truncate text-start">{tab.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Body */}
              <div className="flex-1 overflow-y-auto p-5">
              {/* ========================================================= */}
              {/* TAB 1: DEDICATED SINGLE-BRAND MODE                        */}
              {/* ========================================================= */}
              {activeTab === 'dedicated_brand' && (
                <div className="space-y-5">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h3 className="font-extrabold text-sm sm:text-base">
                          {isAr
                            ? 'نظام تحويل وتخصيص التطبيق بالكامل لشركة محددة'
                            : 'Dedicated Single-Brand App Transformation'}
                        </h3>
                      </div>
                      <p className="text-xs text-indigo-100 max-w-2xl leading-relaxed">
                        {isAr
                          ? 'اختر أي شركة شريكة لتحويل التطبيق بالكامل لصالحها: الاسم، الشعار الدائري، الألوان، أزرار التفاعل، كود البرومو، وبانر الـ VIP. وإذا اخترت "الجميع"، يعود التطبيق ليعمل كمنصة عامة تجمع كافة الشركاء كما هو الآن.'
                          : 'Select a bookmaker to dedicate 100% of the app experience to that single brand (theme, circular logo, exclusive perks, and ASO). Choose "All Companies" to revert to multi-brand mode.'}
                      </p>
                    </div>
                  </div>

                  {modeAppliedSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'تم تطبيق وضع الهوية والثيم بنجاح وتحديث واجهة التطبيق فوراً!' : 'Brand Mode successfully applied!'}</span>
                    </div>
                  )}

                  {/* Website Sections Customizer for Dedicated Company */}
                  {effectiveBranding.exclusiveMode && effectiveBranding.targetCompanyId && effectiveBranding.targetCompanyId !== 'all' && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-md space-y-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {isAr ? 'تخصيص محتوى وأقسام الموقع للشركة الحالية' : 'Customize Company Website Content & Sections'}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {isAr ? 'عدل كود البرومو، روابط التسجيل، والأوصاف التفصيلية التي تظهر في واجهة الشركة.' : 'Edit promo code, registration links, and detailed descriptions for this brand.'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleSaveCompanyWebsiteSections}
                          disabled={savingWebsiteSections}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isAr ? 'حفظ تعديلات الموقع' : 'Save Website Edits'}</span>
                        </button>
                      </div>

                      {websiteSectionsSavedSuccess && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{isAr ? 'تم حفظ وتحديث محتوى وأقسام موقع الشركة بنجاح!' : 'Company website content saved successfully!'}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {isAr ? 'كود البرومو المعتمد' : 'Promo Code'}
                          </label>
                          <input
                            type="text"
                            value={editSitePromo}
                            onChange={(e) => setEditSitePromo(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                            placeholder="PROMO123"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {isAr ? 'رابط التسجيل بالشركة (Affiliate Link)' : 'Affiliate Link'}
                          </label>
                          <input
                            type="url"
                            value={editSiteAffLink}
                            onChange={(e) => setEditSiteAffLink(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            placeholder="https://..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {isAr ? 'رابط تحميل التطبيق' : 'App Download Link'}
                          </label>
                          <input
                            type="url"
                            value={editSiteAppDownload}
                            onChange={(e) => setEditSiteAppDownload(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {isAr ? 'نبذة تعريفية مفصلة عن الشركة (اللغة العربية)' : 'Detailed Overview (Arabic)'}
                          </label>
                          <textarea
                            rows={3}
                            value={editSiteOverviewAr}
                            onChange={(e) => setEditSiteOverviewAr(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {isAr ? 'نبذة تعريفية مفصلة عن الشركة (اللغة الإنجليزية)' : 'Detailed Overview (English)'}
                          </label>
                          <textarea
                            rows={3}
                            value={editSiteOverviewEn}
                            onChange={(e) => setEditSiteOverviewEn(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode Option 1: Multi-Brand All Companies */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      !effectiveBranding.exclusiveMode || effectiveBranding.targetCompanyId === 'all'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {isAr ? 'الوضع العام: جميع الشركات والشركاء' : 'General Platform: All Companies'}
                            </h4>
                            {(!effectiveBranding.exclusiveMode || effectiveBranding.targetCompanyId === 'all') && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                {isAr ? 'الوضع النشط حالياً' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isAr
                              ? 'يعرض جميع الشركات الشريكة المعتمدة مع أزرار ملونة وهوية VEX Deals العامة.'
                              : 'Showcases all partner bookmakers with brand-colored CTA buttons.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleApplyAllCompaniesMode}
                        disabled={modeApplying}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        {isAr ? 'تفعيل وضع جميع الشركات' : 'Activate Multi-Brand'}
                      </button>
                    </div>
                  </div>

                  {/* Mode Option 2: Choose Single Company */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span>{isAr ? 'أو اختر شركة واحدة لتخصيص التطبيق بالكامل لها:' : 'Or Dedicate App to a Single Company:'}</span>
                      </h4>

                      {/* Brand Search Bar */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchBrand}
                          onChange={(e) => setSearchBrand(e.target.value)}
                          placeholder={isAr ? 'ابحث في الشركات...' : 'Search company...'}
                          className="w-full pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredBrands.map((comp) => {
                        const isThisBrandActive =
                          effectiveBranding.exclusiveMode && effectiveBranding.targetCompanyId === comp.id;
                        const theme = getCompanyTheme(comp.id, comp.name, comp.color);

                        return (
                          <div
                            key={comp.id}
                            className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                              isThisBrandActive
                                ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 shadow-md ring-1 ring-purple-500'
                                : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-1"
                              style={{ backgroundColor: comp.color }}
                            />

                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <CompanyBrandLogo companyName={comp.name} size="md" />
                                  <div>
                                    <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                      {comp.name}
                                    </h5>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      كود: {comp.promo_code}
                                    </span>
                                  </div>
                                </div>

                                {isThisBrandActive && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                                    {isAr ? 'مخصص الآن' : 'Dedicated'}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                {isAr ? theme.taglineAr : theme.taglineEn}
                              </p>
                            </div>

                            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                              <button
                                onClick={() => handleApplySingleCompanyMode(comp)}
                                disabled={modeApplying || isThisBrandActive}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1 ${
                                  isThisBrandActive
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default'
                                    : 'text-white'
                                }`}
                                style={{
                                  backgroundColor: isThisBrandActive ? undefined : comp.color,
                                }}
                              >
                                <span>
                                  {isThisBrandActive
                                    ? isAr
                                      ? 'التطبيق مخصص لها'
                                      : 'Dedicated'
                                    : isAr
                                    ? `تخصيص التطبيق لـ ${comp.name}`
                                    : `Dedicate to ${comp.name}`}
                                </span>
                              </button>

                              <button
                                onClick={() => {
                                  setAsoTargetMode('company');
                                  setAsoSelectedCompanyId(comp.id);
                                  setActiveTab('aso_suite');
                                }}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors"
                                title={isAr ? 'عرض حزمة ASO الخاصة بها' : 'View ASO Pack'}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: COMPANIES MANAGEMENT & EDITING                     */}
              {/* ========================================================= */}
              {activeTab === 'companies' && (
                <div className="space-y-4">
                  {/* Top Header & Search & Add */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {isAr ? 'إدارة المنصات الشريكة والأكواد والروابط' : 'Partner Bookmakers & Promos'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isAr
                          ? 'تعديل البرومو كود، روابط الإحالة والتحميل، وتفعيل/إلغاء تنشيط أي شركة فورياً.'
                          : 'Edit promo codes, affiliate links, download links, and toggle active status.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          placeholder={isAr ? 'بحث في الشركات...' : 'Search companies...'}
                          className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      {onSyncCompanies && (
                        <button
                          onClick={handleSyncOfficialCompanies}
                          disabled={syncingCompanies}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          title={
                            isAr
                              ? 'مزامنة وتحديث جميع الروابط والأكواد المعتمدة رسمياً لجميع الشركات الـ 8'
                              : 'Sync all verified official company links & promo codes'
                          }
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingCompanies ? 'animate-spin' : ''}`} />
                          <span>
                            {syncCompaniesSuccess
                              ? isAr
                                ? 'تم التحديث بنجاح!'
                                : 'Synced!'
                              : isAr
                              ? 'تحديث ومزامنة بيانات الشركات'
                              : 'Sync Official Data'}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowAddCompanyModal(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة شركة جديدة' : 'Add Company'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Company Modal Overlay */}
                  {showAddCompanyModal && (
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                          {isAr ? 'إضافة شركة شريكة جديدة إلى المنصة' : 'Add New Partner Bookmaker'}
                        </h4>
                        <button
                          onClick={() => setShowAddCompanyModal(false)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateNewCompany} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'اسم الشركة:' : 'Company Name:'}
                          </label>
                          <input
                            type="text"
                            required
                            value={newCompany.name}
                            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                            placeholder="BETWINNER"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'كود البرومو المعتمد:' : 'Promo Code:'}
                          </label>
                          <input
                            type="text"
                            required
                            value={newCompany.promo_code}
                            onChange={(e) => setNewCompany({ ...newCompany, promo_code: e.target.value })}
                            placeholder="VEX2026"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'رابط الإحالة والتسجيل:' : 'Affiliate Registration Link:'}
                          </label>
                          <input
                            type="url"
                            value={newCompany.affiliate_link}
                            onChange={(e) => setNewCompany({ ...newCompany, affiliate_link: e.target.value })}
                            placeholder="https://betwinner.com/affiliate"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'رابط تحميل التطبيق والـ APK:' : 'App/APK Download Link:'}
                          </label>
                          <input
                            type="url"
                            value={newCompany.app_link}
                            onChange={(e) => setNewCompany({ ...newCompany, app_link: e.target.value })}
                            placeholder="https://betwinner.com/download"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'لون البراند الرئيسي (Hex):' : 'Brand Primary Color:'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newCompany.color}
                              onChange={(e) => setNewCompany({ ...newCompany, color: e.target.value })}
                              className="w-9 h-8 rounded-lg cursor-pointer border border-slate-300"
                            />
                            <input
                              type="text"
                              value={newCompany.color}
                              onChange={(e) => setNewCompany({ ...newCompany, color: e.target.value })}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'الوصف ونسبة التعويض:' : 'Description & Rebate:'}
                          </label>
                          <input
                            type="text"
                            value={newCompany.description}
                            onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                            placeholder="كاش باك يصل لـ 100% وبونص ترحيبي"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                          />
                        </div>

                        {/* API Integration Settings inside Add Company Modal */}
                        <div className="sm:col-span-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
                                  <Cpu className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{isAr ? 'إعدادات ربط الـ API لتحويل الرصيد المتاح' : 'API Integration for Available Balance'}</span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                      {isAr ? 'ميزة الربط المباشر' : 'Direct Gateway'}
                                    </span>
                                  </h5>
                                  <p className="text-[10px] text-slate-500">
                                    {isAr
                                      ? 'تمكين تحويل الرصيد المتاح فقط من محفظة اللاعب إلى حسابه في تطبيق الشركة عبر الـ API'
                                      : 'Allows transferring available player wallet balance to company account via API'}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setNewCompanyApiEnabled(!newCompanyApiEnabled)}
                                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                                  newCompanyApiEnabled
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {newCompanyApiEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                <span>{newCompanyApiEnabled ? (isAr ? 'مفعّل' : 'Enabled') : (isAr ? 'معطّل' : 'Disabled')}</span>
                              </button>
                            </div>

                            {newCompanyApiEnabled && (
                              <div className="space-y-3 pt-1">
                                {/* Strict security reminder */}
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
                                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">{isAr ? 'تنبيه الأمان والسياسة المالية:' : 'Security Policy:'} </span>
                                    <span>
                                      {isAr
                                        ? 'الربط مخصص للرصيد المتاح (Available) فقط. الرصيد المجمد (Frozen) محمي كلياً وغير قابل للتحويل إطلاقاً.'
                                        : 'Only available balance can be transferred. Frozen balance is strictly locked.'}
                                    </span>
                                  </div>
                                </div>

                                {/* Integration Protocol / Method Selection */}
                                <div>
                                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'طريقة ونوع الربط (Integration Protocol):' : 'Integration Method:'}
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                      {
                                        id: 'rest_api',
                                        title: 'Direct REST API',
                                        descAr: 'طلب JSON POST مع Bearer Token أو API Key',
                                        badge: 'شائع وموصى به',
                                      },
                                      {
                                        id: 'merchant_gateway',
                                        title: 'Merchant Gateway',
                                        descAr: 'بوابة تاجر ووكيل مع Merchant ID وتوقيع Secret',
                                        badge: 'بوابات الوكلاء',
                                      },
                                      {
                                        id: 'webhook_s2s',
                                        title: 'Server Webhook (S2S)',
                                        descAr: 'استدعاء Server-to-Server مع إشعار كولباك فوري',
                                        badge: 'إشعارات سريعة',
                                      },
                                      {
                                        id: 'basic_auth',
                                        title: 'Basic HTTP Auth',
                                        descAr: 'توثيق كلاسيكي عبر Username + Password',
                                        badge: 'كلاسيكي',
                                      },
                                      {
                                        id: 'oauth2_client',
                                        title: 'OAuth 2.0 Client',
                                        descAr: 'Client ID + Secret وتوليد Token ديناميكي',
                                        badge: 'أمان متقدم',
                                      },
                                    ].map((m) => {
                                      const isSelected = (newCompanyApiConfig.integration_type || 'rest_api') === m.id;
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() =>
                                            setNewCompanyApiConfig({
                                              ...newCompanyApiConfig,
                                              integration_type: m.id as CompanyApiIntegrationType,
                                            })
                                          }
                                          className={`p-2 rounded-xl text-right transition-all border ${
                                            isSelected
                                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs'
                                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                              {m.title}
                                            </span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                          </div>
                                          <p className="text-[9px] text-slate-500 leading-tight">{m.descAr}</p>
                                          <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {m.badge}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Endpoint URL */}
                                <div>
                                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'رابط نقطة نهاية التحويل (API Endpoint URL):' : 'API Endpoint URL:'}
                                  </label>
                                  <input
                                    type="url"
                                    value={newCompanyApiConfig.endpoint_url || ''}
                                    onChange={(e) =>
                                      setNewCompanyApiConfig({
                                        ...newCompanyApiConfig,
                                        endpoint_url: e.target.value,
                                      })
                                    }
                                    placeholder={
                                      newCompany.name
                                        ? `https://api.${newCompany.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/v1/agent/deposit`
                                        : 'https://api.bookmaker.com/v1/agent/deposit'
                                    }
                                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                  />
                                </div>

                                {/* Method Specific Credentials */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {(newCompanyApiConfig.integration_type === 'rest_api' ||
                                    !newCompanyApiConfig.integration_type) && (
                                    <div className="sm:col-span-2">
                                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {isAr ? 'مفتاح الـ API أو الـ Bearer Token:' : 'API Key / Bearer Token:'}
                                      </label>
                                      <input
                                        type="password"
                                        value={newCompanyApiConfig.api_key || ''}
                                        onChange={(e) =>
                                          setNewCompanyApiConfig({ ...newCompanyApiConfig, api_key: e.target.value })
                                        }
                                        placeholder="sk_live_vex_..."
                                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                      />
                                    </div>
                                  )}

                                  {newCompanyApiConfig.integration_type === 'merchant_gateway' && (
                                    <>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'معرف التاجر / الوكيل (Merchant ID):' : 'Merchant ID:'}
                                        </label>
                                        <input
                                          type="text"
                                          value={newCompanyApiConfig.merchant_id || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, merchant_id: e.target.value })
                                          }
                                          placeholder="MCH-88231"
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'المفتاح السري للتوقيع (Secret Key / Hash):' : 'Secret Key / Hash:'}
                                        </label>
                                        <input
                                          type="password"
                                          value={newCompanyApiConfig.secret_key || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, secret_key: e.target.value })
                                          }
                                          placeholder="sec_..."
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {newCompanyApiConfig.integration_type === 'webhook_s2s' && (
                                    <>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'رابط الـ Webhook للإشعار السريع:' : 'Callback Webhook URL:'}
                                        </label>
                                        <input
                                          type="url"
                                          value={newCompanyApiConfig.webhook_url || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, webhook_url: e.target.value })
                                          }
                                          placeholder="https://api.bookmaker.com/webhook/confirm"
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'سر التوقيع الرقمي (Signing Secret):' : 'Signing Secret:'}
                                        </label>
                                        <input
                                          type="password"
                                          value={newCompanyApiConfig.secret_key || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, secret_key: e.target.value })
                                          }
                                          placeholder="whsec_..."
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {newCompanyApiConfig.integration_type === 'basic_auth' && (
                                    <>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'اسم المستخدم (API Username):' : 'Username:'}
                                        </label>
                                        <input
                                          type="text"
                                          value={newCompanyApiConfig.api_key || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, api_key: e.target.value })
                                          }
                                          placeholder="vex_agent_user"
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'كلمة المرور (API Password):' : 'Password:'}
                                        </label>
                                        <input
                                          type="password"
                                          value={newCompanyApiConfig.secret_key || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, secret_key: e.target.value })
                                          }
                                          placeholder="••••••••"
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {newCompanyApiConfig.integration_type === 'oauth2_client' && (
                                    <>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'معرف العميل (Client ID):' : 'Client ID:'}
                                        </label>
                                        <input
                                          type="text"
                                          value={newCompanyApiConfig.api_key || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, api_key: e.target.value })
                                          }
                                          placeholder="client_vex_auth"
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                          {isAr ? 'السر المعتمد (Client Secret):' : 'Client Secret:'}
                                        </label>
                                        <input
                                          type="password"
                                          value={newCompanyApiConfig.secret_key || ''}
                                          onChange={(e) =>
                                            setNewCompanyApiConfig({ ...newCompanyApiConfig, secret_key: e.target.value })
                                          }
                                          placeholder="csec_..."
                                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                        />
                                      </div>
                                    </>
                                  )}

                                  <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      {isAr ? 'اسم متغير حساب اللاعب (Account Param):' : 'Account Parameter:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={newCompanyApiConfig.account_id_param || 'player_id'}
                                      onChange={(e) =>
                                        setNewCompanyApiConfig({
                                          ...newCompanyApiConfig,
                                          account_id_param: e.target.value,
                                        })
                                      }
                                      placeholder="player_id"
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                                    />
                                  </div>

                                  <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      {isAr ? 'الحد الأدنى والأقصى للتحويل ($):' : 'Transfer Limits ($):'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="1"
                                        value={newCompanyApiConfig.min_transfer_amount || 1}
                                        onChange={(e) =>
                                          setNewCompanyApiConfig({
                                            ...newCompanyApiConfig,
                                            min_transfer_amount: Number(e.target.value),
                                          })
                                        }
                                        placeholder="Min"
                                        className="w-1/2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-[11px]"
                                      />
                                      <span className="text-slate-400 font-bold">-</span>
                                      <input
                                        type="number"
                                        min="10"
                                        value={newCompanyApiConfig.max_transfer_amount || 5000}
                                        onChange={(e) =>
                                          setNewCompanyApiConfig({
                                            ...newCompanyApiConfig,
                                            max_transfer_amount: Number(e.target.value),
                                          })
                                        }
                                        placeholder="Max"
                                        className="w-1/2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-[11px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2 pt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddCompanyModal(false)}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm"
                          >
                            {isAr ? 'حفظ وإضافة الشركة' : 'Save Company'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Companies Grid with Direct Editing & Toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {companies
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
                          c.promo_code.toLowerCase().includes(companySearch.toLowerCase())
                      )
                      .map((comp) => {
                        const isEditingThis = editingCompany?.id === comp.id;
                        const activeComp = isEditingThis ? editingCompany : comp;

                        return (
                          <div
                            key={comp.id}
                            className={`bg-white dark:bg-slate-950/60 p-4 rounded-2xl border transition-all relative overflow-hidden ${
                              comp.is_active
                                ? 'border-slate-200/90 dark:border-slate-800'
                                : 'border-rose-200 dark:border-rose-950/50 bg-rose-50/10'
                            }`}
                          >
                            {/* Color Bar */}
                            <div
                              className="absolute top-0 left-0 right-0 h-1"
                              style={{ backgroundColor: comp.color }}
                            />

                            <div className="space-y-3">
                              {/* Header with Circular Logo, Name, and Active Toggle */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <CompanyBrandLogo companyName={comp.name} size="md" />
                                  <div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                      {comp.name}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ID: {comp.id}
                                    </span>
                                  </div>
                                </div>

                                {/* Active / Inactive Switch */}
                                <button
                                  onClick={() => handleToggleActive(comp)}
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                                    comp.is_active
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                                  }`}
                                  title={comp.is_active ? 'انقر لتعطيل الشركة' : 'انقر لتنشيط الشركة'}
                                >
                                  {comp.is_active ? (
                                    <>
                                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                                      <span>{isAr ? 'نشط ويعمل' : 'Active'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-4 h-4 text-rose-600" />
                                      <span>{isAr ? 'معطل ومخفي' : 'Inactive'}</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Editable Fields */}
                              {isEditingThis ? (
                                <div className="space-y-2.5 pt-1 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                      {isAr ? 'كود البرومو (Promo Code):' : 'Promo Code:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={activeComp.promo_code}
                                      onChange={(e) =>
                                        setEditingCompany({ ...activeComp, promo_code: e.target.value })
                                      }
                                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                      {isAr ? 'رابط الإحالة (Affiliate Link):' : 'Affiliate Link:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={activeComp.affiliate_link}
                                      onChange={(e) =>
                                        setEditingCompany({ ...activeComp, affiliate_link: e.target.value })
                                      }
                                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                      {isAr ? 'رابط تحميل التطبيق والـ APK (App Download Link):' : 'App Link:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={activeComp.app_link || ''}
                                      onChange={(e) =>
                                        setEditingCompany({ ...activeComp, app_link: e.target.value })
                                      }
                                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={activeComp.color}
                                      onChange={(e) =>
                                        setEditingCompany({ ...activeComp, color: e.target.value })
                                      }
                                      className="w-8 h-8 rounded-lg cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={activeComp.color}
                                      onChange={(e) =>
                                        setEditingCompany({ ...activeComp, color: e.target.value })
                                      }
                                      className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                                    />
                                    <div className="flex-1 flex justify-end gap-1.5">
                                      <button
                                        onClick={() => setEditingCompany(null)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                                      >
                                        {isAr ? 'إلغاء' : 'Cancel'}
                                      </button>
                                      <button
                                        onClick={() => handleSaveCompanyEdit(activeComp)}
                                        disabled={savingCompanyId === comp.id}
                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-xs"
                                      >
                                        {savingCompanyId === comp.id ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                        <span>{isAr ? 'حفظ' : 'Save'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      {isAr ? 'البرومو كود:' : 'Promo Code:'}
                                    </span>
                                    <span
                                      className="font-mono font-bold px-2 py-0.5 rounded-lg border text-xs"
                                      style={{
                                        color: comp.color,
                                        borderColor: `${comp.color}40`,
                                        backgroundColor: `${comp.color}10`,
                                      }}
                                    >
                                      {comp.promo_code}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      {isAr ? 'رابط الإحالة:' : 'Affiliate:'}
                                    </span>
                                    <a
                                      href={comp.affiliate_link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] font-mono text-sky-600 dark:text-sky-400 truncate max-w-[180px] hover:underline flex items-center gap-1"
                                    >
                                      <span className="truncate">{comp.affiliate_link}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      {isAr ? 'رابط التحميل:' : 'App Link:'}
                                    </span>
                                    <a
                                      href={comp.app_link || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[180px] hover:underline flex items-center gap-1"
                                    >
                                      <span className="truncate">{comp.app_link || 'غير محدد'}</span>
                                      <Download className="w-3 h-3 shrink-0" />
                                    </a>
                                  </div>

                                  {/* API Integration Status Ribbon */}
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Cpu className="w-3.5 h-3.5 text-sky-500" />
                                      {comp.api_config?.enabled ? (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>API: {comp.api_config.integration_type.replace('_', ' ').toUpperCase()}</span>
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-medium">
                                            {isAr ? 'تحويل رصيد متاح فقط' : 'Available balance only'}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium">
                                          {isAr ? 'الـ API غير مفعل' : 'API Disabled'}
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => {
                                        setApiPreselectedCompanyId(comp.id);
                                        setActiveTab('company_api');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60 flex items-center gap-1 shadow-2xs transition-all"
                                    >
                                      <Cpu className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                      <span>{isAr ? 'إدارة تكاملات API' : 'API Integrations'}</span>
                                    </button>
                                  </div>

                                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                    <button
                                      onClick={() => setEditingCompany({ ...comp })}
                                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'تعديل البيانات والروابط' : 'Edit Company Data'}</span>
                                    </button>

                                    {companySavedSuccess === comp.id && (
                                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>{isAr ? 'تم الحفظ!' : 'Saved!'}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* ========================================================= */}
                  {/* DEDICATED COMPANY API CONFIGURATION MODAL                 */}
                  {/* ========================================================= */}
                  {configuringApiCompany && tempApiConfig && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border"
                              style={{
                                backgroundColor: `${configuringApiCompany.color}15`,
                                borderColor: `${configuringApiCompany.color}40`,
                              }}
                            >
                              <CompanyBrandLogo
                                companyId={configuringApiCompany.id}
                                size="md"
                                className="rounded-xl"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                                  {isAr
                                    ? `إعدادات ربط الـ API - تطبيق ${configuringApiCompany.name}`
                                    : `API Integration Settings - ${configuringApiCompany.name}`}
                                </h3>
                                <span
                                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border"
                                  style={{
                                    color: configuringApiCompany.color,
                                    borderColor: `${configuringApiCompany.color}50`,
                                    backgroundColor: `${configuringApiCompany.color}10`,
                                  }}
                                >
                                  {configuringApiCompany.promo_code}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {isAr
                                  ? 'ربط مباشر لنقل الرصيد المتاح من محفظة اللاعب إلى حسابه في تطبيق الشركة'
                                  : 'Direct protocol linking player available balance to bookmaker app account'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setConfiguringApiCompany(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                          {/* Policy Golden Rule Alert */}
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:amber-200 space-y-1">
                            <div className="flex items-center gap-2 font-black text-xs text-amber-800 dark:text-amber-300">
                              <ShieldCheck className="w-4 h-4 text-amber-600" />
                              <span>{isAr ? 'سياسة التحويل المصرفي الصارمة:' : 'Strict Financial Policy:'}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                              {isAr
                                ? 'هذا الربط يتيح للاعب تحويل الرصيد المتاح (Available Balance) فقط إلى تطبيق الشركة. الرصيد المجمد (Frozen Balance) محمي ومقفل بنظام المنصة ولا يمكن تحويله عبر الـ API إطلاقاً لضمان شروط المكافآت ونزاهة الحسابات.'
                                : 'This gateway strictly authorizes transfer of Available Balance only. Frozen balances are securely locked and non-transferrable via API until unfrozen via authorized rebate events.'}
                            </p>
                          </div>

                          {/* Master Gateway Toggle */}
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                                {isAr ? 'تفعيل بوابة الـ API لهذه الشركة' : 'Enable API Gateway for this Bookmaker'}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {isAr
                                  ? 'عند التفعيل، سيظهر خيار الإيداع المباشر في تطبيق الشركة داخل تبويب التحويلات للاعبين'
                                  : 'When enabled, players will see the Direct App Deposit option in Transfers tab'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setTempApiConfig({ ...tempApiConfig, enabled: !tempApiConfig.enabled })
                              }
                              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                                tempApiConfig.enabled
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {tempApiConfig.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              <span>{tempApiConfig.enabled ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Inactive')}</span>
                            </button>
                          </div>

                          {/* Protocol / Method Picker */}
                          <div className="space-y-2">
                            <label className="block font-bold text-slate-700 dark:text-slate-300">
                              {isAr ? 'بروتوكول وطريقة الربط المعتمدة:' : 'Select Integration Protocol / Method:'}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                {
                                  id: 'rest_api',
                                  name: 'Direct REST API',
                                  badge: isAr ? 'موصى به' : 'Recommended',
                                  desc: isAr
                                    ? 'طلب إيداع JSON POST مباشر مع Bearer Token أو API-Key'
                                    : 'Standard JSON POST with Bearer Token header',
                                },
                                {
                                  id: 'merchant_gateway',
                                  name: 'Merchant Gateway',
                                  badge: isAr ? 'بوابة وكلاء' : 'Agent Portal',
                                  desc: isAr
                                    ? 'بوابة وكيل معتمد مع Merchant ID وتوقيع رقمي مشفر (HMAC)'
                                    : 'Sportsbook merchant ID with digital signature hashing',
                                },
                                {
                                  id: 'webhook_s2s',
                                  name: 'Server Webhook (S2S)',
                                  badge: isAr ? 'إشعار فوري' : 'Real-time Callback',
                                  desc: isAr
                                    ? 'استدعاء خادم إلى خادم مع Callback Webhook وتأكيد فوري'
                                    : 'Server-to-Server callback with instant confirmation payload',
                                },
                                {
                                  id: 'basic_auth',
                                  name: 'Basic HTTP Auth',
                                  badge: isAr ? 'كلاسيكي' : 'Classic',
                                  desc: isAr
                                    ? 'توثيق كلاسيكي عبر Username + Password مشفرة'
                                    : 'HTTP Basic Auth headers (username & password)',
                                },
                                {
                                  id: 'oauth2_client',
                                  name: 'OAuth 2.0 Client',
                                  badge: isAr ? 'أمان بنكي' : 'OAuth 2.0',
                                  desc: isAr
                                    ? 'Client ID + Secret وتوليد Token ديناميكي لكل عملية'
                                    : 'OAuth 2.0 token grant exchange flow for bank-grade security',
                                },
                              ].map((proto) => {
                                const isSelected = tempApiConfig.integration_type === proto.id;
                                return (
                                  <button
                                    key={proto.id}
                                    type="button"
                                    onClick={() =>
                                      setTempApiConfig({
                                        ...tempApiConfig,
                                        integration_type: proto.id as CompanyApiIntegrationType,
                                      })
                                    }
                                    className={`p-3 rounded-2xl text-right transition-all border ${
                                      isSelected
                                        ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-slate-900 dark:text-slate-100">
                                        {proto.name}
                                      </span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-snug mb-2">{proto.desc}</p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                      {proto.badge}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Endpoint URL */}
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {isAr ? 'رابط نقطة نهاية التحويل المباشر (API Endpoint URL):' : 'API Endpoint URL:'}
                            </label>
                            <div className="relative">
                              <input
                                type="url"
                                required
                                value={tempApiConfig.endpoint_url}
                                onChange={(e) =>
                                  setTempApiConfig({ ...tempApiConfig, endpoint_url: e.target.value })
                                }
                                placeholder="https://api.company.com/v1/agent/deposit"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-xs pl-8"
                              />
                              <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                            </div>
                          </div>

                          {/* Protocol Specific Credentials Form */}
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                              <Key className="w-4 h-4 text-sky-600" />
                              <span>{isAr ? 'بيانات الاعتماد والمفاتيح السرية:' : 'API Credentials & Keys:'}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {tempApiConfig.integration_type === 'rest_api' && (
                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    {isAr ? 'مفتاح الـ API أو الـ Bearer Token:' : 'API Key / Bearer Token:'}
                                  </label>
                                  <input
                                    type="password"
                                    value={tempApiConfig.api_key || ''}
                                    onChange={(e) =>
                                      setTempApiConfig({ ...tempApiConfig, api_key: e.target.value })
                                    }
                                    placeholder="sk_live_vex_auth_token_..."
                                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                  />
                                </div>
                              )}

                              {tempApiConfig.integration_type === 'merchant_gateway' && (
                                <>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'معرف التاجر / الوكيل (Merchant ID):' : 'Merchant ID:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={tempApiConfig.merchant_id || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, merchant_id: e.target.value })
                                      }
                                      placeholder="MCH-88231-LIVE"
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'المفتاح السري للتوقيع (Secret Key / HMAC):' : 'Secret Key / HMAC:'}
                                    </label>
                                    <input
                                      type="password"
                                      value={tempApiConfig.secret_key || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, secret_key: e.target.value })
                                      }
                                      placeholder="sec_live_..."
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                </>
                              )}

                              {tempApiConfig.integration_type === 'webhook_s2s' && (
                                <>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'رابط الـ Webhook للإشعار وتأكيد الإيداع:' : 'Webhook Callback URL:'}
                                    </label>
                                    <input
                                      type="url"
                                      value={tempApiConfig.webhook_url || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, webhook_url: e.target.value })
                                      }
                                      placeholder="https://api.bookmaker.com/webhook/confirm"
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'سر توقيع الـ Webhook (Signing Secret):' : 'Webhook Signing Secret:'}
                                    </label>
                                    <input
                                      type="password"
                                      value={tempApiConfig.secret_key || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, secret_key: e.target.value })
                                      }
                                      placeholder="whsec_..."
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                </>
                              )}

                              {tempApiConfig.integration_type === 'basic_auth' && (
                                <>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'اسم المستخدم (API Username):' : 'Username:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={tempApiConfig.api_key || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, api_key: e.target.value })
                                      }
                                      placeholder="vex_partner_user"
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'كلمة المرور (API Password):' : 'Password:'}
                                    </label>
                                    <input
                                      type="password"
                                      value={tempApiConfig.secret_key || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, secret_key: e.target.value })
                                      }
                                      placeholder="••••••••"
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                </>
                              )}

                              {tempApiConfig.integration_type === 'oauth2_client' && (
                                <>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'معرف العميل (Client ID):' : 'Client ID:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={tempApiConfig.api_key || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, api_key: e.target.value })
                                      }
                                      placeholder="client_vex_8831"
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      {isAr ? 'السر المعتمد (Client Secret):' : 'Client Secret:'}
                                    </label>
                                    <input
                                      type="password"
                                      value={tempApiConfig.secret_key || ''}
                                      onChange={(e) =>
                                        setTempApiConfig({ ...tempApiConfig, secret_key: e.target.value })
                                      }
                                      placeholder="csec_..."
                                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                    />
                                  </div>
                                </>
                              )}

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  {isAr ? 'اسم متغير حساب اللاعب (Account Param):' : 'Account Parameter Name:'}
                                </label>
                                <input
                                  type="text"
                                  value={tempApiConfig.account_id_param || 'player_id'}
                                  onChange={(e) =>
                                    setTempApiConfig({ ...tempApiConfig, account_id_param: e.target.value })
                                  }
                                  placeholder="player_id"
                                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  {isAr ? 'الحد الأدنى والأقصى للتحويل ($):' : 'Transfer Limits ($):'}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    value={tempApiConfig.min_transfer_amount || 1}
                                    onChange={(e) =>
                                      setTempApiConfig({
                                        ...tempApiConfig,
                                        min_transfer_amount: Number(e.target.value),
                                      })
                                    }
                                    className="w-1/2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
                                  />
                                  <span className="text-slate-400 font-bold">-</span>
                                  <input
                                    type="number"
                                    min="10"
                                    value={tempApiConfig.max_transfer_amount || 5000}
                                    onChange={(e) =>
                                      setTempApiConfig({
                                        ...tempApiConfig,
                                        max_transfer_amount: Number(e.target.value),
                                      })
                                    }
                                    className="w-1/2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Toggles row */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempApiConfig.auto_payout ?? true}
                                  onChange={(e) =>
                                    setTempApiConfig({ ...tempApiConfig, auto_payout: e.target.checked })
                                  }
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                  {isAr ? 'تنفيذ فوري تلقائي عبر API بدون موافقة يدوية' : 'Auto-Payout (Instant)'}
                                </span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempApiConfig.test_mode ?? false}
                                  onChange={(e) =>
                                    setTempApiConfig({ ...tempApiConfig, test_mode: e.target.checked })
                                  }
                                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                                />
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                  {isAr ? 'وضع الاختبار والتجربة (Sandbox Mode)' : 'Sandbox / Test Mode'}
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Handshake & Connection Test Diagnostic Section */}
                          <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800/80 space-y-2.5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-sky-600" />
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                  {isAr ? 'فحص واختبار اتصال الـ API:' : 'Test API Gateway Handshake:'}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={testingApi}
                                onClick={handleTestApiConnection}
                                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                              >
                                {testingApi ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Radio className="w-3.5 h-3.5" />
                                )}
                                <span>{testingApi ? (isAr ? 'جاري الفحص...' : 'Testing...') : (isAr ? 'فحص الاتصال بالخادم' : 'Test Handshake')}</span>
                              </button>
                            </div>

                            {apiTestResult && (
                              <div
                                className={`p-3 rounded-xl text-xs flex items-start gap-2 animate-fade-in ${
                                  apiTestResult.success
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {apiTestResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex items-center justify-between font-bold">
                                    <span>{apiTestResult.statusText}</span>
                                    {apiTestResult.latencyMs > 0 && (
                                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/10">
                                        {apiTestResult.latencyMs}ms
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] leading-relaxed">{apiTestResult.message}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setConfiguringApiCompany(null)}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>

                          <button
                            type="button"
                            disabled={savingApiConfig}
                            onClick={handleSaveApiConfig}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            {savingApiConfig ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : apiSaveSuccess ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {apiSaveSuccess
                                ? isAr
                                  ? 'تم الحفظ وتطبيق الربط بنجاح!'
                                  : 'Saved Successfully!'
                                : isAr
                                ? 'حفظ وتطبيق إعدادات الربط'
                                : 'Save & Apply API Settings'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: COMPANY API INTEGRATIONS                             */}
              {/* ========================================================= */}
              {activeTab === 'company_api' && (
                <CompanyApiIntegration
                  companies={companies}
                  onUpdateCompany={onUpdateCompany}
                  lang={lang}
                  onCopyToast={onCopyToast}
                  initialSelectedCompanyId={apiPreselectedCompanyId}
                  onOpenHealthDashboard={() => setActiveTab('integration_health')}
                />
              )}

              {/* ========================================================= */}
              {/* TAB: WEBHOOK & API INTEGRATION TESTER                     */}
              {/* ========================================================= */}
              {activeTab === 'integration_tester' && (
                <IntegrationTester
                  companies={companies}
                  lang={lang}
                  onCopyToast={onCopyToast}
                  initialCompanyId={apiPreselectedCompanyId}
                />
              )}

              {/* ========================================================= */}
              {/* TAB: INTEGRATION HEALTH DASHBOARD                         */}
              {/* ========================================================= */}
              {activeTab === 'integration_health' && (
                <IntegrationHealthDashboard
                  companies={companies}
                  lang={lang}
                  onCopyToast={onCopyToast}
                  onOpenTester={(compKey) => {
                    if (compKey) setApiPreselectedCompanyId(compKey);
                    setActiveTab('integration_tester');
                  }}
                  onNavigateToApiConfig={(compKey) => {
                    if (compKey) setApiPreselectedCompanyId(compKey);
                    setActiveTab('company_api');
                  }}
                />
              )}

              {/* ========================================================= */}
              {/* TAB 3: ASO STRATEGY & METADATA SUITE                      */}
              {/* ========================================================= */}
              {activeTab === 'aso_suite' && (
                <div className="space-y-5">
                  {/* Top ASO Banner */}
                  <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-400" />
                        <h3 className="font-extrabold text-sm sm:text-base">
                          {isAr
                            ? 'خطة ASO المعتمدة (App Store Optimization) للمشروع ولكل شركة'
                            : 'Master ASO Strategy & Metadata Generator'}
                        </h3>
                      </div>
                      <p className="text-xs text-sky-100 max-w-2xl leading-relaxed">
                        {isAr
                          ? 'نصوص تسويقية جاهزة ومطابقة لمعايير Google Play Console و Apple App Store Connect، مع الكلمات المفتاحية الأكثر بحثاً ونصوص لقطات الشاشة لتصدر نتائج البحث.'
                          : 'High-conversion metadata ready for Google Play & Apple App Store submission, targeting peak organic traffic in MENA and global betting markets.'}
                      </p>
                    </div>
                  </div>

                  {/* Switch between Global Project ASO vs Company ASO */}
                  <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAsoTargetMode('global')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          asoTargetMode === 'global'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? 'خطة ASO الشاملة لكامل المشروع' : 'Global Project ASO'}
                      </button>

                      <button
                        onClick={() => setAsoTargetMode('company')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          asoTargetMode === 'company'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? 'حزم ASO مخصصة لكل شركة' : 'Per-Company ASO Packs'}
                      </button>
                    </div>

                    {asoTargetMode === 'company' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{isAr ? 'الشركة:' : 'Company:'}</span>
                        <select
                          value={asoSelectedCompanyId}
                          onChange={(e) => setAsoSelectedCompanyId(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.promo_code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* ----------------- GLOBAL ASO ----------------- */}
                  {asoTargetMode === 'global' && (
                    <div className="space-y-4">
                      {/* Google Play Box */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>Google Play Store Package</span>
                          </h4>
                          <button
                            onClick={() => exportAsoAsJson(GLOBAL_PROJECT_ASO.googlePlay, 'vex_google_play_aso')}
                            className="text-xs text-sky-600 font-bold flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تصدير JSON</span>
                          </button>
                        </div>

                        {/* Title Field */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              العنوان (Title - Max 30 chars):
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {GLOBAL_PROJECT_ASO.googlePlay.title}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(GLOBAL_PROJECT_ASO.googlePlay.title, 'gp_title')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1"
                          >
                            {copiedAsoField === 'gp_title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>نسخ</span>
                          </button>
                        </div>

                        {/* Short Desc Field */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              الوصف القصير (Short Description - Max 80 chars):
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {GLOBAL_PROJECT_ASO.googlePlay.subtitleOrShortDesc}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(GLOBAL_PROJECT_ASO.googlePlay.subtitleOrShortDesc, 'gp_short')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1"
                          >
                            {copiedAsoField === 'gp_short' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>نسخ</span>
                          </button>
                        </div>

                        {/* Long Description Full */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold">
                              الوصف الكامل المحسن لمحركات البحث (Full Description - Max 4000 chars):
                            </span>
                            <button
                              onClick={() => copyToClipboard(GLOBAL_PROJECT_ASO.googlePlay.fullDescription, 'gp_full')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1"
                            >
                              {copiedAsoField === 'gp_full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>نسخ الوصف الكامل</span>
                            </button>
                          </div>
                          <pre className="text-[11px] text-slate-600 dark:text-slate-400 font-sans whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            {GLOBAL_PROJECT_ASO.googlePlay.fullDescription}
                          </pre>
                        </div>
                      </div>

                      {/* Apple App Store Box */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                            <span>Apple App Store Package</span>
                          </h4>
                          <button
                            onClick={() => exportAsoAsJson(GLOBAL_PROJECT_ASO.appStore, 'vex_app_store_aso')}
                            className="text-xs text-sky-600 font-bold flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تصدير JSON</span>
                          </button>
                        </div>

                        {/* Keywords Field */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              الكلمات المفتاحية (Keywords - Max 100 chars comma-separated):
                            </span>
                            <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                              {GLOBAL_PROJECT_ASO.appStore.keywords}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(GLOBAL_PROJECT_ASO.appStore.keywords || '', 'ios_kw')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1"
                          >
                            {copiedAsoField === 'ios_kw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>نسخ الكلمات</span>
                          </button>
                        </div>
                      </div>

                      {/* Target Keywords Matrix */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {isAr ? 'قاعدة بيانات الكلمات المفتاحية الأكثر بحثاً (Target Keywords)' : 'Keyword Opportunities'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {GLOBAL_PROJECT_ASO.keywordsDatabase.map((kw, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {kw.keyword}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  الترتيب المستهدف: {kw.targetRank}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {kw.searchVolume.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ----------------- COMPANY ASO PACK ----------------- */}
                  {asoTargetMode === 'company' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <CompanyBrandLogo companyName={companyAsoSuite.companyName} size="md" />
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                حزمة ASO الرسمية لـ {companyAsoSuite.companyName}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                مجهزة بكود البرومو الرسمي ورابط التحميل لتلك الشركة.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => exportAsoAsJson(companyAsoSuite, `${companyAsoSuite.companyName.toLowerCase()}_aso_pack`)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تصدير الحزمة JSON</span>
                          </button>
                        </div>

                        {/* Title Box */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">عنوان المتجر المخصص:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {companyAsoSuite.googlePlay.title}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(companyAsoSuite.googlePlay.title, 'cmp_title')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-1 text-xs"
                          >
                            {copiedAsoField === 'cmp_title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>نسخ</span>
                          </button>
                        </div>

                        {/* Keywords Box */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">كلمات مفتاحية مستهدفة:</span>
                            <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                              {companyAsoSuite.appStore.keywords}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(companyAsoSuite.appStore.keywords || '', 'cmp_kw')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-1 text-xs"
                          >
                            {copiedAsoField === 'cmp_kw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>نسخ</span>
                          </button>
                        </div>

                        {/* Full Description Box */}
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold">
                              الوصف الكامل التسويقي المحتوي على كود الوكالة المعتمد:
                            </span>
                            <button
                              onClick={() => copyToClipboard(companyAsoSuite.googlePlay.fullDescription, 'cmp_desc')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-1 text-xs"
                            >
                              {copiedAsoField === 'cmp_desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>نسخ الوصف</span>
                            </button>
                          </div>
                          <pre className="text-[11px] text-slate-600 dark:text-slate-400 font-sans whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            {companyAsoSuite.googlePlay.fullDescription}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: GENERAL BRANDING, HIGH-RES ICONS & MANIFEST STUDIO */}
              {/* ========================================================= */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <Palette className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-sm sm:text-base">
                            {isAr ? 'استوديو أيقونات التطبيق عالية الدقة ونظام الـ Manifest' : 'High-Resolution App Icon & Dynamic Manifest Studio'}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            PWA READY
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                          {isAr
                            ? 'قم برفع أيقونات فائقة الدقة (512x512 أو 1024x1024) أو اختر من النماذج الاحترافية المعتمدة. يتم تطبيق وتوليد الـ Manifest و Favicon و Apple Touch Icon ووسوم Meta Tags فورياً.'
                            : 'Upload ultra high-res assets or choose from curated vector presets. Generates dynamic Web App Manifest, Favicon, Apple Touch Icon, and Meta Tags on the fly.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleDownloadManifest}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                        title="تحميل manifest.json"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isAr ? 'تحميل Manifest' : 'Get Manifest'}</span>
                      </button>
                      <button
                        onClick={handleCopyHtmlSnippet}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        {copiedManifestSnippet ? <Check className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
                        <span>{copiedManifestSnippet ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ وسوم HTML' : 'Copy HTML Tags')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Studio Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Panel: Configuration & Input Methods */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Section 1: Core App Identity */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            {isAr ? 'بيانات التطبيق والهوية البصرية' : 'App Identity & Palette'}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                              {isAr ? 'اسم التطبيق (App Name)' : 'Application Name'}
                            </label>
                            <input
                              type="text"
                              value={editAppName}
                              onChange={(e) => setEditAppName(e.target.value)}
                              placeholder="VEX Deals"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                              {isAr ? 'لون الثيم الأساسي (Theme Color)' : 'PWA Theme Color'}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editThemeColor}
                                onChange={(e) => setEditThemeColor(e.target.value)}
                                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                              />
                              <input
                                type="text"
                                value={editThemeColor}
                                onChange={(e) => setEditThemeColor(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'الشعار الوصفي (Tagline / Description)' : 'Tagline / Description'}
                          </label>
                          <input
                            type="text"
                            value={editTagline}
                            onChange={(e) => setEditTagline(e.target.value)}
                            placeholder="منصة الولاء والتعويضات والتحليلات الرياضية الذكية"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Centralized Branding & Configuration Metadata Panel */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              {isAr ? 'إعدادات وسوم الموقع ومتاعب السيو (SEO Meta & Contact)' : 'SEO Meta Tags & Contact Settings'}
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                                {isAr ? 'وصف الموقع (Meta Description)' : 'Meta Description'}
                              </label>
                              <textarea
                                rows={2}
                                value={editMetaDescription}
                                onChange={(e) => setEditMetaDescription(e.target.value)}
                                placeholder="منصة الولاء والتعويضات والتحليلات الرياضية..."
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                                  {isAr ? 'الكلمات المفتاحية (Meta Keywords)' : 'Meta Keywords'}
                                </label>
                                <input
                                  type="text"
                                  value={editMetaKeywords}
                                  onChange={(e) => setEditMetaKeywords(e.target.value)}
                                  placeholder="تعويضات, رهانات, بونص, ارباح"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                                  {isAr ? 'البريد الإلكتروني للدعم (Contact Email)' : 'Contact Support Email'}
                                </label>
                                <input
                                  type="email"
                                  value={editContactEmail}
                                  onChange={(e) => setEditContactEmail(e.target.value)}
                                  placeholder="support@vexdeals.com"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Icon Source Switcher */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              {isAr ? 'مصدر الأيقونة عالية الدقة' : 'High-Resolution Icon Source'}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {editIconType === 'upload' ? 'FILE UPLOAD' : editIconType === 'preset' ? 'VECTOR PRESETS' : 'CUSTOM URL'}
                          </span>
                        </div>

                        {/* Switcher Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditIconType('upload')}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                              editIconType === 'upload'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>{isAr ? 'رفع صورة عالية الدقة' : 'Upload File'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditIconType('preset')}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                              editIconType === 'preset'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{isAr ? 'نماذج Vector SVG' : 'Vector Presets'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditIconType('custom')}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                              editIconType === 'custom'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Globe className="w-4 h-4" />
                            <span>{isAr ? 'رابط مباشر (URL)' : 'Direct URL'}</span>
                          </button>
                        </div>

                        {/* MODE 1: FILE UPLOAD */}
                        {editIconType === 'upload' && (
                          <div className="space-y-3">
                            <label
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleFileUpload(e);
                              }}
                              className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-all group"
                            >
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                onChange={handleFileUpload}
                                className="hidden"
                              />

                              {isProcessingUpload ? (
                                <div className="flex flex-col items-center gap-2">
                                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {isAr ? 'جاري معالجة وفحص دقة الصورة...' : 'Processing and analyzing resolution...'}
                                  </span>
                                </div>
                              ) : editUploadedData ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-emerald-500/50 relative">
                                    <img src={editUploadedData} alt="Uploaded Icon" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                                      {isAr ? 'تم تحميل الصورة بنجاح!' : 'Icon asset loaded!'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {editIconResolution.width} × {editIconResolution.height} px
                                      {editIconResolution.width >= 512 && ' (High-Res Master 🌟)'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 underline group-hover:text-emerald-600">
                                    {isAr ? 'اضغط لتغيير الصورة' : 'Click to change image'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-center">
                                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {isAr ? 'اسحب وأفلت ملف الأيقونة هنا، أو اضغط للاختيار' : 'Drag and drop high-res icon, or click to browse'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                      يدعم PNG, SVG, JPG, WebP (يُفضل 512×512 أو 1024×1024 بكسل لضمان وضوح فائق)
                                    </p>
                                  </div>
                                </div>
                              )}
                            </label>

                            {uploadErrorMessage && (
                              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900">
                                {uploadErrorMessage}
                              </div>
                            )}

                            {editUploadedData && (
                              <div className="flex items-center justify-between text-xs text-slate-500 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span>{isAr ? 'جودة المعالجة المعتمدة:' : 'Processing Quality:'}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {editIconResolution.width >= 512 ? 'Ultra High-Definition 4K' : 'Standard Web Definition'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* MODE 2: CURATED VECTOR PRESETS */}
                        {editIconType === 'preset' && (
                          <div className="space-y-3">
                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                              {[
                                { id: 'all', label: isAr ? 'الكل' : 'All' },
                                { id: 'core', label: isAr ? 'رسمي (VEX)' : 'Official' },
                                { id: 'vip', label: isAr ? 'ملكي (VIP)' : 'Royal VIP' },
                                { id: 'sports', label: isAr ? 'رياضي و AI' : 'Sports AI' },
                                { id: 'crypto', label: isAr ? 'محافظ وأرصدة' : 'Crypto/Cash' },
                                { id: 'partner', label: isAr ? 'شركاء المراهنات' : 'Partners' },
                              ].map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setPresetCategoryFilter(cat.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                                    presetCategoryFilter === cat.id
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              ))}
                            </div>

                            {/* Preset Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                              {ICON_PRESETS.filter((p) => presetCategoryFilter === 'all' || p.category === presetCategoryFilter).map(
                                (preset) => {
                                  const isSelected = editPresetIconId === preset.id;
                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => setEditPresetIconId(preset.id)}
                                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all relative ${
                                        isSelected
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                      }`}
                                    >
                                      {isSelected && (
                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                                          ✓
                                        </span>
                                      )}
                                      <div
                                        className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-md"
                                        dangerouslySetInnerHTML={{
                                          __html: getPresetSvg(preset.id, editAppName || 'VEX', 128),
                                        }}
                                      />
                                      <div className="text-center">
                                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block truncate max-w-[110px]">
                                          {isAr ? preset.nameAr : preset.nameEn}
                                        </span>
                                        <span className="text-[9px] text-slate-400 block font-mono">
                                          SVG 512x512
                                        </span>
                                      </div>
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                        {/* MODE 3: DIRECT URL */}
                        {editIconType === 'custom' && (
                          <div className="space-y-2">
                            <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300">
                              {isAr ? 'رابط ملف الأيقونة المباشر (Direct Image URL):' : 'Direct Image URL'}
                            </label>
                            <input
                              type="url"
                              value={editCustomUrl}
                              onChange={(e) => setEditCustomUrl(e.target.value)}
                              placeholder="https://example.com/assets/high-res-icon.png"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                            />
                            <p className="text-[10px] text-slate-500">
                              {isAr
                                ? 'يتم جلب الصورة تلقائياً وتضمينها في الـ Manifest ووسوم الميتا.'
                                : 'Icon will be linked directly to PWA manifest and browser meta tags.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 3: Save & Apply Primary CTA */}
                      <button
                        onClick={handleSaveBranding}
                        disabled={savingBranding}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingBranding ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : brandingSavedSuccess ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        <span>
                          {brandingSavedSuccess
                            ? isAr
                              ? '✨ تم حفظ الأيقونة وتحديث الـ Manifest و Meta Tags فوراً!'
                              : '✨ Manifest & Meta Tags Updated Successfully!'
                            : isAr
                            ? '🚀 حفظ وتطبيق الأيقونة والـ Manifest فورياً'
                            : '🚀 Save & Deploy High-Res Assets & Manifest'}
                        </span>
                      </button>
                    </div>

                    {/* Right Panel: Live Previews, Framing & Export Suite */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Framing & Safe Area Controls */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            {isAr ? 'شكل التأطير والأمان' : 'Framing & Safe Area'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMaskableSafeZone(!showMaskableSafeZone)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                              showMaskableSafeZone
                                ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? 'شبكة الأمان Maskable (80%)' : 'Maskable Safe Zone'}
                          </button>
                        </div>

                        {/* Shape Switcher */}
                        <div className="flex gap-2">
                          {[
                            { id: 'circle', label: isAr ? 'دائري (Web/iOS)' : 'Circle' },
                            { id: 'squircle', label: isAr ? 'Squircle (Android)' : 'Squircle' },
                            { id: 'rounded', label: isAr ? 'مربع منحني (App Store)' : 'Rounded' },
                          ].map((shape) => (
                            <button
                              key={shape.id}
                              type="button"
                              onClick={() => setEditShape(shape.id as any)}
                              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                                editShape === shape.id
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {shape.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Device Mockup Preview Screen */}
                      <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        {/* Device Selector Tabs */}
                        <div className="flex items-center justify-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          {[
                            { id: 'android', label: '📱 Android', icon: Smartphone },
                            { id: 'ios', label: '🍏 iOS Home', icon: Smartphone },
                            { id: 'tab', label: '🌐 Browser Tab', icon: Globe },
                            { id: 'store', label: '🏪 Store 512', icon: Maximize2 },
                          ].map((dev) => (
                            <button
                              key={dev.id}
                              type="button"
                              onClick={() => setPreviewDevice(dev.id as any)}
                              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                                previewDevice === dev.id
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              {dev.label}
                            </button>
                          ))}
                        </div>

                        {/* Screen Mockup Container */}
                        <div className="relative min-h-[200px] flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
                          {/* Android Preview */}
                          {previewDevice === 'android' && (
                            <div className="flex flex-col items-center gap-2 animate-fadeIn">
                              <div className="relative">
                                <AppIconRenderer
                                  branding={{
                                    appName: editAppName || 'VEX Deals',
                                    tagline: editTagline,
                                    iconType: editIconType,
                                    presetIconId: editPresetIconId,
                                    customIconUrl: editCustomUrl,
                                    uploadedIconData: editUploadedData,
                                  }}
                                  size="xl"
                                  shape={editShape}
                                  className="shadow-2xl ring-2 ring-white/20"
                                />
                                {showMaskableSafeZone && (
                                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 pointer-events-none scale-[0.8] flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-amber-300 bg-black/60 px-1 rounded">SAFE</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold text-white tracking-tight drop-shadow-md">
                                {editAppName || 'VEX Deals'}
                              </span>
                            </div>
                          )}

                          {/* iOS Preview */}
                          {previewDevice === 'ios' && (
                            <div className="flex flex-col items-center gap-2 animate-fadeIn">
                              <div className="relative p-1">
                                <AppIconRenderer
                                  branding={{
                                    appName: editAppName || 'VEX Deals',
                                    tagline: editTagline,
                                    iconType: editIconType,
                                    presetIconId: editPresetIconId,
                                    customIconUrl: editCustomUrl,
                                    uploadedIconData: editUploadedData,
                                  }}
                                  size="xl"
                                  shape="rounded"
                                  className="shadow-2xl ring-2 ring-white/30"
                                />
                              </div>
                              <span className="text-xs font-bold text-white tracking-tight drop-shadow-md">
                                {editAppName || 'VEX Deals'}
                              </span>
                            </div>
                          )}

                          {/* Browser Tab Preview */}
                          {previewDevice === 'tab' && (
                            <div className="w-full max-w-xs bg-slate-900 rounded-xl p-2 border border-slate-700 space-y-2 animate-fadeIn">
                              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                                <AppIconRenderer
                                  branding={{
                                    appName: editAppName || 'VEX Deals',
                                    tagline: editTagline,
                                    iconType: editIconType,
                                    presetIconId: editPresetIconId,
                                    customIconUrl: editCustomUrl,
                                    uploadedIconData: editUploadedData,
                                  }}
                                  size="xs"
                                  shape="circle"
                                />
                                <span className="text-xs font-bold text-white truncate">
                                  {editAppName || 'VEX Deals'} - {editTagline || 'Loyalty'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 text-center font-mono">
                                https://{PLATFORM_DOMAIN}/
                              </div>
                            </div>
                          )}

                          {/* Store 512 Preview */}
                          {previewDevice === 'store' && (
                            <div className="flex flex-col items-center gap-3 animate-fadeIn">
                              <AppIconRenderer
                                branding={{
                                  appName: editAppName || 'VEX Deals',
                                  tagline: editTagline,
                                  iconType: editIconType,
                                  presetIconId: editPresetIconId,
                                  customIconUrl: editCustomUrl,
                                  uploadedIconData: editUploadedData,
                                }}
                                size="2xl"
                                shape="squircle"
                                className="shadow-2xl ring-4 ring-emerald-500/30"
                              />
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                512 × 512 MASTER ASSET
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Download Individual Asset Badges */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                          {isAr ? 'تحميل حزم الأيقونات الفردية' : 'Export Icon Assets Package'}
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadIconAsset(512)}
                            disabled={!!downloadingAsset}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between"
                          >
                            <span>512×512 Master</span>
                            <Download className="w-3.5 h-3.5 text-emerald-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadIconAsset(192)}
                            disabled={!!downloadingAsset}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between"
                          >
                            <span>192×192 Mobile</span>
                            <Download className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                        </div>

                        {/* Manifest JSON Inspector Accordion */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setShowManifestJsonViewer(!showManifestJsonViewer)}
                            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-emerald-600 font-bold"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5" />
                              {isAr ? 'عرض كود manifest.json المولد لحظياً' : 'Inspect Dynamic Manifest JSON'}
                            </span>
                            <span>{showManifestJsonViewer ? '▲' : '▼'}</span>
                          </button>

                          {showManifestJsonViewer && (
                            <pre className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {JSON.stringify(
                                generateManifestObject({
                                  appName: editAppName || 'VEX Deals',
                                  tagline: editTagline || '',
                                  iconType: editIconType,
                                  presetIconId: editPresetIconId,
                                  customIconUrl: editCustomUrl,
                                  uploadedIconData: editUploadedData,
                                  themeColor: editThemeColor,
                                }),
                                null,
                                2
                              )}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: COMPENSATION REQUESTS                              */}
              {/* ========================================================= */}
              {activeTab === 'compensation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? 'طلبات التعويض الواردة للمراجعة والاعتماد' : 'Incoming Compensation Requests'}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      إجمالي: {requests.length} طلبات
                    </span>
                  </div>

                  {requests.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500">
                        {isAr ? 'لا توجد طلبات تعويض مسجلة حالياً.' : 'No compensation requests found.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {requests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-white dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {req.company_name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                #{req.id}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  req.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : req.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {req.status === 'pending'
                                  ? 'قيد المراجعة'
                                  : req.status === 'approved'
                                  ? 'معتمد'
                                  : 'مرفوض'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 font-mono">
                              <span>كود الرهان: {req.bet_code}</span>
                              <span>المبلغ: ${req.amount}</span>
                            </div>
                          </div>

                          {req.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onApproveRequest(req.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                              >
                                اعتماد التعويض
                              </button>
                              <button
                                onClick={() => {
                                  setRejectId(req.id);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
                              >
                                رفض
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reject Reason Prompt */}
                  {rejectId && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                        سبب رفض الطلب #{rejectId}:
                      </h4>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-200"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRejectId(null)}
                          className="px-3 py-1 text-xs rounded-lg bg-slate-200"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={async () => {
                            await onRejectRequest(rejectId, rejectReason);
                            setRejectId(null);
                          }}
                          className="px-3 py-1 text-xs rounded-lg bg-rose-600 text-white font-bold"
                        >
                          تأكيد الرفض
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: AI AGENT                                           */}
              {/* ========================================================= */}
              {activeTab === 'ai_agent' && (
                <div className="space-y-5">
                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl flex items-start gap-3">
                    <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <p className="font-extrabold text-sm text-purple-900 dark:text-purple-300 mb-1">
                        {isAr ? 'وكيل Gemini الذكي للتحليلات الرياضية' : 'Gemini AI Match Forecast Engine'}
                      </p>
                      <p>
                        {isAr
                          ? 'يقوم الوكيل الذكي بتحليل المباريات الرياضية الكبرى عبر نموذج gemini-3.8-flash على الخادم (Server-Side)، واستخراج نسب الفوز ونقاط القوة التكتيكية وتوزيع التوقعات الفورية على المستخدمين.'
                          : 'The tactical AI agent evaluates upcoming matches using server-side Gemini, generating win probabilities and automated alerts.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      {isAr ? 'توليد وإرسال إشعار توقع ذكي للمستخدمين فوراً' : 'Generate & Broadcast AI Pick'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? 'عند الضغط، سيقوم الوكيل الذكي بفحص قمة المباريات القادمة وصياغة تنبيه تكتيكي عاجل وإضافته لقائمة إشعارات جميع المستخدمين.'
                        : 'Analyzes the top featured match and immediately broadcasts an AI alert to all active app users.'}
                    </p>
                    <button
                      onClick={onTriggerAiBroadcast || onTriggerAiPrediction}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-600/30 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isAr ? 'توليد وبث توقع الذكاء الاصطناعي الآن' : 'Broadcast AI Match Alert Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 7: BROADCAST NOTIFICATIONS                            */}
              {/* ========================================================= */}
              {activeTab === 'broadcast' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isAr ? 'بث إشعار عام لجميع مستخدمي المنصة' : 'Broadcast Custom Push Notification'}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'عنوان الإشعار:' : 'Notification Title:'}
                      </label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder={isAr ? 'تحديث هام بخصوص تعويضات الأسبوع' : 'Important System Announcement'}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'نص الرسالة:' : 'Message Content:'}
                      </label>
                      <textarea
                        rows={3}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder={isAr ? 'تمت إضافة عروض استرداد نقدي جديدة بنسبة 10% لجميع الشركاء...' : 'Message text...'}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      {['ai_prediction', 'sports_news', 'compensation', 'security', 'system'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setBroadcastCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            broadcastCategory === cat
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleSendBroadcast}
                      disabled={broadcastSending || !broadcastTitle || !broadcastMessage}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {broadcastSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      <span>
                        {broadcastSent
                          ? isAr
                            ? 'تم إرسال الإشعار بنجاح!'
                            : 'Broadcast Sent!'
                          : isAr
                          ? 'إرسال الإشعار لجميع الأجهزة'
                          : 'Send Broadcast'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: NOTIFICATIONS HUB                                   */}
              {/* ========================================================= */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {isAr ? 'مركز الإشعارات الحية في الوقت الحقيقي (Real-Time)' : 'Real-Time Notifications Hub'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isAr ? 'إدارة ومتابعة وبث الإشعارات لجميع عملاء المنصة عبر دوكر والـ VPS' : 'Manage and broadcast live alerts across VPS and Docker cluster'}
                      </p>
                    </div>
                    {onTriggerAiBroadcast && (
                      <button
                        onClick={onTriggerAiBroadcast}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'بث توقع ذكاء اصطناعي فوري' : 'Trigger AI Broadcast'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        {isAr ? 'لا توجد إشعارات مسجلة حالياً.' : 'No notifications found.'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            n.read
                              ? 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              {n.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                              {n.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${n.read ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'}`}>
                              {n.read ? (isAr ? 'مقروء' : 'Read') : (isAr ? 'غير مقروء (نشط)' : 'Unread (Live)')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 8: STORE COMPLIANCE                                   */}
              {/* ========================================================= */}
              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <p className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300 mb-1">
                        {isAr ? 'جاهزية متجر أبل (App Store) وجوجل بلاي (Google Play)' : 'Store Readiness Audit'}
                      </p>
                      <p>
                        {isAr
                          ? 'النظام مهيأ بالكامل ليطابق إرشادات Apple App Store Guideline 5.1.1 و 5.3 بالإضافة لسياسات Google Play Real Money Gaming (RMG).'
                          : 'Full adherence to Apple Guideline 5.1.1 and Google Play RMG policies.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        title: isAr ? 'بوابة التحقق من السن (+18 Age Gate)' : 'Age Gate (+18)',
                        desc: isAr ? 'إلزام المستخدمين بتأكيد العمر القانوني قبل استعراض العروض الرياضية.' : 'Strict 18+ legal age verification.',
                        status: 'مفعل ومطبق',
                      },
                      {
                        title: isAr ? 'حذف الحساب والبيانات (Apple Guideline 5.1.1)' : 'Account Purge (Apple 5.1.1)',
                        desc: isAr ? 'زر حذف شامل ومباشر لجميع بيانات المستخدم والمحافظ وأرقام الهاتف.' : 'Instant, total account and wallet deletion.',
                        status: 'مفعل ومطبق',
                      },
                      {
                        title: isAr ? 'تنبيه اللعب المسؤول (Responsible Gaming)' : 'Responsible Gaming Links',
                        desc: isAr ? 'تنويهات قانونية وروابط لمنظمات BeGambleAware و GamCare.' : 'Official responsible gambling help resources.',
                        status: 'مفعل ومطبق',
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white">{item.title}</h4>
                          <p className="text-slate-500 text-[11px] mt-0.5">{item.desc}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Admin Footer */}
            <div className="px-5 py-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                VEX Engine v3.8 • Multi-Tenant & Full ASO Suite
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs"
              >
                {isAr ? 'إغلاق لوحة التحكم' : 'Close Dashboard'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
