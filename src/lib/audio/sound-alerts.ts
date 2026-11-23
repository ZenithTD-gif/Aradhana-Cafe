/**
 * Sound Alert Engine using Web Audio API
 * Provides zero-dependency, reliable, synthesized continuous ringing & chimes
 * that won't fail due to 404s, CORS, or blocked media files.
 */

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private isRinging: boolean = false;
  private ringIntervalId: any = null;
  private audioUnlocked: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Must be called during or after user interaction (like clicking "Enable Sound")
   */
  public unlockAudio(): boolean {
    const ctx = this.getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      this.audioUnlocked = true;
      // Play a subtle short confirmation chime so user knows it's active
      this.playChime(660, 0.1);
      return true;
    }
    return false;
  }

  public isAudioUnlocked(): boolean {
    return this.audioUnlocked && this.audioCtx?.state === 'running';
  }

  /**
   * Plays a single pleasant chime or bell tone
   */
  public playChime(freq = 880, duration = 0.3) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  /**
   * Plays an urgent restaurant order bell tone pair
   */
  private playRestaurantBell() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Higher ring
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Follow-up bell chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.15); // E6
      gain2.gain.setValueAtTime(0.5, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn('Bell tone play error:', err);
    }
  }

  /**
   * Starts CONTINUOUS looping notification sound until acknowledged
   */
  public startContinuousRinging() {
    if (this.isRinging) return;
    this.isRinging = true;

    // Trigger immediate ring
    this.playRestaurantBell();

    // Repeat every 1.4 seconds until stopped
    this.ringIntervalId = setInterval(() => {
      if (this.isRinging) {
        this.playRestaurantBell();
      }
    }, 1400);
  }

  /**
   * Stops continuous notification sound (called on Acknowledge)
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
}

export const soundManager = new SoundAlertManager();
