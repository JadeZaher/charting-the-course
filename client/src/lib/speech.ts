// Speech-to-text utilities using the browser Web Speech API.
// Works in Chrome and Safari; not supported in Firefox.

export interface SpeechRecognitionEvent extends Event {
  readonly results: {
    readonly length: number;
    readonly [index: number]: {
      readonly length: number;
      readonly [index: number]: {
        readonly transcript: string;
        readonly confidence: number;
      };
    };
  };
}

export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const speechWindow = window as SpeechRecognitionWindow;
  return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
}

export function createSpeechRecognition(): SpeechRecognition {
  const speechWindow = window as SpeechRecognitionWindow;
  const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
  if (!Recognition) throw new Error('Speech recognition is not supported by this browser.');

  const recognition = new Recognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  return recognition;
}
