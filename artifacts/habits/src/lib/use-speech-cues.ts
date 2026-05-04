import { useCallback, useEffect, useRef } from 'react';

const START_PHRASES = [
  "Let's go! Time to brush your teeth!",
  "Brush time! Let's get those teeth sparkly clean!",
  "Ready? Let's brush those teeth!",
];

const ZONE_SWITCH_PHRASES = [
  "Halfway there! You're doing amazing!",
  "Switch to the other side now! Keep it up!",
  "Great work! Now let's do the other half!",
  "You're a superstar! Keep brushing!",
];

const ALMOST_DONE_PHRASES = [
  "Almost done! Just a few more seconds!",
  "You've almost got it! Keep going!",
  "So close! Finish strong!",
];

const COMPLETE_PHRASES = [
  "You did it! Sparkling clean teeth!",
  "Amazing job! Your teeth are so clean!",
  "Woohoo! You're a brushing champion!",
  "Brilliant! Those teeth are gleaming!",
];

const PERIODIC_PHRASES = [
  "Keep going! You're doing so well!",
  "Those teeth are getting so clean!",
  "You're doing a great job!",
  "Keep brushing! Almost there!",
  "Brilliant work! Don't stop!",
  "You've got this! Keep it up!",
  "Scrub scrub scrub! Looking great!",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useSpeechCues(enabled = true) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    synthRef.current = window.speechSynthesis;

    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer a female/child-friendly English voice
      const preferred = voices.find(
        (v) => v.lang.startsWith('en') && /female|samantha|karen|moira|victoria|fiona/i.test(v.name),
      ) ?? voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null;
      voiceRef.current = preferred;
    };

    loadVoice();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoice);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoice);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled) return;
      const synth = synthRef.current;
      if (!synth) return;
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.voice = voiceRef.current;
      utt.rate = 0.95;
      utt.pitch = 1.15;
      utt.volume = 0.9;
      synth.speak(utt);
    },
    [enabled],
  );

  const stop = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  const speakStart      = useCallback(() => speak(pickRandom(START_PHRASES)),      [speak]);
  const speakZoneSwitch = useCallback(() => speak(pickRandom(ZONE_SWITCH_PHRASES)), [speak]);
  const speakAlmostDone = useCallback(() => speak(pickRandom(ALMOST_DONE_PHRASES)), [speak]);
  const speakComplete   = useCallback(() => speak(pickRandom(COMPLETE_PHRASES)),    [speak]);
  const speakPeriodic   = useCallback(() => speak(pickRandom(PERIODIC_PHRASES)),    [speak]);

  return { speak, stop, speakStart, speakZoneSwitch, speakAlmostDone, speakComplete, speakPeriodic };
}
