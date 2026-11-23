/**
 * Sound Alert Engine for Aradhana Café (Admin & Kitchen Portals)
 * - Plays lightweight local audio (/sounds/notification.wav)
 * - Dual-fallback to synthesized Web Audio API bell chime
 * - Handles browser autoplay permissions and unlock
 * - Supports persistent Sound ON / OFF per portal (Admin / Kitchen)
 * - Stops continuous ringing when orders are accepted in either portal
 * - Prevents duplicate notifications for already-accepted orders
 */

class SoundAlertManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isRinging: boolean = false;
  private ringIntervalId: any = null;
  private audioUnlocked: boolean = false;
  private notifiedOrderIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioElement = new Audio('/sounds/notification.wav');
        this.audioElement.preload = 'auto';
      } catch (e) {
        console.warn('Audio element initialization error:', e);
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Sound ON/OFF state check with localStorage persistence per portal
   */
  public isSoundEnabled(portal: 'admin' | 'kitchen' = 'admin'): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(`aradhana_${portal}_sound_enabled`);
    return stored === null ? true : stored === 'true';
  }

  /**
   * Toggle or set Sound ON/OFF with localStorage persistence
   */
  public setSoundEnabled(portal: 'admin' | 'kitchen', enabled: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`aradhana_${portal}_sound_enabled`, String(enabled));
    if (!enabled) {
      this.stopContinuousRinging();
    }
  }

  /**
   * Handles browser autoplay policy on user interaction (Click / Tap)
   */
  public unlockAudio(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }

      if (this.audioElement) {
        // Play and immediately pause/rewind to unlock browser audio token
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.audioElement?.pause();
              if (this.audioElement) this.audioElement.currentTime = 0;
            })
            .catch(() => {});
        }
      }

      this.audioUnlocked = true;
      return true;
    } catch (e) {
      console.warn('Audio unlock error:', e);
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    return this.audioUnlocked;
  }

  /**
   * Plays the local audio notification or synthesized fallback
   */
  public playNotificationSound() {
    if (typeof window === 'undefined') return;

    // 1. Try local audio file
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = 0;
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // If HTML5 Audio was blocked, fallback to Web Audio API
            this.playSynthesizedBell();
          });
          return;
        }
      } catch {
        // Fall through to synthesizer
      }
    }

    // 2. Synthesizer fallback
    this.playSynthesizedBell();
  }

  /**
   * Web Audio API synthesized restaurant service bell
   */
  private playSynthesizedBell() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Bell chime: 987.77 Hz (B5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Follow-up chime: 1318.51 Hz (E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.16);
      gain2.gain.setValueAtTime(0.45, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn('Synthesized bell error:', err);
    }
  }

  /**
   * Starts CONTINUOUS ringing until orders are accepted
   */
  public startContinuousRinging(portal: 'admin' | 'kitchen' = 'admin') {
    if (!this.isSoundEnabled(portal)) {
      this.stopContinuousRinging();
      return;
    }

    if (this.isRinging) return;
    this.isRinging = true;

    // Immediate sound
    this.playNotificationSound();

    // Repeat every 1.5 seconds until stopped
    this.ringIntervalId = setInterval(() => {
      if (this.isRinging && this.isSoundEnabled(portal)) {
        this.playNotificationSound();
      } else {
        this.stopContinuousRinging();
      }
    }, 1500);
  }

  /**
   * Stops continuous ringing
   */
  public stopContinuousRinging() {
    this.isRinging = false;
    if (this.ringIntervalId) {
      clearInterval(this.ringIntervalId);
      this.ringIntervalId = null;
    }
  }

  public getIsRinging(): boolean {
    return this.isRinging;
  }

  /**
   * Prevents repeated notifications for already-notified/accepted orders
   */
  public hasOrderBeenNotified(orderId: string): boolean {
    return this.notifiedOrderIds.has(orderId);
  }

  public markOrderNotified(orderId: string) {
    this.notifiedOrderIds.add(orderId);
  }

  public resetNotifiedOrders() {
    this.notifiedOrderIds.clear();
  }
}

export const soundManager = new SoundAlertManager();
