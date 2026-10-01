import {
  LotteryDraw,
  LotteryTicket,
  LotteryStats,
  LotteryUserWonPrize,
  LotteryAlertSettings,
} from '../types';
import {
  DEFAULT_PRIZE_TIERS,
  LOTTERY_ADMIN_KEY,
  evaluateMatches,
  countMatches,
  computePerWinnerPrize,
  computeTierTotal,
  computeLotteryStats,
  type LotteryTierId,
} from '../../shared/lotteryConfig';
import { requestFCMToken } from './firebaseClient';
import { vexApi } from './api';

// Re-export for existing consumers (LotteryPrizeCards, LotteryTierAlertsModal)
export { DEFAULT_PRIZE_TIERS };
export { LOTTERY_ADMIN_KEY };

const STORAGE_KEYS = {
  DRAWS: 'vex_lottery_draws_v1',
  TICKETS: 'vex_lottery_tickets_v1',
  FREE_TICKETS_BALANCE: 'vex_lottery_free_tickets_',
  USER_WON_PRIZES: 'vex_lottery_user_winnings_',
  ALERT_SETTINGS: 'vex_lottery_tier_alert_settings_v1',
};

// SHA-256 helper using Web Crypto API
export async function sha256(message: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('WebCrypto not available, using fallback hash', err);
  }
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback_sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

interface LotteryStateResponse {
  success: boolean;
  serverTime: string;
  activeDrawId: string | null;
  draws: LotteryDraw[];
  stats: LotteryStats;
  user: { userId: string; freeTickets: number; tickets: LotteryTicket[] } | null;
  allTickets?: LotteryTicket[];
}

const STATE_CACHE_MS = 5000;

class LotteryService {
  private draws: LotteryDraw[] = [];
  private tickets: LotteryTicket[] = [];
  private freeByUser: Record<string, number> = {};
  private stateCache = new Map<string, { at: number; data: LotteryStateResponse }>();

  constructor() {
    this.initData();
  }

  // ----------------------------------------------------------
  // Local mirror (offline fallback + cheap sync getters)
  // ----------------------------------------------------------

  private initData() {
    if (typeof window === 'undefined') return;
    try {
      const storedDraws = localStorage.getItem(STORAGE_KEYS.DRAWS);
      if (storedDraws) this.draws = JSON.parse(storedDraws);
      const storedTickets = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (storedTickets) this.tickets = JSON.parse(storedTickets);
    } catch (e) {
      console.warn('Error loading lottery data from localStorage:', e);
      this.draws = [];
      this.tickets = [];
    }
  }

  private saveDraws() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DRAWS, JSON.stringify(this.draws));
    }
  }

  private saveTickets() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(this.tickets));
    }
  }

  private invalidateState() {
    this.stateCache.clear();
  }

  private adminHeaders(): Record<string, string> {
    return { 'x-vex-admin': LOTTERY_ADMIN_KEY };
  }

  /** Fetch server state (5s in-memory cache). Returns null when unreachable. */
  private async fetchState(userId?: string, allTickets = false): Promise<LotteryStateResponse | null> {
    const key = `${userId || ''}|${allTickets ? 'all' : ''}`;
    const cached = this.stateCache.get(key);
    if (cached && Date.now() - cached.at < STATE_CACHE_MS) return cached.data;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const qs = new URLSearchParams();
      if (userId) qs.set('userId', userId);
      if (allTickets) qs.set('allTickets', '1');
      const query = qs.toString();
      const res = await fetch(`/api/lottery/state${query ? `?${query}` : ''}`, {
        signal: controller.signal,
        headers: allTickets ? this.adminHeaders() : undefined,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`state ${res.status}`);
      const data = (await res.json()) as LotteryStateResponse;
      if (!data || !data.success || !Array.isArray(data.draws)) throw new Error('bad state payload');

      this.stateCache.set(key, { at: Date.now(), data });
      this.draws = data.draws;
      this.saveDraws();
      if (data.user) {
        this.tickets = data.user.tickets;
        this.freeByUser[data.user.userId] = data.user.freeTickets;
        this.saveTickets();
      }
      return data;
    } catch (err) {
      console.debug('Lottery state fetch unavailable, using local fallback:', err);
      return null;
    }
  }

  // ----------------------------------------------------------
  // Reads
  // ----------------------------------------------------------

  public async getDraws(): Promise<LotteryDraw[]> {
    const state = await this.fetchState();
    if (state) return [...state.draws].sort((a, b) => b.drawNumber - a.drawNumber);
    this.initData();
    return [...this.draws].sort((a, b) => b.drawNumber - a.drawNumber);
  }

  public async getActiveDraw(): Promise<LotteryDraw | null> {
    const draws = await this.getDraws();
    return draws.find((d) => d.status === 'open' || d.status === 'drawing' || d.status === 'closed') || draws[0] || null;
  }

  public async getUserTickets(userId: string): Promise<LotteryTicket[]> {
    const state = await this.fetchState(userId);
    if (state && state.user) return state.user.tickets;
    this.initData();
    return this.tickets
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  }

  /** All tickets across all users — admin only (server verifies the admin key). */
  public async getAllTickets(): Promise<LotteryTicket[]> {
    const state = await this.fetchState(undefined, true);
    if (state && state.allTickets) return state.allTickets;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
        if (raw) return JSON.parse(raw) as LotteryTicket[];
      } catch {
        /* ignore */
      }
    }
    return [];
  }

  public getFreeCompassionTicketsCount(userId: string): number {
    if (this.freeByUser[userId] !== undefined) return this.freeByUser[userId];
    if (typeof window === 'undefined') return 1;
    const raw = localStorage.getItem(`${STORAGE_KEYS.FREE_TICKETS_BALANCE}${userId}`);
    if (raw !== null) return parseInt(raw, 10) || 0;
    // Default 1 free solidarity welcome ticket (server mirrors this lazily)
    localStorage.setItem(`${STORAGE_KEYS.FREE_TICKETS_BALANCE}${userId}`, '1');
    return 1;
  }

  public setFreeCompassionTicketsCount(userId: string, count: number): void {
    const safe = Math.max(0, count);
    this.freeByUser[userId] = safe;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEYS.FREE_TICKETS_BALANCE}${userId}`, safe.toString());
    }
  }

  public generateQuickPick(): { mainNumbers: number[]; luckyNumbers: number[] } {
    const mainSet = new Set<number>();
    while (mainSet.size < 5) {
      mainSet.add(Math.floor(Math.random() * 50) + 1);
    }
    const luckySet = new Set<number>();
    while (luckySet.size < 2) {
      luckySet.add(Math.floor(Math.random() * 12) + 1);
    }
    return {
      mainNumbers: Array.from(mainSet).sort((a, b) => a - b),
      luckyNumbers: Array.from(luckySet).sort((a, b) => a - b),
    };
  }

  public getStats(): LotteryStats {
    const cached = this.stateCache.get('|');
    if (cached) return cached.data.stats;
    this.initData();
    return computeLotteryStats(this.draws, 0);
  }

  // ----------------------------------------------------------
  // Purchase (server-authoritative, local fallback when offline)
  // ----------------------------------------------------------

  public async purchaseTicket(params: {
    userId: string;
    drawId: string;
    mainNumbers: number[];
    luckyNumbers: number[];
    paymentMethod: 'wallet_balance' | 'compassion_free_ticket' | 'promo_credit';
    companyId?: string;
    userPhoneMasked?: string;
  }): Promise<{ success: boolean; ticket?: LotteryTicket; error?: string }> {
    const isPaid = params.paymentMethod === 'wallet_balance';
    let price = 0;
    let debited = false;

    // Wallet purchases: validate + debit locally BEFORE creating the ticket,
    // refunding if the server rejects it.
    if (isPaid) {
      const state = await this.fetchState();
      const draw = state?.draws.find((d) => d.id === params.drawId);
      if (!draw) return { success: false, error: 'Draw not found' };
      if (draw.status !== 'open') {
        return { success: false, error: 'Draw is currently not open for ticket purchases' };
      }
      price = draw.ticketPrice;
      if (!params.companyId) {
        return { success: false, error: 'No wallet selected for payment' };
      }
      debited = await vexApi.debitWallet(params.companyId, price, 'lottery_ticket_purchase', 'VEX LOTTERY');
      if (!debited) {
        return { success: false, error: 'Insufficient balance in the selected wallet' };
      }
    }

    const refund = () => {
      if (debited && params.companyId) {
        void vexApi.creditWallet(params.companyId, price, 'lottery_ticket_refund', 'VEX LOTTERY REFUND');
      }
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/lottery/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId: params.userId,
          drawId: params.drawId,
          mainNumbers: params.mainNumbers,
          luckyNumbers: params.luckyNumbers,
          paymentMethod: params.paymentMethod,
          companyId: params.companyId,
          userPhoneMasked: params.userPhoneMasked,
        }),
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.ticket) {
          this.invalidateState();
          this.tickets.unshift(data.ticket);
          this.saveTickets();
          if (params.paymentMethod === 'compassion_free_ticket') {
            const cur = this.getFreeCompassionTicketsCount(params.userId);
            this.setFreeCompassionTicketsCount(params.userId, cur - 1);
          }
          return { success: true, ticket: data.ticket };
        }
        refund();
        return { success: false, error: (data && data.error) || 'Failed to purchase ticket' };
      }

      let error = `Failed to purchase ticket (${res.status})`;
      try {
        const body = await res.json();
        if (body && body.error) error = body.error;
      } catch {
        /* non-JSON error body */
      }
      refund();
      return { success: false, error };
    } catch (err) {
      // Network/server unreachable — keep the offline demo path working.
      // Paid tickets were already debited above; free tickets debit their own counter.
      console.warn('Lottery purchase fell back to local mode:', err);
      const local = this.purchaseTicketLocal(params);
      if (!local.success) refund();
      return local;
    }
  }

  private purchaseTicketLocal(params: {
    userId: string;
    drawId: string;
    mainNumbers: number[];
    luckyNumbers: number[];
    paymentMethod: 'wallet_balance' | 'compassion_free_ticket' | 'promo_credit';
    companyId?: string;
    userPhoneMasked?: string;
  }): { success: boolean; ticket?: LotteryTicket; error?: string } {
    this.initData();
    const { userId, drawId, mainNumbers, luckyNumbers, paymentMethod, companyId, userPhoneMasked } = params;

    const draw = this.draws.find((d) => d.id === drawId);
    if (!draw) return { success: false, error: 'Draw not found' };
    if (draw.status !== 'open') return { success: false, error: 'Draw is currently not open for ticket purchases' };
    if (mainNumbers.length !== 5 || luckyNumbers.length !== 2) {
      return { success: false, error: 'Please select exactly 5 main numbers and 2 lucky stars' };
    }
    if (new Set(mainNumbers).size !== 5 || new Set(luckyNumbers).size !== 2) {
      return { success: false, error: 'Numbers must be distinct' };
    }

    if (paymentMethod === 'compassion_free_ticket') {
      const freeCount = this.getFreeCompassionTicketsCount(userId);
      if (freeCount <= 0) {
        return { success: false, error: 'No free compassion tickets available in your balance' };
      }
      this.setFreeCompassionTicketsCount(userId, freeCount - 1);
    }

    const ticketPrice = paymentMethod === 'compassion_free_ticket' ? 0 : draw.ticketPrice;
    const ticketId = `TCK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newTicket: LotteryTicket = {
      id: ticketId,
      drawId: draw.id,
      drawNumber: draw.drawNumber,
      userId,
      userPhoneMasked: userPhoneMasked || `${userId.slice(0, 4)}***`,
      companyId,
      mainNumbers: [...mainNumbers].sort((a, b) => a - b),
      luckyNumbers: [...luckyNumbers].sort((a, b) => a - b),
      pricePaid: ticketPrice,
      paymentMethod,
      purchasedAt: new Date().toISOString(),
      matchedMainCount: 0,
      matchedLuckyCount: 0,
      isClaimed: false,
    };

    draw.ticketsSoldCount += 1;
    if (ticketPrice > 0) {
      draw.jackpotAmount = Math.round((draw.jackpotAmount + ticketPrice * 0.6) * 100) / 100;
      draw.totalPool = Math.round((draw.totalPool + ticketPrice) * 100) / 100;
    }
    this.saveDraws();
    this.tickets.unshift(newTicket);
    this.saveTickets();

    return { success: true, ticket: newTicket };
  }

  // ----------------------------------------------------------
  // Provably Fair verification
  // ----------------------------------------------------------

  public async verifyDrawFairness(draw: LotteryDraw): Promise<{
    isValid: boolean;
    computedHash: string;
    expectedHash: string;
  }> {
    const computedHash = await sha256(draw.provablyFair.serverSeed);
    const expectedHash = draw.provablyFair.serverSeedHash;
    return {
      isValid: computedHash.toLowerCase() === expectedHash.toLowerCase(),
      computedHash,
      expectedHash,
    };
  }

  // ----------------------------------------------------------
  // Admin actions (server endpoints with admin key; local fallback)
  // ----------------------------------------------------------

  public async triggerDraw(
    drawId: string,
    forcedNumbers?: { mainNumbers: number[]; luckyNumbers: number[] }
  ): Promise<{
    success: boolean;
    winningMain: number[];
    winningLucky: number[];
    totalWinners: number;
    totalPayout: number;
  }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.adminHeaders() },
        signal: controller.signal,
        body: JSON.stringify({
          drawId,
          forceMain: forcedNumbers?.mainNumbers,
          forceLucky: forcedNumbers?.luckyNumbers,
        }),
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        throw new Error((data && data.error) || `Draw failed (${res.status})`);
      }
      this.invalidateState();
      return {
        success: true,
        winningMain: data.winningMain,
        winningLucky: data.winningLucky,
        totalWinners: data.totalWinners,
        totalPayout: data.totalPayout,
      };
    } catch (err) {
      if (err instanceof TypeError || (err instanceof Error && err.name === 'AbortError')) {
        // Offline: evaluate locally with the same shared rules.
        return this.triggerDrawLocal(drawId, forcedNumbers);
      }
      throw err;
    }
  }

  private triggerDrawLocal(
    drawId: string,
    forcedNumbers?: { mainNumbers: number[]; luckyNumbers: number[] }
  ): {
    success: boolean;
    winningMain: number[];
    winningLucky: number[];
    totalWinners: number;
    totalPayout: number;
  } {
    this.initData();
    const draw = this.draws.find((d) => d.id === drawId);
    const empty = { success: false, winningMain: [], winningLucky: [], totalWinners: 0, totalPayout: 0 };
    if (!draw) return empty;

    let winningMain: number[];
    let winningLucky: number[];
    if (forcedNumbers && forcedNumbers.mainNumbers.length === 5 && forcedNumbers.luckyNumbers.length === 2) {
      winningMain = [...forcedNumbers.mainNumbers].sort((a, b) => a - b);
      winningLucky = [...forcedNumbers.luckyNumbers].sort((a, b) => a - b);
    } else {
      const generated = this.generateQuickPick();
      winningMain = generated.mainNumbers;
      winningLucky = generated.luckyNumbers;
    }

    draw.winningMainNumbers = winningMain;
    draw.winningLuckyNumbers = winningLucky;
    draw.status = 'completed';
    draw.drawAt = new Date().toISOString();
    draw.provablyFair.verified = true;
    if (!draw.provablyFair.clientSeed) {
      draw.provablyFair.clientSeed = `community_${draw.ticketsSoldCount}_${new Date(draw.closeAt).getTime()}`;
    }

    let totalWinners = 0;
    let totalPayout = 0;
    const winnersCount: Record<LotteryTierId, number> = {
      tier1_jackpot: 0,
      tier2_match5: 0,
      tier3_match4_2: 0,
      tier4_match3: 0,
      tier5_match2: 0,
    };

    this.tickets.forEach((t) => {
      if (t.drawId !== drawId) return;
      const { matchedMain, matchedLucky } = countMatches(t.mainNumbers, t.luckyNumbers, winningMain, winningLucky);
      t.matchedMainCount = matchedMain;
      t.matchedLuckyCount = matchedLucky;
      const tierId = evaluateMatches(matchedMain, matchedLucky);
      if (tierId) {
        t.matchedTier = tierId;
        winnersCount[tierId] += 1;
        totalWinners++;
      } else {
        t.matchedTier = undefined;
        t.prizeWon = 0;
      }
    });

    (Object.keys(winnersCount) as LotteryTierId[]).forEach((tierId) => {
      const count = winnersCount[tierId];
      if (count <= 0) return;
      const perWinner = computePerWinnerPrize(tierId, draw.totalPool, draw.jackpotAmount, count);
      this.tickets.forEach((t) => {
        if (t.drawId === drawId && t.matchedTier === tierId) t.prizeWon = perWinner;
      });
      totalPayout += computeTierTotal(tierId, draw.totalPool, draw.jackpotAmount, count);
    });

    draw.winnersCount = winnersCount;
    draw.totalPaidOut = Math.round(totalPayout * 100) / 100;
    draw.jackpotPaid =
      winnersCount.tier1_jackpot > 0
        ? computeTierTotal('tier1_jackpot', draw.totalPool, draw.jackpotAmount, winnersCount.tier1_jackpot)
        : 0;

    this.saveDraws();
    this.saveTickets();

    return { success: true, winningMain, winningLucky, totalWinners, totalPayout: draw.totalPaidOut };
  }

  public async createDraw(params: {
    titleAr: string;
    titleEn: string;
    ticketPrice: number;
    initialJackpot: number;
    closeAt: string;
  }): Promise<LotteryDraw> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/lottery/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.adminHeaders() },
        signal: controller.signal,
        body: JSON.stringify(params),
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success || !data.draw) {
        throw new Error((data && data.error) || `Create draw failed (${res.status})`);
      }
      this.invalidateState();
      return data.draw as LotteryDraw;
    } catch (err) {
      if (err instanceof TypeError || (err instanceof Error && err.name === 'AbortError')) {
        return this.createDrawLocal(params);
      }
      throw err;
    }
  }

  private async createDrawLocal(params: {
    titleAr: string;
    titleEn: string;
    ticketPrice: number;
    initialJackpot: number;
    closeAt: string;
  }): Promise<LotteryDraw> {
    this.initData();
    const nextNumber = this.draws.reduce((max, d) => Math.max(max, d.drawNumber), 87) + 1;
    const serverSeed = `vex_seed_draw_${nextNumber}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const serverSeedHash = await sha256(serverSeed);

    const newDraw: LotteryDraw = {
      id: `DRAW-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
      drawNumber: nextNumber,
      titleAr: params.titleAr || `سحب VEX الأسبوعي الكبرى #${nextNumber}`,
      titleEn: params.titleEn || `VEX Weekly Mega Draw #${nextNumber}`,
      status: 'open',
      ticketPrice: params.ticketPrice || 1.0,
      currency: 'USD',
      jackpotAmount: params.initialJackpot || 15000.0,
      initialJackpot: params.initialJackpot || 15000.0,
      totalPool: params.initialJackpot || 15000.0,
      ticketsSoldCount: 0,
      participantsCount: 0,
      openAt: new Date().toISOString(),
      closeAt: params.closeAt || new Date(Date.now() + 7 * 86400000).toISOString(),
      drawAt: new Date(new Date(params.closeAt || Date.now() + 7 * 86400000).getTime() + 60000).toISOString(),
      provablyFair: {
        serverSeed,
        serverSeedHash,
        clientSeed: '',
        nonce: nextNumber,
        verified: false,
      },
      tiers: DEFAULT_PRIZE_TIERS,
      isRollover: false,
      reminded60: false,
      reminded30: false,
    };

    this.draws.unshift(newDraw);
    this.saveDraws();
    return newDraw;
  }

  public async airdropFreeTickets(userId: string, count: number): Promise<{ success: boolean; balance: number }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/lottery/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.adminHeaders() },
        signal: controller.signal,
        body: JSON.stringify({ userId, count }),
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        throw new Error((data && data.error) || `Airdrop failed (${res.status})`);
      }
      this.invalidateState();
      this.setFreeCompassionTicketsCount(userId, data.balance);
      return { success: true, balance: data.balance };
    } catch (err) {
      if (err instanceof TypeError || (err instanceof Error && err.name === 'AbortError')) {
        const current = this.getFreeCompassionTicketsCount(userId);
        const balance = current + count;
        this.setFreeCompassionTicketsCount(userId, balance);
        return { success: true, balance };
      }
      throw err;
    }
  }

  // ----------------------------------------------------------
  // Winnings history
  // ----------------------------------------------------------

  public async getUserWonPrizes(userId: string): Promise<LotteryUserWonPrize[]> {
    const tickets = await this.getUserTickets(userId);
    const drawMap = new Map(this.draws.map((d) => [d.id, d]));

    const fromTickets: LotteryUserWonPrize[] = tickets
      .filter((t) => (t.prizeWon || 0) > 0)
      .map((t) => {
        const draw = drawMap.get(t.drawId);
        const tier = DEFAULT_PRIZE_TIERS.find((p) => p.id === t.matchedTier) || DEFAULT_PRIZE_TIERS[4];
        return {
          id: `WIN-${t.id}`,
          ticketId: t.id,
          drawId: t.drawId,
          drawNumber: t.drawNumber,
          drawTitleAr: draw?.titleAr || `سحب VEX التكافلي #${t.drawNumber}`,
          drawTitleEn: draw?.titleEn || `VEX Solidarity Draw #${t.drawNumber}`,
          date: t.claimedAt || t.purchasedAt,
          prizeNameAr: tier.nameAr,
          prizeNameEn: tier.nameEn,
          tierId: t.matchedTier || 'tier5_match2',
          amountWon: t.prizeWon || 0,
          matchedMainCount: t.matchedMainCount || 0,
          matchedLuckyCount: t.matchedLuckyCount || 0,
          mainNumbers: t.mainNumbers,
          luckyNumbers: t.luckyNumbers,
          deliveryStatus: t.isClaimed ? ('deposited_to_wallet' as const) : ('processing' as const),
          payoutWalletCompanyId: t.companyId,
          transactionRef: t.isClaimed
            ? t.transactionId || `VEX-TX-${t.id.slice(-6)}`
            : undefined,
          claimedAt: t.claimedAt,
        };
      });

    // Custom saved records in localStorage (e.g. claims synced elsewhere)
    let customWon: LotteryUserWonPrize[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_KEYS.USER_WON_PRIZES}${userId}`);
        if (raw) customWon = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse custom won prizes', e);
      }
    }

    const all = [...fromTickets, ...customWon];
    const seen = new Set<string>();
    return all
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ----------------------------------------------------------
  // Prize claim — server marks the ticket claimed once, then the
  // prize is credited into the user's wallet (platform pattern).
  // ----------------------------------------------------------

  public async claimPrize(
    userId: string,
    ticketId: string,
    fallbackCompanyId?: string
  ): Promise<{
    success: boolean;
    amount?: number;
    companyId?: string;
    transactionId?: string;
    error?: string;
  }> {
    // Wallet must exist before we hit the server: once the server marks the
    // ticket claimed we cannot roll that flag back, so never claim blind.
    const wallets = await vexApi.getWallets();
    const wallet = fallbackCompanyId ? wallets.find((w) => w.company_id === fallbackCompanyId) : undefined;
    if (!wallet) {
      return { success: false, error: 'No linked wallet to deposit the prize into' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('/api/lottery/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ userId, ticketId, companyId: fallbackCompanyId }),
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        return { success: false, error: (data && data.error) || `Claim failed (${res.status})` };
      }

      const amount = Number(data.amount) || 0;
      const targetCompanyId = data.companyId || fallbackCompanyId!;
      const credited = await vexApi.creditWallet(targetCompanyId, amount, 'lottery_prize_payout', 'VEX LOTTERY PRIZE');
      this.invalidateState();

      if (!credited) {
        return {
          success: false,
          amount,
          transactionId: data.transactionId,
          error: 'Prize was marked claimed but the wallet credit failed — contact support with this reference',
        };
      }
      return {
        success: true,
        amount,
        companyId: targetCompanyId,
        transactionId: data.transactionId,
      };
    } catch (err) {
      // No offline claim path: the server flag is what prevents double payouts.
      console.warn('Lottery claim failed:', err);
      return { success: false, error: 'Could not reach the server to claim — check your connection and try again' };
    }
  }

  // ----------------------------------------------------------
  // Legacy notification helpers (kept for existing UI buttons)
  // ----------------------------------------------------------

  /** Server is now the source of truth for draw state — sync is a no-op. */
  public async syncDrawWithServer(_draw: LotteryDraw): Promise<void> {
    return;
  }

  public async triggerOneHourPreDrawNotification(): Promise<{ success: boolean; message?: string; notification?: any }> {
    try {
      const res = await fetch('/api/lottery/trigger-1hour-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to trigger 1-hour notification via server:', err);
    }
    return { success: false, message: 'Server unreachable' };
  }

  public getTierAlertSettings(): LotteryAlertSettings {
    const defaultSettings: LotteryAlertSettings = {
      fcmEnabled: true,
      fcmToken: null,
      globalDrawAlert: true,
      thirtyMinTierAlertsEnabled: true,
      tierConfigs: {
        tier1_jackpot: { tierId: 'tier1_jackpot', enabled: true, leadTimeMinutes: 30, soundEnabled: true },
        tier2_match5: { tierId: 'tier2_match5', enabled: true, leadTimeMinutes: 30, soundEnabled: true },
        tier3_match4_2: { tierId: 'tier3_match4_2', enabled: true, leadTimeMinutes: 30, soundEnabled: true },
        tier4_match3: { tierId: 'tier4_match3', enabled: true, leadTimeMinutes: 30, soundEnabled: false },
        tier5_match2: { tierId: 'tier5_match2', enabled: true, leadTimeMinutes: 30, soundEnabled: false },
      },
      lastUpdated: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ALERT_SETTINGS);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  }

  public async saveTierAlertSettings(settings: LotteryAlertSettings): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ALERT_SETTINGS, JSON.stringify(settings));
    }
    try {
      const tierSubs: Record<string, boolean> = {};
      Object.entries(settings.tierConfigs).forEach(([k, v]) => {
        tierSubs[k] = v.enabled;
      });

      await fetch('/api/lottery/update-tier-alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierAlertSubscriptions: tierSubs,
          fcmToken: settings.fcmToken,
        }),
      });
    } catch (err) {
      console.warn('Could not sync tier alert settings with server:', err);
    }
  }

  public async enableFcmPushNotifications(): Promise<string | null> {
    try {
      const token = await requestFCMToken();
      if (token) {
        const current = this.getTierAlertSettings();
        current.fcmEnabled = true;
        current.fcmToken = token;
        await this.saveTierAlertSettings(current);
      }
      return token;
    } catch (e) {
      console.warn('FCM Push request failed:', e);
      return null;
    }
  }

  public async triggerThirtyMinTierFcmAlert(
    tierId: string = 'tier1_jackpot'
  ): Promise<{ success: boolean; message?: string; notification?: any }> {
    try {
      const res = await fetch('/api/lottery/trigger-30min-tier-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to trigger 30-min tier alert via server:', err);
    }
    return { success: false, message: 'Server unreachable' };
  }

  public resetToDefaults(): void {
    this.draws = [];
    this.tickets = [];
    this.invalidateState();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.DRAWS);
      localStorage.removeItem(STORAGE_KEYS.TICKETS);
    }
  }
}

export const lotteryService = new LotteryService();
