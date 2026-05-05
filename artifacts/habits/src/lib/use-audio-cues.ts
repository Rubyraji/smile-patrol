import { useCallback, useRef } from 'react';

type OscType = OscillatorType;

export function useAudioCues(enabled = true) {
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
      if (!enabled) return;
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
    [getCtx, enabled],
  );

  // Half-mouth milestone: 6-note ascending arpeggio, bright and celebratory
  const playZoneSwitch = useCallback(() => {
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 E5 G5 C6 E6 G6
    notes.forEach((f, i) => tone(f, 0.30, i * 0.12, 0.28 + i * 0.02));
  }, [tone]);

  // Full-mouth milestone: grand sweeping 8-note fanfare with a sustained finish
  const playComplete = useCallback(() => {
    const notes = [523, 659, 784, 988, 1047, 1319, 1568, 2093]; // C5→B5→C6→E6→G6→C7
    notes.forEach((f, i) => {
      const isLast = i === notes.length - 1;
      tone(f, isLast ? 1.2 : 0.28, i * 0.13, 0.25 + i * 0.025);
    });
  }, [tone]);

  // Countdown beeps that intensify as you approach each milestone
  // secsLeft: 5 = softest/lowest, 1 = loudest/highest
  const playCountdownBeep = useCallback((secsLeft: number) => {
    const intensity = 6 - secsLeft; // 1..5
    const freqs  = [440, 494, 523, 587, 880]; // A4 B4 C5 D5 A5
    const vols   = [0.10, 0.13, 0.17, 0.21, 0.28];
    const durs   = [0.06, 0.07, 0.08, 0.09, 0.13];
    const idx    = Math.min(intensity - 1, 4);
    tone(freqs[idx], durs[idx], 0, vols[idx]);
    // On the very last second add a bright overtone
    if (secsLeft === 1) tone(1760, 0.10, 0.02, 0.14);
  }, [tone]);

  return { playZoneSwitch, playComplete, playCountdownBeep };
}
