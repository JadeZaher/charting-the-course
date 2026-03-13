import { useState, useRef, useEffect } from 'react';
import { isSpeechSupported, createSpeechRecognition } from '@/lib/speech';

interface UseSpeechInputOptions {
  onTranscript: (text: string) => void;
}

export function useSpeechInput({ onTranscript }: UseSpeechInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => isSpeechSupported());
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function startListening() {
    if (!isSupported || isListening) return;
    try {
      const recognition = createSpeechRecognition();
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        if (transcript) onTranscript(transcript);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return { isListening, isSupported, startListening, stopListening };
}
