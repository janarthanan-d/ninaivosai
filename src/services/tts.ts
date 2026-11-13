import { api } from './api.ts';

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  mode: 'browser' | 'server' | 'none';
  rate: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  error: string | null;
}

class TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private listeners: ((state: TTSState) => void)[] = [];
  private state: TTSState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    mode: 'none',
    rate: 1.0,
    availableVoices: [],
    selectedVoice: null,
    error: null,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const tamilVoices = voices.filter(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    
    this.state.availableVoices = tamilVoices.length > 0 ? tamilVoices : voices;
    if (tamilVoices.length > 0 && !this.state.selectedVoice) {
      this.state.selectedVoice = tamilVoices[0];
    }
    this.notify();
  }

  public subscribe(cb: (state: TTSState) => void) {
    this.listeners.push(cb);
    cb({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public setRate(newRate: number) {
    this.state.rate = newRate;
    if (this.currentUtterance && this.state.isPlaying) {
      this.currentUtterance.rate = newRate;
    }
    if (this.currentAudioElement && this.state.isPlaying) {
      this.currentAudioElement.playbackRate = newRate;
    }
    this.notify();
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.state.selectedVoice = voice;
    this.notify();
  }

  public async speak(text: string, forceServer: boolean = false) {
    this.stop();
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    const hasTamilBrowserVoice = this.state.availableVoices.some(v => v.lang.startsWith('ta'));

    // Try browser speech synthesis if available and not forced to server
    if (!forceServer && typeof window !== 'undefined' && 'speechSynthesis' in window && hasTamilBrowserVoice) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ta-IN';
        if (this.state.selectedVoice) {
          utterance.voice = this.state.selectedVoice;
        }
        utterance.rate = this.state.rate;

        utterance.onstart = () => {
          this.state.isPlaying = true;
          this.state.isPaused = false;
          this.state.isLoading = false;
          this.state.mode = 'browser';
          this.notify();
        };

        utterance.onend = () => {
          this.state.isPlaying = false;
          this.state.isPaused = false;
          this.state.isLoading = false;
          this.currentUtterance = null;
          this.notify();
        };

        utterance.onerror = () => {
          // If browser speech fails, gracefully try server TTS
          this.speakViaServer(text);
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback to server
      }
    }

    // Server-side Gemini TTS fallback
    await this.speakViaServer(text);
  }

  private async speakViaServer(text: string) {
    try {
      this.state.mode = 'server';
      this.state.isLoading = true;
      this.notify();

      const res = await api.generateServerTTS(text);
      if (!res.audioBase64) {
        throw new Error('குரல் தரவு பெறப்படவில்லை.');
      }

      const audioSrc = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
      const audio = new Audio(audioSrc);
      audio.playbackRate = this.state.rate;

      audio.onplay = () => {
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.isLoading = false;
        this.notify();
      };

      audio.onpause = () => {
        if (this.state.isPlaying) {
          this.state.isPaused = true;
          this.notify();
        }
      };

      audio.onended = () => {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.currentAudioElement = null;
        this.notify();
      };

      audio.onerror = () => {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.isLoading = false;
        this.state.error = 'குரல் ஒலிபரப்பில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.';
        this.notify();
      };

      this.currentAudioElement = audio;
      await audio.play();
    } catch (err: any) {
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.isLoading = false;
      this.state.error = err.message || 'தமிழ் குரல் வசதி தற்போது கிடைக்கவில்லை.';
      this.notify();
    }
  }

  public pause() {
    if (this.state.mode === 'browser' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      this.state.isPaused = true;
      this.notify();
    } else if (this.state.mode === 'server' && this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.state.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (this.state.mode === 'browser' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      this.state.isPaused = false;
      this.notify();
    } else if (this.state.mode === 'server' && this.currentAudioElement) {
      this.currentAudioElement.play();
      this.state.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    this.currentUtterance = null;
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.isLoading = false;
    this.notify();
  }
}

export const tts = new TTSService();
