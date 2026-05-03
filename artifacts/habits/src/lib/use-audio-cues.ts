import { useCallback, useRef } from 'react';

type OscType = OscillatorType;

export function useAudioCues() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  const tone = useCallback(
    (freq: number, duration: number, delay = 0, volume = 0.3, type: OscType = 'sine') => {
      const ctx = getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.02);
    },
    [getCtx],
  );

  // G4 → B4 two-tone chime when switching zones
  const playZoneSwitch = useCallback(() => {
    tone(392, 0.28, 0,    0.38);
    tone(494, 0.38, 0.18, 0.38);
  }, [tone]);

  // C5 → E5 → G5 → C6 ascending fanfare on completion
  const playComplete = useCallback(() => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(f, 0.32, i * 0.13, 0.35));
  }, [tone]);

  // Short tick; higher pitch on the very last second
  const playCountdownBeep = useCallback((isLast: boolean) => {
    tone(isLast ? 1047 : 880, 0.07, 0, isLast ? 0.22 : 0.13);
  }, [tone]);

  return { playZoneSwitch, playComplete, playCountdownBeep };
}
