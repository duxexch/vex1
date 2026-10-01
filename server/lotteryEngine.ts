// ============================================================
// VEX Lottery Engine — server-authoritative draw/ticket lifecycle.
// State lives in data/*.json via storage.ts. No express/socket imports
// here: callers (server.ts) map returned events to notifications.
// ============================================================

import crypto from 'crypto';
import { storage } from './storage';
import {
  LotteryDraw,
  LotteryTicket,
  LotteryTierId,
  LotteryConfig,
  LotteryServerState,
  DEFAULT_PRIZE_TIERS,
  DEFAULT_LOTTERY_CONFIG,
  DEFAULT_LOTTERY_STATE,
  LOTTERY_ADMIN_KEY,
  evaluateMatches,
  countMatches,
  computePerWinnerPrize,
  computeTierTotal,
  computeLotteryStats,
  generateWinningNumbersFromSeeds,
} from '../shared/lotteryConfig';

export { LOTTERY_ADMIN_KEY };

const sha256hex = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const iso = (t: number) => new Date(t).toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

export type LotteryTickEvent =
  | { type: 'reminder60'; draw: LotteryDraw }
  | { type: 'reminder30'; draw: LotteryDraw; tierIds: LotteryTierId[] }
  | { type: 'closed'; draw: LotteryDraw }
  | { type: 'results'; draw: LotteryDraw }
  | { type: 'newDraw'; draw: LotteryDraw };

export type PurchaseResult = { success: true; ticket: LotteryTicket } | { success: false; error: string };
export type DrawResult =
  | { success: true; draw: LotteryDraw; winningMain: number[]; winningLucky: number[]; totalWinners: number; totalPayout: number }
  | { success: false; error: string };

// ------------------------------------------------------------
// Seed / migration
// ------------------------------------------------------------

function buildSeedDraws(): LotteryDraw[] {
  const now = Date.now();
  const day = 86400000;
  const seed87 = 'vex_seed_draw_87_revealed_provably_fair_verified_key_99';
  const seed86 = 'vex_seed_draw_86_revealed_provably_fair_solidarity_pass';
  const openSeed = crypto.randomBytes(32).toString('hex');

  const close88 = now + 2 * day;
  return [
    {
      id: 'DRAW-2026-088',
      drawNumber: 88,
      titleAr: 'سحب VEX الأسبوعي الذهبي الكبرى #88',
      titleEn: 'VEX Weekly Mega Gold Draw #88',
      status: 'open',
      ticketPrice: 1.0,
      currency: 'USD',
      jackpotAmount: 18450.0,
      initialJackpot: 15000.0,
      totalPool: 22680.0,
      ticketsSoldCount: 0,
      participantsCount: 0,
      openAt: iso(now - 3 * day),
      closeAt: iso(close88),
      drawAt: iso(close88 + 3600000),
      provablyFair: {
        serverSeed: openSeed,
        serverSeedHash: sha256hex(openSeed),
        clientSeed: '',
        nonce: 88,
        verified: false,
      },
      tiers: DEFAULT_PRIZE_TIERS,
      isRollover: true,
      reminded60: false,
      reminded30: false,
    },
    {
      id: 'DRAW-2026-087',
      drawNumber: 87,
      titleAr: 'سحب VEX الأسبوعي الكبرى #87',
      titleEn: 'VEX Weekly Mega Draw #87',
      status: 'completed',
      ticketPrice: 1.0,
      currency: 'USD',
      jackpotAmount: 14200.0,
      initialJackpot: 10000.0,
      totalPool: 17400.0,
      ticketsSoldCount: 4120,
      participantsCount: 1105,
      openAt: iso(now - 10 * day),
      closeAt: iso(now - 4 * day),
      drawAt: iso(now - 4 * day),
      closedAt: iso(now - 4 * day),
      winningMainNumbers: [7, 14, 23, 38, 45],
      winningLuckyNumbers: [3, 9],
      provablyFair: {
        serverSeed: seed87,
        serverSeedHash: sha256hex(seed87),
        clientSeed: 'btc_block_890120_vex_seed_87',
        nonce: 87,
        verified: true,
      },
      tiers: DEFAULT_PRIZE_TIERS,
      winnersCount: { tier1_jackpot: 0, tier2_match5: 1, tier3_match4_2: 3, tier4_match3: 42, tier5_match2: 198 },
      totalPaidOut: 6850.0,
      jackpotPaid: 0,
      isRollover: true,
      isSeedHistory: true,
    },
    {
      id: 'DRAW-2026-086',
      drawNumber: 86,
      titleAr: 'سحب تضامن المنحوسين الاستثنائي #86',
      titleEn: 'Unlucky Solidarity Special Draw #86',
      status: 'completed',
      ticketPrice: 1.0,
      currency: 'USD',
      jackpotAmount: 12500.0,
      initialJackpot: 10000.0,
      totalPool: 15300.0,
      ticketsSoldCount: 3200,
      participantsCount: 940,
      openAt: iso(now - 17 * day),
      closeAt: iso(now - 11 * day),
      drawAt: iso(now - 11 * day),
      closedAt: iso(now - 11 * day),
      winningMainNumbers: [4, 18, 29, 33, 49],
      winningLuckyNumbers: [6, 11],
      provablyFair: {
        serverSeed: seed86,
        serverSeedHash: sha256hex(seed86),
        clientSeed: 'btc_block_889150_vex_seed_86',
        nonce: 86,
        verified: true,
      },
      tiers: DEFAULT_PRIZE_TIERS,
      winnersCount: { tier1_jackpot: 1, tier2_match5: 2, tier3_match4_2: 6, tier4_match3: 31, tier5_match2: 145 },
      totalPaidOut: 14850.0,
      jackpotPaid: 12500.0,
      isRollover: false,
      isSeedHistory: true,
    },
  ];
}

function ensureDraws(): LotteryDraw[] {
  let draws = storage.getLotteryDraws();
  if (draws.length === 0) {
    draws = buildSeedDraws();
    storage.saveLotteryDraws(draws);
    console.log('[Lottery] Seeded initial draws (#86-#88) into data/lottery_draws.json');
  }
  return draws;
}

export function getConfig(): LotteryConfig {
  return storage.getLotteryConfig();
}
export function saveConfig(cfg: LotteryConfig): void {
  storage.saveLotteryConfig(cfg);
}
export function getStateStore(): LotteryServerState {
  return storage.getLotteryState();
}
export function saveStateStore(s: LotteryServerState): void {
  storage.saveLotteryState(s);
}

// ------------------------------------------------------------
// Reads
// ------------------------------------------------------------

/** ServerSeed stays secret until the draw is completed (revealed). */
export function publicDraw(d: LotteryDraw): LotteryDraw {
  const revealed = d.status === 'completed' || d.status === 'cancelled';
  return {
    ...d,
    provablyFair: {
      ...d.provablyFair,
      serverSeed: revealed ? d.provablyFair.serverSeed : '',
    },
  };
}

export function getActiveDraw(draws?: LotteryDraw[]): LotteryDraw | null {
  const list = draws || ensureDraws();
  return list.find((d) => d.status === 'open' || d.status === 'closed' || d.status === 'drawing') || null;
}

export function getFreeTickets(userId: string): number {
  const credits = storage.getLotteryCredits();
  if (credits[userId] === undefined) {
    credits[userId] = 1; // welcome solidarity ticket
    storage.saveLotteryCredits(credits);
    return 1;
  }
  return credits[userId];
}

export function setFreeTickets(userId: string, count: number): void {
  const credits = storage.getLotteryCredits();
  credits[userId] = Math.max(0, Math.floor(count));
  storage.saveLotteryCredits(credits);
}

export function getAllTickets(): LotteryTicket[] {
  return storage.getLotteryTickets();
}

export function getUserTickets(userId: string): LotteryTicket[] {
  return storage
    .getLotteryTickets()
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
}

export function computeStats() {
  const draws = ensureDraws();
  const state = getStateStore();
  const tickets = getAllTickets();
  const freeSpent = tickets.filter((t) => t.paymentMethod === 'compassion_free_ticket').length;
  // Seeded demo-history draws are display-only — platform stats track real activity.
  const realDraws = draws.filter((d) => !d.isSeedHistory);
  return computeLotteryStats(realDraws, state.airDropTotal + freeSpent);
}

export interface LotteryPublicState {
  serverTime: string;
  activeDrawId: string | null;
  draws: LotteryDraw[];
  stats: ReturnType<typeof computeLotteryStats>;
  user: { userId: string; freeTickets: number; tickets: LotteryTicket[] } | null;
  allTickets?: LotteryTicket[];
}

export function getPublicState(userId?: string, includeAllTickets = false): LotteryPublicState {
  const draws = ensureDraws();
  const sorted = [...draws].sort((a, b) => b.drawNumber - a.drawNumber);
  const active = getActiveDraw(draws);
  return {
    serverTime: new Date().toISOString(),
    activeDrawId: active ? active.id : null,
    draws: sorted.map(publicDraw),
    stats: computeStats(),
    user: userId
      ? { userId, freeTickets: getFreeTickets(userId), tickets: getUserTickets(userId) }
      : null,
    allTickets: includeAllTickets ? getAllTickets() : undefined,
  };
}

/** Shape consumed by the legacy /api/lottery/status + sync-draw endpoints. */
export function getLegacyReminderState() {
  const draws = ensureDraws();
  const active = getActiveDraw(draws);
  const state = getStateStore();
  if (!active) return null;
  return {
    activeDrawId: active.id,
    titleAr: active.titleAr,
    titleEn: active.titleEn,
    closeAt: active.closeAt,
    jackpotAmount: active.jackpotAmount,
    oneHourReminderSent: !!active.reminded60,
    thirtyMinReminderSent: !!active.reminded30,
    tierAlertSubscriptions: state.tierAlertSubscriptions,
  };
}

// ------------------------------------------------------------
// Mutations
// ------------------------------------------------------------

function validNumbers(mainNumbers: number[], luckyNumbers: number[]): string | null {
  if (mainNumbers.length !== 5 || luckyNumbers.length !== 2) return 'Pick exactly 5 main numbers and 2 lucky stars';
  if (new Set(mainNumbers).size !== 5 || new Set(luckyNumbers).size !== 2) return 'Numbers must be distinct';
  if (mainNumbers.some((n) => !Number.isInteger(n) || n < 1 || n > 50)) return 'Main numbers must be integers 1-50';
  if (luckyNumbers.some((n) => !Number.isInteger(n) || n < 1 || n > 12)) return 'Lucky stars must be integers 1-12';
  return null;
}

export function purchaseTicket(params: {
  userId: string;
  drawId: string;
  mainNumbers: number[];
  luckyNumbers: number[];
  paymentMethod: LotteryTicket['paymentMethod'];
  companyId?: string;
  userPhoneMasked?: string;
}): PurchaseResult {
  const { userId, drawId, mainNumbers, luckyNumbers, paymentMethod, companyId, userPhoneMasked } = params;

  const draws = ensureDraws();
  const draw = draws.find((d) => d.id === drawId);
  if (!draw) return { success: false, error: 'Draw not found' };
  if (draw.status !== 'open') return { success: false, error: 'Draw is currently not open for ticket purchases' };
  if (Date.now() >= new Date(draw.closeAt).getTime()) return { success: false, error: 'Ticket sales for this draw have closed' };

  const numErr = validNumbers(mainNumbers, luckyNumbers);
  if (numErr) return { success: false, error: numErr };

  if (paymentMethod === 'wallet_balance' && !companyId) {
    return { success: false, error: 'companyId is required for wallet purchases (refund/payout destination)' };
  }

  let pricePaid = draw.ticketPrice;
  if (paymentMethod === 'compassion_free_ticket') {
    const credits = storage.getLotteryCredits();
    const balance = credits[userId] === undefined ? 1 : credits[userId];
    if (balance <= 0) return { success: false, error: 'No free compassion tickets available in your balance' };
    credits[userId] = balance - 1;
    storage.saveLotteryCredits(credits);
    pricePaid = 0;
  }

  const tickets = storage.getLotteryTickets();
  const ticket: LotteryTicket = {
    id: `TCK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    drawId: draw.id,
    drawNumber: draw.drawNumber,
    userId,
    userPhoneMasked: userPhoneMasked || `${userId.slice(0, 4)}***`,
    companyId,
    mainNumbers: [...mainNumbers].sort((a, b) => a - b),
    luckyNumbers: [...luckyNumbers].sort((a, b) => a - b),
    pricePaid,
    paymentMethod,
    purchasedAt: new Date().toISOString(),
    matchedMainCount: 0,
    matchedLuckyCount: 0,
    isClaimed: false,
  };
  tickets.unshift(ticket);
  storage.saveLotteryTickets(tickets);

  draw.ticketsSoldCount = (draw.ticketsSoldCount || 0) + 1;
  if (pricePaid > 0) {
    draw.jackpotAmount = round2(draw.jackpotAmount + pricePaid * 0.6);
    draw.totalPool = round2(draw.totalPool + pricePaid);
  }
  draw.participantsCount = new Set(tickets.filter((t) => t.drawId === draw.id).map((t) => t.userId)).size;
  storage.saveLotteryDraws(draws);

  return { success: true, ticket };
}

// ------------------------------------------------------------
// Prize claim — server-authoritative "claimed once" gate.
// The actual money movement happens client-side (the platform keeps
// balances in the browser), but the server owns the claim flag so a
// prize can never be collected twice.
// ------------------------------------------------------------

export type ClaimResult =
  | { success: true; ticket: LotteryTicket; amount: number; companyId?: string; transactionId: string }
  | { success: false; error: string };

export function claimPrize(userId: string, ticketId: string, payoutCompanyId?: string): ClaimResult {
  const tickets = storage.getLotteryTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return { success: false, error: 'Ticket not found' };
  if (ticket.userId !== userId) return { success: false, error: 'This ticket does not belong to the requesting user' };
  if (!ticket.prizeWon || ticket.prizeWon <= 0) return { success: false, error: 'This ticket has no prize to claim' };
  if (ticket.isClaimed) return { success: false, error: 'This prize has already been claimed' };

  if (!ticket.companyId && payoutCompanyId) ticket.companyId = payoutCompanyId;
  ticket.isClaimed = true;
  ticket.claimedAt = new Date().toISOString();
  ticket.transactionId =
    ticket.transactionId || `VEX-TX-${Date.now().toString(36).toUpperCase()}-${ticket.id.slice(-4)}`;
  storage.saveLotteryTickets(tickets);

  return {
    success: true,
    ticket,
    amount: ticket.prizeWon,
    companyId: ticket.companyId,
    transactionId: ticket.transactionId,
  };
}

export function createDraw(params: {
  titleAr?: string;
  titleEn?: string;
  ticketPrice?: number;
  initialJackpot?: number;
  closeAt?: string;
  isRollover?: boolean;
}): LotteryDraw {
  const cfg = getConfig();
  const draws = ensureDraws();
  const nextNumber = draws.reduce((max, d) => Math.max(max, d.drawNumber), 0) + 1;
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const closeAtMs = params.closeAt ? new Date(params.closeAt).getTime() : Date.now() + cfg.intervalDays * 86400000;

  const newDraw: LotteryDraw = {
    id: `DRAW-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
    drawNumber: nextNumber,
    titleAr: params.titleAr || `سحب VEX الأسبوعي الكبرى #${nextNumber}`,
    titleEn: params.titleEn || `VEX Weekly Mega Draw #${nextNumber}`,
    status: 'open',
    ticketPrice: params.ticketPrice ?? cfg.ticketPrice,
    currency: 'USD',
    jackpotAmount: params.initialJackpot ?? cfg.baseJackpot,
    initialJackpot: params.initialJackpot ?? cfg.baseJackpot,
    totalPool: params.initialJackpot ?? cfg.baseJackpot,
    ticketsSoldCount: 0,
    participantsCount: 0,
    openAt: new Date().toISOString(),
    closeAt: iso(closeAtMs),
    drawAt: iso(closeAtMs + cfg.closeGraceSeconds * 1000),
    provablyFair: {
      serverSeed,
      serverSeedHash: sha256hex(serverSeed),
      clientSeed: '',
      nonce: nextNumber,
      verified: false,
    },
    tiers: DEFAULT_PRIZE_TIERS,
    isRollover: params.isRollover || false,
    reminded60: false,
    reminded30: false,
  };

  draws.unshift(newDraw);
  storage.saveLotteryDraws(draws);
  return newDraw;
}

export function runDraw(
  drawId: string,
  opts: { force?: boolean; forcedMain?: number[]; forcedLucky?: number[] } = {}
): DrawResult {
  const draws = ensureDraws();
  const draw = draws.find((d) => d.id === drawId);
  if (!draw) return { success: false, error: 'Draw not found' };
  if (draw.status === 'completed') return { success: false, error: 'Draw already completed' };
  if (draw.status === 'cancelled') return { success: false, error: 'Draw was cancelled' };
  if (!opts.force && draw.status === 'open' && Date.now() < new Date(draw.closeAt).getTime()) {
    return { success: false, error: 'Draw has not closed yet' };
  }

  const pf = draw.provablyFair;
  if (sha256hex(pf.serverSeed) !== pf.serverSeedHash) {
    return { success: false, error: 'Server seed hash mismatch — refusing to draw' };
  }

  let winningMain: number[];
  let winningLucky: number[];
  if (opts.forcedMain && opts.forcedLucky) {
    const err = validNumbers(opts.forcedMain, opts.forcedLucky);
    if (err) return { success: false, error: err };
    winningMain = [...opts.forcedMain].sort((a, b) => a - b);
    winningLucky = [...opts.forcedLucky].sort((a, b) => a - b);
  } else {
    if (!pf.clientSeed) {
      pf.clientSeed = `community_${draw.ticketsSoldCount}_${new Date(draw.closeAt).getTime()}`;
    }
    pf.nonce = draw.drawNumber;
    const generated = generateWinningNumbersFromSeeds(sha256hex, pf.serverSeed, pf.clientSeed, pf.nonce);
    winningMain = generated.mainNumbers;
    winningLucky = generated.luckyNumbers;
  }

  draw.winningMainNumbers = winningMain;
  draw.winningLuckyNumbers = winningLucky;
  if (!draw.closedAt) draw.closedAt = new Date().toISOString();

  const tickets = storage.getLotteryTickets();
  const winnersCount: Record<string, number> = {
    tier1_jackpot: 0,
    tier2_match5: 0,
    tier3_match4_2: 0,
    tier4_match3: 0,
    tier5_match2: 0,
  };

  tickets.forEach((t) => {
    if (t.drawId !== draw.id) return;
    const { matchedMain, matchedLucky } = countMatches(t.mainNumbers, t.luckyNumbers, winningMain, winningLucky);
    t.matchedMainCount = matchedMain;
    t.matchedLuckyCount = matchedLucky;
    const tierId = evaluateMatches(matchedMain, matchedLucky);
    if (tierId) {
      t.matchedTier = tierId;
      winnersCount[tierId] += 1;
    } else {
      t.matchedTier = undefined;
      t.prizeWon = 0;
    }
  });

  // Payouts: percentage tiers are a pool share split among that tier's
  // winners (guaranteed floors applied), fixed tiers pay per ticket.
  let totalPayout = 0;
  (Object.keys(winnersCount) as LotteryTierId[]).forEach((tierId) => {
    const count = winnersCount[tierId];
    if (count <= 0) return;
    const perWinner = computePerWinnerPrize(tierId, draw.totalPool, draw.jackpotAmount, count);
    tickets.forEach((t) => {
      if (t.drawId === draw.id && t.matchedTier === tierId) t.prizeWon = perWinner;
    });
    totalPayout += computeTierTotal(tierId, draw.totalPool, draw.jackpotAmount, count);
  });
  totalPayout = round2(totalPayout);

  const tier1Winners = winnersCount.tier1_jackpot || 0;
  draw.jackpotPaid = tier1Winners > 0 ? round2(computeTierTotal('tier1_jackpot', draw.totalPool, draw.jackpotAmount, tier1Winners)) : 0;
  draw.winnersCount = winnersCount;
  draw.totalPaidOut = totalPayout;
  draw.status = 'completed';
  draw.drawAt = new Date().toISOString();
  pf.verified = true;
  pf.clientSeed = pf.clientSeed || `community_${draw.ticketsSoldCount}_${new Date(draw.closeAt).getTime()}`;

  if (totalPayout > draw.totalPool) {
    console.warn(`[Lottery] ${draw.id}: payout $${totalPayout} exceeds pool $${draw.totalPool} (guaranteed floors)`);
  }

  storage.saveLotteryTickets(tickets);
  storage.saveLotteryDraws(draws);

  const totalWinners = Object.values(winnersCount).reduce((a, b) => a + b, 0);
  return { success: true, draw, winningMain, winningLucky, totalWinners, totalPayout };
}

export function airdropFreeTickets(userId: string, count: number): { success: boolean; balance: number } {
  if (!userId.trim() || !Number.isInteger(count) || count < 1 || count > 500) {
    return { success: false, balance: 0 };
  }
  const credits = storage.getLotteryCredits();
  const base = credits[userId] === undefined ? 1 : credits[userId];
  credits[userId] = base + count;
  storage.saveLotteryCredits(credits);

  const state = getStateStore();
  state.airDropTotal += count;
  saveStateStore(state);

  return { success: true, balance: credits[userId] };
}

export function updateActiveDrawFields(fields: {
  drawId?: string;
  titleAr?: string;
  titleEn?: string;
  closeAt?: string;
  jackpotAmount?: number;
}): LotteryDraw | null {
  const draws = ensureDraws();
  const active = getActiveDraw(draws);
  if (!active) return null;
  if (fields.drawId && fields.drawId !== active.id) return active; // legacy sync only touches the active draw
  if (fields.titleAr) active.titleAr = fields.titleAr;
  if (fields.titleEn) active.titleEn = fields.titleEn;
  if (fields.closeAt) {
    active.closeAt = fields.closeAt;
    const cfg = getConfig();
    active.drawAt = iso(new Date(fields.closeAt).getTime() + cfg.closeGraceSeconds * 1000);
    active.reminded60 = false;
    active.reminded30 = false;
  }
  if (fields.jackpotAmount && Number.isFinite(fields.jackpotAmount)) active.jackpotAmount = fields.jackpotAmount;
  storage.saveLotteryDraws(draws);
  return active;
}

// ------------------------------------------------------------
// Scheduler tick (called every ~30s by the background worker)
// ------------------------------------------------------------

export function schedulerTick(nowMs = Date.now()): LotteryTickEvent[] {
  const cfg = getConfig();
  if (!cfg.enabled) return [];

  const events: LotteryTickEvent[] = [];

  // Phase 1: pre-close reminders + auto-close (one load, one save)
  const draws = ensureDraws();
  let dirty = false;
  for (const draw of draws) {
    if (draw.status !== 'open') continue;
    const closeMs = new Date(draw.closeAt).getTime();
    if (nowMs >= closeMs) {
      draw.status = 'closed';
      draw.closedAt = iso(nowMs);
      if (!draw.provablyFair.clientSeed) {
        draw.provablyFair.clientSeed = `community_${draw.ticketsSoldCount}_${closeMs}`;
      }
      draw.provablyFair.nonce = draw.drawNumber;
      draw.drawAt = iso(closeMs + cfg.closeGraceSeconds * 1000);
      dirty = true;
      events.push({ type: 'closed', draw: { ...draw } });
    } else {
      const diffMin = (closeMs - nowMs) / 60000;
      if (diffMin <= 60 && !draw.reminded60) {
        draw.reminded60 = true;
        dirty = true;
        events.push({ type: 'reminder60', draw: { ...draw } });
      }
      if (diffMin <= 30 && !draw.reminded30) {
        draw.reminded30 = true;
        dirty = true;
        const subs = getStateStore().tierAlertSubscriptions;
        const tierIds = (Object.keys(subs) as LotteryTierId[]).filter((t) => subs[t]);
        events.push({ type: 'reminder30', draw: { ...draw }, tierIds });
      }
    }
  }
  if (dirty) storage.saveLotteryDraws(draws);

  // Phase 2: auto-draw closed draws past drawAt (runDraw persists its own state,
  // so re-read the store here instead of using the possibly stale `draws` copy)
  for (const draw of ensureDraws()) {
    if (draw.status === 'closed' && nowMs >= new Date(draw.drawAt).getTime()) {
      const res = runDraw(draw.id, { force: true });
      if (res.success) {
        if ((res.draw.winnersCount?.tier1_jackpot || 0) === 0) {
          const all = storage.getLotteryDraws();
          const fresh = all.find((d) => d.id === draw.id);
          if (fresh) {
            fresh.isRollover = true;
            storage.saveLotteryDraws(all);
          }
        }
        events.push({ type: 'results', draw: res.draw });
      } else if ('error' in res) {
        console.error(`[Lottery] Auto-draw failed for ${draw.id}:`, res.error);
      }
    }
  }

  // Phase 3: auto-create the next draw once nothing is active.
  const current = ensureDraws();
  const stillActive = current.some((d) => d.status === 'open' || d.status === 'closed' || d.status === 'drawing');
  if (cfg.autoCreateNext && !stillActive && current.length > 0) {
    const prev = current.reduce((max, d) => (d.drawNumber > max.drawNumber ? d : max), current[0]);
    if (prev.status === 'completed') {
      const tier1Won = (prev.winnersCount?.tier1_jackpot || 0) > 0;
      const nextJackpot = tier1Won ? cfg.baseJackpot : Math.max(cfg.baseJackpot, prev.jackpotAmount);
      const created = createDraw({
        initialJackpot: nextJackpot,
        closeAt: iso(nowMs + cfg.intervalDays * 86400000),
        isRollover: !tier1Won,
      });
      events.push({ type: 'newDraw', draw: created });
    }
  }

  return events;
}
