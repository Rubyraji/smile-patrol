import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Moon,
  Check,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useKids, getCurrentSession, type Session } from '@/lib/store';
import {
  getTeethForAge,
  DEFAULT_AGE,
  computeBrushedSurfaces,
  allBrushed,
} from '@/lib/teeth';
import { BrushDial } from '@/components/brush-dial';
import { DentalArches } from '@/components/dental-arches';
import { ParentPinPad } from '@/components/parent-pin-pad';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DURATION_MS = 120_000; // 2 minutes
const HALF_MS = 60_000; // 1 minute per zone

type Zone = {
  key: 'top' | 'bottom';
  label: string;
  emoji: string;
  hint: string;
};

const ZONES: Zone[] = [
  {
    key: 'top',
    label: 'Top teeth',
    emoji: '⬆️',
    hint: 'Brush the teeth on top — front and back!',
  },
  {
    key: 'bottom',
    label: 'Bottom teeth',
    emoji: '⬇️',
    hint: 'Now brush the bottom teeth — front and back!',
  },
];

export default function Brush() {
  const [, navigate] = useLocation();
  const {
    activeKid,
    setSession: persistSession,
    parentPin,
    requireParentSignoff,
  } = useKids();
  const [session, setSession] = useState<Session>(getCurrentSession());
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  // Whether the just-finished session has been confirmed (either no signoff
  // required, or the parent has entered the PIN). Sessions are only persisted
  // once this flips true.
  const [signedOff, setSignedOff] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const signoffRequired = requireParentSignoff && !!parentPin;

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const startedAt = startTimeRef.current ?? now;
      const e = baseRef.current + (now - startedAt);
      if (e >= DURATION_MS) {
        setElapsed(DURATION_MS);
        baseRef.current = DURATION_MS;
        setRunning(false);
        setCompleted(true);
        if (activeKid && !signoffRequired) {
          persistSession(
            activeKid.id,
            format(new Date(), 'yyyy-MM-dd'),
            session,
            true,
          );
          setSignedOff(true);
        }
        return;
      }
      setElapsed(e);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // capture progress when pausing
      if (startTimeRef.current !== null) {
        baseRef.current = baseRef.current + (performance.now() - startTimeRef.current);
        if (baseRef.current > DURATION_MS) baseRef.current = DURATION_MS;
      }
    };
  }, [running, activeKid, persistSession, session, signoffRequired]);

  const handleStart = () => {
    if (completed) handleReset();
    setRunning(true);
  };
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setCompleted(false);
    setSignedOff(false);
    baseRef.current = 0;
    startTimeRef.current = null;
  };

  const handlePinSuccess = () => {
    if (activeKid) {
      persistSession(
        activeKid.id,
        format(new Date(), 'yyyy-MM-dd'),
        session,
        true,
      );
    }
    setSignedOff(true);
  };

  if (!activeKid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No kid selected.</p>
          <Link href="/">
            <Button>Go home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress = elapsed / DURATION_MS;
  const remainingMs = Math.max(0, DURATION_MS - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  const teeth = useMemo(
    () => getTeethForAge(activeKid.age ?? DEFAULT_AGE, activeKid.missingTeeth ?? []),
    [activeKid.age, activeKid.missingTeeth],
  );

  // Map of which tooth surfaces have been brushed so far in this session.
  // Updates every animation frame as `elapsed` advances.
  const brushedSurfaces = useMemo(
    () => (completed ? allBrushed(teeth) : computeBrushedSurfaces(elapsed, teeth, HALF_MS)),
    [completed, elapsed, teeth],
  );

  // Top teeth for the first minute, bottom teeth for the second minute
  const zoneIdx = Math.min(1, Math.floor(elapsed / HALF_MS));
  const zone = ZONES[zoneIdx];
  const zoneRemainingSec = Math.max(
    0,
    Math.ceil((HALF_MS * (zoneIdx + 1) - elapsed) / 1000),
  );

  return (
    <div className="min-h-screen flex flex-col px-5 pt-4 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 max-w-md w-full mx-auto">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-muted active:scale-95 transition"
          data-testid="brush-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: activeKid.color }}
          >
            {activeKid.emoji}
          </span>
          <span className="font-bold">{activeKid.name}</span>
        </div>

        <div className="w-10" />
      </header>

      {/* Session toggle */}
      <div className="max-w-md w-full mx-auto mb-6">
        <div className="bg-card border rounded-full p-1 flex gap-1">
          {(['morning', 'afternoon'] as Session[]).map((s) => {
            const active = s === session;
            const Icon = s === 'morning' ? Sun : Moon;
            return (
              <button
                key={s}
                onClick={() => !running && setSession(s)}
                disabled={running}
                data-testid={`session-toggle-${s}`}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                  running && 'opacity-60 cursor-not-allowed'
                )}
              >
                <Icon className="h-4 w-4" />
                {s === 'morning' ? 'Morning' : 'Evening'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone reminder popup — visible whenever the timer is active */}
      <div className="max-w-md w-full mx-auto mb-4 min-h-[88px]">
        <AnimatePresence mode="wait">
          {completed ? null : running || elapsed > 0 ? (
            <motion.div
              key={zone.key}
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl p-4 flex items-center gap-3 shadow-md border-2"
              style={{
                backgroundColor: `${activeKid.color}1f`,
                borderColor: `${activeKid.color}66`,
              }}
              data-testid={`zone-banner-${zone.key}`}
            >
              <motion.div
                animate={running ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: activeKid.color }}
              >
                {zone.emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: activeKid.color }}
                >
                  Now brushing
                </p>
                <p className="text-lg font-bold leading-tight">{zone.label}!</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {zone.hint}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="text-2xl font-bold tabular-nums leading-none"
                  style={{ color: activeKid.color }}
                  data-testid="zone-remaining"
                >
                  {zoneRemainingSec}s
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  left
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 flex items-center gap-3 border-2 border-dashed"
              style={{ borderColor: 'var(--border)' }}
              data-testid="zone-banner-ready"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
                ⬆️⬇️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Two minutes
                </p>
                <p className="text-sm font-bold leading-tight">
                  Top teeth first, then bottom!
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  I'll remind you when to switch.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dial */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <BrushDial progress={progress} color={activeKid.color} pulse={running}>
          <div className="text-center select-none w-full px-2">
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <DentalArches
                    teeth={teeth}
                    brushedSurfaces={brushedSurfaces}
                    brushColor={activeKid.color}
                    size={210}
                  />
                  <div
                    className={cn(
                      '-mt-6 w-14 h-14 rounded-full flex items-center justify-center shadow-md',
                      signoffRequired && !signedOff && 'opacity-70',
                    )}
                    style={{ backgroundColor: activeKid.color }}
                  >
                    {signoffRequired && !signedOff ? (
                      <Lock className="h-7 w-7 text-white" strokeWidth={2.5} />
                    ) : (
                      <Check className="h-8 w-8 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <p className="text-lg font-bold mt-2">All done!</p>
                  <p className="text-xs text-muted-foreground">
                    {signoffRequired && !signedOff
                      ? 'Show a parent to confirm.'
                      : 'Sparkly clean ✨'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <DentalArches
                    teeth={teeth}
                    brushedSurfaces={brushedSurfaces}
                    brushColor={activeKid.color}
                    size={220}
                  />
                  <p
                    className="text-3xl font-bold tabular-nums tracking-tight -mt-4"
                    data-testid="timer-display"
                  >
                    {mins}:{secs.toString().padStart(2, '0')}
                  </p>
                  <p className="text-[11px] text-muted-foreground -mt-0.5">
                    {running ? 'Total time left' : 'Tap start to begin'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BrushDial>

        {/* Zone pips — one per minute */}
        <div className="flex gap-3 mt-6">
          {ZONES.map((z, i) => {
            const active = zoneIdx === i && (running || elapsed > 0);
            const done = elapsed >= HALF_MS * (i + 1);
            return (
              <div
                key={z.key}
                className="flex items-center gap-1.5"
                data-testid={`zone-pip-${z.key}`}
              >
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    done ? 'w-12 bg-primary' : active ? 'w-12 bg-primary/60' : 'w-10 bg-muted',
                  )}
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  {z.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-md w-full mx-auto mt-6">
        {completed ? (
          <div className="space-y-3">
            {signoffRequired && !signedOff ? (
              <Button
                onClick={() => setPinOpen(true)}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-2xl shadow-md gap-2"
                style={{ backgroundColor: activeKid.color, color: '#fff' }}
                data-testid="parent-confirm-button"
              >
                <Lock className="h-5 w-5" />
                Parent: tap to confirm
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/')}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-2xl shadow-md"
                style={{ backgroundColor: activeKid.color, color: '#fff' }}
                data-testid="finish-button"
              >
                See my week
              </Button>
            )}
            <Button
              onClick={handleReset}
              variant="ghost"
              size="lg"
              className="w-full rounded-2xl"
              data-testid="reset-button"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Brush again
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 shrink-0"
              disabled={elapsed === 0}
              data-testid="reset-button"
              aria-label="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              onClick={running ? handlePause : handleStart}
              size="lg"
              className="flex-1 h-16 rounded-2xl text-lg font-bold shadow-md gap-2"
              style={{ backgroundColor: activeKid.color, color: '#fff' }}
              data-testid={running ? 'pause-button' : 'start-button'}
            >
              {running ? (
                <>
                  <Pause className="h-6 w-6 fill-white" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 fill-white" />
                  {elapsed > 0 ? 'Resume' : 'Start'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <ParentPinPad
        open={pinOpen}
        onOpenChange={setPinOpen}
        mode="verify"
        expectedPin={parentPin}
        onSuccess={handlePinSuccess}
        accentColor={activeKid.color}
        title="Parent sign-off"
        subtitle={`Enter your PIN to confirm ${activeKid.name}'s brush.`}
      />
    </div>
  );
}
