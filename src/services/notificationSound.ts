// Web Audio notification chime — no audio asset needed (works offline, zero downloads,
// no copyright risk). Two-note "ding-ding" for normal alerts, a brighter three-note
// ascending pattern for urgent categories (security/compensation/lottery).

const SOUND_PREF_KEY = 'vex_notif_sound';

type ChimeVariant = 'default' | 'urgent';

let audioCtx: AudioContext | null = null;
let unlocked = false;
let pendingResume: Promise<void> | null = null;
let lastPlayedAt = 0;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended' && !pendingResume) {
      pendingResume = audioCtx.resume().then(
        () => {
          unlocked = true;
          pendingResume = null;
        },
        () => {
          pendingResume = null;
        },
      );
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Unlock audio on the first user gesture so later notification sounds are instant
function attachGestureUnlock() {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
    unlocked = true;
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);
}

if (typeof window !== 'undefined') {
  attachGestureUnlock();
}

export function isNotificationSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* private mode */
  }
}

function playNote(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  gainValue: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startAt);
  // Gentle upward pitch bend gives it a friendly "arrival" feel
  osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startAt + duration);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

export function playNotificationSound(variant: ChimeVariant = 'default') {
  if (!isNotificationSoundEnabled()) return;
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastPlayedAt < 800) return; // throttle bursts
  lastPlayedAt = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  const t0 = ctx.currentTime + 0.02;
  try {
    if (variant === 'urgent') {
      // Ascending C6 → E6 → G6 triple chime, slightly louder
      playNote(ctx, 1046.5, t0, 0.28, 0.22);
      playNote(ctx, 1318.5, t0 + 0.13, 0.28, 0.22);
      playNote(ctx, 1568.0, t0 + 0.26, 0.45, 0.24);
    } else {
      // Classic two-tone: A5 → E6
      playNote(ctx, 880.0, t0, 0.25, 0.2);
      playNote(ctx, 1318.5, t0 + 0.14, 0.4, 0.2);
    }
  } catch {
    /* autoplay policy blocked — silent skip */
  }
}

export function vibrateNotificationPattern() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate([120, 60, 180]);
  } catch {
    /* unsupported */
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
