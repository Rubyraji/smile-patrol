import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Play, Pause, RotateCcw, Sun, Moon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useKids, getCurrentSession, type Session } from '@/lib/store';
import { BrushDial } from '@/components/brush-dial';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DURATION_MS = 120_000; // 2 minutes

const QUADRANT_LABELS = ['Top right', 'Top left', 'Bottom left', 'Bottom right'];
const QUADRANT_EMOJIS = ['↗️', '↖️', '↙️', '↘️'];

export default function Brush() {
  const [, navigate] = useLocation();
  const { activeKid, setSession: persistSession } = useKids();
  const [session, setSession] = useState<Session>(getCurrentSession());
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);

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
        if (activeKid) {
          persistSession(activeKid.id, format(new Date(), 'yyyy-MM-dd'), session, true);
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
  }, [running, activeKid, persistSession, session]);

  const handleStart = () => {
    if (completed) handleReset();
    setRunning(true);
  };
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setCompleted(false);
    baseRef.current = 0;
    startTimeRef.current = null;
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

  // Quadrant guidance every 30s
  const elapsedSec = Math.floor(elapsed / 1000);
  const quadrantIdx = Math.min(3, Math.floor(elapsedSec / 30));

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

      {/* Dial */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <BrushDial progress={progress} color={activeKid.color} pulse={running}>
          <div className="text-center select-none">
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: activeKid.color }}
                  >
                    <Check className="h-12 w-12 text-white" strokeWidth={3} />
                  </div>
                  <p className="text-2xl font-bold">All done!</p>
                  <p className="text-sm text-muted-foreground">Sparkly clean ✨</p>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-6xl mb-1">🪥</div>
                  <p className="text-5xl font-bold tabular-nums tracking-tight" data-testid="timer-display">
                    {mins}:{secs.toString().padStart(2, '0')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {running ? `${QUADRANT_EMOJIS[quadrantIdx]} ${QUADRANT_LABELS[quadrantIdx]}` : 'Tap start to begin'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BrushDial>

        {/* Quadrant pips */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                elapsedSec >= (i + 1) * 30
                  ? 'w-8 bg-primary'
                  : elapsedSec >= i * 30 && running
                    ? 'w-8 bg-primary/60'
                    : 'w-6 bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-md w-full mx-auto mt-6">
        {completed ? (
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="w-full h-14 text-base font-bold rounded-2xl shadow-md"
              style={{ backgroundColor: activeKid.color, color: '#fff' }}
              data-testid="finish-button"
            >
              See my week
            </Button>
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
    </div>
  );
}
