// ============================================================
// VEX Lottery — canonical domain model.
// Imported by BOTH the React client (src/) and the Express server
// (server/), so keep this file dependency-free: no node:, no DOM,
// no React. Pure types + pure functions only.
// ============================================================

export type LotteryDrawStatus = 'upcoming' | 'open' | 'closed' | 'drawing' | 'completed' | 'cancelled';

export type LotteryTierId = 'tier1_jackpot' | 'tier2_match5' | 'tier3_match4_2' | 'tier4_match3' | 'tier5_match2';

export type LotteryIntervalId = 'hourly' | 'every_5h' | 'every_15h' | 'daily' | 'weekly' | 'monthly';

export interface LotteryPrizeTier {
  id: LotteryTierId;
  nameAr: string;
  nameEn: string;
  matchMain: number;
  matchLucky: number;
  sharePercent: number;
  guaranteedAmount?: number;
  fixedPrize?: number;
  odds?: string;
  termsAr?: string;
  termsEn?: string;
  payoutTermsAr?: string;
  payoutTermsEn?: string;
}

export interface ProvablyFairProof {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  verified: boolean;
}

export interface LotteryDraw {
  id: string;
  drawNumber: number;
  titleAr: string;
  titleEn: string;
  status: LotteryDrawStatus;
  ticketPrice: number;
  currency: string;
  jackpotAmount: number;
  initialJackpot: number;
  totalPool: number;
  ticketsSoldCount: number;
  participantsCount: number;
  openAt: string;
  closeAt: string;
  drawAt: string;
  closedAt?: string;
  winningMainNumbers?: number[];
  winningLuckyNumbers?: number[];
  provablyFair: ProvablyFairProof;
  tiers: LotteryPrizeTier[];
  winnersCount?: Record<string, number>;
  totalPaidOut?: number;
  jackpotPaid?: number;
  isRollover?: boolean;
  /** vex0.35 coverage (rule B): amount paid beyond this draw's own hold,
   *  the 0.5 x baseJackpot cap for this cadence, and whether the cap broke. */
  coverage?: { loss: number; cap: number; breach: boolean };
  reminded60?: boolean;
  reminded30?: boolean;
  /** Demo-history draw seeded at first boot — excluded from platform statistics. */
  isSeedHistory?: boolean;
  /** Cadence bucket this draw belongs to (hourly/5h/15h/daily/weekly/monthly). */
  typeId?: LotteryIntervalId;
}

export interface LotteryTicket {
  id: string;
  drawId: string;
  drawNumber: number;
  userId: string;
  userPhoneMasked?: string;
  companyId?: string;
  mainNumbers: number[];
  luckyNumbers: number[];
  pricePaid: number;
  paymentMethod: 'wallet_balance' | 'compassion_free_ticket' | 'promo_credit';
  purchasedAt: string;
  matchedMainCount?: number;
  matchedLuckyCount?: number;
  matchedTier?: LotteryTierId;
  prizeWon?: number;
  isClaimed?: boolean;
  claimedAt?: string;
  transactionId?: string;
}

export interface LotteryStats {
  totalDrawsCompleted: number;
  totalPrizesPaid: number;
  totalTicketsSold: number;
  biggestJackpotWon: number;
  compassionTicketsAwarded: number;
  hotNumbers: { number: number; frequency: number }[];
  coldNumbers: { number: number; frequency: number }[];
}

export interface LotteryDrawType {
  id: LotteryIntervalId;
  nameAr: string;
  nameEn: string;
  intervalMinutes: number;
  ticketPrice: number;
  baseJackpot: number;
  enabled: boolean;
  tiers: LotteryPrizeTier[];
}

export interface LotteryConfig {
  enabled: boolean;
  autoCreateNext: boolean;
  intervalDays: number;
  baseJackpot: number;
  ticketPrice: number;
  closeGraceSeconds: number;
  notifyTelegram: boolean;
  /** Per-cadence draw types (v3). Absent only before first migration. */
  drawTypes?: Record<LotteryIntervalId, LotteryDrawType>;
}

export interface LotteryServerState {
  version: number;
  tierAlertSubscriptions: Record<LotteryTierId, boolean>;
  airDropTotal: number;
  /** vex0.35: unrecovered coverage debt per cadence type, clawed back from
   *  future rollover carries (never from winner prizes, never below base). */
  coverageDebt?: Partial<Record<LotteryIntervalId, number>>;
}

// Shared admin key used by the admin UI (bundled) and checked by the
// server. Raises the bar above "any button in the console" — it is NOT
// a secret against a determined attacker who reads the bundle.
export const LOTTERY_ADMIN_KEY = 'vex-lottery-admin-2026';

export const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  enabled: true,
  autoCreateNext: true,
  intervalDays: 7,
  baseJackpot: 15000,
  ticketPrice: 1.0,
  closeGraceSeconds: 60,
  notifyTelegram: true,
};

export const DEFAULT_LOTTERY_STATE: LotteryServerState = {
  version: 2,
  tierAlertSubscriptions: {
    tier1_jackpot: true,
    tier2_match5: true,
    tier3_match4_2: true,
    tier4_match3: true,
    tier5_match2: true,
  },
  airDropTotal: 0,
};

// ------------------------------------------------------------
// Prize tiers (single source of truth — UI cards AND payout engine)
// ------------------------------------------------------------

export const DEFAULT_PRIZE_TIERS: LotteryPrizeTier[] = [
  {
    id: 'tier1_jackpot',
    nameAr: 'الجائزة الكبرى (5 أرقام + 2 ذهبيين)',
    nameEn: 'Jackpot (Match 5 + 2 Lucky Stars)',
    matchMain: 5,
    matchLucky: 2,
    sharePercent: 50,
    guaranteedAmount: 10000,
    odds: '1 : 139,838,160',
    termsAr:
      'تتطلب مطابقة جميع الأرقام الخمسة الرئيسية (من 1 إلى 50) بالإضافة إلى رقمي نجوم الحظ الذهبيين (من 1 إلى 12) بدقة تامة. في حال تعدد التذاكر الفائزة، تُقسَّم الجائزة بالتساوي بينها، مع ضمان حد أدنى إجمالي لا يقل عن $10,000.',
    termsEn:
      'Requires an exact match of all 5 main balls (1-50) plus both lucky stars (1-12). If multiple tickets match, the jackpot is split equally among them, guaranteed at no less than $10,000 in total.',
    payoutTermsAr: 'إيداع تلقائي في المحفظة النشطة بعد السحب، ومتاحة للسحب عبر USDT أو فودافون كاش أو التحويل البنكي.',
    payoutTermsEn: 'Automatic credit to your active wallet after the draw. Withdrawable via USDT, Vodafone Cash, or Bank Transfer.',
  },
  {
    id: 'tier2_match5',
    nameAr: 'المستوى الثاني (5 أرقام + 1 ذهبي)',
    nameEn: 'Tier 2 (Match 5 + 1 Lucky Star)',
    matchMain: 5,
    matchLucky: 1,
    sharePercent: 20,
    guaranteedAmount: 2500,
    odds: '1 : 6,991,908',
    termsAr:
      'تتطلب مطابقة 5 أرقام رئيسية ورقم ذهبي واحد. يحصل الفائزون على 20% من إجمالي مجمع السحب مقسومة بينهم بالتساوي، بحد أدنى إجمالي مضمون $2,500.',
    termsEn:
      'Requires matching 5 main numbers and 1 lucky star. Awarded 20% of the total pool split equally among winners, with a guaranteed total minimum of $2,500.',
    payoutTermsAr: 'صرف مباشر في المحفظة بعد انتهاء السحب.',
    payoutTermsEn: 'Direct credit to wallet after the draw completes.',
  },
  {
    id: 'tier3_match4_2',
    nameAr: 'المستوى الثالث (4 أرقام + 2 ذهبيين)',
    nameEn: 'Tier 3 (Match 4 + 2 Lucky Stars)',
    matchMain: 4,
    matchLucky: 2,
    sharePercent: 15,
    guaranteedAmount: 1000,
    odds: '1 : 621,503',
    termsAr:
      'تتطلب مطابقة 4 أرقام رئيسية ورقمي الحظ الذهبيين. يحصل الفائزون على 15% من المجمع مقسومة بينهم بالتساوي، بحد أدنى إجمالي مضمون $1,000.',
    termsEn:
      'Requires matching 4 main numbers and both lucky stars. Awarded 15% of the pool split equally among winners, with a guaranteed total minimum of $1,000.',
    payoutTermsAr: 'إيداع في المحفظة مع إشعار وتوليد إيصال رقمي.',
    payoutTermsEn: 'Credit to wallet with push notification and a digital payout receipt.',
  },
  {
    id: 'tier4_match3',
    nameAr: 'المستوى الرابع (3 أرقام + أي ذهبي)',
    nameEn: 'Tier 4 (Match 3 + Any Lucky)',
    matchMain: 3,
    matchLucky: 1,
    sharePercent: 10,
    fixedPrize: 25,
    odds: '1 : 3,107',
    termsAr:
      'تتطلب مطابقة 3 أرقام رئيسية على الأقل ورقم ذهبي واحد على الأقل. جائزة نقدية ثابتة بقيمة $25.00 لكل تذكرة فائزة.',
    termsEn:
      'Requires matching at least 3 main numbers and at least 1 lucky star. Fixed cash prize of $25.00 per winning ticket.',
    payoutTermsAr: 'تضاف لرصيد المحفظة المتاح للاستخدام في طلبات التعويض أو شراء تذاكر جديدة أو السحب.',
    payoutTermsEn: 'Credited to spendable wallet balance for compensation requests, new tickets or withdrawals.',
  },
  {
    id: 'tier5_match2',
    nameAr: 'المستوى الخامس (رقمين + 1 ذهبي)',
    nameEn: 'Tier 5 (Match 2 + 1 Lucky)',
    matchMain: 2,
    matchLucky: 1,
    sharePercent: 5,
    fixedPrize: 2.5,
    odds: '1 : 128',
    termsAr:
      'تتطلب مطابقة رقمين رئيسيين على الأقل ورقم ذهبي واحد على الأقل. تمنحك جائزة نقدية $2.50 أو تذكرة تكافل مجانية إضافية للمشاركة في السحب القادم.',
    termsEn:
      'Requires matching at least 2 main numbers and at least 1 lucky star. Awards $2.50 cash or a free solidarity lottery ticket.',
    payoutTermsAr: 'تسليم للمحفظة وتحديث لرصيد التذاكر المجانية.',
    payoutTermsEn: 'Credit to wallet and updated free ticket balance.',
  },
];

// ------------------------------------------------------------
// Per-cadence prize economies — each draw type carries its own tiers
// (floors/fixed prizes scale with the jackpot and ticket price).
// ------------------------------------------------------------

export function buildPrizeTiers(p: {
  t1Floor: number;
  t2Floor: number;
  t3Floor: number;
  t4Fixed: number;
  t5Fixed: number;
  t1Share?: number;
  t2Share?: number;
  t3Share?: number;
}): LotteryPrizeTier[] {
  const usd = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return [
    {
      id: 'tier1_jackpot',
      nameAr: 'الجائزة الكبرى (5 أرقام + 2 ذهبيين)',
      nameEn: 'Jackpot (Match 5 + 2 Lucky Stars)',
      matchMain: 5,
      matchLucky: 2,
      sharePercent: p.t1Share ?? 50,
      guaranteedAmount: p.t1Floor,
      odds: '1 : 139,838,160',
      termsAr: `تتطلب مطابقة جميع الأرقام الخمسة الرئيسية (من 1 إلى 50) بالإضافة إلى رقمي نجوم الحظ الذهبيين (من 1 إلى 12) بدقة تامة. في حال تعدد التذاكر الفائزة، تُقسَّم الجائزة بالتساوي بينها، مع ضمان حد أدنى إجمالي لا يقل عن ${usd(p.t1Floor)}.`,
      termsEn: `Requires an exact match of all 5 main balls (1-50) plus both lucky stars (1-12). If multiple tickets match, the jackpot is split equally among them, guaranteed at no less than ${usd(p.t1Floor)} in total.`,
      payoutTermsAr: 'إيداع تلقائي في المحفظة النشطة بعد السحب، ومتاحة للسحب عبر USDT أو فودافون كاش أو التحويل البنكي.',
      payoutTermsEn: 'Automatic credit to your active wallet after the draw. Withdrawable via USDT, Vodafone Cash, or Bank Transfer.',
    },
    {
      id: 'tier2_match5',
      nameAr: 'المستوى الثاني (5 أرقام + 1 ذهبي)',
      nameEn: 'Tier 2 (Match 5 + 1 Lucky Star)',
      matchMain: 5,
      matchLucky: 1,
      sharePercent: p.t2Share ?? 20,
      guaranteedAmount: p.t2Floor,
      odds: '1 : 6,991,908',
      termsAr: `تتطلب مطابقة 5 أرقام رئيسية ورقم ذهبي واحد. يحصل الفائزون على ${p.t2Share ?? 20}% من إجمالي مجمع السحب مقسومة بينهم بالتساوي، بحد أدنى إجمالي مضمون ${usd(p.t2Floor)}.`,
      termsEn: `Requires matching 5 main numbers and 1 lucky star. Awarded ${p.t2Share ?? 20}% of the total pool split equally among winners, with a guaranteed total minimum of ${usd(p.t2Floor)}.`,
      payoutTermsAr: 'صرف مباشر في المحفظة بعد انتهاء السحب.',
      payoutTermsEn: 'Direct credit to wallet after the draw completes.',
    },
    {
      id: 'tier3_match4_2',
      nameAr: 'المستوى الثالث (4 أرقام + 2 ذهبيين)',
      nameEn: 'Tier 3 (Match 4 + 2 Lucky Stars)',
      matchMain: 4,
      matchLucky: 2,
      sharePercent: p.t3Share ?? 15,
      guaranteedAmount: p.t3Floor,
      odds: '1 : 621,503',
      termsAr: `تتطلب مطابقة 4 أرقام رئيسية ورقمي الحظ الذهبيين. يحصل الفائزون على ${p.t3Share ?? 15}% من المجمع مقسومة بينهم بالتساوي، بحد أدنى إجمالي مضمون ${usd(p.t3Floor)}.`,
      termsEn: `Requires matching 4 main numbers and both lucky stars. Awarded ${p.t3Share ?? 15}% of the pool split equally among winners, with a guaranteed total minimum of ${usd(p.t3Floor)}.`,
      payoutTermsAr: 'إيداع في المحفظة مع إشعار وتوليد إيصال رقمي.',
      payoutTermsEn: 'Credit to wallet with push notification and a digital payout receipt.',
    },
    {
      id: 'tier4_match3',
      nameAr: 'المستوى الرابع (3 أرقام + أي ذهبي)',
      nameEn: 'Tier 4 (Match 3 + Any Lucky)',
      matchMain: 3,
      matchLucky: 1,
      sharePercent: 10,
      fixedPrize: p.t4Fixed,
      odds: '1 : 3,107',
      termsAr: `تتطلب مطابقة 3 أرقام رئيسية على الأقل ورقم ذهبي واحد على الأقل. جائزة نقدية ثابتة بقيمة ${usd(p.t4Fixed)} لكل تذكرة فائزة.`,
      termsEn: `Requires matching at least 3 main numbers and at least 1 lucky star. Fixed cash prize of ${usd(p.t4Fixed)} per winning ticket.`,
      payoutTermsAr: 'تضاف لرصيد المحفظة المتاح للاستخدام في طلبات التعويض أو شراء تذاكر جديدة أو السحب.',
      payoutTermsEn: 'Credited to spendable wallet balance for compensation requests, new tickets or withdrawals.',
    },
    {
      id: 'tier5_match2',
      nameAr: 'المستوى الخامس (رقمين + 1 ذهبي)',
      nameEn: 'Tier 5 (Match 2 + 1 Lucky)',
      matchMain: 2,
      matchLucky: 1,
      sharePercent: 5,
      fixedPrize: p.t5Fixed,
      odds: '1 : 128',
      termsAr: `تتطلب مطابقة رقمين رئيسيين على الأقل ورقم ذهبي واحد على الأقل. تمنحك جائزة نقدية ${usd(p.t5Fixed)} لكل تذكرة فائزة.`,
      termsEn: `Requires matching at least 2 main numbers and at least 1 lucky star. Awards ${usd(p.t5Fixed)} cash per winning ticket.`,
      payoutTermsAr: 'تسليم للمحفظة وتحديث لرصيد التذاكر المجانية.',
      payoutTermsEn: 'Credit to wallet and updated free ticket balance.',
    },
  ];
}

export const DEFAULT_DRAW_TYPES: Record<LotteryIntervalId, LotteryDrawType> = {
  hourly: {
    id: 'hourly',
    nameAr: 'سحب كل ساعة',
    nameEn: 'Hourly Draw',
    intervalMinutes: 60,
    ticketPrice: 0.25,
    baseJackpot: 100,
    enabled: true,
    tiers: buildPrizeTiers({ t1Floor: 100, t2Floor: 20, t3Floor: 10, t4Fixed: 2, t5Fixed: 0.5 }),
  },
  every_5h: {
    id: 'every_5h',
    nameAr: 'سحب كل 5 ساعات',
    nameEn: '5-Hour Draw',
    intervalMinutes: 300,
    ticketPrice: 0.5,
    baseJackpot: 500,
    enabled: true,
    tiers: buildPrizeTiers({ t1Floor: 500, t2Floor: 100, t3Floor: 50, t4Fixed: 10, t5Fixed: 1 }),
  },
  every_15h: {
    id: 'every_15h',
    nameAr: 'سحب كل 15 ساعة',
    nameEn: '15-Hour Draw',
    intervalMinutes: 900,
    ticketPrice: 1,
    baseJackpot: 1500,
    enabled: true,
    tiers: buildPrizeTiers({ t1Floor: 1500, t2Floor: 300, t3Floor: 150, t4Fixed: 25, t5Fixed: 2.5 }),
  },
  daily: {
    id: 'daily',
    nameAr: 'السحب اليومي',
    nameEn: 'Daily Draw',
    intervalMinutes: 1440,
    ticketPrice: 1,
    baseJackpot: 15000,
    enabled: true,
    tiers: DEFAULT_PRIZE_TIERS,
  },
  weekly: {
    id: 'weekly',
    nameAr: 'السحب الأسبوعي',
    nameEn: 'Weekly Draw',
    intervalMinutes: 10080,
    ticketPrice: 2,
    baseJackpot: 50000,
    enabled: true,
    tiers: buildPrizeTiers({ t1Floor: 50000, t2Floor: 5000, t3Floor: 2500, t4Fixed: 100, t5Fixed: 10 }),
  },
  monthly: {
    id: 'monthly',
    nameAr: 'السحب الشهري',
    nameEn: 'Monthly Draw',
    intervalMinutes: 43200,
    ticketPrice: 5,
    baseJackpot: 250000,
    enabled: true,
    tiers: buildPrizeTiers({ t1Floor: 250000, t2Floor: 25000, t3Floor: 10000, t4Fixed: 500, t5Fixed: 50 }),
  },
};

export const LOTTERY_DRAW_TYPE_IDS: LotteryIntervalId[] = [
  'hourly',
  'every_5h',
  'every_15h',
  'daily',
  'weekly',
  'monthly',
];

// ------------------------------------------------------------
// Evaluation — strictly matches the advertised tier conditions above.
// Edge cases (documented):
//   5+0, 4+1 falls to tier4 (>=3 main + >=1 lucky), 3+0 / 2+0 / <=1 main -> no prize.
// ------------------------------------------------------------

export function evaluateMatches(matchedMain: number, matchedLucky: number): LotteryTierId | null {
  if (matchedMain === 5 && matchedLucky === 2) return 'tier1_jackpot';
  if (matchedMain === 5 && matchedLucky === 1) return 'tier2_match5';
  if (matchedMain === 4 && matchedLucky === 2) return 'tier3_match4_2';
  if (matchedMain >= 3 && matchedLucky >= 1) return 'tier4_match3';
  if (matchedMain >= 2 && matchedLucky >= 1) return 'tier5_match2';
  return null;
}

export function countMatches(
  ticketMain: number[],
  ticketLucky: number[],
  winMain: number[],
  winLucky: number[]
): { matchedMain: number; matchedLucky: number } {
  const mainSet = new Set(winMain);
  const luckySet = new Set(winLucky);
  return {
    matchedMain: ticketMain.filter((n) => mainSet.has(n)).length,
    matchedLucky: ticketLucky.filter((n) => luckySet.has(n)).length,
  };
}

export function getTier(tierId: LotteryTierId, tiers: LotteryPrizeTier[] = DEFAULT_PRIZE_TIERS): LotteryPrizeTier {
  return tiers.find((t) => t.id === tierId) || tiers[0] || DEFAULT_PRIZE_TIERS[0];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Total prize money for a whole tier in this draw (already accounting for
 * the number of winners). Percentage tiers are a share of totalPool with a
 * guaranteed floor; fixed tiers pay fixedPrize each; the jackpot pays the
 * full jackpot with a guaranteed floor.
 */
export function computeTierTotal(
  tierId: LotteryTierId,
  totalPool: number,
  jackpotAmount: number,
  winnersCount: number,
  tiers: LotteryPrizeTier[] = DEFAULT_PRIZE_TIERS
): number {
  if (winnersCount <= 0) return 0;
  const tier = getTier(tierId, tiers);
  if (tier.fixedPrize) return round2(tier.fixedPrize * winnersCount);
  if (tierId === 'tier1_jackpot') return round2(Math.max(jackpotAmount, tier.guaranteedAmount || 0));
  const share = round2((Math.max(totalPool, 0) * (tier.sharePercent || 0)) / 100);
  return round2(Math.max(share, tier.guaranteedAmount || 0));
}

/** Prize per single winning ticket for a tier. */
export function computePerWinnerPrize(
  tierId: LotteryTierId,
  totalPool: number,
  jackpotAmount: number,
  winnersCount: number,
  tiers: LotteryPrizeTier[] = DEFAULT_PRIZE_TIERS
): number {
  if (winnersCount <= 0) return 0;
  return round2(computeTierTotal(tierId, totalPool, jackpotAmount, winnersCount, tiers) / winnersCount);
}

// ------------------------------------------------------------
// Coverage rules (vex0.35) — house-loss guardrails per draw.
//
// A draw's HOLD is its pool (house seed + paid ticket revenue).
// Coverage LOSS is what the draw pays beyond that hold — the
// guaranteed-floor / fixed-prize burn on a thin pool (exactly the
// quantity runDraw used to warn about). Rule B: loss per draw may
// never exceed 0.5 x baseJackpot.
// ------------------------------------------------------------

export const COVERAGE_MAX_LOSS_RATIO = 0.5;

/** Rule B cap for one draw of a cadence whose baseJackpot is `base`. */
export function maxLossCap(base: number): number {
  return round2(Math.max(0, base) * COVERAGE_MAX_LOSS_RATIO);
}

/** Amount paid beyond the draw's own hold (never negative). */
export function computeCoverageLoss(totalPaidOut: number, totalPool: number): number {
  return round2(Math.max(0, totalPaidOut - totalPool));
}

/**
 * Deterministic zero-revenue floor liability of a tier set: what the house
 * owes from its own seed if every floor binds and no ticket is sold. The
 * pool only grows with sales (which shrink floor excess), so this is the
 * worst case. Percentage tiers owe `max(0, floor - share% x base)`; tier1
 * owes `max(0, floor - base)` because the jackpot consumes the hold first;
 * fixed tiers owe nothing at zero winners.
 */
export function worstCaseFloorLiability(tiers: LotteryPrizeTier[], base: number): number {
  let liability = 0;
  for (const tier of tiers) {
    const floor = tier.guaranteedAmount || 0;
    if (floor <= 0) continue;
    const seedShare =
      tier.id === 'tier1_jackpot' ? base : ((tier.sharePercent || 0) / 100) * base;
    liability += Math.max(0, floor - seedShare);
  }
  return round2(liability);
}

/**
 * Rule B at config time: reject a tier/jackpot combination whose guaranteed
 * floors could burn more than 0.5 x baseJackpot with zero ticket sales.
 * Returns an error message, or null when the configuration is covered.
 */
export function validateTypeCoverage(type: {
  id?: string;
  baseJackpot: number;
  tiers: LotteryPrizeTier[];
}): string | null {
  const cap = maxLossCap(type.baseJackpot);
  const liability = worstCaseFloorLiability(type.tiers, type.baseJackpot);
  if (liability > cap) {
    const name = type.id || 'draw type';
    return (
      `Coverage rule B violated for ${name}: guaranteed floors can burn $${liability.toLocaleString('en-US')} ` +
      `with zero sales, above the cap of 0.5 x baseJackpot = $${cap.toLocaleString('en-US')}. ` +
      `Raise baseJackpot or lower the tier floors.`
    );
  }
  return null;
}

// ------------------------------------------------------------
// Real statistics computed from actual draw history
// ------------------------------------------------------------

export function computeLotteryStats(draws: LotteryDraw[], freeTicketsAwarded = 0): LotteryStats {
  const completed = draws.filter((d) => d.status === 'completed');
  const totalPrizesPaid = round2(completed.reduce((acc, d) => acc + (d.totalPaidOut || 0), 0));
  const totalTicketsSold = draws.reduce((acc, d) => acc + (d.ticketsSoldCount || 0), 0);
  const biggestJackpotWon = completed.reduce((acc, d) => Math.max(acc, d.jackpotPaid || 0), 0);

  const freq = new Map<number, number>();
  completed.forEach((d) => {
    (d.winningMainNumbers || []).forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
  });

  const ranked = Array.from(freq.entries())
    .map(([number, frequency]) => ({ number, frequency }))
    .sort((a, b) => b.frequency - a.frequency || a.number - b.number);

  const hotNumbers = ranked.slice(0, 5);
  const coldNumbers = ranked.slice(-5).reverse();
  // Placeholder fill only once real history exists — an empty platform
  // must not present invented numbers as "hot".
  if (completed.length > 0 && hotNumbers.length < 5) {
    for (let n = 1; n <= 50 && hotNumbers.length < 5; n++) {
      if (!freq.has(n)) hotNumbers.push({ number: n, frequency: 0 });
    }
  }

  return {
    totalDrawsCompleted: completed.length,
    totalPrizesPaid,
    totalTicketsSold,
    biggestJackpotWon,
    compassionTicketsAwarded: freeTicketsAwarded,
    hotNumbers,
    coldNumbers,
  };
}

// ------------------------------------------------------------
// Provably-fair winning number stream (server-side: sha256 via node crypto)
// ------------------------------------------------------------

/**
 * Deterministic uniform pick in [1..max] from the draw seeds.
 * `hashHex(str) -> 64-char lowercase sha256 hex` is injected so this file
 * stays dependency-free (client never generates numbers anyway).
 */
export function pickFromStream(hashHex: (s: string) => string, parts: string[], counter: number, max: number): number {
  const limit = Math.floor(4294967296 / max) * max;
  let i = counter;
  for (;;) {
    const h = hashHex(`${parts.join('|')}|${i}`);
    const v = parseInt(h.slice(0, 8), 16);
    if (v < limit) return (v % max) + 1;
    i++;
  }
}

export function generateWinningNumbersFromSeeds(
  hashHex: (s: string) => string,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { mainNumbers: number[]; luckyNumbers: number[] } {
  const base = [serverSeed, clientSeed, String(nonce)];
  const mainSet = new Set<number>();
  let counter = 0;
  while (mainSet.size < 5) {
    mainSet.add(pickFromStream(hashHex, base, counter++, 50));
  }
  const luckySet = new Set<number>();
  const luckyBase = [serverSeed, clientSeed, String(nonce), 'lucky'];
  let luckyCounter = 0;
  while (luckySet.size < 2) {
    luckySet.add(pickFromStream(hashHex, luckyBase, luckyCounter++, 12));
  }
  return {
    mainNumbers: Array.from(mainSet).sort((a, b) => a - b),
    luckyNumbers: Array.from(luckySet).sort((a, b) => a - b),
  };
}
