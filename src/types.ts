export type Language = 'ar' | 'en' | 'es' | 'ru';
export type ThemeMode = 'light' | 'dark';

export const PLATFORM_DOMAIN = 'vex.deals';
export const PLATFORM_URL = 'https://vex.deals';

export type CompanyApiIntegrationType =
  | 'rest_api'           // Direct REST API (Bearer Token / API Key)
  | 'merchant_gateway'   // Merchant / Agent Gateway (Merchant ID + Secret Key)
  | 'webhook_s2s'        // Server-to-Server (S2S) Webhook Trigger
  | 'basic_auth'         // Basic HTTP Auth API (Username / Password)
  | 'oauth2_client';     // OAuth 2.0 Client Credentials (Client ID + Secret)

export type ApiMethodActionType =
  | 'deposit'           // Direct player credit / deposit to app account
  | 'payout'            // Payout / withdrawal from app account
  | 'balance_check'     // Balance inquiry
  | 'account_verify'    // Verify player ID exists in bookmaker system
  | 'webhook_callback'  // Receive server-to-server callback confirmation
  | 'all';              // Universal gateway handling all transactions

export interface CompanyApiMethod {
  id: string;
  name: string;
  name_ar?: string;
  method_type: CompanyApiIntegrationType;
  endpoint_url: string;
  enabled: boolean;
  is_primary?: boolean;
  action_type?: ApiMethodActionType;
  api_key?: string;
  secret_key?: string;
  client_id?: string;
  merchant_id?: string;
  webhook_url?: string;
  account_id_param?: string;
  min_transfer_amount?: number;
  max_transfer_amount?: number;
  allow_available_only: boolean; // Always true: Strict policy protects frozen balances
  auto_payout?: boolean;
  test_mode?: boolean;
  custom_headers?: string;
  notes?: string;
  last_test_status?: 'success' | 'failed' | 'untested';
  last_test_at?: string;
  last_test_latency?: number;
  last_test_message?: string;
  last_response_sample?: any;
}

export interface CompanyApiConfig {
  enabled: boolean;
  integration_type: CompanyApiIntegrationType;
  endpoint_url: string;             // e.g. https://api.company.com/v1/players/deposit
  api_key?: string;                 // API Key / Bearer Token / Client ID
  secret_key?: string;              // Secret Key / Signature Hash / Password
  merchant_id?: string;             // Merchant ID / Agent ID
  webhook_url?: string;             // Webhook callback URL for confirmation
  account_id_param?: string;        // Player account parameter name (e.g. 'player_id', 'user_id', 'account_id')
  min_transfer_amount?: number;     // Minimum transfer threshold in USD
  max_transfer_amount?: number;     // Maximum transfer limit per transaction
  allow_available_only: boolean;    // Always true: Only available balance (not frozen) is transferable
  auto_payout: boolean;             // Immediate automated execution via API
  test_mode?: boolean;              // Sandbox / Test Mode
  custom_headers?: string;          // Optional custom HTTP headers (JSON string)
  notes?: string;                   // Notes or docs URL
  last_test_status?: 'success' | 'failed' | 'untested';
  last_test_at?: string;
}

export interface Company {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  name_es?: string;
  name_ru?: string;
  type: string;
  details: string;
  details_en?: string;
  details_es?: string;
  details_ru?: string;
  is_active: boolean;
  icon?: string;
  logo_url?: string;
  address?: string;
  affiliate_link: string;
  app_link: string;
  bot_icon?: string;
  promo_code: string;
  show_in_comp: boolean;
  color: string;
  description: string;
  description_en?: string;
  description_es?: string;
  description_ru?: string;
  badge?: string;
  badge_en?: string;
  badge_es?: string;
  badge_ru?: string;
  bonus_text?: string;
  bonus_text_en?: string;
  bonus_text_es?: string;
  bonus_text_ru?: string;
  api_config?: CompanyApiConfig;
  api_methods?: CompanyApiMethod[];
}

export type AccountStatus = 'pending' | 'active' | 'rejected';

export interface CompensationAccount {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  account_number: string;
  status: AccountStatus;
  sub_affiliate_verified?: boolean; // Verified to be registered under VEX promo code
  created_at: string;
}

export interface Wallet {
  user_id: string;
  company_id: string;
  company_name: string;
  icon?: string;
  frozen: number;
  available: number;
  pending_locked?: number; // Concurrency anti-double-spend lock
  last_unfreeze_at?: string; // Anti-Sybil daily cooldown
  created_at: string;
}

export type CompensationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CompensationRequest {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  account_number: string;
  bet_slip_id?: string; // Required for fraud prevention: official bookmaker slip ID
  loss_date?: string;
  screenshot?: string;
  status: CompensationRequestStatus;
  amount: number;
  currency?: string;
  note?: string;
  verification_stage?: 'auto_checked' | 'slip_verified' | 'admin_approved';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  company_id: string;
  company_name: string;
  referral_code: string;
  referred_account: string;
  status: 'registered' | 'pending';
  created_at: string;
  unlocked_amount?: number;
}

export type TransferStatus = 'otp_pending' | 'completed' | 'failed' | 'rejected';

export interface Transfer {
  id: string;
  from_user: string;
  to_account: string;
  to_account_owner_name?: string;
  company_id: string;
  company_name: string;
  amount: number;
  status: TransferStatus;
  otp_phone?: string;
  created_at: string;
  transfer_type?: 'friend_transfer' | 'company_api_payout';
  api_reference?: string;
  api_integration_type?: CompanyApiIntegrationType;
  api_response_message?: string;
}

export interface UserProfile {
  user_id: string;
  phone_number: string;
  country_code: string;
  is_phone_verified: boolean;
  telegram_username?: string;
  telegram_id?: string;
  pin_set: boolean;
  failed_pin_attempts: number;
  pin_lock_until?: number;
  created_at: string;
}

export interface ActiveOtpSession {
  transfer_id?: string;
  action_type: 'transfer' | 'phone_verify' | 'security_update';
  code: string;
  phone_number: string;
  expires_at: number;
  resend_available_at: number;
  attempts: number;
}

export interface SecurityVulnerability {
  id: string;
  titleAr: string;
  titleEn: string;
  severity: 'critical' | 'high' | 'medium';
  problemAr: string;
  solutionAr: string;
  implementationStatus: 'active' | 'ready';
  iconType: 'shield-alert' | 'users' | 'file-check' | 'refresh-cw' | 'lock' | 'alert-triangle';
}

export interface CompanySectionContent {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  contentAr: string;
  contentEn: string;
  enabled: boolean;
}

export interface CompanyCustomWebsite {
  heroBadgeAr?: string;
  heroBadgeEn?: string;
  welcomeBonusAr?: string;
  welcomeBonusEn?: string;
  promoCode?: string;
  affiliateLink?: string;
  appDownloadLink?: string;
  sections?: {
    overview?: CompanySectionContent;
    bonus?: CompanySectionContent;
    registrationGuide?: CompanySectionContent;
    cashbackPolicy?: CompanySectionContent;
    aiPredictions?: CompanySectionContent;
    faq?: CompanySectionContent;
  };
}

export interface AppBranding {
  appName: string;
  tagline: string;
  metaDescription?: string;
  metaKeywords?: string;
  contactEmail?: string;
  supportPhone?: string;
  iconType: 'preset' | 'custom' | 'upload';
  presetIconId: string;
  customIconUrl?: string;
  uploadedIconData?: string;
  iconResolution?: {
    width: number;
    height: number;
  };
  highResAssets?: {
    icon192?: string;
    icon512?: string;
    appleTouch?: string;
    favicon?: string;
    maskable?: string;
  };
  themeColor?: string;
  backgroundColor?: string;
  targetCompanyId?: string; // 'all' or company id like 'CMP1XB001'
  exclusiveMode?: boolean; // true when app is transformed to a single company
  companyCustomWebsites?: Record<string, CompanyCustomWebsite>;
  updatedAt?: string;
}

export type NotificationCategory = 'ai_prediction' | 'sports_news' | 'compensation' | 'transfer' | 'security' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  data?: {
    matchId?: string;
    confidence?: number;
    predictionText?: string;
    amount?: number;
    companyName?: string;
    actionUrl?: string;
  };
}

export interface SportsMatchFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  league: string;
  leagueLogo?: string;
  kickoffTime: string;
  status: 'upcoming' | 'live' | 'finished';
  liveScore?: string;
  minute?: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25?: number;
    bothScore?: number;
  };
  aiAnalysis?: AiMatchAnalysis;
}

export interface AiMatchAnalysis {
  matchId: string;
  generatedAt: string;
  predictedScore: string;
  winProbabilities: {
    home: number;
    draw: number;
    away: number;
  };
  confidenceScore: number;
  tacticalSummary: string;
  keyFactors: string[];
  recommendedPick: string;
  riskLevel: 'low' | 'moderate' | 'high';
  disclaimer: string;
  poweredBy?: string;
}

export interface SportsNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  imageUrl: string;
  url?: string;
}

export type TabType = 'companies' | 'wallets' | 'transfers' | 'referrals' | 'activity' | 'ai-sports';

export interface WebhookTestRecord {
  id: string;
  companyId: string;
  companyName: string;
  endpointUrl: string;
  httpMethod: 'POST' | 'PUT' | 'PATCH' | 'GET';
  eventType: string;
  payload: any;
  headers: Record<string, string>;
  responseStatus: number;
  responseLatencyMs: number;
  responseBody: any;
  curlCommand: string;
  executedAt: string;
  success: boolean;
  notes?: string;
}

export interface HourlyHealthMetric {
  hour: string;
  timestamp: number;
  successCount: number;
  failureCount: number;
  totalCount: number;
  avgLatencyMs: number;
  successRate: number;
}

export interface ConnectionHealthRecord {
  methodId: string;
  methodName: string;
  methodNameAr?: string;
  companyId: string;
  companyName: string;
  companyColor?: string;
  promoCode?: string;
  methodType: CompanyApiIntegrationType;
  endpointUrl: string;
  enabled: boolean;
  isPrimary?: boolean;
  successRate24h: number;
  totalCalls24h: number;
  successCalls24h: number;
  failedCalls24h: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  status: 'healthy' | 'degraded' | 'down' | 'untested';
  lastCheckedAt: string;
  lastStatusCode: number;
  lastStatusMessage: string;
  errorBreakdown: {
    badRequest: number;
    unauthorized: number;
    rateLimited: number;
    gatewayError: number;
    timeout: number;
  };
}

