// Web Speech Recognition Service for Real-time Tamil Speech-to-Text

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionStatus {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
}

class SpeechToTextService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onStatusChangeCallback: ((status: SpeechRecognitionStatus) => void) | null = null;
  private accumulatedText: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ta-IN'; // Tamil (India)

        this.recognition.onstart = () => {
          this.isListening = true;
          this.notifyStatus(null);
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.onResultCallback) {
            if (finalTranscript) {
              this.accumulatedText += finalTranscript;
              this.onResultCallback(this.accumulatedText, true);
            } else if (interimTranscript) {
              this.onResultCallback(this.accumulatedText + interimTranscript, false);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          let errorMsg = 'குரல் அங்கீகாரத்தில் பிழை ஏற்பட்டது.';
          if (event.error === 'not-allowed') {
            errorMsg = 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. உலாவியின் அமைப்புகளில் மைக் அனுமதியை வழங்கவும்.';
          } else if (event.error === 'no-speech') {
            errorMsg = 'பேச்சு எதுவும் கேட்கவில்லை. மீண்டும் தெளிவாகப் பேசவும்.';
          } else if (event.error === 'network') {
            errorMsg = 'இணைய இணைப்பைச் சரிபார்க்கவும்.';
          }
          this.isListening = false;
          this.notifyStatus(errorMsg);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.notifyStatus(null);
        };
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public start(
    initialText: string = '',
    onResult: (text: string, isFinal: boolean) => void,
    onStatusChange?: (status: SpeechRecognitionStatus) => void
  ) {
    if (!this.recognition) {
      if (onStatusChange) {
        onStatusChange({
          isListening: false,
          isSupported: false,
          error: 'உங்கள் உலாவியில் நேரலை குரல் தட்டச்சு வசதி ஆதரிக்கப்படவில்லை. கீழே உள்ள ஆடியோ பதிவு அல்லது கோப்புப் பதிவேற்றத்தைப் பயன்படுத்தவும்.',
        });
      }
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.accumulatedText = initialText ? initialText.trim() + ' ' : '';
    this.onResultCallback = onResult;
    this.onStatusChangeCallback = onStatusChange || null;

    try {
      this.recognition.start();
    } catch {
      // recognition might already be active
      this.stop();
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch {
          // ignore
        }
      }, 200);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
    this.notifyStatus(null);
  }

  private notifyStatus(error: string | null) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({
        isListening: this.isListening,
        isSupported: this.isSupported(),
        error,
      });
    }
  }
}

export const stt = new SpeechToTextService();
