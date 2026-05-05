import { useCallback, useRef } from 'react';

// "Cockles and Mussels" (Molly Malone) — [frequency Hz, duration s]
// 3/4 waltz, quarter note ≈ 0.5 s  (♩= 120 bpm)
const C4  = 261.63;
const D4  = 293.66;
const E4  = 329.63;
const F4  = 349.23;
const G4  = 392.00;
const A4  = 440.00;
const C5  = 523.25;

const MELODY: [number, number][] = [
  // "In Dublin's fair city"
  [C4, 0.25], // In
  [F4, 0.50], // Dub-
  [F4, 0.50], // -lin's
  [F4, 0.25], // fair
  [F4, 0.25], // ci-
  [F4, 0.50], // -ty

  // "where girls are so pretty"
  [A4, 0.25], // where
  [C5, 0.25], // girls
  [A4, 0.25], // are
  [F4, 0.75], // so pret-

  // "I first set"
  [G4, 0.25], // -ty / I
  [G4, 0.25], // first
  [G4, 0.50], // set

  // "my eyes on sweet Molly Malone"
  [E4, 0.25], // my
  [D4, 0.25], // eyes
  [C4, 1.50], // on (long hold)

  // "She wheeled her wheelbarrow"
  [C4, 0.25], // She
  [F4, 0.50], // wheeled
  [F4, 0.50], // her
  [F4, 0.25], // wheel-
  [F4, 0.25], // -bar-
  [F4, 0.50], // -row

  // "through streets broad and narrow"
  [A4, 0.25], // through
  [C4, 0.25], // streets
  [A4, 0.25], // broad
  [F4, 0.75], // and nar-

  // "row — crying cockles…"
  [G4, 0.25], // -row
  [C4, 0.50], // cry-
  [F4, 1.50], // -ing… (hold before repeat)
];

const NOTE_GAP    = 0.025;
const LOOP_PAUSE  = 0.8;
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
