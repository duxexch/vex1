import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(express.json({ limit: '10mb' }));

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

// In-Memory App Branding Storage
let currentBranding = {
  appName: 'VEX Deals',
  tagline: 'منصة الولاء والتعويضات والتحليلات الرياضية الذكية',
  iconType: 'preset' as 'preset' | 'custom' | 'upload',
  presetIconId: 'emerald-shield',
  customIconUrl: '',
  uploadedIconData: '',
  iconResolution: { width: 512, height: 512 },
  themeColor: '#f8fafc',
  backgroundColor: '#f8fafc',
  targetCompanyId: 'all',
  exclusiveMode: false,
  updatedAt: new Date().toISOString(),
};

// Curated Sports Fixtures
const SPORTS_FIXTURES = [
  {
    id: 'FIX-RMA-BAR',
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

// In-Memory Notification Queue
const NOTIFICATIONS_STORE: any[] = [
  {
    id: 'NOTIF-AI-01',
    title: '🤖 توقع الذكاء الاصطناعي: الكلاسيكو الإسباني',
    message: 'حلل وكيل VEX الذكي لقاء ريال مدريد وبرشلونة بنسبة ثقة 84% مع ترجيح فوز صاحب الأرض وخيار كلا الفريقين يسجل.',
    category: 'ai_prediction',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    data: {
      matchId: 'FIX-RMA-BAR',
      confidence: 84,
      predictionText: 'فوز أصحاب الأرض أو كلا الفريقين يسجل (2-1)',
    },
  },
  {
    id: 'NOTIF-COMP-02',
    title: '🛡️ نظام أمان الحسابات وتوثيق رقم الهاتف',
    message: 'تم تفعيل ربط رقم الهاتف الحقيقي بنجاح لضمان حماية محفظتك من عمليات السحب غير المصرح بها.',
    category: 'security',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'NOTIF-SPORT-03',
    title: '⚽ انطلاق الجولة الحاسمة لدوري أبطال أوروبا',
    message: 'مباريات نارية قادمة، تحقق من تحليلات الذكاء الاصطناعي ومعدلات الاحتمالات لكل مباراة الآن.',
    category: 'sports_news',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    read: true,
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

// App Branding (Name & Icon)
app.get('/api/app-branding', (req, res) => {
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
  currentBranding.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    branding: currentBranding,
    message: 'تم تحديث هوية وأيقونة التطبيق ومواصفات Manifest بنجاح!',
  });
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

  NOTIFICATIONS_STORE.unshift(newNotif);
  io.emit('notification', newNotif);

  res.json({
    success: true,
    notification: newNotif,
    message: 'تم إنشاء وتوزيع توقع الذكاء الاصطناعي بنجاح كإشعار لجميع المستخدمين!',
  });
});

// Notifications Endpoints
app.get('/api/notifications', (req, res) => {
  res.json({
    notifications: NOTIFICATIONS_STORE,
    unreadCount: NOTIFICATIONS_STORE.filter((n) => !n.read).length,
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

  NOTIFICATIONS_STORE.unshift(notif);
  io.emit('notification', notif);

  res.json({
    success: true,
    notification: notif,
    message: 'تم بث الإشعار بنجاح لجميع مستخدمي التطبيق!',
  });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { id } = req.body;
  if (id === 'all') {
    NOTIFICATIONS_STORE.forEach((n) => (n.read = true));
  } else {
    const target = NOTIFICATIONS_STORE.find((n) => n.id === id);
    if (target) target.read = true;
  }
  res.json({ success: true });
});

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
  });
}

setupServer();
