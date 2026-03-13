// Speech-to-text utilities using the browser Web Speech API.
// Works in Chrome and Safari; not supported in Firefox.

export function isSpeechSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function createSpeechRecognition(): SpeechRecognition {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  return recognition;
}
