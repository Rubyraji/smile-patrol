import { useCallback, useRef } from 'react';

// "Row, Row, Row Your Boat" — [frequency Hz, duration s]
// Tempo: quarter note ≈ 0.5 s  (♩= 120 bpm)
//   dotted quarter = 0.75 s  |  quarter = 0.5 s  |  eighth = 0.25 s  |  dotted half = 1.5 s
const C4  = 261.63;
const D4  = 293.66;
const E4  = 329.63;
const F4  = 349.23;
const G4  = 392.00;
const C5  = 523.25;

const MELODY: [number, number][] = [
  // Row,  row,  row  your  boat
  [C4, 0.75], [C4, 0.25], [C4, 0.50], [D4, 0.25], [E4, 0.75],
  // Gent-ly  down  the  stream
  [E4, 0.25], [D4, 0.25], [E4, 0.25], [F4, 0.25], [G4, 1.50],
  // Mer-ri-ly  mer-ri-ly  mer-ri-ly  mer-ri-ly
  [C5, 0.25], [C5, 0.25], [C5, 0.25],
  [G4, 0.25], [G4, 0.25], [G4, 0.25],
  [E4, 0.25], [E4, 0.25], [E4, 0.25],
  [D4, 0.25], [D4, 0.25], [D4, 0.25],
  // Life  is  but  a  dream
  [G4, 0.25], [F4, 0.25], [E4, 0.25], [D4, 0.25], [C4, 1.50],
];

const NOTE_GAP    = 0.025; // tiny articulation gap between notes
const LOOP_PAUSE  = 0.6;   // brief rest before the song repeats
const LOOP_DURATION =
  MELODY.reduce((s, [, d]) => s + d + NOTE_GAP, 0) + LOOP_PAUSE;

const MELODY_VOL  = 0.16;
const HARMONY_VOL = 0.06;
const LOOK_AHEAD  = 0.12; // schedule this many seconds ahead

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
      // Melody voice — sine wave
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

      // Soft harmony — triangle an octave below, for warmth
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

    // Reschedule next loop slightly before this one ends
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
