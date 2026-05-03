import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useKidsContext as useKids } from '@/lib/kids-context';
import { getCurrentSession, PET_CARE_ITEMS, PET_SPECIES_LIST, type Session } from '@/lib/store';
import {
  getTeethForAge,
  DEFAULT_AGE,
  computeBrushedSurfaces,
  allBrushed,
} from '@/lib/teeth';
import { BrushDial } from '@/components/brush-dial';
import { DentalArches } from '@/components/dental-arches';
import { ParentPinPad } from '@/components/parent-pin-pad';
import { EggHatchAnimation } from '@/components/egg-hatch-animation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAudioCues } from '@/lib/use-audio-cues';
import { FunFactCard } from '@/components/fun-fact-card';
import { BRUSH_THEMES, THEME_ORDER, type BrushThemeKey } from '@/lib/brush-themes';

export default function Brush() {
  const [, navigate] = useLocation();
  const {
    activeKid,
    setSession: persistSession,
    parentPin,
    requireParentSignoff,
    setParentPin,
    awardBrushSticker,
  } = useKids();

  const [session, setSession] = useState<Session>(getCurrentSession());
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [signedOff, setSignedOff] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [forgotPinOpen, setForgotPinOpen] = useState(false);

  // null = not chosen yet; 2 = 2-minute; 3 = 3-minute (earns a pet care item)
  const [durationChoice, setDurationChoice] = useState<2 | 3 | null>(null);
  const [stickerEarned, setStickerEarned] = useState<{ emoji: string; name: string } | null>(null);
  const [showHatch, setShowHatch] = useState(false);
  // Capture egg state before the brush completes so we can trigger the animation
  const wasEggRef = useRef(
    activeKid?.pet != null && !activeKid.pet.hatched,
  );

  const signoffRequired = requireParentSignoff && !!parentPin;

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [themeKey, setThemeKey] = useState<BrushThemeKey>(() => {
    const kidId = activeKid?.id ?? 'guest';
    return (localStorage.getItem(`brush-theme-${kidId}`) as BrushThemeKey | null) ?? 'default';
  });
  const theme = BRUSH_THEMES[themeKey];
  const handleThemeChange = (key: BrushThemeKey) => {
    setThemeKey(key);
    if (activeKid) localStorage.setItem(`brush-theme-${activeKid.id}`, key);
  };

  // Derived constants from choice
  const durationMs = (durationChoice ?? 2) * 60_000;
  const halfMs = durationMs / 2;

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  // ── Audio cues ──────────────────────────────────────────────────────────
  const { playZoneSwitch, playComplete, playCountdownBeep } = useAudioCues();

  // Zone index computed early so effects can reference it (hooks must not come after early returns)
  const zoneIdx = Math.min(1, Math.floor(elapsed / halfMs));
  const zoneRemainingSec = Math.max(
    0,
    Math.ceil((halfMs * (zoneIdx + 1) - elapsed) / 1000),
  );

  // Chime when switching from top → bottom zone
  const prevZoneRef = useRef(0);
  useEffect(() => {
    if (running && zoneIdx === 1 && prevZoneRef.current === 0) {
      playZoneSwitch();
    }
    prevZoneRef.current = zoneIdx;
  }, [zoneIdx, running, playZoneSwitch]);

  // Fanfare when the timer completes
  useEffect(() => {
    if (completed) playComplete();
  }, [completed, playComplete]);

  // Countdown beeps in the last 5 seconds of each zone
  const lastBeepSecRef = useRef(-1);
  useEffect(() => {
    if (!running) { lastBeepSecRef.current = -1; return; }
    if (zoneRemainingSec >= 1 && zoneRemainingSec <= 5 && zoneRemainingSec !== lastBeepSecRef.current) {
      lastBeepSecRef.current = zoneRemainingSec;
      playCountdownBeep(zoneRemainingSec === 1);
    }
  }, [running, zoneRemainingSec, playCountdownBeep]);

  // ── Motivational messages (themed) ────────────────────────────────────────
  const ZONE_SWITCH_MSGS = theme.zoneSwitchMsgs;
  const ALMOST_DONE_MSGS = theme.almostDoneMsgs;

  const [motivMsg, setMotivMsg] = useState<string | null>(null);
  const motivTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMotivMsg = useCallback((msg: string, durationMs_ = 2800) => {
    if (motivTimerRef.current) clearTimeout(motivTimerRef.current);
    setMotivMsg(msg);
    motivTimerRef.current = setTimeout(() => setMotivMsg(null), durationMs_);
  }, []);

  // Zone-switch motivational pop-up (fires alongside the audio chime)
  const prevZoneMsgRef = useRef(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (running && zoneIdx === 1 && prevZoneMsgRef.current === 0) {
      const msg = ZONE_SWITCH_MSGS[Math.floor(Math.random() * ZONE_SWITCH_MSGS.length)];
      t = setTimeout(() => showMotivMsg(msg), 320);
      prevZoneMsgRef.current = 1;
    }
    if (zoneIdx === 0) prevZoneMsgRef.current = 0;
    return () => { if (t) clearTimeout(t); };
  // ZONE_SWITCH_MSGS is stable (defined inline) — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneIdx, running, showMotivMsg]);

  // "Almost done" pop-up when countdown hits 5 seconds
  const almostDoneShownRef = useRef<number>(-1);
  useEffect(() => {
    if (!running) return;
    if (zoneRemainingSec === 5 && almostDoneShownRef.current !== zoneIdx) {
      almostDoneShownRef.current = zoneIdx;
      const msg = ALMOST_DONE_MSGS[Math.floor(Math.random() * ALMOST_DONE_MSGS.length)];
      showMotivMsg(msg, 4500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, zoneRemainingSec, zoneIdx, showMotivMsg]);

  // Clear message on reset
  useEffect(() => {
    if (!running && elapsed === 0) {
      if (motivTimerRef.current) clearTimeout(motivTimerRef.current);
      setMotivMsg(null);
      prevZoneMsgRef.current = 0;
      almostDoneShownRef.current = -1;
    }
  }, [running, elapsed]);

  useEffect(() => {
    if (!running) return;
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const startedAt = startTimeRef.current ?? now;
      const e = baseRef.current + (now - startedAt);
      if (e >= durationMs) {
        setElapsed(durationMs);
        baseRef.current = durationMs;
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
        // Award a pet care item for the 3-minute bonus brush
        if (durationChoice === 3 && activeKid) {
          const kidStickers = activeKid.brushStickers ?? [];
          const idx = kidStickers.length % PET_CARE_ITEMS.length;
          const pick = PET_CARE_ITEMS[idx];
          setStickerEarned({ emoji: pick.emoji, name: pick.name });
          awardBrushSticker(activeKid.id, format(new Date(), 'yyyy-MM-dd'));
          // If the pet was an egg, trigger the hatch animation
          if (wasEggRef.current) setShowHatch(true);
        }
        return;
      }
      setElapsed(e);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (startTimeRef.current !== null) {
        baseRef.current = baseRef.current + (performance.now() - startTimeRef.current);
        if (baseRef.current > durationMs) baseRef.current = durationMs;
      }
    };
  }, [running, activeKid, persistSession, session, signoffRequired, durationMs, durationChoice, awardBrushSticker]);

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
    setStickerEarned(null);
    setDurationChoice(null);
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

  const handleForgotPin = () => {
    if (activeKid) {
      persistSession(
        activeKid.id,
        format(new Date(), 'yyyy-MM-dd'),
        session,
        true,
      );
    }
    setParentPin(null);
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

  const progress = elapsed / durationMs;
  const remainingMs = Math.max(0, durationMs - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  const teeth = useMemo(
    () => getTeethForAge(activeKid.age ?? DEFAULT_AGE, activeKid.missingTeeth ?? []),
    [activeKid.age, activeKid.missingTeeth],
  );

  const brushedSurfaces = useMemo(
    () => (completed ? allBrushed(teeth) : computeBrushedSurfaces(elapsed, teeth, halfMs)),
    [completed, elapsed, teeth, halfMs],
  );

  const zone = theme.zones[zoneIdx];
  const accentColor = theme.color || activeKid.color;

  return (
    <div
      className="min-h-screen flex flex-col px-5 pt-4 pb-32 transition-colors duration-500"
      style={{ backgroundColor: `${accentColor}0d` }}
    >
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

      {/* Theme picker */}
      {!running && (
        <div className="max-w-md w-full mx-auto mb-3 flex gap-2 justify-center">
          {THEME_ORDER.map((key) => {
            const t = BRUSH_THEMES[key];
            const active = themeKey === key;
            const btnColor = t.color || activeKid.color;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => handleThemeChange(key)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={
                  active
                    ? { backgroundColor: btnColor, borderColor: btnColor, color: '#fff' }
                    : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                }
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Session toggle */}
      <div className="max-w-md w-full mx-auto mb-5">
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
                  running && 'opacity-60 cursor-not-allowed',
                )}
              >
                <Icon className="h-4 w-4" />
                {s === 'morning' ? 'Morning' : 'Evening'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration picker / Zone reminder */}
      <div className="max-w-md w-full mx-auto mb-4">
        <AnimatePresence mode="wait">
          {durationChoice === null ? (
            /* ── Duration picker ──────────────────────────────────────── */
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-center mb-3">
                How long will you brush?
              </p>
              <div className="flex gap-3">
                {/* 2-minute option */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDurationChoice(2)}
                  data-testid="duration-2min"
                  className="flex-1 flex flex-col items-center gap-1.5 py-5 rounded-2xl border-2 bg-card transition-all"
                  style={{ borderColor: `${accentColor}55` }}
                >
                  <span className="text-3xl">🕐</span>
                  <span className="text-xl font-black">2 min</span>
                  <span className="text-xs text-muted-foreground font-semibold">Standard</span>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
                  >
                    5 pts ⭐
                  </span>
                </motion.button>

                {/* 3-minute option — bonus highlighted */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDurationChoice(3)}
                  data-testid="duration-3min"
                  className="flex-1 flex flex-col items-center gap-1.5 py-5 rounded-2xl border-2 transition-all relative overflow-hidden"
                  style={{
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}18`,
                  }}
                >
                  <span
                    className="absolute top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full text-white leading-none"
                    style={{ backgroundColor: accentColor }}
                  >
                    BONUS
                  </span>
                  <span className="text-3xl">⭐</span>
                  <span className="text-xl font-black">3 min</span>
                  <span className="text-xs font-bold" style={{ color: accentColor }}>
                    Earn a sticker!
                  </span>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    10 pts ⭐⭐
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ) : completed ? null : running || elapsed > 0 ? (
            /* ── Active zone banner ───────────────────────────────────── */
            <motion.div
              key={zoneIdx === 0 ? 'top' : 'bottom'}
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl p-4 flex items-center gap-3 shadow-md border-2"
              style={{
                backgroundColor: `${accentColor}1f`,
                borderColor: `${accentColor}66`,
              }}
              data-testid={`zone-banner-${zoneIdx === 0 ? 'top' : 'bottom'}`}
            >
              <motion.div
                animate={running ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {zone.emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: accentColor }}
                >
                  Now brushing
                </p>
                <p className="text-lg font-bold leading-tight">{zone.label}!</p>
                <p className="text-xs text-muted-foreground leading-snug">{zone.hint}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="text-2xl font-bold tabular-nums leading-none"
                  style={{ color: accentColor }}
                  data-testid="zone-remaining"
                >
                  {zoneRemainingSec}s
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">left</p>
              </div>
            </motion.div>
          ) : (
            /* ── Ready banner (duration chosen, not started) ──────────── */
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 flex items-center gap-3 border-2 border-dashed"
              style={{ borderColor: 'var(--border)' }}
              data-testid="zone-banner-ready"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${accentColor}22` }}
              >
                {theme.zones[0].emoji}{theme.zones[1].emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {durationChoice === 3 ? 'Three minutes' : 'Two minutes'}
                  {durationChoice === 3 && (
                    <span className="ml-2 text-amber-500">⭐ sticker mode!</span>
                  )}
                </p>
                <p className="text-sm font-bold leading-tight">
                  {theme.zones[0].label} first, then {theme.zones[1].label}!
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  I'll remind you when to switch.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Motivational message banner */}
      <div className="max-w-md w-full mx-auto -mt-1 mb-2 h-10">
        <AnimatePresence>
          {motivMsg && (
            <motion.div
              key={motivMsg}
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl shadow-sm text-sm font-black text-white text-center"
              style={{ backgroundColor: accentColor }}
            >
              {motivMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dial */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <BrushDial progress={progress} color={accentColor} pulse={running}>
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
                    size={stickerEarned ? 220 : 260}
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
                  <p className="text-lg font-bold mt-1.5">All done!</p>
                  <p className="text-xs text-muted-foreground">
                    {signoffRequired && !signedOff
                      ? 'Show a parent to confirm.'
                      : 'Sparkly clean ✨'}
                  </p>

                  {/* Pet care item reveal — only for 3-min brush */}
                  {stickerEarned && (() => {
                    const petInfo = activeKid.pet
                      ? PET_SPECIES_LIST.find(s => s.key === activeKid.pet!.species)
                      : null;
                    const petName = activeKid.pet?.name;
                    const isEgg = activeKid.pet && !activeKid.pet.hatched;
                    return (
                      <motion.div
                        key="sticker-reveal"
                        initial={{ scale: 0, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.45 }}
                        className="mt-3 flex flex-col items-center gap-1"
                      >
                        {/* Stacked: pet emoji + care item */}
                        <div className="relative">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-2"
                            style={{
                              backgroundColor: petInfo
                                ? `${petInfo.color}28`
                                : `${activeKid.color}22`,
                              borderColor: petInfo?.color ?? activeKid.color,
                            }}
                          >
                            {stickerEarned.emoji}
                          </div>
                          {petInfo && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.7, type: 'spring', stiffness: 300 }}
                              className="absolute -bottom-1 -right-1 text-lg"
                            >
                              {isEgg ? '🥚' : petInfo.emoji}
                            </motion.span>
                          )}
                        </div>

                        <p
                          className="text-[11px] font-extrabold uppercase tracking-wide mt-1"
                          style={{ color: petInfo?.color ?? activeKid.color }}
                        >
                          {isEgg
                            ? '🥚 Your egg is hatching!'
                            : petName
                              ? `${petName} loved it!`
                              : 'Pet care earned!'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{stickerEarned.name}</p>
                      </motion.div>
                    );
                  })()}
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
                    size={260}
                  />
                  <p
                    className="text-3xl font-bold tabular-nums tracking-tight -mt-4"
                    data-testid="timer-display"
                  >
                    {durationChoice !== null
                      ? `${mins}:${secs.toString().padStart(2, '0')}`
                      : '--:--'}
                  </p>
                  <p className="text-[11px] text-muted-foreground -mt-0.5">
                    {running
                      ? 'Total time left'
                      : durationChoice !== null
                        ? 'Tap start to begin'
                        : 'Choose a time above'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BrushDial>

        {/* Zone progress pips */}
        {durationChoice !== null && (
          <div className="flex gap-3 mt-6">
            {theme.zones.map((z, i) => {
              const pipKey = i === 0 ? 'top' : 'bottom';
              const active = zoneIdx === i && (running || elapsed > 0);
              const done = elapsed >= halfMs * (i + 1);
              return (
                <div
                  key={pipKey}
                  className="flex items-center gap-1.5"
                  data-testid={`zone-pip-${pipKey}`}
                >
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      done
                        ? 'w-12 bg-primary'
                        : active
                          ? 'w-12 bg-primary/60'
                          : 'w-10 bg-muted',
                    )}
                  />
                  <span className="text-xs font-semibold text-muted-foreground">{z.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fun fact — visible while brushing */}
      <AnimatePresence>
        {(running || (elapsed > 0 && !completed)) && (
          <motion.div
            key="brush-fun-fact"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="max-w-md w-full mx-auto mt-4"
          >
            <FunFactCard kid={activeKid} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="max-w-md w-full mx-auto mt-6">
        {completed ? (
          <div className="space-y-3">
            {signoffRequired && !signedOff ? (
              <Button
                onClick={() => setPinOpen(true)}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-2xl shadow-md gap-2"
                style={{ backgroundColor: accentColor, color: '#fff' }}
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
                style={{ backgroundColor: accentColor, color: '#fff' }}
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
              disabled={elapsed === 0 && durationChoice === null}
              data-testid="reset-button"
              aria-label="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              onClick={running ? handlePause : handleStart}
              size="lg"
              className="flex-1 h-16 rounded-2xl text-lg font-bold shadow-md gap-2"
              style={{ backgroundColor: accentColor, color: '#fff' }}
              disabled={durationChoice === null}
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
        onForgotPin={() => setForgotPinOpen(true)}
        accentColor={accentColor}
        title="Parent sign-off"
        subtitle={`Enter your PIN to confirm ${activeKid.name}'s brush.`}
      />

      {/* Egg hatch animation overlay */}
      <AnimatePresence>
        {showHatch && activeKid?.pet && (() => {
          const info = PET_SPECIES_LIST.find(s => s.key === activeKid.pet!.species);
          if (!info) return null;
          return (
            <EggHatchAnimation
              petInfo={info}
              petName={activeKid.pet!.name || info.defaultName}
              onComplete={() => setShowHatch(false)}
            />
          );
        })()}
      </AnimatePresence>

      <AlertDialog open={forgotPinOpen} onOpenChange={setForgotPinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset parent PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              Your PIN will be cleared and sign-off will be turned off. This brush will be saved
              as normal. You can set a new PIN any time in Kids settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForgotPin}
              data-testid="confirm-forgot-pin-brush"
            >
              Reset PIN &amp; save brush
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
