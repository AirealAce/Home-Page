'use client';

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private async loadSound(url: string): Promise<AudioBuffer> {
    await this.ensureAudioContext();
    
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Error loading sound ${url}:`, error);
      throw error;
    }
  }

  public async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.ensureAudioContext();
      await this.preloadSounds();
      this.isInitialized = true;
      console.log('AudioManager initialized successfully');
    } catch (error) {
      console.error('Error initializing AudioManager:', error);
    }
  }

  public async preloadSounds() {
    await this.ensureAudioContext();
    
    if (!this.audioContext) return;

    const soundUrls = {
      hover: '/sounds/hover.mp3',
      click: '/sounds/click.mp3',
      focus: '/sounds/focus.mp3',
      success: '/sounds/success.mp3'
    };

    try {
      for (const [name, url] of Object.entries(soundUrls)) {
        if (!this.sounds.has(name)) {
          const buffer = await this.loadSound(url);
          this.sounds.set(name, buffer);
          console.log(`${name} sound loaded successfully`);
        }
      }
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  public async playSound(soundName: string) {
    if (!this.isEnabled) return;

    try {
      await this.ensureAudioContext();
      
      if (!this.audioContext) {
        console.warn('AudioContext not available');
        return;
      }

      const buffer = this.sounds.get(soundName);
      if (!buffer) {
        console.warn(`Sound ${soundName} not loaded`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5; // Set volume to 50%

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }
}

export const audioManager = AudioManager.getInstance(); 