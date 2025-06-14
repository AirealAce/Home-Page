'use client';

class SoundEffects {
  private static instance: SoundEffects;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): SoundEffects {
    if (!SoundEffects.instance) {
      SoundEffects.instance = new SoundEffects();
    }
    return SoundEffects.instance;
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private createOscillator(frequency: number, type: OscillatorType = 'sine'): OscillatorNode {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    return oscillator;
  }

  private createGainNode(volume: number = this.volume): GainNode {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    return gainNode;
  }

  public async playHoverSound() {
    if (!this.isEnabled) return;
    
    try {
      await this.ensureAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.createOscillator(880, 'sine');
      const gainNode = this.createGainNode(0.1);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing hover sound:', error);
    }
  }

  public async playClickSound() {
    if (!this.isEnabled) return;
    
    try {
      await this.ensureAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.createOscillator(440, 'square');
      const gainNode = this.createGainNode(0.2);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  }

  public async playFocusSound() {
    if (!this.isEnabled) return;
    
    try {
      await this.ensureAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.createOscillator(660, 'sine');
      const gainNode = this.createGainNode(0.15);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (error) {
      console.error('Error playing focus sound:', error);
    }
  }

  public async playSuccessSound() {
    if (!this.isEnabled) return;
    
    try {
      await this.ensureAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.createOscillator(880, 'sine');
      const gainNode = this.createGainNode(0.2);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1320, this.audioContext.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }
}

export const soundEffects = SoundEffects.getInstance(); 