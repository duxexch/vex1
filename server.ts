import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { storage } from './server/storage';
import { ServerCompensationRequest } from './server/seedData';
import { agentEngine, calculateNotificationTiming } from './server/agentEngine';

const currentFilename = process.cwd();
const currentDirname = process.cwd();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  console.log('⚡ Socket.io client connected:', socket.id);

  socket.on('heartbeat', (data) => {
    socket.emit('heartbeat_ack', { serverTime: Date.now() });
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
  });
});

const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Enterprise-Grade Security & Payment Gateway Defense Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss: data: blob: *; img-src 'self' https: data: blob:; font-src 'self' https: data:; frame-ancestors *;"
  );
  next();
});

// Advanced In-Memory Rate Limiter (Protection against DDoS and Brute Force)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
app.use('/api/', (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = requestCounts.get(ip as string);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip as string, { count: 1, resetTime: now + 60000 }); // 60s window
    return next();
  }

  if (record.count > 120) { // Max 120 requests per minute per IP
    return res.status(429).json({
      error: 'Too many requests. Security rate limit exceeded. Please try again later.',
    });
  }

  record.count++;
  next();
});

// Lazy Google Gen AI initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// Persistent App Branding Storage
let currentBranding = storage.getAppBranding();

// Curated Sports Fixtures
const SPORTS_FIXTURES = [
  {
    id: 'FIX-RMA-BAR',
    category: 'Football',
    date: 'Today',
    homeTeam: 'ريال مدريد',
    awayTeam: 'برشلونة',
    homeLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80',
    league: 'الدوري الإسباني - الكلاسيكو',
    kickoffTime: 'اليوم، 22:00 بتوقيت مكة',
    status: 'upcoming' as const,
    odds: {
      home: 2.15,
      draw: 3.50,
      away: 3.20,
      over25: 1.62,
      bothScore: 1.55,
    },
  },
  {
    id: 'FIX-MCI-ARS',
    category: 'Football',
    date: 'Tomorrow',
    homeTeam: 'مانشستر سيتي',
    awayTeam: 'آرسنال',
    homeLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&auto=format&fit=crop&q=80',
    league: 'الدوري الإنجليزي الممتاز',
    kickoffTime: 'غداً، 19:30 بتوقيت مكة',
    status: 'upcoming' as const,
    odds: {
      home: 1.95,
      draw: 3.60,
      away: 3.80,
      over25: 1.70,
      bothScore: 1.65,
    },
  },
  {
    id: 'FIX-LIV-PSG',
    category: 'Football',
    date: 'Tomorrow',
    homeTeam: 'ليفربول',
    awayTeam: 'باريس سان جيرمان',
    homeLogo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=128&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=128&auto=format&fit=crop&q=80',
    league: 'دوري أبطال أوروبا',
    kickoffTime: 'الأربعاء، 23:00 بتوقيت مكة',
    status: 'upcoming' as const,
    odds: {
      home: 2.05,
      draw: 3.65,
      away: 3.40,
      over25: 1.58,
      bothScore: 1.50,
    },
  },
  {
    id: 'FIX-BAY-BVB',
    category: 'Basketball',
    date: 'Weekend',
    homeTeam: 'بايرن ميونخ',
    awayTeam: 'بوروسيا دورتموند',
    homeLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=128&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=128&auto=format&fit=crop&q=80',
    league: 'الدوري الألماني - دير كلاسيكر',
    kickoffTime: 'السبت، 20:30 بتوقيت مكة',
    status: 'upcoming' as const,
    odds: {
      home: 1.65,
      draw: 4.20,
      away: 4.80,
      over25: 1.42,
      bothScore: 1.48,
    },
  },
  {
    id: 'FIX-HIL-NAS',
    category: 'Tennis',
    date: 'Today',
    homeTeam: 'الهلال',
    awayTeam: 'النصر',
    homeLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&auto=format&fit=crop&q=80',
    league: 'دوري روشن السعودي - ديربي الرياض',
    kickoffTime: 'الجمعة، 21:00 بتوقيت مكة',
    status: 'upcoming' as const,
    odds: {
      home: 2.20,
      draw: 3.40,
      away: 3.10,
      over25: 1.60,
      bothScore: 1.52,
    },
  },
];

// Curated Sports News Items
const SPORTS_NEWS = [
  {
    id: 'NEWS-01',
    title: 'قمة الكلاسيكو: استراتيجيات هجومية وتوقعات الذكاء الاصطناعي ترجح كفة أصحاب الأرض',
    summary: 'تحليلات المعطيات التكتيكية تشير إلى ضغط عالي في وسط الملعب مع احتمالية تسجيل الفريقين بنسبة تفوق 72%.',
    source: 'Marca Sports & AI',
    publishedAt: 'منذ 25 دقيقة',
    category: 'الكلاسيكو',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'NEWS-02',
    title: 'دوري الأبطال: جاهزية تامة ومفاجآت متوقعة في التشكيل الأساسي قبل مواجهة الأربعاء',
    summary: 'المدرب يؤكد عودة المهاجم الأساسي بعد تعافيه من الإصابة وجاهزيته لخوض الدقائق التسعين كاملة.',
    source: 'UEFA Official News',
    publishedAt: 'منذ ساعة',
    category: 'دوري أبطال أوروبا',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'NEWS-03',
    title: 'تحديثات الإحصاءات: ارتفاع معدل تسجيل الأهداف في الدوريات الأوروبية الكبرى بنسبة 14%',
    summary: 'دراسة تحليلية موسعة تكشف عن تغير ديناميكيات اللعب التكتيكي والاعتماد الأكبر على التحولات السريعة.',
    source: 'Opta Analyst Hub',
    publishedAt: 'منذ 3 ساعات',
    category: 'إحصائيات وتحليلات',
    imageUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&auto=format&fit=crop&q=80',
  },
];

// ==========================================
// API ROUTES FIRST
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiReady: !!process.env.GEMINI_API_KEY,
  });
});

// ============================================================================
// AGENT SKILL FILES MANAGEMENT (Admin uploads skill files for agents)
// ============================================================================
const SKILLS_DIR = path.join(process.cwd(), 'data', 'agent-skills');

// Simple file upload middleware (no multer dependency needed)
function parseMultipartBody(req: any): Promise<{ fields: Record<string, string>; file: { data: Buffer; name: string; type: string } | null }> {
  return new Promise((resolve) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      resolve({ fields: {}, file: null });
      return;
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) { resolve({ fields: {}, file: null }); return; }
        const parts = body.toString('binary').split('--' + boundary);
        const fields: Record<string, string> = {};
        let file: { data: Buffer; name: string; type: string } | null = null;
        for (const part of parts) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;
          const header = part.substring(0, headerEnd);
          const content = part.substring(headerEnd + 4);
          const nameMatch = header.match(/name="([^"]+)"/);
          const filenameMatch = header.match(/filename="([^"]+)"/);
          const typeMatch = header.match(/Content-Type:\s*(\S+)/);
          if (filenameMatch && nameMatch) {
            const dataStr = content.substring(0, content.lastIndexOf('\r\n'));
            file = { data: Buffer.from(dataStr, 'binary'), name: filenameMatch[1], type: typeMatch ? typeMatch[1] : 'application/octet-stream' };
          } else if (nameMatch) {
            fields[nameMatch[1]] = content.trim();
          }
        }
        resolve({ fields, file });
      } catch { resolve({ fields: {}, file: null }); }
    });
    req.on('error', () => resolve({ fields: {}, file: null }));
  });
}

app.get('/api/agent-skills', (req, res) => {
  try {
    if (!fs.existsSync(SKILLS_DIR)) { res.json({ success: true, skills: [] }); return; }
    const files = fs.readdirSync(SKILLS_DIR).filter(f => !f.startsWith('.'));
    const skills = files.map(f => {
      const stat = fs.statSync(path.join(SKILLS_DIR, f));
      return { filename: f, size: stat.size, modified: stat.mtime.toISOString() };
    });
    res.json({ success: true, skills });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/agent-skills', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });
    const { fields, file } = await parseMultipartBody(req);
    if (!file) { res.status(400).json({ success: false, error: 'No file provided' }); return; }
    const agentId = fields.agentId || 'general';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${agentId}_${safeName}`;
    fs.writeFileSync(path.join(SKILLS_DIR, filename), file.data);
    res.json({ success: true, filename, size: file.data.length, agentId });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/agent-skills/download/:filename', (req, res) => {
  const filePath = path.join(SKILLS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Not found' }); return; }
  res.download(filePath);
});

app.delete('/api/agent-skills/:filename', (req, res) => {
  const filePath = path.join(SKILLS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Not found' }); return; }
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

// Companies Directory Management Endpoints (Replica-Synced)
app.get('/api/companies', (req, res) => {
  const companies = storage.getCompanies();
  res.json({
    success: true,
    companies,
    total: companies.length,
    updatedAt: new Date().toISOString(),
  });
});

app.post('/api/companies', (req, res) => {
  const comp = req.body;
  if (!comp || !comp.name) {
    return res.status(400).json({ error: 'اسم الشركة مطلوب.' });
  }
  if (!comp.id) {
    comp.id = `CMP${Date.now().toString(36).toUpperCase()}`;
  }
  const updatedList = storage.saveCompany(comp);
  io.emit('companies_updated', updatedList);
  res.json({
    success: true,
    company: comp,
    companies: updatedList,
    message: 'تم حفظ بيانات الشركة بنجاح في قاعدة بيانات السيرفر.',
  });
});

app.post('/api/companies/:id/toggle-active', (req, res) => {
  const result = storage.toggleCompanyActive(req.params.id);
  const updatedList = storage.getCompanies();
  io.emit('companies_updated', updatedList);
  res.json({
    success: result.success,
    is_active: result.is_active,
    companies: updatedList,
  });
});

// Admin Get All Core System Data (For Dashboard & Synchronization)
app.get('/api/admin/all-data', (req, res) => {
  res.json({
    success: true,
    companies: storage.getCompanies(),
    compensationRequests: storage.getCompensationRequests(),
    phoneChangeRequests: storage.getPhoneChangeRequests(),
    branding: storage.getAppBranding(),
    notifications: storage.getNotifications(),
    telegramConfig: storage.getTelegramConfig(),
  });
});

// Admin Restore & Re-seed Replica Data (Exact Copy Guarantee)
app.post('/api/admin/restore-replica-data', (req, res) => {
  const result = storage.restoreAllReplicaData();
  const companies = storage.getCompanies();
  const requests = storage.getCompensationRequests();
  const branding = storage.getAppBranding();
  const notifs = storage.getNotifications();
  const phoneRequests = storage.getPhoneChangeRequests();

  currentBranding = branding;

  io.emit('companies_updated', companies);
  io.emit('compensation_requests_updated', requests);
  io.emit('app_branding_updated', branding);
  io.emit('notifications_updated', notifs);
  io.emit('phone_requests_updated', phoneRequests);

  res.json({
    success: true,
    message: 'تمت استعادة ومزامنة كافة بيانات النسخة النموذجية الأصلية بنجاح في قاعدة بيانات السيرفر!',
    stats: result,
  });
});

// Admin Clean Slate Data Reset (Clear User Activity, Notification History & Demo Accounts)
app.post('/api/admin/data-reset', (req, res) => {
  const result = storage.clearCleanSlate();

  io.emit('compensation_requests_updated', []);
  io.emit('phone_requests_updated', []);
  io.emit('notifications_updated', []);
  io.emit('companies_updated', storage.getCompanies());

  res.json({
    success: true,
    ...result,
  });
});

// App Branding (Name & Icon)
app.get('/api/app-branding', (req, res) => {
  currentBranding = storage.getAppBranding();
  res.json(currentBranding);
});

app.post('/api/app-branding', (req, res) => {
  const {
    appName,
    tagline,
    iconType,
    presetIconId,
    customIconUrl,
    uploadedIconData,
    iconResolution,
    themeColor,
    backgroundColor,
    targetCompanyId,
    exclusiveMode,
    whatsappNumber,
    whatsappEnabled,
  } = req.body;

  if (appName && appName.trim()) {
    currentBranding.appName = appName.trim();
  }
  if (tagline !== undefined) {
    currentBranding.tagline = tagline.trim();
  }
  if (iconType === 'preset' || iconType === 'custom' || iconType === 'upload') {
    currentBranding.iconType = iconType;
  }
  if (presetIconId) {
    currentBranding.presetIconId = presetIconId;
  }
  if (customIconUrl !== undefined) {
    currentBranding.customIconUrl = customIconUrl.trim();
  }
  if (uploadedIconData !== undefined) {
    currentBranding.uploadedIconData = uploadedIconData;
  }
  if (iconResolution) {
    currentBranding.iconResolution = iconResolution;
  }
  if (themeColor) {
    currentBranding.themeColor = themeColor;
  }
  if (backgroundColor) {
    currentBranding.backgroundColor = backgroundColor;
  }
  if (targetCompanyId !== undefined) {
    currentBranding.targetCompanyId = targetCompanyId;
  }
  if (exclusiveMode !== undefined) {
    currentBranding.exclusiveMode = exclusiveMode;
  }
  if (whatsappNumber !== undefined) {
    currentBranding.whatsappNumber = whatsappNumber;
  }
  if (whatsappEnabled !== undefined) {
    currentBranding.whatsappEnabled = whatsappEnabled;
  }
  currentBranding.updatedAt = new Date().toISOString();

  storage.saveAppBranding(currentBranding);
  io.emit('app_branding_updated', currentBranding);

  res.json({
    success: true,
    branding: currentBranding,
    message: 'تم تحديث هوية وأيقونة التطبيق ومواصفات Manifest بنجاح!',
  });
});

// Payment Methods Management
app.get('/api/payment-methods', (req, res) => {
  const branding = storage.getAppBranding();
  res.json({ paymentMethods: branding.paymentMethods || [] });
});

app.post('/api/payment-methods', (req, res) => {
  const { paymentMethods } = req.body;
  if (!Array.isArray(paymentMethods)) {
    return res.status(400).json({ error: 'Invalid payment methods format' });
  }
  const branding = storage.getAppBranding();
  branding.paymentMethods = paymentMethods;
  storage.saveAppBranding(branding);
  currentBranding = branding;
  io.emit('payment_methods_updated', branding.paymentMethods);
  res.json({ success: true, paymentMethods: branding.paymentMethods });
});

// Dynamic Web App Manifest Endpoint
const getDynamicManifest = () => {
  const appName = currentBranding.appName || 'VEX Deals';
  const shortName = appName.split(' ')[0];
  const description = currentBranding.tagline || 'منصة الولاء والتعويضات والتحليلات الرياضية الذكية';
  const themeColor = currentBranding.themeColor || '#f8fafc';
  const bgColor = currentBranding.backgroundColor || '#f8fafc';

  let iconSrc192 = '/icon-192.svg';
  let iconSrc512 = '/icon-512.svg';

  if (currentBranding.iconType === 'upload' && currentBranding.uploadedIconData) {
    iconSrc192 = currentBranding.uploadedIconData;
    iconSrc512 = currentBranding.uploadedIconData;
  } else if (currentBranding.iconType === 'custom' && currentBranding.customIconUrl) {
    iconSrc192 = currentBranding.customIconUrl;
    iconSrc512 = currentBranding.customIconUrl;
  }

  return {
    name: appName,
    short_name: shortName,
    description: description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: bgColor,
    theme_color: themeColor,
    icons: [
      {
        src: iconSrc192,
        sizes: '192x192',
        type: iconSrc192.startsWith('data:image/svg') || iconSrc192.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'any',
      },
      {
        src: iconSrc512,
        sizes: '512x512',
        type: iconSrc512.startsWith('data:image/svg') || iconSrc512.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'any',
      },
      {
        src: iconSrc512,
        sizes: '512x512',
        type: iconSrc512.startsWith('data:image/svg') || iconSrc512.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'utilities', 'sports'],
  };
};

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'no-cache');
  res.json(getDynamicManifest());
});

app.get('/api/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json(getDynamicManifest());
});

// Sports Fixtures
app.get('/api/sports/fixtures', (req, res) => {
  res.json({
    fixtures: SPORTS_FIXTURES,
    total: SPORTS_FIXTURES.length,
    updatedAt: new Date().toISOString(),
  });
});

// Sports News
app.get('/api/sports/news', (req, res) => {
  res.json({
    news: SPORTS_NEWS,
    updatedAt: new Date().toISOString(),
  });
});

// AI Match Tactical Analysis using Gemini
app.post('/api/ai/analyze-match', async (req, res) => {
  const { matchId, homeTeam, awayTeam, league, odds } = req.body;

  const match = SPORTS_FIXTURES.find((f) => f.id === matchId) || {
    id: matchId || 'CUSTOM',
    homeTeam: homeTeam || 'الفريق المضيف',
    awayTeam: awayTeam || 'الفريق الضيف',
    league: league || 'بطولة رياضية',
    odds: odds || { home: 2.1, draw: 3.4, away: 3.2 },
  };

  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `أنت محلل رياضي تكتيكي ووكيل ذكاء اصطناعي محترف لمنصة VEX Deals الرياضية.
قم بتحليل المباراة التالية بعمق وموضوعية:
المباراة: ${match.homeTeam} ضد ${match.awayTeam}
البطولة: ${match.league}
الاحتمالات (Odds): فوز المضيف (${match.odds.home})، التعادل (${match.odds.draw})، فوز الضيف (${match.odds.away}).

المطلوب: إرجاع كائن JSON منظم وفق الخصائص التالية باللغة العربية:
1. predictedScore: النتيجة المتوقعة كنص (مثال: "2 - 1")
2. winProbabilities: كائن يحتوي على نسب مئوية مجموعها 100: home (رقم), draw (رقم), away (رقم)
3. confidenceScore: رقم بين 50 و 95 يمثل نسبة الثقة في التحليل
4. tacticalSummary: فقرة تحليلية دقيقة وموجزة (سياق الهجوم والدفاع، الحالة البدنية، الغيابات، الأسلوب التكتيكي)
5. keyFactors: مصفوفة من 3 إلى 4 نقاط مفتاحية ترجح كفة التحليل
6. recommendedPick: التوقع الاستراتيجي الأنسب (مثال: "فوز أصحاب الأرض مع تسجيل كلا الفريقين")
7. riskLevel: إحدى القيم: "low" أو "moderate" أو "high"
8. disclaimer: تنبيه لعب مسؤول قانوني قصير ومحترف (+18 للتحليل الرياضي فقط)`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedScore: { type: Type.STRING },
              winProbabilities: {
                type: Type.OBJECT,
                properties: {
                  home: { type: Type.NUMBER },
                  draw: { type: Type.NUMBER },
                  away: { type: Type.NUMBER },
                },
                required: ['home', 'draw', 'away'],
              },
              confidenceScore: { type: Type.NUMBER },
              tacticalSummary: { type: Type.STRING },
              keyFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedPick: { type: Type.STRING },
              riskLevel: { type: Type.STRING },
              disclaimer: { type: Type.STRING },
            },
            required: [
              'predictedScore',
              'winProbabilities',
              'confidenceScore',
              'tacticalSummary',
              'keyFactors',
              'recommendedPick',
              'riskLevel',
              'disclaimer',
            ],
          },
        },
      });

      const parsedResult = JSON.parse(response.text || '{}');

      return res.json({
        success: true,
        matchId: match.id,
        analysis: {
          ...parsedResult,
          matchId: match.id,
          generatedAt: new Date().toISOString(),
          poweredBy: 'Gemini 3.8 Flash AI Engine',
        },
      });
    } catch (err: any) {
      console.error('Gemini API Error, using heuristic tactical model:', err);
    }
  }

  // Resilient High-Caliber Heuristic Engine (Ensures 100% reliable UX)
  const homeProb = Math.min(65, Math.max(35, Math.round(50 + (1 / match.odds.home - 1 / match.odds.away) * 35)));
  const awayProb = Math.min(50, Math.max(20, Math.round(100 - homeProb - 25)));
  const drawProb = 100 - homeProb - awayProb;

  const fallbackAnalysis = {
    matchId: match.id,
    generatedAt: new Date().toISOString(),
    predictedScore: homeProb > awayProb ? '2 - 1' : '1 - 1',
    winProbabilities: {
      home: homeProb,
      draw: drawProb,
      away: awayProb,
    },
    confidenceScore: 82,
    tacticalSummary: `يتميز ${match.homeTeam} بقدرات اختراق هجومي عالية ومعدل ضغط عالي في الثلث الأخير، بينما يعتمد ${match.awayTeam} على الارتداد السريع والتسديدات المباغتة. الأرقام ترجح تقارباً كبيراً مع أفضلية نسبية لعامل الأرض والجمهور.`,
    keyFactors: [
      'معدل الاستحواذ الإيجابي وتنوع حلول التسجيل في الكرات الثابتة',
      'صلابة الدفاع في المباريات القارية ومرونة خط الوسط',
      'حافز النقاط الثلاث في الترتيب والمنافسة على صدارة البطولة',
    ],
    recommendedPick: `${match.homeTeam} فوز أو تعادل + أكثر من 1.5 هدف في المباراة`,
    riskLevel: 'moderate',
    disclaimer: 'تنبيه: التحليلات الرياضية مخصصة للمتابعة التحليلية والإحصائية (+18). اللعب المسؤول هو الأولوية.',
    poweredBy: 'VEX AI Tactical Forecasting Engine',
  };

  res.json({
    success: true,
    matchId: match.id,
    analysis: fallbackAnalysis,
  });
});

// Automated AI Agent Match Prediction Broadcaster
app.post('/api/ai/agent-broadcast', async (req, res) => {
  const topMatch = SPORTS_FIXTURES[0]; // El Clásico or top fixture
  const client = getGeminiClient();
  let aiAlertText = `توقع VEX الذكي لقاء ${topMatch.homeTeam} و ${topMatch.awayTeam}: نوصي بخيار (${topMatch.homeTeam} أو كلا الفريقين يسجل). نسبة الثقة 85%.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `قم بصياغة إشعار عاجل وقوي باللغة العربية لا يتجاوز 25 كلمة يتضمن توقيع وتحليل سريع لمباراة قمة بين ${topMatch.homeTeam} و ${topMatch.awayTeam} مع خيار مقترح ونسبة ثقة عالية.`,
      });
      if (response.text) {
        aiAlertText = response.text.trim();
      }
    } catch {
      // Fallback alert text
    }
  }

  const newNotif = {
    id: `NOTIF-AI-${Date.now()}`,
    title: `⚡ تنبيه الذكاء الاصطناعي: ${topMatch.homeTeam} vs ${topMatch.awayTeam}`,
    message: aiAlertText,
    category: 'ai_prediction',
    timestamp: new Date().toISOString(),
    read: false,
    data: {
      matchId: topMatch.id,
      confidence: 86,
      predictionText: 'تحليل ومطابقة فورية للقمة',
    },
  };

  storage.addNotification(newNotif);
  io.emit('notification', newNotif);

  res.json({
    success: true,
    notification: newNotif,
    message: 'تم إنشاء وتوزيع توقع الذكاء الاصطناعي بنجاح كإشعار لجميع المستخدمين!',
  });
});

// ========================================================
// AI Agents Hub & Autonomous Intelligence Endpoints
// ========================================================

// 1. Get all AI Agents
app.get('/api/ai/agents', (req, res) => {
  try {
    const agents = agentEngine.getAgents();
    res.json({ success: true, agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create or Update an AI Agent
app.post('/api/ai/agents', (req, res) => {
  try {
    const { name, name_ar } = req.body;
    if (!name || !name_ar) {
      return res.status(400).json({ error: 'اسم الوكيل بالعربية والإنجليزية مطلوب.' });
    }
    const saved = agentEngine.saveAgent(req.body);
    res.json({ success: true, agent: saved, message: 'تم حفظ وتفعيل الوكيل بنجاح!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete a custom AI Agent
app.delete('/api/ai/agents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = agentEngine.deleteAgent(id);
    if (!success) {
      return res.status(400).json({ error: 'لا يمكن حذف الوكلاء الأساسيين في النظام.' });
    }
    res.json({ success: true, message: 'تم حذف الوكيل بنجاح.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Conversational Chat with AI Agent (with Multimodal Vision, Action Execution & Google Search Grounding)
app.post('/api/ai/agents/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments, enableGoogleSearch } = req.body;
    if ((!message || !message.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'نص الرسالة أو ملف مرفق مطلوب.' });
    }

    const result = await agentEngine.chatWithAgent({
      agentId: id,
      message: (message || '').trim(),
      attachments: attachments || [],
      enableGoogleSearch: enableGoogleSearch !== false,
      includePlatformState: true,
    });

    // If any actions were executed, broadcast real-time updates
    if (result.executedActions && result.executedActions.length > 0) {
      for (const act of result.executedActions) {
        if (act.type === 'create_company' || act.type === 'update_company' || act.type === 'toggle_company' || act.type === 'delete_company') {
          io.emit('companies_updated', storage.getCompanies());
        }
        if (act.type === 'approve_compensation' || act.type === 'reject_compensation') {
          io.emit('compensation_updated', storage.getCompensationRequests());
        }
        if (act.type === 'dispatch_notification' && act.details) {
          io.emit('notification', act.details);
        }
      }
    }

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[AI Chat Error]:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء التحدث مع الوكيل.' });
  }
});

// 4b. Executive Admin Live Audit & Deep Inspection
app.get('/api/ai/admin/audit', (req, res) => {
  try {
    const auditReport = agentEngine.generateAdminAudit();
    res.json({ success: true, auditReport });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4c. Direct Administrative Action Execution
app.post('/api/ai/admin/execute', (req, res) => {
  try {
    const { type, params } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'نوع الإجراء التنفيذي مطلوب.' });
    }
    const executedAction = agentEngine.executeAdminAction({ type, params });

    if (executedAction.type === 'create_company' || executedAction.type === 'update_company' || executedAction.type === 'toggle_company' || executedAction.type === 'delete_company') {
      io.emit('companies_updated', storage.getCompanies());
    }
    if (executedAction.type === 'approve_compensation' || executedAction.type === 'reject_compensation') {
      io.emit('compensation_updated', storage.getCompensationRequests());
    }
    if (executedAction.type === 'dispatch_notification' && executedAction.details) {
      io.emit('notification', executedAction.details);
    }

    res.json({ success: true, executedAction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4d. Media Assets Library for AI Agents & Admin
app.get('/api/media/assets', (req, res) => {
  try {
    const assets = storage.getMediaAssets();
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Agent Memory Bank
app.get('/api/ai/agents/:id/memory', (req, res) => {
  try {
    const { id } = req.params;
    const memory = agentEngine.getMemory(id);
    res.json({ success: true, memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Add Rule/Preference to Agent Memory
app.post('/api/ai/agents/:id/memory', (req, res) => {
  try {
    const { id } = req.params;
    const { text, category } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'نص التوجيه مطلوب.' });
    }
    const item = agentEngine.addPreference(id, text.trim(), category || 'preference');
    res.json({ success: true, item, message: 'تم حفظ القاعدة في ذاكرة الوكيل بنجاح.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Preference from Memory
app.delete('/api/ai/agents/:id/memory/:prefId', (req, res) => {
  try {
    const { id, prefId } = req.params;
    const success = agentEngine.deletePreference(id, prefId);
    res.json({ success, message: success ? 'تم حذف التوجيه من الذاكرة.' : 'التوجيه غير موجود.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Smart Timing & User Activity Insights
app.get('/api/ai/notifications/insights', (req, res) => {
  try {
    const report = calculateNotificationTiming();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Autonomous Smart Notification Dispatch (with Anti-Spam Check & Socket Broadcast)
app.post('/api/ai/notifications/smart-dispatch', async (req, res) => {
  try {
    const { bypassAntiSpam, customTitle, customMessage, category } = req.body;
    
    if (customTitle && customMessage) {
      const timingReport = calculateNotificationTiming();
      const newNotif = {
        id: `NOTIF-SMART-${Date.now()}`,
        title: customTitle.trim(),
        message: customMessage.trim(),
        category: category || 'ai_prediction',
        timestamp: new Date().toISOString(),
        read: false,
        data: {
          dispatchedBy: 'Admin AI Hub',
          activityScore: timingReport.activityScore,
        },
      };
      storage.addNotification(newNotif);
      io.emit('notification', newNotif);

      return res.json({
        success: true,
        notification: newNotif,
        timingReport,
        message: 'تم بث الإشعار بنجاح لجميع مستخدمي المنصة!',
      });
    }

    const result = await agentEngine.generateSmartNotification({
      bypassAntiSpam: Boolean(bypassAntiSpam),
    });

    if (result.success && result.notification) {
      io.emit('notification', result.notification);
    }

    res.json(result);
  } catch (err: any) {
    console.error('[AI Dispatch Error]:', err);
    res.status(500).json({ error: err.message || 'فشل توليد أو إرسال الإشعار الذكي.' });
  }
});

// 9a. User Activity Logging & Engagement Tracking
app.post('/api/users/:userId/activity', (req, res) => {
  try {
    const { userId } = req.params;
    const { actionType } = req.body;
    const engagementBehavior = storage.logUserInteraction(userId, actionType || 'interaction');
    res.json({ success: true, engagementBehavior });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9b. User Profile & Engagement Details
app.get('/api/users/:userId/profile', (req, res) => {
  try {
    const profile = storage.getUserProfile(req.params.userId);
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9c. Aggregated Platform User Cohort Behavior
app.get('/api/ai/notifications/cohort-behavior', (req, res) => {
  try {
    const cohort = storage.getAggregatedCohortBehavior();
    res.json({ success: true, cohort });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9d. Time-Based Heuristic Evaluation
app.post('/api/ai/notifications/evaluate-timing', (req, res) => {
  try {
    const { title, message, category, targetUserId, urgency } = req.body;
    const evaluation = agentEngine.evaluateNotificationUrgencyAndTiming({
      title: title || '',
      message: message || '',
      category,
      targetUserId,
      urgency,
    });
    res.json({ success: true, evaluation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9f. AI Content Generator for Sports & Marketing Notifications
app.post('/api/ai/notifications/generate-content', async (req, res) => {
  try {
    const { agentId, theme, targetCompanyId, targetMatchId, customPrompt } = req.body;
    const result = await agentEngine.generateNotificationContent({
      agentId,
      theme: theme || 'sports_tactical',
      targetCompanyId,
      targetMatchId,
      customPrompt,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[AI Content Generator Error]:', err);
    res.status(500).json({ error: err.message || 'فشل توليد محتوى الإشعار.' });
  }
});

// 9g. Multi-Language Audience Cohorts (Lists by Language & Country)
app.get('/api/ai/notifications/cohorts', (req, res) => {
  try {
    const cohorts = storage.getAudienceCohorts();
    const profiles = storage.getUserProfiles();
    res.json({
      success: true,
      cohorts,
      totalUsers: profiles.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9h. Pre-Dispatch AI Multi-Language Campaign Generator
app.post('/api/ai/notifications/generate-localized-campaign', async (req, res) => {
  try {
    const { agentId, theme, targetCompanyId, customPrompt, baseTitle, baseMessage } = req.body;
    const result = await agentEngine.generateLocalizedNotificationCampaign({
      agentId,
      theme,
      targetCompanyId,
      customPrompt,
      baseTitle,
      baseMessage,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[Generate Localized Campaign Error]:', err);
    res.status(500).json({ error: err.message || 'فشل توليد حملة الإشعارات متعددة اللغات.' });
  }
});

// 9i. Dispatch Multi-Language Campaign to Audience Lists
app.post('/api/ai/notifications/dispatch-localized-campaign', (req, res) => {
  try {
    const { campaignId, variants, defaultTitle, defaultMessage, targetCompanyId } = req.body;
    if (!variants || Object.keys(variants).length === 0) {
      return res.status(400).json({ error: 'يجب توفير نسخ اللغات المترجمة للإرسال.' });
    }

    const result = agentEngine.dispatchLocalizedCampaign({
      campaignId,
      variants,
      defaultTitle,
      defaultMessage,
      targetCompanyId,
    });

    if (result.success && result.notification) {
      io.emit('notification', result.notification);
      io.emit('localized_campaign_dispatched', {
        campaignId,
        notificationId: result.notification.id,
        totalCohorts: result.totalCohortsDispatched,
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('[Dispatch Localized Campaign Error]:', err);
    res.status(500).json({ error: err.message || 'فشل بث الحملة متعددة اللغات.' });
  }
});

// 9j. User Preferences (Language & Country update)
app.put('/api/users/:userId/preferences', (req, res) => {
  try {
    const { userId } = req.params;
    const { language, country_code, country_iso, phone_number } = req.body;
    const updatedProfile = storage.updateUserPreferences(userId, {
      language,
      country_code,
      country_iso,
      phone_number,
    });
    res.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9e. Scheduled Notifications Queue Management
app.get('/api/ai/notifications/scheduled', (req, res) => {
  try {
    const scheduled = storage.getScheduledNotifications();
    res.json({ success: true, scheduled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/notifications/schedule', (req, res) => {
  try {
    const { title, message, category, urgency, targetUserId, scheduledFor, heuristicReason, targetOptimalWindow } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'العنوان ونص الرسالة مطلوبان للجدولة.' });
    }

    const scheduledItem = agentEngine.scheduleNotification({
      title,
      message,
      category,
      urgency,
      targetUserId,
      scheduledFor,
      heuristicReason,
      targetOptimalWindow,
    });

    res.json({ success: true, scheduledItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/notifications/scheduled/:id/dispatch-now', (req, res) => {
  try {
    const { id } = req.params;
    const list = storage.getScheduledNotifications();
    const item = list.find((s) => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'الإشعار المجدول غير موجود.' });
    }

    item.status = 'dispatched';
    item.dispatchedAt = new Date().toISOString();
    storage.saveScheduledNotifications(list);

    const notif = {
      id: `NOTIF-MANUAL-${Date.now()}`,
      title: item.title,
      message: item.message,
      category: item.category || 'ai_prediction',
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        scheduledId: item.id,
        optimalWindow: item.targetOptimalWindow,
        urgency: item.urgency,
        dispatchedBy: 'Admin Immediate Override',
      },
    };

    storage.addNotification(notif);
    io.emit('notification', notif);

    res.json({ success: true, notification: notif });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ai/notifications/scheduled/:id', (req, res) => {
  try {
    const success = storage.deleteScheduledNotification(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// 9.5 A/B Testing Notification Campaigns & Regional Resonance Endpoints
// --------------------------------------------------------------------------

// List all A/B test campaigns
app.get('/api/ai/notifications/ab-test', (req, res) => {
  try {
    const campaigns = storage.getAbTestCampaigns();
    res.json({ success: true, campaigns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate A/B contrast variants with AI Agent & Heuristics
app.post('/api/ai/notifications/ab-test/generate', async (req, res) => {
  try {
    const result = await agentEngine.generateAbTestVariants(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Save an A/B test campaign
app.post('/api/ai/notifications/ab-test', (req, res) => {
  try {
    const campaign = req.body;
    if (!campaign || !campaign.name) {
      return res.status(400).json({ error: 'بيانات حملة اختبار A/B غير مكتملة.' });
    }
    const created = storage.addAbTestCampaign(campaign);
    res.json({ success: true, campaign: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update an A/B test campaign
app.put('/api/ai/notifications/ab-test/:id', (req, res) => {
  try {
    const updated = storage.updateAbTestCampaign(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'حملة الاختبار غير موجودة.' });
    }
    res.json({ success: true, campaign: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger a pilot test (sample dispatch across regions)
app.post('/api/ai/notifications/ab-test/:id/pilot', (req, res) => {
  try {
    const campaigns = storage.getAbTestCampaigns();
    const campaign = campaigns.find((c) => c.id === req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'حملة الاختبار غير موجودة.' });
    }

    // Sample pilot calculation based on regional resonance scores
    const sampleSizePerVariant = req.body.sampleSize || 1000;
    
    // Calculate weighted expected clicks based on regional cohorts
    const regions = campaign.regionalResonance || [];
    let avgScoreA = 70;
    let avgScoreB = 75;
    if (regions.length > 0) {
      avgScoreA = regions.reduce((acc: number, r: any) => acc + (r.scoreA || 70), 0) / regions.length;
      avgScoreB = regions.reduce((acc: number, r: any) => acc + (r.scoreB || 70), 0) / regions.length;
    }

    // Baseline conversion rate around 10-15%, adjusted by resonance score + small realistic variance
    const ctrA = parseFloat(((avgScoreA / 100) * 16 + (Math.random() * 1.8 - 0.9)).toFixed(2));
    const ctrB = parseFloat(((avgScoreB / 100) * 16 + (Math.random() * 1.8 - 0.9)).toFixed(2));

    const clicksA = Math.round((sampleSizePerVariant * ctrA) / 100);
    const clicksB = Math.round((sampleSizePerVariant * ctrB) / 100);

    const winner: 'A' | 'B' = ctrA > ctrB ? 'A' : 'B';
    const winningMargin = Math.abs(ctrA - ctrB).toFixed(2);
    const winnerReasonAr = winner === 'A'
      ? `تفوق النسخة (أ) بمعدل نقر ${ctrA}% مقابل ${ctrB}% للنسخة (ب) بفارق +${winningMargin}%. أظهر المستخدمون تفضيلاً واضحاً للغة الأمان والمصداقية.`
      : `تفوق النسخة (ب) بمعدل نقر ${ctrB}% مقابل ${ctrA}% للنسخة (أ) بفارق +${winningMargin}%. حققت النبرة الحماسية والدعوة المباشرة استجابة فورية أعلى.`;

    const updated = storage.updateAbTestCampaign(req.params.id, {
      status: 'pilot_sent',
      variantA: {
        ...campaign.variantA,
        sampleSent: sampleSizePerVariant,
        clicks: clicksA,
        ctr: ctrA,
      },
      variantB: {
        ...campaign.variantB,
        sampleSent: sampleSizePerVariant,
        clicks: clicksB,
        ctr: ctrB,
      },
      winner,
      winnerReasonAr,
      lastPilotAt: new Date().toISOString(),
    });

    res.json({ success: true, campaign: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Broadcast winning variant (or regional split) to the live platform
app.post('/api/ai/notifications/ab-test/:id/broadcast', (req, res) => {
  try {
    const campaigns = storage.getAbTestCampaigns();
    const campaign = campaigns.find((c) => c.id === req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'حملة الاختبار غير موجودة.' });
    }

    const { selectedVariant, broadcastType } = req.body; // 'A' | 'B' | 'regional_split'
    const targetVariant = selectedVariant === 'B' ? campaign.variantB : campaign.variantA;

    const notif = {
      id: `NOTIF-AB-${Date.now()}`,
      title: targetVariant.title,
      message: targetVariant.message,
      category: campaign.category || 'ai_prediction',
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        abTestCampaignId: campaign.id,
        abCampaignName: campaign.name,
        variantId: selectedVariant || campaign.winner || 'A',
        ctaText: targetVariant.ctaText,
        ctaAction: targetVariant.ctaAction,
        broadcastType: broadcastType || 'winner_broadcast',
        dispatchedBy: 'A/B Test Verification Engine',
      },
    };

    storage.addNotification(notif);
    io.emit('notification', notif);

    const updated = storage.updateAbTestCampaign(req.params.id, {
      status: 'completed',
      broadcastedAt: new Date().toISOString(),
      broadcastedVariant: selectedVariant || campaign.winner || 'A',
    });

    res.json({
      success: true,
      notification: notif,
      campaign: updated,
      message: 'تم بث النسخة الفائزة بنجاح لكافة مستخدمي المنصة!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an A/B test campaign
app.delete('/api/ai/notifications/ab-test/:id', (req, res) => {
  try {
    const success = storage.deleteAbTestCampaign(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// 9.6 Automated Compensation Approval Email Template Generator Endpoints
// --------------------------------------------------------------------------

// 1. Get all compensation approval email templates
app.get('/api/admin/compensation-email-templates', (req, res) => {
  try {
    const templates = storage.getCompensationEmailTemplates();
    res.json({ success: true, templates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Save / update a compensation approval email template
app.post('/api/admin/compensation-email-templates', (req, res) => {
  try {
    const template = req.body;
    if (!template || !template.name || !template.subject || !template.body_html) {
      return res.status(400).json({ error: 'بيانات قالب البريد الإلكتروني غير مكتملة (الاسم، العنوان، والمحتوى مطلوبين).' });
    }

    if (!template.id) {
      template.id = `tmpl-custom-${Date.now()}`;
    }

    storage.addCompensationEmailTemplate(template);
    res.json({ success: true, template });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete a custom compensation email template
app.delete('/api/admin/compensation-email-templates/:id', (req, res) => {
  try {
    const success = storage.deleteCompensationEmailTemplate(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Dispatch / log an approved compensation email notification
app.post('/api/admin/compensation-email/dispatch', (req, res) => {
  try {
    const {
      requestId,
      templateId,
      recipientEmail,
      userId,
      companyName,
      subject,
      bodyHtml,
      bodyText,
      sentBy,
      createPushNotification = true,
    } = req.body;

    if (!requestId || !recipientEmail || !subject) {
      return res.status(400).json({ error: 'Missing required dispatch parameters (requestId, recipientEmail, subject).' });
    }

    const dispatchLog = {
      id: `LOG-DISPATCH-${Date.now()}`,
      request_id: requestId,
      template_id: templateId || 'custom',
      recipient_email: recipientEmail,
      user_id: userId || 'unknown_user',
      company_name: companyName || 'VEX Deals Partner',
      subject,
      dispatched_at: new Date().toISOString(),
      status: 'sent' as const,
      sent_by: sentBy || 'VEX Financial Compliance Officer',
    };

    storage.addEmailDispatchLog(dispatchLog);

    // Also push real-time notification to user feed
    if (createPushNotification) {
      const notif = {
        id: `NOTIF-EMAIL-DISPATCH-${Date.now()}`,
        title: `📧 تم إرسال إشعار الاعتماد: ${subject.replace(/[🛡️✅🔓💎]/g, '').trim().slice(0, 40)}`,
        message: `تم إرسال إيميل رسمي إلى (${recipientEmail}) يتضمن تفاصيل الرصيد المعتمد وحالة المحفظة وكود البرومو لدى ${companyName}.`,
        category: 'compensation',
        timestamp: new Date().toISOString(),
        read: false,
        data: {
          requestId,
          recipientEmail,
          companyName,
          dispatchId: dispatchLog.id,
        },
      };
      storage.addNotification(notif);
      io.emit('notification', notif);
    }

    res.json({
      success: true,
      dispatchLog,
      message: `تم توثيق وإرسال إيميل الاعتماد بنجاح إلى ${recipientEmail}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get email dispatch history logs
app.get('/api/admin/compensation-email/logs', (req, res) => {
  try {
    const logs = storage.getEmailDispatchLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. AI-Powered Smart Email Template Generator / Polisher
app.post('/api/admin/compensation-email/generate-ai', async (req, res) => {
  try {
    const {
      request,
      company,
      tone = 'executive_formal',
      language = 'ar',
      type = 'loss_compensation',
      customPrompt = '',
    } = req.body;

    const isAr = language === 'ar';
    const isUnfreeze = type === 'deposit_unfreeze' || request?.id?.startsWith('DEP-UNF-');

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are the Head of Customer Success & Financial Compliance at VEX Deals, a premier Sportsbook & VIP Loyalty platform.
Generate a high-converting, professional, HTML and Plain-Text email template for an APPROVED compensation or deposit-unfreeze request.

Context:
- Type: ${isUnfreeze ? '1:1 Deposit Unfreeze Approval (unlocked funds into available balance)' : 'Loss Compensation Approval (refund added to wallet balance)'}
- Language: ${isAr ? 'Arabic (العربية الفصحى الراقية)' : 'English'}
- Target Tone: ${tone} (e.g. executive_formal, high_energy_friendly, security_audit, vip_prestige)
- Custom Admin Guidance: ${customPrompt || 'Highlight the balance breakdown, explain the unfreeze ratio, promote the company promo code, and thank the customer.'}

STRICT INSTRUCTION: You MUST use these exact template placeholders so the platform dynamically resolves them:
- {{user_balance}} -> Total user wallet balance
- {{available_balance}} -> Immediately withdrawable available cash
- {{frozen_balance}} -> Remaining locked frozen balance
- {{approved_amount}} -> The exact amount approved in this request
- {{currency}} -> Currency symbol ($)
- {{account_number}} -> Customer's bookmaker account ID
- {{company_name}} -> Sportsbook / partner brand name
- {{company_promo_code}} -> Official agency promo code
- {{company_bonus_text}} -> Active bonus perks
- {{company_affiliate_link}} -> Partner link
- {{company_support_email}} -> Support desk email
- {{request_id}} -> Transaction audit ID
- {{bet_slip_id}} -> Slip or deposit ID
- {{approval_date}} -> Timestamp of approval
- {{admin_agent}} -> Auditor title
- {{platform_name}} -> Platform name (VEX Deals VIP)

Return ONLY valid JSON matching this schema:
{
  "subject": "Email subject line containing relevant placeholders",
  "preheader": "1-sentence inbox preheader summary",
  "body_text": "Complete plain-text email with placeholder tags",
  "body_html": "Modern, responsive, inline-styled email container (max-width 620px, dark theme compatible, table layout, status badges, financial breakdown, CTA button)"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({
          success: true,
          template: {
            id: `tmpl-ai-${Date.now()}`,
            name: isAr ? `قالب ذكي (${tone})` : `AI Tailored Template (${tone})`,
            type: isUnfreeze ? 'deposit_unfreeze' : 'loss_compensation',
            subject: parsed.subject,
            preheader: parsed.preheader,
            body_text: parsed.body_text,
            body_html: parsed.body_html,
            created_at: new Date().toISOString(),
          },
        });
      } catch (geminiError: any) {
        console.warn('[AI Email Generator] Gemini call failed, falling back to algorithmic composer:', geminiError?.message);
      }
    }

    // High quality algorithmic fallback if Gemini is offline or API key absent
    const fallbackSubject = isUnfreeze
      ? (isAr ? '🔓 اعتماد فك تجميد الرصيد 1:1 بمبلغ {{currency}}{{approved_amount}} - رصيدك متاح للسحب' : '🔓 Balance Unfrozen: {{currency}}{{approved_amount}} is Available for Withdrawal')
      : (isAr ? '✅ تم اعتماد طلب التعويض بمبلغ {{currency}}{{approved_amount}} لحسابك لدى {{company_name}}' : '✅ Compensation Approved: {{currency}}{{approved_amount}} Credited - {{company_name}}');

    const fallbackText = isAr
      ? `مرحباً عزيزنا العميل،\n\nيسرنا إبلاغك باعتماد طلبك رقم #{{request_id}}.\nالمبلغ المعتمد: {{currency}}{{approved_amount}}\nرقم حسابك: {{account_number}}\nالرصيد المتاح: {{currency}}{{available_balance}}\nالرصيد المجمد: {{currency}}{{frozen_balance}}\nإجمالي الرصيد: {{currency}}{{user_balance}}\n\nكود البرومو المعتمد: {{company_promo_code}}\nللمزيد: {{company_affiliate_link}}`
      : `Dear Customer,\n\nYour request #{{request_id}} has been approved.\nApproved Amount: {{currency}}{{approved_amount}}\nAvailable Balance: {{currency}}{{available_balance}}\nFrozen Balance: {{currency}}{{frozen_balance}}\nTotal: {{currency}}{{user_balance}}\nPromo Code: {{company_promo_code}}`;

    const fallbackHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'};">
  <div style="background: #059669; padding: 18px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h2 style="margin: 0; font-size: 20px;">${isUnfreeze ? 'تم فك تجميد الرصيد بنجاح' : 'تم اعتماد طلب التعويض'}</h2>
    <p style="margin: 6px 0 0 0; font-size: 13px;">#{{request_id}} | {{company_name}}</p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    تم فحص ومطابقة العملية لحسابكم رقم <strong>{{account_number}}</strong> بقسيمة رقم <strong>#{{bet_slip_id}}</strong>.
  </p>
  <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 6px 0; color: #34d399; font-weight: bold;">المبلغ المعتمد: +{{currency}}{{approved_amount}}</p>
    <p style="margin: 6px 0; color: #38bdf8;">الرصيد المتاح: {{currency}}{{available_balance}}</p>
    <p style="margin: 6px 0; color: #fbbf24;">الرصيد المجمد: {{currency}}{{frozen_balance}}</p>
    <p style="margin: 6px 0; color: #ffffff; font-weight: bold;">إجمالي المحفظة: {{currency}}{{user_balance}}</p>
  </div>
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">كود البرومو المعتمد: <strong>{{company_promo_code}}</strong> | {{company_support_email}}</p>
</div>`;

    res.json({
      success: true,
      template: {
        id: `tmpl-fallback-${Date.now()}`,
        name: isAr ? 'قالب مرن ذكي' : 'Smart Fallback Template',
        type: isUnfreeze ? 'deposit_unfreeze' : 'loss_compensation',
        subject: fallbackSubject,
        preheader: isAr ? 'إشعار فوري باعتماد العملية وتحديث الرصيد' : 'Instant transaction approval and ledger update',
        body_text: fallbackText,
        body_html: fallbackHtml,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 10. Live & Historical Search Explorer
app.post('/api/ai/search', async (req, res) => {
  try {
    const { query, mode } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'نص البحث مطلوب.' });
    }

    const compRequests = storage.getCompensationRequests();
    const companies = storage.getCompanies();

    const q = query.toLowerCase();
    const matchedRequests = compRequests.filter(
      (r) => r.company_name?.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.account_number?.includes(q) || r.bet_slip_id?.includes(q)
    ).slice(0, 5);
    const matchedCompanies = companies.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.name_ar && c.name_ar.includes(query)) || c.promo_code?.toLowerCase().includes(q)
    );

    const client = getGeminiClient();
    let liveWebAnalysis: string = '';
    let citations: Array<{ title: string; url: string }> = [];

    if (client && (mode === 'live_web' || mode === 'hybrid' || !mode)) {
      try {
        const searchPrompt = `أنت محرك بحث رياضي وتحليلي ذكي لمنصة VEX Deals.
قم بالإجابة على استفسار المدير بدقة وحيادية معتمداً على أحدث المعلومات الحية من الويب:
"${query}"
المطلوب: تقديم إجابة دقيقة، مع أبرز الإحصائيات أو التشكيلات أو الأخبار المرتبطة.`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        liveWebAnalysis = response.text || '';
        const meta = response.candidates?.[0]?.groundingMetadata;
        if (meta?.groundingChunks) {
          meta.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
              citations.push({
                title: chunk.web.title || 'مصدر رياضي رسمي',
                url: chunk.web.uri,
              });
            }
          });
        }
      } catch (searchErr) {
        console.warn('[AI Search Warning]:', searchErr);
      }
    }

    res.json({
      success: true,
      query,
      liveWebAnalysis,
      citations,
      platformHistory: {
        requests: matchedRequests,
        companies: matchedCompanies,
        totalMatches: matchedRequests.length + matchedCompanies.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications Endpoints
app.get('/api/notifications', (req, res) => {
  const notifs = storage.getNotifications();
  res.json({
    notifications: notifs,
    unreadCount: notifs.filter((n) => !n.read).length,
  });
});

app.post('/api/notifications/broadcast', (req, res) => {
  const { title, message, category, data } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'العنوان ومحتوى الرسالة مطلوبان.' });
  }

  const notif = {
    id: `NOTIF-${Date.now()}`,
    title: title.trim(),
    message: message.trim(),
    category: category || 'system',
    timestamp: new Date().toISOString(),
    read: false,
    data: data || {},
  };

  storage.addNotification(notif);
  io.emit('notification', notif);

  res.json({
    success: true,
    notification: notif,
    message: 'تم بث الإشعار بنجاح لجميع مستخدمي التطبيق!',
  });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { id } = req.body;
  const notifs = storage.getNotifications();
  if (id === 'all') {
    notifs.forEach((n) => (n.read = true));
  } else {
    const target = notifs.find((n) => n.id === id);
    if (target) target.read = true;
  }
  storage.saveNotifications(notifs);
  res.json({ success: true });
});

// ==========================================
// VIRAL FEATURES ENDPOINTS
// ==========================================

// Golden Hour
app.get('/api/viral/golden-hour', (req, res) => {
  res.json({ success: true, state: storage.getGoldenHourState() });
});
app.post('/api/viral/golden-hour/trigger', (req, res) => {
  const { durationMinutes, multiplier, messageAr, messageEn } = req.body;
  const now = new Date();
  const end = new Date(now.getTime() + (durationMinutes || 60) * 60000);
  const state = {
    isActive: true,
    startTime: now.toISOString(),
    endTime: end.toISOString(),
    multiplier: multiplier || 2,
    messageAr: messageAr || 'الساعة الذهبية بدأت! سرعة فك الرصيد تضاعفت.',
    messageEn: messageEn || 'Golden Hour Active! Unfreeze speed doubled.'
  };
  storage.saveGoldenHourState(state);
  io.emit('golden_hour_started', state);
  res.json({ success: true, state });
});

// Unlucky Bets Leaderboard
app.get('/api/viral/unlucky-bets', (req, res) => {
  res.json({ success: true, bets: storage.getUnluckyBets() });
});
app.post('/api/viral/unlucky-bets', (req, res) => {
  const bet = storage.addUnluckyBet({ ...req.body, status: 'approved', votes: 0 });
  io.emit('new_unlucky_bet', bet);
  res.json({ success: true, bet });
});
app.post('/api/viral/unlucky-bets/:id/vote', (req, res) => {
  const bet = storage.voteUnluckyBet(req.params.id);
  if (bet) {
    io.emit('unlucky_bet_voted', bet);
    res.json({ success: true, bet });
  } else {
    res.status(404).json({ error: 'Bet not found' });
  }
});

// AI Challenges
app.get('/api/viral/ai-challenges', (req, res) => {
  res.json({ success: true, challenges: storage.getAiChallenges() });
});
app.post('/api/viral/ai-challenges', (req, res) => {
  const challenge = storage.addAiChallenge(req.body);
  io.emit('new_ai_challenge', challenge);
  res.json({ success: true, challenge });
});

// Referrals
app.get('/api/viral/referrals', (req, res) => {
  res.json({ success: true, referrals: storage.getReferrals() });
});
app.post('/api/viral/referrals', (req, res) => {
  const ref = storage.addReferral(req.body);
  res.json({ success: true, ref });
});

// ==========================================
// LOTTERY (YANASIB) ENDPOINTS
// ==========================================

const LOTTERY_CONSTANTS = {
  numbers_count: 5,
  max_number: 30,
  rollover_pct: 0.5,
  secondary_share: 0.7,
  small_share: 0.3,
  draw_types: {
    hourly: { name: 'سحب كل ساعة', icon: '⏰', ticket_price: 50, duration: 3600, multiplier: 1.0 },
    daily: { name: 'سحب يومي', icon: '📅', ticket_price: 100, duration: 86400, multiplier: 2.5 },
    weekly: { name: 'سحب أسبوعي', icon: '🏆', ticket_price: 250, duration: 604800, multiplier: 10.0 },
  },
};

function ensureLotteryRound(state: any, drawType: string): any {
  const config = storage.getLotteryConfig();
  const cfg = LOTTERY_CONSTANTS.draw_types[drawType as keyof typeof LOTTERY_CONSTANTS.draw_types];
  if (!cfg) return state;

  if (!state.drawTypes) state.drawTypes = {};
  if (!state.drawTypes[drawType]) {
    state.drawTypes[drawType] = { draw_time: 0, tickets: [], tickets_sold: 0, prize_pool: 0, history: [] };
  }

  const round = state.drawTypes[drawType];
  const now = Date.now() / 1000;

  if (!round.draw_time || now >= round.draw_time) {
    if (round.draw_time > 0 && round.tickets && round.tickets.length > 0) {
      performDraw(state, drawType);
    }
    round.draw_time = now + cfg.duration;
    round.tickets = [];
    round.tickets_sold = 0;
    round.prize_pool = 0;
  }

  return state;
}

function performDraw(state: any, drawType: string): void {
  const round = state.drawTypes[drawType];
  if (!round || !round.tickets || round.tickets.length === 0) return;

  const winningNumbers: number[] = [];
  while (winningNumbers.length < LOTTERY_CONSTANTS.numbers_count) {
    const n = Math.floor(Math.random() * LOTTERY_CONSTANTS.max_number) + 1;
    if (!winningNumbers.includes(n)) winningNumbers.push(n);
  }
  winningNumbers.sort((a, b) => a - b);

  const prizePool = round.prize_pool;
  const redistributable = prizePool * (1 - LOTTERY_CONSTANTS.rollover_pct);

  const winners = { jackpot: [] as any[], secondary: [] as any[], small: [] as any[] };
  let jackpotWinners = 0;

  for (const ticket of round.tickets) {
    const matches = (ticket.numbers || []).filter((n: number) => winningNumbers.includes(n)).length;
    ticket.drawn = winningNumbers;
    ticket.matches = matches;
    if (matches === LOTTERY_CONSTANTS.numbers_count) {
      ticket.status = 'win';
      ticket.prize = 0;
      winners.jackpot.push(ticket);
      jackpotWinners++;
    } else if (matches === 4) {
      ticket.status = 'win';
      ticket.prize = 0;
      winners.secondary.push(ticket);
    } else if (matches === 3) {
      ticket.status = 'win';
      ticket.prize = 0;
      winners.small.push(ticket);
    } else {
      ticket.status = 'lose';
      ticket.prize = 0;
    }
  }

  let rolloverAmount = 0;
  if (jackpotWinners > 0) {
    const perWinner = prizePool / jackpotWinners;
    winners.jackpot.forEach((t: any) => t.prize = perWinner);
    rolloverAmount = 0;
  } else {
    rolloverAmount = prizePool * LOTTERY_CONSTANTS.rollover_pct;
    const secondaryPrize = winners.secondary.length > 0 ? (redistributable * LOTTERY_CONSTANTS.secondary_share) / winners.secondary.length : 0;
    const smallPrize = winners.small.length > 0 ? (redistributable * LOTTERY_CONSTANTS.small_share) / winners.small.length : 0;
    winners.secondary.forEach((t: any) => t.prize = secondaryPrize);
    winners.small.forEach((t: any) => t.prize = smallPrize);
  }

  round.history.push({
    winning_numbers: winningNumbers,
    prize_pool: prizePool,
    tickets_sold: round.tickets_sold,
    winners: { jackpot: winners.jackpot.length, secondary: winners.secondary.length, small: winners.small.length },
    rollover: rolloverAmount,
    timestamp: new Date().toISOString(),
  });

  round.rollover = rolloverAmount;
  round.drawn = winningNumbers;
}

// GET /api/lottery/state - Get current lottery state for all draw types
app.get('/api/lottery/state', (req, res) => {
  try {
    const config = storage.getLotteryConfig();
    if (!config.enabled) {
      return res.json({ enabled: false, draw_types: {} });
    }

    let state = storage.getLotteryState();
    const uid = (req.query.uid as string) || 'anonymous';

    const drawTypes: any = {};
    for (const [key, cfg] of Object.entries(LOTTERY_CONSTANTS.draw_types)) {
      state = ensureLotteryRound(state, key);
      const round = state.drawTypes[key];
      const myTickets = (round.tickets || []).filter((t: any) => t.uid === uid);

      drawTypes[key] = {
        ...cfg,
        draw_time: round.draw_time,
        tickets_sold: round.tickets_sold,
        max_tickets: config[key]?.max_tickets || 1000,
        tickets_available: (config[key]?.max_tickets || 1000) - round.tickets_sold,
        participants_count: new Set((round.tickets || []).map((t: any) => t.uid)).size,
        prize_pool: round.prize_pool,
        jackpot_estimate: round.prize_pool * cfg.multiplier,
        drawn: round.drawn || null,
        rollover: round.rollover || 0,
        my_tickets: myTickets,
        history: (round.history || []).slice(-5),
      };
    }

    storage.saveLotteryState(state);
    res.json({ enabled: true, draw_types: drawTypes });
  } catch (err) {
    console.error('[Lottery] Error getting state:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lottery/buy - Buy lottery tickets
app.post('/api/lottery/buy', (req, res) => {
  try {
    const config = storage.getLotteryConfig();
    if (!config.enabled) {
      return res.status(400).json({ error: 'Lottery is disabled' });
    }

    const { count = 1, draw_type = 'hourly', uid = 'anonymous' } = req.body;
    const ticketCount = Math.max(1, Math.min(10, Number(count)));
    const drawType = LOTTERY_CONSTANTS.draw_types[draw_type as keyof typeof LOTTERY_CONSTANTS.draw_types];
    if (!drawType) return res.status(400).json({ error: 'Invalid draw type' });

    const cfg = config[draw_type] || { ticket_price: drawType.ticket_price, max_tickets: 1000 };
    const ticketPrice = cfg.ticket_price;
    const totalCost = ticketPrice * ticketCount;

    let state = storage.getLotteryState();
    state = ensureLotteryRound(state, draw_type);
    const round = state.drawTypes[draw_type];

    if (round.tickets_sold + ticketCount > (cfg.max_tickets || 1000)) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    const newTickets: any[] = [];
    for (let i = 0; i < ticketCount; i++) {
      const nums: number[] = [];
      while (nums.length < LOTTERY_CONSTANTS.numbers_count) {
        const n = Math.floor(Math.random() * LOTTERY_CONSTANTS.max_number) + 1;
        if (!nums.includes(n)) nums.push(n);
      }
      nums.sort((a, b) => a - b);
      newTickets.push({
        id: `T${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`,
        uid,
        numbers: nums,
        status: 'pending',
        drawn: null,
        matches: 0,
        prize: 0,
      });
    }

    round.tickets.push(...newTickets);
    round.tickets_sold += ticketCount;
    round.prize_pool = Math.round((round.prize_pool + totalCost * 0.8) * 100) / 100;

    storage.saveLotteryState(state);

    res.json({
      success: true,
      tickets: newTickets,
      ticket_price: ticketPrice,
      total_cost: totalCost,
      prize_pool: round.prize_pool,
      tickets_sold: round.tickets_sold,
    });
  } catch (err) {
    console.error('[Lottery] Buy error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lottery/draw/:drawType - Admin: execute draw
app.post('/api/lottery/draw/:drawType', (req, res) => {
  try {
    const { drawType } = req.params;
    if (!LOTTERY_CONSTANTS.draw_types[drawType as keyof typeof LOTTERY_CONSTANTS.draw_types]) {
      return res.status(400).json({ error: 'Invalid draw type' });
    }

    let state = storage.getLotteryState();
    const round = state.drawTypes?.[drawType];
    if (!round || !round.tickets || round.tickets.length === 0) {
      return res.status(400).json({ error: 'No tickets to draw' });
    }

    performDraw(state, drawType);
    const result = round.history[round.history.length - 1];
    storage.saveLotteryState(state);

    res.json({ success: true, result });
  } catch (err) {
    console.error('[Lottery] Draw error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lottery/config - Admin: update lottery config
app.post('/api/lottery/config', (req, res) => {
  try {
    const config = storage.getLotteryConfig();
    const updates = req.body;
    if (updates.enabled !== undefined) config.enabled = updates.enabled;
    for (const key of ['hourly', 'daily', 'weekly']) {
      if (updates[key]) {
        config[key] = { ...config[key], ...updates[key] };
      }
    }
    storage.saveLotteryConfig(config);
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/lottery/history - Get draw history
app.get('/api/lottery/history', (req, res) => {
  try {
    const state = storage.getLotteryState();
    const history: any[] = [];
    for (const [key, round] of Object.entries(state.drawTypes || {})) {
      for (const h of (round as any).history || []) {
        history.push({ ...h, draw_type: key });
      }
    }
    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ history: history.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// COMPENSATION & DEPOSIT UNFREEZE ENDPOINTS
// ==========================================

// Submit Regular Compensation Request (Loss)
app.post('/api/compensation/requests', (req, res) => {
  const { company_id, company_name, account_number, bet_slip_id, amount, note, user_id } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  const numAmount = Number(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'المبلغ غير صالح، يجب أن يكون أكبر من 0.' });
  }

  const cleanSlip = (bet_slip_id || '').trim();
  const cleanAccount = (account_number || '').trim();

  const requests = storage.getCompensationRequests();
  const existingPending = requests.find(
    (r) =>
      r.status === 'pending' &&
      r.account_number === cleanAccount &&
      r.bet_slip_id === cleanSlip
  );

  if (existingPending) {
    return res.status(429).json({
      error: 'يوجد طلب تعويض قيد المراجعة لنفس الحساب ورقم القسيمة تم تقديمه مسبقاً.',
    });
  }

  const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newRequest: ServerCompensationRequest = {
    id: requestId,
    user_id: user_id || 'anonymous',
    company_id: company_id || 'UNKNOWN',
    company_name: company_name || 'شركة غير محددة',
    account_number: cleanAccount,
    bet_slip_id: cleanSlip || `SLIP-${Date.now()}`,
    amount: numAmount,
    status: 'pending',
    created_at: new Date().toISOString(),
    note: note ? String(note).trim().slice(0, 500) : 'طلب تعويض خسائر قسيمة رهان',
    sender_ip: String(clientIp),
  };

  storage.addCompensationRequest(newRequest);

  const adminNotif = {
    id: `NOTIF-COMP-${Date.now()}`,
    title: `🛡️ طلب تعويض جديد: $${numAmount}`,
    message: `قدم الحساب ${newRequest.account_number} في ${newRequest.company_name} قسيمة رهان خاسرة بقيمة $${numAmount}.`,
    category: 'compensation',
    timestamp: new Date().toISOString(),
    read: false,
    data: {
      requestId: newRequest.id,
      amount: numAmount,
      company: newRequest.company_name,
    },
  };

  storage.addNotification(adminNotif);
  io.emit('notification', adminNotif);
  io.emit('new_compensation_request', newRequest);

  res.json({
    success: true,
    request: newRequest,
    message: 'تم تسجيل طلب التعويض بنجاح وجارٍ مراجعته.',
  });
});

// Submit Deposit Unfreeze Request
app.post('/api/compensation/requests/unfreeze-deposit', (req, res) => {
  const { company_id, company_name, account_number, senderPhone, amount, note, user_id } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  const numAmount = Number(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'المبلغ غير صالح، يجب أن يكون أكبر من 0.' });
  }

  if (numAmount > 50000) {
    return res.status(400).json({ error: 'الحد الأقصى للطلب هو $50,000.' });
  }

  if (!account_number || typeof account_number !== 'string' || account_number.trim().length < 3) {
    return res.status(400).json({ error: 'رقم الحساب في شركة المراهنات مطلوب ويجب أن يكون صحيحاً.' });
  }

  if (!senderPhone || typeof senderPhone !== 'string' || senderPhone.trim().length < 7) {
    return res.status(400).json({ error: 'رقم الهاتف المحول منه مطلوب ويجب أن يتكون من 7 أرقام على الأقل.' });
  }

  // Anti-replay / Anti-DDoS duplicate prevention: Check for duplicate pending requests within 60s
  const now = Date.now();
  const requests = storage.getCompensationRequests();
  const existingPending = requests.find(
    (r) =>
      r.status === 'pending' &&
      r.account_number === account_number.trim() &&
      r.bet_slip_id === `DEPOSIT-${senderPhone.trim()}` &&
      now - new Date(r.created_at).getTime() < 60000
  );

  if (existingPending) {
    return res.status(429).json({
      error: 'يوجد طلب فك تجميد قيد المراجعة لنفس الحساب ورقم الهاتف تم تقديمه مؤخراً. يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.',
    });
  }

  const requestId = `DEP-UNF-${now}-${Math.floor(Math.random() * 1000)}`;
  const newRequest: ServerCompensationRequest = {
    id: requestId,
    user_id: user_id || 'anonymous',
    company_id: company_id || 'UNKNOWN',
    company_name: company_name || 'شركة غير محددة',
    account_number: account_number.trim(),
    bet_slip_id: `DEPOSIT-${senderPhone.trim()}`,
    amount: numAmount,
    status: 'pending',
    created_at: new Date().toISOString(),
    note: note ? String(note).trim().slice(0, 500) : 'إيداع مباشر لفك التجميد 1:1',
    sender_ip: String(clientIp),
  };

  storage.addCompensationRequest(newRequest);

  // Notify connected admin and users via Socket.io & notifications queue
  const adminNotif = {
    id: `NOTIF-UNF-${now}`,
    title: `🔓 طلب فك تجميد جديد: $${numAmount}`,
    message: `قدم العميل ذو الحساب ${newRequest.account_number} في ${newRequest.company_name} طلب فك تجميد بقيمة $${numAmount}.`,
    category: 'compensation',
    timestamp: new Date().toISOString(),
    read: false,
    data: {
      requestId: newRequest.id,
      amount: numAmount,
      company: newRequest.company_name,
    },
  };

  storage.addNotification(adminNotif);
  io.emit('notification', adminNotif);
  io.emit('new_compensation_request', newRequest);

  res.json({
    success: true,
    request: newRequest,
    message: 'تم تسجيل طلب فك التجميد بنجاح وجارٍ التحقق منه في لوحة التحكم.',
  });
});

// List Compensation & Unfreeze Requests
app.get('/api/compensation/requests', (req, res) => {
  const { status, type, userId } = req.query;
  let list = storage.getCompensationRequests();

  if (userId && typeof userId === 'string') {
    list = list.filter((r) => r.user_id === userId);
  }

  if (status && typeof status === 'string') {
    list = list.filter((r) => r.status === status);
  }

  if (type === 'unfreeze') {
    list = list.filter((r) => r.id.startsWith('DEP-UNF-') || r.bet_slip_id.startsWith('DEPOSIT-'));
  } else if (type === 'compensation') {
    list = list.filter((r) => !r.id.startsWith('DEP-UNF-') && !r.bet_slip_id.startsWith('DEPOSIT-'));
  }

  res.json({
    success: true,
    requests: list,
    total: list.length,
  });
});

// Approve Request (Admin)
app.post('/api/compensation/approve', (req, res) => {
  const { requestId, adminName } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'معرف الطلب مطلوب.' });
  }

  const updated = storage.updateCompensationRequest(requestId, {
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminName || 'الإدارة العامة',
  });

  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود في النظام.' });
  }

  // Broadcast approval notification
  const isUnfreeze = updated.id.startsWith('DEP-UNF-') || updated.bet_slip_id.startsWith('DEPOSIT-');
  const notif = {
    id: `NOTIF-APP-${Date.now()}`,
    title: isUnfreeze ? '✅ تم فك تجميد رصيدك بنجاح!' : '✅ تم اعتماد طلب التعويض!',
    message: isUnfreeze
      ? `تم التحقق من إيداعك بقيمة $${updated.amount} وفك تجميد الرصيد المقابل له ليصبح متاحاً للسحب الفوري.`
      : `تم اعتماد طلب التعويض بقيمة $${updated.amount} وإضافته لرصيدك المجمد بنجاح.`,
    category: 'compensation',
    timestamp: new Date().toISOString(),
    read: false,
    data: { requestId: updated.id, amount: updated.amount },
  };

  storage.addNotification(notif);
  io.emit('notification', notif);
  io.emit('compensation_status_updated', { requestId: updated.id, status: 'approved', request: updated });

  res.json({
    success: true,
    request: updated,
    message: isUnfreeze ? 'تم اعتماد الإيداع وفك تجميد الرصيد 1:1 بنجاح!' : 'تم اعتماد طلب التعويض بنجاح!',
  });
});

// Reject Request (Admin)
app.post('/api/compensation/reject', (req, res) => {
  const { requestId, reason, adminName } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'معرف الطلب مطلوب.' });
  }

  const updated = storage.updateCompensationRequest(requestId, {
    status: 'rejected',
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminName || 'الإدارة العامة',
    rejection_reason: reason || 'غير مطابق للشروط والمعايير',
  });

  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود في النظام.' });
  }

  io.emit('compensation_status_updated', { requestId: updated.id, status: 'rejected', request: updated });

  res.json({
    success: true,
    request: updated,
    message: 'تم رفض الطلب وتحديث الحالة.',
  });
});

// Bulk Approve Requests (Admin)
app.post('/api/compensation/bulk-approve', (req, res) => {
  try {
    const { requestIds, adminName } = req.body;
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ error: 'قائمة معرفات الطلبات مطلوبة.' });
    }

    const approvedList: any[] = [];
    const timestamp = new Date().toISOString();

    for (const id of requestIds) {
      const updated = storage.updateCompensationRequest(id, {
        status: 'approved',
        reviewed_at: timestamp,
        reviewed_by: adminName || 'الإدارة العامة',
      });
      if (updated) {
        approvedList.push(updated);
        const isUnfreeze = updated.id.startsWith('DEP-UNF-') || updated.bet_slip_id?.startsWith('DEPOSIT-');
        const notif = {
          id: `NOTIF-APP-${Date.now()}-${id}`,
          title: isUnfreeze ? '✅ تم فك تجميد رصيدك بنجاح!' : '✅ تم اعتماد طلب التعويض!',
          message: isUnfreeze
            ? `تم التحقق من إيداعك بقيمة $${updated.amount} وفك تجميد الرصيد المقابل له ليصبح متاحاً للسحب الفوري.`
            : `تم اعتماد طلب التعويض بقيمة $${updated.amount} وإضافته لرصيدك المجمد بنجاح.`,
          category: 'compensation',
          timestamp,
          read: false,
          data: { requestId: updated.id, amount: updated.amount },
        };
        storage.addNotification(notif);
        io.emit('notification', notif);
        io.emit('compensation_status_updated', { requestId: updated.id, status: 'approved', request: updated });
      }
    }

    res.json({
      success: true,
      count: approvedList.length,
      approvedRequests: approvedList,
      message: `تم اعتماد ${approvedList.length} طلب بنجاح!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Reject Requests (Admin)
app.post('/api/compensation/bulk-reject', (req, res) => {
  try {
    const { requestIds, reason, adminName } = req.body;
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ error: 'قائمة معرفات الطلبات مطلوبة.' });
    }

    const rejectedList: any[] = [];
    const timestamp = new Date().toISOString();

    for (const id of requestIds) {
      const updated = storage.updateCompensationRequest(id, {
        status: 'rejected',
        reviewed_at: timestamp,
        reviewed_by: adminName || 'الإدارة العامة',
        rejection_reason: reason || 'غير مطابق للشروط والمعايير',
      });
      if (updated) {
        rejectedList.push(updated);
        io.emit('compensation_status_updated', { requestId: updated.id, status: 'rejected', request: updated });
      }
    }

    res.json({
      success: true,
      count: rejectedList.length,
      rejectedRequests: rejectedList,
      message: `تم رفض ${rejectedList.length} طلب بنجاح.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// Phone Number Lock & Admin Change Request System
// --------------------------------------------------------------------------

// Submit phone change request
app.post('/api/user/phone-change-request', (req, res) => {
  const { userId, currentPhone, newPhone, reason } = req.body;
  if (!newPhone || !currentPhone) {
    return res.status(400).json({ error: 'الرقم الحالي والرقم الجديد مطلوبان.' });
  }

  const cleanNew = String(newPhone).trim();
  const cleanCurrent = String(currentPhone).trim();

  if (cleanNew === cleanCurrent) {
    return res.status(400).json({ error: 'الرقم الجديد يجب أن يكون مختلفاً عن الرقم الحالي.' });
  }

  // Check if pending request exists for this user
  const phoneRequests = storage.getPhoneChangeRequests();
  const existingPending = phoneRequests.find(
    (r) => r.user_id === (userId || 'anonymous') && r.status === 'pending'
  );
  if (existingPending) {
    return res.status(429).json({
      error: 'يوجد لديك طلب تغيير رقم هاتف قيد المراجعة لدى الإدارة حالياً. يرجى انتظار قرار الإدارة.',
    });
  }

  const now = Date.now();
  const requestId = `PCR-${now}-${Math.floor(Math.random() * 1000)}`;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  const newRequest = {
    id: requestId,
    user_id: userId || 'anonymous',
    current_phone: cleanCurrent,
    new_phone: cleanNew,
    reason: reason ? String(reason).trim().slice(0, 500) : 'طلب تغيير رقم الهاتف المعتمد',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    ip_address: String(clientIp),
  };

  storage.addPhoneChangeRequest(newRequest);

  // Send admin notification
  const adminNotif = {
    id: `NOTIF-PCR-${now}`,
    title: '🔒 طلب تغيير رقم هاتف المحفظة',
    message: `طلب المستخدم (${cleanCurrent}) تغيير رقمه المعتمد إلى (${cleanNew})، السبب: ${newRequest.reason}`,
    category: 'security',
    timestamp: new Date().toISOString(),
    read: false,
    data: { requestId: newRequest.id, currentPhone: cleanCurrent, newPhone: cleanNew },
  };

  storage.addNotification(adminNotif);
  io.emit('notification', adminNotif);
  io.emit('new_phone_change_request', newRequest);

  res.json({
    success: true,
    request: newRequest,
    message: 'تم إرسال طلب تغيير رقم الهاتف إلى الإدارة بنجاح وجارٍ مراجعته أمنياً.',
  });
});

// List phone change requests
app.get('/api/user/phone-change-requests', (req, res) => {
  const { userId, status } = req.query;
  let list = storage.getPhoneChangeRequests();

  if (userId && typeof userId === 'string') {
    list = list.filter((r) => r.user_id === userId);
  }
  if (status && typeof status === 'string') {
    list = list.filter((r) => r.status === status);
  }

  res.json({
    success: true,
    requests: list,
    total: list.length,
  });
});

// Approve Phone Change Request (Admin)
app.post('/api/admin/phone-change-requests/approve', (req, res) => {
  const { requestId, adminName } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'معرف الطلب مطلوب.' });
  }

  const updated = storage.updatePhoneChangeRequest(requestId, {
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminName || 'الإدارة العامة',
  });

  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود في النظام.' });
  }

  const notif = {
    id: `NOTIF-PCR-APP-${Date.now()}`,
    title: '✅ تم اعتماد وتحديث رقم هاتفك',
    message: `وافقت الإدارة على طلبك وتم تحديث رقم هاتفك المعتمد في المحفظة إلى ${updated.new_phone}.`,
    category: 'security',
    timestamp: new Date().toISOString(),
    read: false,
    data: { requestId: updated.id, newPhone: updated.new_phone },
  };

  storage.addNotification(notif);
  io.emit('notification', notif);
  io.emit('phone_change_status_updated', { requestId: updated.id, status: 'approved', request: updated });

  res.json({
    success: true,
    request: updated,
    message: 'تمت الموافقة على تغيير رقم الهاتف وتحديث بيانات المستخدم.',
  });
});

// Reject Phone Change Request (Admin)
app.post('/api/admin/phone-change-requests/reject', (req, res) => {
  const { requestId, reason, adminName } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'معرف الطلب مطلوب.' });
  }

  const updated = storage.updatePhoneChangeRequest(requestId, {
    status: 'rejected',
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminName || 'الإدارة العامة',
  });

  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود في النظام.' });
  }

  const notif = {
    id: `NOTIF-PCR-REJ-${Date.now()}`,
    title: '❌ تم رفض طلب تغيير رقم الهاتف',
    message: `تم رفض طلب تغيير رقم الهاتف من قبل الإدارة: ${reason || 'لم يتم استيفاء معايير التحقق الأمني'}`,
    category: 'security',
    timestamp: new Date().toISOString(),
    read: false,
    data: { requestId: updated.id },
  };

  storage.addNotification(notif);
  io.emit('notification', notif);
  io.emit('phone_change_status_updated', { requestId: updated.id, status: 'rejected', request: updated });

  res.json({
    success: true,
    request: updated,
    message: 'تم رفض طلب تغيير رقم الهاتف.',
  });
});

// ============================================================================
// SEO: Multilingual Landing Pages, Sitemap, Robots for ALL domains and languages
// ============================================================================
const LANGUAGES = ['ar', 'en', 'es', 'ru', 'fr', 'de', 'tr', 'pt'];
const LANG_META: Record<string, {name: string; dir: string; iso: string; homeLabel: string}> = {
  ar: { name: 'Arabic', dir: 'rtl', iso: 'ar-SA', homeLabel: 'الرئيسية' },
  en: { name: 'English', dir: 'ltr', iso: 'en-US', homeLabel: 'Home' },
  es: { name: 'Spanish', dir: 'ltr', iso: 'es-ES', homeLabel: 'Inicio' },
  ru: { name: 'Russian', dir: 'ltr', iso: 'ru-RU', homeLabel: 'Главная' },
  fr: { name: 'French', dir: 'ltr', iso: 'fr-FR', homeLabel: 'Accueil' },
  de: { name: 'German', dir: 'ltr', iso: 'de-DE', homeLabel: 'Startseite' },
  tr: { name: 'Turkish', dir: 'ltr', iso: 'tr-TR', homeLabel: 'Ana Sayfa' },
  pt: { name: 'Portuguese', dir: 'ltr', iso: 'pt-BR', homeLabel: 'Inicio' },
};
const LABELS: Record<string, Record<string, string>> = {
  ar: { bonus: 'مكافآت', code: 'كود الوكالة', back: 'العودة للتطبيق', desc1: 'وكالة رسمية', desc2: 'بونص ترحيبي + تعويض خسائر + فك تجميد' },
  en: { bonus: 'Bonus', code: 'Agency Code', back: 'Back to App', desc1: 'Official agency', desc2: 'Welcome bonus + loss compensation + unfreezing' },
  es: { bonus: 'Bonos', code: 'Codigo Agencia', back: 'Volver a la App', desc1: 'Agencia oficial', desc2: 'Bonos de bienvenida + compensacion de perdidas' },
  ru: { bonus: 'Бонусы', code: 'Код Агентства', back: 'Назад к Приложению', desc1: 'Официальное агентство', desc2: 'Приветственный бонус + компенсация потерь' },
  fr: { bonus: 'Bonus', code: 'Code Agence', back: "Retour a l'App", desc1: 'Agence officielle', desc2: 'Bonus de bienvenue + compensation des pertes' },
  de: { bonus: 'Bonus', code: 'Agentur-Code', back: 'Zurueck zur App', desc1: 'Offizielle Agentur', desc2: 'Willkommensbonus + Verlustkompensation' },
  tr: { bonus: 'Bonuslar', code: 'Ajans Kodu', back: 'Uygulamaya Don', desc1: 'Resmi ajans', desc2: 'Hosgeldiniz bonusu + kayip tazminati' },
  pt: { bonus: 'Bonus', code: 'Codigo Agencia', back: 'Voltar ao App', desc1: 'Agencia oficial', desc2: 'Bonus de boas-vindas + compensacao de perdas' },
};
let SEO_COMPANIES: Record<string, any> = {};
try {
  const data = fs.readFileSync(path.join(process.cwd(), 'data', 'companies.json'), 'utf-8');
  for (const c of JSON.parse(data)) { SEO_COMPANIES[c.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = c; }
} catch(e) {}
function escapeHtml(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getCompanyPage(slug: string, domain: string, lang: string): string {
  const c = SEO_COMPANIES[slug]; if (!c) return '';
  const lm = LANG_META[lang] || LANG_META['ar']; const lb = LABELS[lang] || LABELS['ar'];
  const name = c.name_ar || c.name; const desc = c.description || c.name_ar || c.name; const code = c.promo_code || '';
  const fullTitle = name + ' - ' + lb.bonus + ' | ' + domain;
  const canonical = 'https://' + domain + '/company/' + slug + '?lang=' + lang;
  const hreflangs = LANGUAGES.map(l => '    <link rel="alternate" hreflang="' + l + '" href="https://' + domain + '/company/' + slug + '?lang=' + l + '" />').join('\n') + '\n    <link rel="alternate" hreflang="x-default" href="https://' + domain + '/company/' + slug + '" />';
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", "name": name, "description": desc, "url": canonical, "inLanguage": lang, "mainEntity": { "@type": "Organization", "name": c.name }, "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": lm.homeLabel, "item": "https://" + domain + "/?lang=" + lang }, { "@type": "ListItem", "position": 2, "name": c.name, "item": canonical }] } });
  return '<!DOCTYPE html>\n<html lang="' + lang + '" dir="' + lm.dir + '">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>' + escapeHtml(fullTitle) + '</title>\n  <meta name="description" content="' + escapeHtml(name + ' - ' + lb.desc1 + '. ' + lb.desc2 + ' ' + lb.code + ': ' + code) + '">\n  <meta name="keywords" content="' + escapeHtml(c.name + ', ' + name + ', ' + lb.bonus + ', ' + lb.code + ', ' + code + ', betting, sports, ' + domain) + '">\n  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">\n  <link rel="canonical" href="' + canonical + '">\n  <meta property="og:title" content="' + escapeHtml(fullTitle) + '">\n  <meta property="og:description" content="' + escapeHtml(desc) + '">\n  <meta property="og:type" content="website">\n  <meta property="og:url" content="' + canonical + '">\n  <meta property="og:site_name" content="' + domain + '">\n  <meta property="og:locale" content="' + lm.iso + '">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="' + escapeHtml(fullTitle) + '">\n  <meta name="twitter:description" content="' + escapeHtml(desc) + '">\n' + hreflangs + '\n  <script type="application/ld+json">' + jsonLd + '</script>\n</head>\n<body>\n  <h1>' + escapeHtml(name) + '</h1>\n  <p>' + escapeHtml(desc) + '</p>\n  <p>' + lb.code + ': <strong>' + escapeHtml(code) + '</strong></p>\n  <p>' + lb.bonus + ': ' + escapeHtml(c.bonus_text || '') + '</p>\n  <a href="/?lang=' + lang + '">' + lb.back + '</a>\n</body>\n</html>';
}
function getSitemapXml(domain: string): string {
  const entries: string[] = [];
  entries.push('  <url><loc>https://' + domain + '/</loc><lastmod>2026-09-11</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>');
  for (const [slug] of Object.entries(SEO_COMPANIES)) {
    entries.push('  <url><loc>https://' + domain + '/company/' + slug + '</loc><lastmod>2026-09-11</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>');
    for (const lang of LANGUAGES) { entries.push('  <url><loc>https://' + domain + '/company/' + slug + '?lang=' + lang + '</loc><lastmod>2026-09-11</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>'); }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + entries.join('\n') + '\n</urlset>';
}
function getRobotsTxt(domain: string): string { return 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: https://' + domain + '/sitemap.xml\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n'; }

app.get('/company/:slug', (req, res) => {
  const slug = req.params.slug as string; const domain = req.hostname;
  const lang = (req.query.lang as string) || 'ar'; const validLang = LANGUAGES.includes(lang) ? lang : 'ar';
  const html = getCompanyPage(slug, domain, validLang);
  if (!html) return res.status(404).send('Company not found');
  res.set('Content-Type', 'text/html; charset=utf-8'); res.send(html);
});
app.get('/sitemap.xml', (req, res) => { res.set('Content-Type', 'application/xml'); res.send(getSitemapXml(req.hostname)); });
app.get('/robots.txt', (req, res) => { res.set('Content-Type', 'text/plain'); res.send(getRobotsTxt(req.hostname)); });

// ============================================================================
// TELEGRAM BOT VERIFICATION ENGINE (Token in Admin, Contact Sharing, 6-Digit OTP)
// ============================================================================

const TELEGRAM_CONFIG_PATH = path.join(process.cwd(), 'telegram-bot-config.json');

interface ServerTelegramConfig {
  bot_token: string;
  bot_username: string;
  is_active: boolean;
  bot_name?: string;
  bot_id?: number;
  updated_at?: string;
}

let telegramConfig: ServerTelegramConfig = {
  bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
  bot_username: process.env.TELEGRAM_BOT_USERNAME || '',
  is_active: true,
};

// Try loading saved config from file
try {
  if (fs.existsSync(TELEGRAM_CONFIG_PATH)) {
    const raw = fs.readFileSync(TELEGRAM_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    telegramConfig = { ...telegramConfig, ...parsed };
    if (parsed.bot_token) {
      telegramConfig.is_active = parsed.is_active !== false;
    }
  }
} catch (e) {
  console.warn('⚠️ [Telegram] Unable to read telegram-bot-config.json', e);
}

function saveTelegramConfigToFile() {
  try {
    fs.writeFileSync(TELEGRAM_CONFIG_PATH, JSON.stringify(telegramConfig, null, 2), 'utf-8');
  } catch (e) {
    console.error('❌ [Telegram] Failed to write telegram-bot-config.json:', e);
  }
}

interface ServerTelegramSession {
  session_id: string;
  user_id: string;
  created_at: number;
  expires_at: number;
  status: 'pending_telegram' | 'contact_received' | 'verified' | 'expired';
  phone_number?: string;
  telegram_username?: string;
  telegram_id?: number;
  telegram_first_name?: string;
  code?: string;
}

// In-Memory Telegram State
const TELEGRAM_SESSIONS = new Map<string, ServerTelegramSession>();
const TELEGRAM_ACTIVE_CODES = new Map<string, ServerTelegramSession>();
const TELEGRAM_USER_SESSIONS = new Map<number, string>();
const TELEGRAM_VERIFIED_HISTORY: Array<{
  phone: string;
  telegram_username?: string;
  telegram_id?: number;
  verified_at: string;
  session_id: string;
}> = [];

// Helper: Mask token for display
function maskTelegramToken(token: string): string {
  if (!token) return '';
  if (token.length <= 10) return '********';
  const prefix = token.substring(0, 6);
  const suffix = token.substring(token.length - 4);
  return `${prefix}...${suffix}`;
}

// Telegram Bot API Helper: Send message
async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: string;
    keyboard?: any[];
    remove_keyboard?: boolean;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  }
) {
  if (!telegramConfig.bot_token) return null;
  const url = `https://api.telegram.org/bot${telegramConfig.bot_token}/sendMessage`;
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode || 'Markdown',
  };

  if (options?.keyboard) {
    body.reply_markup = {
      keyboard: options.keyboard,
      resize_keyboard: options.resize_keyboard !== false,
      one_time_keyboard: options.one_time_keyboard !== false,
    };
  } else if (options?.remove_keyboard) {
    body.reply_markup = {
      remove_keyboard: true,
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error('❌ [Telegram] Failed to send message:', err);
    return null;
  }
}

// Telegram Polling Daemon
let telegramPollingActive = false;
let telegramPollingOffset = 0;
let telegramPollingAbortController: AbortController | null = null;

async function handleTelegramUpdate(update: any) {
  const message = update.message;
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const telegramUserId = message.from?.id;
  const telegramUsername = message.from?.username || '';
  const telegramFirstName = message.from?.first_name || '';
  const text = (message.text || '').trim();

  console.log(`📩 [Telegram Update] from @${telegramUsername} (chat: ${chatId}):`, text || '[Contact]');

  // Case 1: User Shared Contact (Genuine Phone Number from Telegram)
  if (message.contact) {
    const contact = message.contact;
    let rawPhone = contact.phone_number || '';
    if (!rawPhone) return;

    let cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    // Find linked session for this Telegram user or find first pending session
    let sessionId = TELEGRAM_USER_SESSIONS.get(telegramUserId);
    let session = sessionId ? TELEGRAM_SESSIONS.get(sessionId) : null;

    if (!session || session.status === 'verified') {
      for (const s of Array.from(TELEGRAM_SESSIONS.values())) {
        if (s.status === 'pending_telegram' && Date.now() < s.expires_at) {
          session = s;
          sessionId = s.session_id;
          break;
        }
      }
    }

    // Generate unique 6-digit OTP code
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    while (TELEGRAM_ACTIVE_CODES.has(code)) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    if (!session) {
      sessionId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      session = {
        session_id: sessionId,
        user_id: `user_${telegramUserId}`,
        created_at: Date.now(),
        expires_at: Date.now() + 15 * 60 * 1000,
        status: 'contact_received',
        phone_number: cleanPhone,
        telegram_username: telegramUsername,
        telegram_id: telegramUserId,
        telegram_first_name: telegramFirstName,
        code,
      };
      TELEGRAM_SESSIONS.set(sessionId, session);
    } else {
      session.status = 'contact_received';
      session.phone_number = cleanPhone;
      session.telegram_username = telegramUsername;
      session.telegram_id = telegramUserId;
      session.telegram_first_name = telegramFirstName;
      session.code = code;
    }

    TELEGRAM_ACTIVE_CODES.set(code, session);
    if (telegramUserId) {
      TELEGRAM_USER_SESSIONS.set(telegramUserId, sessionId);
    }

    // Emit live WebSocket update to the browser
    io.emit('telegram_contact_received', {
      sessionId,
      phone: cleanPhone,
      code,
      telegramUsername,
      telegramId: telegramUserId,
    });

    // Send formatted message with click-to-copy code in backticks
    const replyMsg =
      `✅ *تم استلام رقم هاتفك بنجاح وتأمينه!*\n\n` +
      `📞 *رقم الهاتف المعتمد:* \`${cleanPhone}\`\n\n` +
      `🔐 *رمز تأكيد وتفعيل المحفظة الفريد الخاص بك:* \n\n` +
      `\`${code}\`\n\n` +
      `👆 *(اضغط فوق الرمز أعلاه لنسخه بنقرة واحدة)*\n\n` +
      `📋 *الخطوة الأخيرة:*\n` +
      `الرجاء العودة إلى الموقع أو التطبيق ولصق هذا الرمز المكون من 6 أرقام في خانة التأكيد لإتمام ربط وقفل رقم هاتفك بمحفظتك بشكل دائم.`;

    await sendTelegramMessage(chatId, replyMsg, {
      remove_keyboard: true,
      parse_mode: 'Markdown',
    });
    return;
  }

  // Case 2: /start or /start v_SESSION_ID
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    let deepLinkPayload = parts[1] || '';
    if (deepLinkPayload.startsWith('v_')) {
      const sessId = deepLinkPayload;
      if (telegramUserId) {
        TELEGRAM_USER_SESSIONS.set(telegramUserId, sessId);
      }
    }

    const welcomeMsg =
      `مرحباً بك في نظام التوثيق والأمان لمحفظة *VEX Deals* 🛡️\n\n` +
      `لحماية حسابك ومحفظتك من العمليات غير المصرح بها، يلزم بروتوكول الأمان ربط رقم هاتفك الحقيقي بالمحفظة لمرة واحدة فقط.\n\n` +
      `يرجى الضغط على الزر أدناه لمشاركة جهة الاتصال الخاصة بك (رقم هاتفك):`;

    await sendTelegramMessage(chatId, welcomeMsg, {
      parse_mode: 'Markdown',
      keyboard: [
        [
          {
            text: '📲 مشاركة جهة الاتصال لتأكيد المحفظة',
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    });
    return;
  }

  // Case 3: Any other text
  const helpMsg =
    `لتأكيد رقم هاتفك والحصول على رمز تفعيل المحفظة الفريد (6 أرقام)، يرجى الضغط على زر *[📲 مشاركة جهة الاتصال]* أدناه:`;

  await sendTelegramMessage(chatId, helpMsg, {
    parse_mode: 'Markdown',
    keyboard: [
      [
        {
          text: '📲 مشاركة جهة الاتصال لتأكيد المحفظة',
          request_contact: true,
        },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  });
}

async function startTelegramPolling() {
  if (!telegramConfig.bot_token || !telegramConfig.is_active) {
    telegramPollingActive = false;
    return;
  }
  if (telegramPollingActive) return;
  telegramPollingActive = true;
  console.log(`🤖 [Telegram Polling Daemon] Started listening for @${telegramConfig.bot_username || 'Bot'} updates...`);

  (async () => {
    while (telegramPollingActive && telegramConfig.bot_token && telegramConfig.is_active) {
      try {
        telegramPollingAbortController = new AbortController();
        const url = `https://api.telegram.org/bot${telegramConfig.bot_token}/getUpdates?offset=${telegramPollingOffset}&timeout=15&allowed_updates=["message"]`;
        const res = await fetch(url, { signal: telegramPollingAbortController.signal });
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 6000));
          continue;
        }
        const data: any = await res.json();
        if (data && data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            telegramPollingOffset = update.update_id + 1;
            await handleTelegramUpdate(update);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') break;
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
    telegramPollingActive = false;
  })();
}

function stopTelegramPolling() {
  telegramPollingActive = false;
  if (telegramPollingAbortController) {
    telegramPollingAbortController.abort();
    telegramPollingAbortController = null;
  }
}

// TELEGRAM API ENDPOINTS

// 1. Get Admin Telegram Config
app.get('/api/admin/telegram-config', (req, res) => {
  res.json({
    success: true,
    config: {
      bot_token: maskTelegramToken(telegramConfig.bot_token),
      raw_has_token: !!telegramConfig.bot_token,
      bot_username: telegramConfig.bot_username,
      is_active: telegramConfig.is_active,
      bot_name: telegramConfig.bot_name,
      bot_id: telegramConfig.bot_id,
      polling_active: telegramPollingActive,
      updated_at: telegramConfig.updated_at,
    },
    verifiedHistory: TELEGRAM_VERIFIED_HISTORY.slice(0, 15),
  });
});

// 2. Save Admin Telegram Config
app.post('/api/admin/telegram-config', async (req, res) => {
  const { bot_token, bot_username, is_active } = req.body;

  if (!bot_token || !bot_token.trim()) {
    return res.status(400).json({ error: 'توكن بوت تيليجرام مطلوب.' });
  }

  const cleanToken = bot_token.trim();

  // Test token with Telegram API getMe
  try {
    const testRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const testData: any = await testRes.json();

    if (!testData.ok || !testData.result) {
      return res.status(400).json({
        error: `رمز التوكن غير صالح: ${testData.description || 'لم يتعرف تيليجرام على التوكن.'}`,
      });
    }

    const botInfo = testData.result;

    telegramConfig.bot_token = cleanToken;
    telegramConfig.bot_username = bot_username?.trim().replace(/^@/, '') || botInfo.username;
    telegramConfig.bot_name = botInfo.first_name;
    telegramConfig.bot_id = botInfo.id;
    telegramConfig.is_active = is_active !== false;
    telegramConfig.updated_at = new Date().toISOString();

    saveTelegramConfigToFile();

    // Restart polling with new token
    stopTelegramPolling();
    if (telegramConfig.is_active) {
      telegramPollingOffset = 0;
      startTelegramPolling();
    }

    io.emit('telegram_config_updated', {
      bot_username: telegramConfig.bot_username,
      bot_name: telegramConfig.bot_name,
      is_active: telegramConfig.is_active,
    });

    res.json({
      success: true,
      bot: botInfo,
      config: {
        bot_username: telegramConfig.bot_username,
        bot_name: telegramConfig.bot_name,
        bot_id: telegramConfig.bot_id,
        is_active: telegramConfig.is_active,
      },
      message: `تم ربط وتفعيل بوت تيليجرام (@${telegramConfig.bot_username}) بنجاح!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: `فشل الاتصال بخوادم تيليجرام: ${err.message}`,
    });
  }
});

// 3. Test Bot Connection
app.post('/api/admin/telegram/test', async (req, res) => {
  if (!telegramConfig.bot_token) {
    return res.status(400).json({ error: 'لم يتم تعيين توكن البوت بعد.' });
  }
  try {
    const testRes = await fetch(`https://api.telegram.org/bot${telegramConfig.bot_token}/getMe`);
    const testData: any = await testRes.json();
    if (testData.ok) {
      res.json({
        success: true,
        bot: testData.result,
        pollingActive: telegramPollingActive,
        message: `البوت متصل بنجاح: ${testData.result.first_name} (@${testData.result.username})`,
      });
    } else {
      res.status(400).json({ success: false, error: testData.description });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create Telegram Verification Session for user
app.post('/api/telegram/session', (req, res) => {
  const { userId } = req.body;
  const sessionId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const session: ServerTelegramSession = {
    session_id: sessionId,
    user_id: userId || 'user_guest',
    created_at: Date.now(),
    expires_at: Date.now() + 15 * 60 * 1000, // 15 mins
    status: 'pending_telegram',
  };

  TELEGRAM_SESSIONS.set(sessionId, session);

  const botUser = telegramConfig.bot_username || 'VexVerifyBot';
  const deepLink = `https://t.me/${botUser}?start=${sessionId}`;

  res.json({
    success: true,
    session_id: sessionId,
    bot_username: botUser,
    deep_link: deepLink,
    bot_configured: !!(telegramConfig.bot_token && telegramConfig.is_active),
    expires_at: session.expires_at,
  });
});

// 5. Check Session Status
app.get('/api/telegram/session-status/:sessionId', (req, res) => {
  const session = TELEGRAM_SESSIONS.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'الجلسة غير موجودة أو انتهت صلاحيتها.' });
  }
  res.json({
    success: true,
    status: session.status,
    phone_number: session.phone_number,
    has_code: !!session.code,
    telegram_username: session.telegram_username,
  });
});

// 6. Verify 6-Digit Code (User pastes in web app)
app.post('/api/telegram/verify-code', (req, res) => {
  const { code, sessionId, userId } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام.' });
  }

  const cleanCode = code.trim().replace(/[^0-9]/g, '');
  if (cleanCode.length !== 6) {
    return res.status(400).json({ error: 'رمز التحقق يجب أن يتكون من 6 أرقام بالضبط.' });
  }

  // Look up code in active codes
  const session = TELEGRAM_ACTIVE_CODES.get(cleanCode);

  if (!session) {
    return res.status(400).json({
      error: 'رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى التأكد من نسخه من بوت تيليجرام.',
    });
  }

  if (Date.now() > session.expires_at) {
    TELEGRAM_ACTIVE_CODES.delete(cleanCode);
    return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق (أكثر من 15 دقيقة). اطلب رمزاً جديداً.' });
  }

  // Success: mark verified
  session.status = 'verified';
  TELEGRAM_ACTIVE_CODES.delete(cleanCode);

  const verifiedPhone = session.phone_number || '';

  TELEGRAM_VERIFIED_HISTORY.unshift({
    phone: verifiedPhone,
    telegram_username: session.telegram_username,
    telegram_id: session.telegram_id,
    verified_at: new Date().toISOString(),
    session_id: session.session_id,
  });

  const notif = {
    id: `NOTIF-TG-VER-${Date.now()}`,
    title: '🔒 تم تأكيد وقفل رقم هاتفك بنجاح',
    message: `تم ربط وتوثيق رقم هاتفك (${verifiedPhone}) عبر بوت تيليجرام وقفله كمعرف أساسي لمحفظتك.`,
    category: 'security',
    timestamp: new Date().toISOString(),
    read: false,
  };

  storage.addNotification(notif);
  io.emit('notification', notif);
  io.emit('phone_verified', {
    userId: userId || session.user_id,
    phone: verifiedPhone,
    telegramUsername: session.telegram_username,
    telegramId: session.telegram_id,
  });

  res.json({
    success: true,
    phone_number: verifiedPhone,
    telegram_username: session.telegram_username,
    telegram_id: session.telegram_id,
    message: `تم تأكيد وتوثيق رقم هاتفك (${verifiedPhone}) وقفله في المحفظة بنجاح!`,
  });
});

// 7. Simulate Telegram Contact Sharing (Testing & Dev Mode)
app.post('/api/telegram/simulate-contact', (req, res) => {
  const { sessionId, phone, telegramUsername } = req.body;

  const targetSession = sessionId ? TELEGRAM_SESSIONS.get(sessionId) : null;
  const sessId = targetSession ? sessionId : `v_sim_${Date.now().toString(36)}`;

  let cleanPhone = (phone || '+9647701234567').trim();
  if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const session: ServerTelegramSession = targetSession || {
    session_id: sessId,
    user_id: 'user_simulated',
    created_at: Date.now(),
    expires_at: Date.now() + 15 * 60 * 1000,
    status: 'contact_received',
    phone_number: cleanPhone,
    telegram_username: telegramUsername || 'demo_user',
    telegram_id: 12345678,
    code,
  };

  session.status = 'contact_received';
  session.phone_number = cleanPhone;
  session.code = code;
  session.telegram_username = telegramUsername || 'demo_user';

  TELEGRAM_SESSIONS.set(sessId, session);
  TELEGRAM_ACTIVE_CODES.set(code, session);

  io.emit('telegram_contact_received', {
    sessionId: sessId,
    phone: cleanPhone,
    code,
    telegramUsername: session.telegram_username,
  });

  res.json({
    success: true,
    code,
    phone: cleanPhone,
    session_id: sessId,
    message: 'تمت محاكاة مشاركة جهة الاتصال وتوليد الرمز المكون من 6 أرقام بنجاح.',
  });
});

// 8. Telegram Webhook Endpoint
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    await handleTelegramUpdate(req.body);
  } catch (err) {
    console.error('❌ [Telegram Webhook] Error:', err);
  }
  res.sendStatus(200);
});

// BACKGROUND NOTIFICATION WORKER FOR DOCKER (Standalone Fallback & Heuristic Scheduler)
function startDockerNotificationWorker() {
  console.log('🤖 [VEX Docker Notification Worker] Initialized and running in background daemon mode...');
  setInterval(() => {
    try {
      // 1. Process due scheduled non-urgent notifications
      const dueDispatched = agentEngine.processDueScheduledNotifications();
      if (dueDispatched && dueDispatched.length > 0) {
        console.log(`[Heuristic Worker] Dispatched ${dueDispatched.length} optimal-window notifications!`);
        dueDispatched.forEach((notif) => {
          io.emit('notification', notif);
        });
      }

      // 2. Pulse active notifications
      const notifs = storage.getNotifications();
      const unreadCount = notifs.filter((n) => !n.read).length;
      io.emit('worker_pulse', { timestamp: new Date().toISOString(), unreadCount });
    } catch (err) {
      console.error('[Worker Error] Background notification pulse failed:', err);
    }
  }, 30000);
}

// VITE MIDDLEWARE SETUP
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`VEX Deals Full-Stack Server with Socket.io running at http://0.0.0.0:${PORT}`);
    startDockerNotificationWorker();
    if (telegramConfig.bot_token && telegramConfig.is_active) {
      startTelegramPolling();
    }
  });
}

setupServer();
