import { Company } from '../src/types';

export const DEFAULT_COMPANIES: Company[] = [];

export const DEFAULT_COMPENSATION_REQUESTS: any[] = [];
export const DEFAULT_PHONE_CHANGE_REQUESTS: any[] = [];
export const DEFAULT_TELEGRAM_CONFIG = { bot_token: '', bot_username: '', bot_name: '', bot_id: 0, is_active: false, updated_at: '' };
export const DEFAULT_APP_BRANDING = { app_name: 'VEX Deals', app_name_ar: 'VEX Deals', primary_color: '#6366f1', secondary_color: '#8b5cf6', logo_url: '', updated_at: '' };
export const DEFAULT_NOTIFICATIONS: any[] = [];
export const DEFAULT_AB_TEST_CAMPAIGNS: any[] = [];

export interface ServerCompensationRequest {
  id: string; userId: string; companyId: string; betSlipId: string; lossDate: string;
  amountUsd: number; currency: string; screenshotUrl?: string; notes?: string;
  status: 'pending' | 'approved' | 'rejected'; createdAt: string; reviewedAt?: string; adminNotes?: string;
}

export interface ServerPhoneChangeRequest {
  id: string; userId: string; currentPhone: string; newPhone: string; reason: string;
  status: 'pending' | 'approved' | 'rejected'; createdAt: string; reviewedAt?: string; adminNotes?: string;
}
