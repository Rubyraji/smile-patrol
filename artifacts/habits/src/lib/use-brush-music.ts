import { useCallback, useRef } from 'react';

// "The Wheels on the Bus" — [frequency Hz, duration s]
// 4/4 time, quarter note = 0.5 s  (♩= 120 bpm)
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const G4 = 392.00;
const A4 = 440.00;

const MELODY: [number, number][] = [
  // "The wheels on the bus go round and round"
  [C4, 0.50], // The
  [C4, 0.50], // wheels
  [C4, 0.25], // on
  [C4, 0.25], // the
  [E4, 0.50], // bus
  [G4, 0.50], // go
  [G4, 0.50], // round
  [A4, 0.25], // and
  [G4, 0.75], // round

  // "round and round" × 2
  [E4, 0.25], // round
  [G4, 0.25], // and
  [A4, 0.75], // round
  [E4, 0.25], // round
  [G4, 0.25], // and
  [A4, 0.75], // round

  // "The wheels on the bus go round and round"
  [C4, 0.50],
  [C4, 0.50],
  [C4, 0.25],
  [C4, 0.25],
  [E4, 0.50],
  [G4, 0.50],
  [G4, 0.50],
  [A4, 0.25],
  [G4, 0.75],

  // "all through the town"
  [G4, 0.50], // all
  [E4, 0.25], // through
  [D4, 0.25], // the
  [C4, 1.50], // town
];

const NOTE_GAP     = 0.025;
const LOOP_PAUSE   = 0.6;
const LOOP_DURATION =
  MELODY.reduce((s, [, d]) => s + d + NOTE_GAP, 0) + LOOP_PAUSE;

const MELODY_VOL  = 0.16;
const HARMONY_VOL = 0.06;
const LOOK_AHEAD  = 0.12;

function makeCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
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
      // Melody — sine
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(MELODY_VOL, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);

      // Soft octave-below harmony — triangle
      const osc2  = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 0.5, t);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(HARMONY_VOL, t + 0.025);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + dur + 0.01);

      t += dur + NOTE_GAP;
    });

    const msUntilNext = Math.max(
      0,
      (loopStart + LOOP_DURATION - LOOK_AHEAD - ctx.currentTime) * 1000,
    );
    timerRef.current = setTimeout(() => {
      if (activeRef.current && ctxRef.current?.state !== 'closed') {
        scheduleLoop(ctx, loopStart + LOOP_DURATION);
      }
    }, msUntilNext);
  }, []);

  const play = useCallback(() => {
    if (!enabled) return;
    activeRef.current = true;
    const ctx = makeCtx(ctxRef);
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
