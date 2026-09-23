/**
 * Web Audio sound engine for buzzers, piezos, and relay clicks
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeOscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playTone(freq: number, volume = 0.15) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stopTone();

    try {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(Math.min(volume, 0.25), this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      this.activeOscillator = this.ctx.createOscillator();
      this.activeOscillator.type = 'square';
      this.activeOscillator.frequency.setValueAtTime(freq || 1000, this.ctx.currentTime);
      this.activeOscillator.connect(this.gainNode);
      this.activeOscillator.start();
    } catch (e) {
      // Audio might be blocked by user gesture policy
    }
  }

  stopTone() {
    if (this.activeOscillator) {
      try {
        this.activeOscillator.stop();
        this.activeOscillator.disconnect();
      } catch (e) {}
      this.activeOscillator = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }
  }

  playRelayClick(isOpen: boolean) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isOpen ? 600 : 900, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
