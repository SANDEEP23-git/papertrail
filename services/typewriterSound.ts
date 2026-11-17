/**
 * PAPERTRAIL — Authentic Vintage Typewriter Sound Engine
 * 
 * Complies with specification:
 * - Natural, subtle, authentic vintage typewriter mechanical sound profile
 * - Managed audio-player pool to control overlapping during rapid typing
 * - Keystroke variation: pitch, resonance, and mechanical clatter detuning
 * - Distinct spacebar, backspace, and carriage-return with subtle bell
 * - Pure client-side zero-dependency Web Audio synthesizer + native haptics
 * - Never blocks or delays user typing
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type StrikeType = 'char' | 'space' | 'enter' | 'backspace';

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.7;
  private hapticsEnabled: boolean = true;
  private lastStrikeTime: number = 0;
  private activeVoicesCount: number = 0;
  private readonly MAX_CONCURRENT_VOICES: number = 3;
  private isSuspended: boolean = false;

  constructor() {
    this.initContext();
  }

  private initContext() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass && !this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    } catch {
      // Audio is non-blocking
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      } catch {}
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  public getHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public pause() {
    this.isSuspended = true;
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend().catch(() => {});
    }
  }

  public resume() {
    this.isSuspended = false;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Main dispatch for input sound based on verified delta
   */
  public playInputSound(type: StrikeType) {
    if (!this.isEnabled || this.volume <= 0.01 || this.isSuspended) {
      return;
    }

    const now = Date.now();
    // Throttle unnatural micro-bursts (<22ms) to prevent audio clutter
    if (now - this.lastStrikeTime < 22 && type === 'char') {
      return;
    }
    this.lastStrikeTime = now;

    // Trigger complementary subtle haptic feedback
    if (this.hapticsEnabled) {
      this.triggerHaptic(type);
    }

    try {
      this.initContext();
      if (!this.audioCtx || !this.masterGain) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      // Voice limit management
      if (this.activeVoicesCount >= this.MAX_CONCURRENT_VOICES) {
        return;
      }

      const ctx = this.audioCtx;
      const t = ctx.currentTime;

      switch (type) {
        case 'char':
          this.synthesizeKeyStrike(ctx, t);
          break;
        case 'space':
          this.synthesizeSpacebar(ctx, t);
          break;
        case 'enter':
          this.synthesizeCarriageReturnWithBell(ctx, t);
          break;
        case 'backspace':
          this.synthesizeBackspace(ctx, t);
          break;
      }
    } catch {
      // Audio failures must never crash or interrupt the typing experience
    }
  }

  /**
   * Character typing:
   * Authentic mechanical typewriter strike combining:
   * 1. Slug impact (sharp metallic click)
   * 2. Platen cylinder body resonance (warm woody thud)
   * 3. Natural detuning per strike so repeated letters sound organic
   */
  private synthesizeKeyStrike(ctx: AudioContext, t: number) {
    this.activeVoicesCount++;

    // Random variation parameters (+/- 8% frequency, varied decay)
    const variation = (Math.random() - 0.5) * 0.16;
    const baseFreq = 420 * (1 + variation);
    const slugFreq = 2100 * (1 + variation);

    // 1. Platen/typebar clatter oscillator
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(baseFreq, t);
    oscBody.frequency.exponentialRampToValueAtTime(120, t + 0.038);

    gainBody.gain.setValueAtTime(0.18, t);
    gainBody.gain.exponentialRampToValueAtTime(0.001, t + 0.042);

    oscBody.connect(gainBody);
    gainBody.connect(this.masterGain!);

    // 2. High-frequency slug metal click
    const oscSlug = ctx.createOscillator();
    const gainSlug = ctx.createGain();
    oscSlug.type = 'sine';
    oscSlug.frequency.setValueAtTime(slugFreq, t);
    oscSlug.frequency.exponentialRampToValueAtTime(800, t + 0.012);

    gainSlug.gain.setValueAtTime(0.14, t);
    gainSlug.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    oscSlug.connect(gainSlug);
    gainSlug.connect(this.masterGain!);

    oscBody.start(t);
    oscSlug.start(t);

    const stopTime = t + 0.048;
    oscBody.stop(stopTime);
    oscSlug.stop(stopTime);

    setTimeout(() => {
      this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
    }, 50);
  }

  /**
   * Spacebar:
   * Softer mechanical escapement advance without the metal slug ping
   */
  private synthesizeSpacebar(ctx: AudioContext, t: number) {
    this.activeVoicesCount++;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(175, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.045);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.048);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.05);

    setTimeout(() => {
      this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
    }, 55);
  }

  /**
   * Carriage return / Enter:
   * Mechanical ratchet travel + delicate vintage typewriter bell chime
   */
  private synthesizeCarriageReturnWithBell(ctx: AudioContext, t: number) {
    this.activeVoicesCount++;

    // 1. Mechanical carriage movement thud
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    oscThud.type = 'triangle';
    oscThud.frequency.setValueAtTime(150, t);
    oscThud.frequency.exponentialRampToValueAtTime(60, t + 0.07);

    gainThud.gain.setValueAtTime(0.22, t);
    gainThud.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    oscThud.connect(gainThud);
    gainThud.connect(this.masterGain!);
    oscThud.start(t);
    oscThud.stop(t + 0.085);

    // 2. Subtle authentic bell (vintage silver bell around 2093 Hz / C7)
    const oscBell = ctx.createOscillator();
    const gainBell = ctx.createGain();
    oscBell.type = 'sine';
    oscBell.frequency.setValueAtTime(2093, t + 0.02);

    gainBell.gain.setValueAtTime(0.0001, t);
    gainBell.gain.setValueAtTime(0.12, t + 0.02);
    gainBell.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

    oscBell.connect(gainBell);
    gainBell.connect(this.masterGain!);
    oscBell.start(t + 0.02);
    oscBell.stop(t + 0.58);

    setTimeout(() => {
      this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
    }, 120);
  }

  /**
   * Backspace:
   * Quieter, distinct mechanical release action
   */
  private synthesizeBackspace(ctx: AudioContext, t: number) {
    this.activeVoicesCount++;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.028);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.035);

    setTimeout(() => {
      this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
    }, 40);
  }

  private triggerHaptic(type: StrikeType) {
    try {
      if (Platform.OS === 'web') return;
      const hapticPromise =
        type === 'enter'
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (hapticPromise && typeof hapticPromise.catch === 'function') {
        hapticPromise.catch(() => {});
      }
    } catch {
      // Non-blocking: devices without vibrator motors gracefully continue
    }
  }
}

export const TypewriterSoundEngine = new SoundEngine();
