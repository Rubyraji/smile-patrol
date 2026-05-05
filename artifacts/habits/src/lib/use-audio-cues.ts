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

  // Light 3-note chime for surface changes within each arch (buccal→occlusal, occlusal→palatal/lingual)
  const playZoneSurface = useCallback(() => {
    tone(392, 0.22, 0,    0.20); // G4
    tone(523, 0.22, 0.10, 0.22); // C5
    tone(659, 0.25, 0.20, 0.18); // E5
  }, [tone]);

  // Grander 6-note ascending arpeggio for the half-mouth milestone (top → bottom arch)
  const playZoneSwitch = useCallback(() => {
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 E5 G5 C6 E6 G6
    notes.forEach((f, i) => tone(f, 0.30, i * 0.12, 0.28 + i * 0.02));
  }, [tone]);

  // Grand sweeping 8-note fanfare for full-mouth completion
  const playComplete = useCallback(() => {
    const notes = [523, 659, 784, 988, 1047, 1319, 1568, 2093];
    notes.forEach((f, i) => {
      const isLast = i === notes.length - 1;
      tone(f, isLast ? 1.2 : 0.28, i * 0.13, 0.25 + i * 0.025);
    });
  }, [tone]);

  // Countdown beeps that intensify as the surface deadline approaches (secsLeft 5→1)
  const playCountdownBeep = useCallback((secsLeft: number) => {
    const intensity = 6 - secsLeft; // 1..5
    const freqs = [440, 494, 523, 587, 880];
    const vols  = [0.10, 0.13, 0.17, 0.21, 0.28];
    const durs  = [0.06, 0.07, 0.08, 0.09, 0.13];
    const idx   = Math.min(intensity - 1, 4);
    tone(freqs[idx], durs[idx], 0, vols[idx]);
    if (secsLeft === 1) tone(1760, 0.10, 0.02, 0.14);
  }, [tone]);

  return { playZoneSurface, playZoneSwitch, playComplete, playCountdownBeep };
}
