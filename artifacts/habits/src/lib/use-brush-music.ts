import { useCallback, useRef } from 'react';

// Cheerful C-major pentatonic melody — [frequency Hz, duration s]
const MELODY: [number, number][] = [
  [523, 0.18],  // C5
  [659, 0.18],  // E5
  [784, 0.18],  // G5
  [880, 0.27],  // A5
  [784, 0.18],  // G5
  [659, 0.18],  // E5
  [587, 0.18],  // D5
  [523, 0.36],  // C5 (slight pause built in before loop)
];

const NOTE_GAP = 0.04;
const LOOP_DURATION = MELODY.reduce((s, [, d]) => s + d + NOTE_GAP, 0);
const VOLUME = 0.14;
const LOOK_AHEAD_S = 0.12;

function getAudioCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current || ref.current.state === 'closed') {
    ref.current = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
  if (ref.current.state === 'suspended') ref.current.resume();
  return ref.current;
}

export function useBrushMusic(enabled = true) {
  const ctxRef    = useRef<AudioContext | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const scheduleLoop = useCallback((ctx: AudioContext, loopStart: number) => {
    if (!activeRef.current) return;

    let t = loopStart;
    MELODY.forEach(([freq, dur]) => {
      // Main melody voice (sine)
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(VOLUME, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.88);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);

      // Soft harmony: a perfect fifth below, quieter triangle
      const osc2  = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 0.667, t);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(VOLUME * 0.35, t + 0.025);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.88);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + dur + 0.01);

      t += dur + NOTE_GAP;
    });

    const msUntilNext = Math.max(
      0,
      (loopStart + LOOP_DURATION - LOOK_AHEAD_S - ctx.currentTime) * 1000,
    );
    timerRef.current = setTimeout(() => {
      if (activeRef.current && ctxRef.current && ctxRef.current.state !== 'closed') {
        scheduleLoop(ctx, loopStart + LOOP_DURATION);
      }
    }, msUntilNext);
  }, []);

  const play = useCallback(() => {
    if (!enabled) return;
    activeRef.current = true;
    const ctx = getAudioCtx(ctxRef);
    scheduleLoop(ctx, ctx.currentTime + 0.08);
  }, [enabled, scheduleLoop]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  return { play, stop };
}
