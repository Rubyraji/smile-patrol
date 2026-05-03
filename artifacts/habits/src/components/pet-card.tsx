import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek } from 'date-fns';
import {
  type Kid,
  PET_SPECIES_LIST,
  getPetHappiness,
  getWeekDays,
} from '@/lib/store';

interface Props {
  kid: Kid;
  onAssign: (kidId: string) => void;
  onName: (kidId: string, name: string) => void;
  onCheckDeath: (kidId: string) => string | null;
}

const SPARKLE_POSITIONS = [
  { x: -52, y: -44, delay: 0,    dur: 2.1, size: 'text-xl' },
  { x:  58, y: -36, delay: 0.4,  dur: 1.8, size: 'text-base' },
  { x: -60, y:  18, delay: 0.9,  dur: 2.4, size: 'text-sm' },
  { x:  55, y:  28, delay: 0.2,  dur: 2.0, size: 'text-lg' },
  { x:   8, y: -62, delay: 0.6,  dur: 1.9, size: 'text-sm' },
  { x: -20, y:  60, delay: 1.1,  dur: 2.3, size: 'text-base' },
  { x:  38, y:  58, delay: 0.75, dur: 2.2, size: 'text-xs' },
];

const CRACK_PATHS = [
  'M 45 8 L 38 30 L 50 44 L 35 75',
  'M 60 22 L 53 38 L 63 50',
  'M 30 45 L 23 58',
];

export function PetCard({ kid, onAssign, onName, onCheckDeath }: Props) {
  const checkedRef = useRef(false);
  const [justDied, setJustDied] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const weekDays = getWeekDays();

  useEffect(() => {
    if (checkedRef.current || !kid.pet) return;
    checkedRef.current = true;
    const prevName = onCheckDeath(kid.id);
    if (prevName) setJustDied(prevName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid.id]);

  const pet = kid.pet;

  /* ── No pet yet — mystery state ────────────────────────────── */
  if (!pet) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onAssign(kid.id)}
        className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #1a0533 0%, #0d1b3e 60%, #0a2a1a 100%)',
          border: '2px solid rgba(192,132,252,0.35)',
          boxShadow: '0 0 32px rgba(192,132,252,0.15), inset 0 0 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Animated radial glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle at 50% 45%, rgba(192,132,252,0.22) 0%, transparent 65%)',
          }}
        />

        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {SPARKLE_POSITIONS.map((sp, i) => (
            <motion.span
              key={i}
              className={`absolute ${sp.size} select-none`}
              style={{ left: `calc(50% + ${sp.x}px)`, top: `calc(45% + ${sp.y}px)` }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4], y: [0, -6, 0] }}
              transition={{ duration: sp.dur, delay: sp.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              ✨
            </motion.span>
          ))}
        </div>

        {/* Mystery silhouette */}
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute rounded-full border-2"
            style={{ width: 96, height: 96, borderColor: 'rgba(192,132,252,0.4)' }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Inner pulsing ring */}
          <motion.div
            className="absolute rounded-full border"
            style={{ width: 70, height: 70, borderColor: 'rgba(192,132,252,0.6)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.0, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Question mark creature */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <motion.span
              className="text-6xl select-none block"
              animate={{ filter: ['brightness(0.6) blur(1px)', 'brightness(1) blur(0px)', 'brightness(0.6) blur(1px)'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 12px rgba(192,132,252,0.8))' }}
            >
              🐣
            </motion.span>
          </motion.div>
        </div>

        {/* Text */}
        <div className="relative z-10 text-center space-y-1">
          <motion.p
            className="font-black text-lg text-white tracking-tight leading-snug"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.0, repeat: Infinity }}
          >
            A mystery pet is waiting!
          </motion.p>
          <p className="text-sm font-semibold" style={{ color: 'rgba(192,132,252,0.85)' }}>
            ✨ Tap to meet your new friend ✨
          </p>
        </div>

        {/* Shimmer tap pill */}
        <motion.div
          className="relative z-10 overflow-hidden rounded-full px-6 py-2"
          style={{ background: 'rgba(192,132,252,0.2)', border: '1px solid rgba(192,132,252,0.5)' }}
          animate={{ boxShadow: ['0 0 0px rgba(192,132,252,0)', '0 0 14px rgba(192,132,252,0.6)', '0 0 0px rgba(192,132,252,0)'] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <motion.div
            className="absolute inset-0 -skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)' }}
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.8 }}
          />
          <span className="text-xs font-black text-white/90 uppercase tracking-widest relative z-10">
            Reveal my pet →
          </span>
        </motion.div>
      </motion.button>
    );
  }

  const info = PET_SPECIES_LIST.find((s) => s.key === pet.species) ?? PET_SPECIES_LIST[0];
  const hearts = getPetHappiness(kid, weekDays);
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const careThisWeek = (kid.brushStickers ?? []).filter(
    (s) => s.date >= weekStart && s.date <= todayStr,
  );

  const petEmoji = !pet.hatched ? '🥚' : info.emoji;

  /* ── Needs naming ───────────────────────────────────────────── */
  if (!pet.name) {
    return (
      <div
        className="bg-card border-2 rounded-2xl p-5 flex flex-col items-center gap-3"
        style={{ borderColor: `${info.color}88` }}
      >
        <AnimatePresence>
          {justDied && (
            <motion.div
              key="died"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full text-center text-xs font-semibold bg-muted rounded-xl px-3 py-2 text-muted-foreground"
            >
              💔 {justDied} crossed the rainbow bridge 🌈
              <br />But look — a new friend arrived!
            </motion.div>
          )}
        </AnimatePresence>

        <motion.span
          animate={pet.hatched ? { y: [0, -10, 0] } : { rotate: [-8, 8, -8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl"
        >
          {petEmoji}
        </motion.span>

        <div className="text-center">
          <p className="font-extrabold text-xl leading-tight">
            A new {info.label} arrived!
          </p>
          {pet.generation > 0 && (
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">
              Generation #{pet.generation + 1}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {pet.hatched ? 'Give them a name!' : 'Name them before they hatch! 🥚'}
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nameInput.trim() && onName(kid.id, nameInput)}
            placeholder={info.defaultName}
            maxLength={20}
            autoFocus
            className="flex-1 h-12 px-4 rounded-xl border-2 bg-background font-bold text-base focus:outline-none transition"
            style={{ borderColor: `${info.color}88` }}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => nameInput.trim() && onName(kid.id, nameInput)}
            disabled={!nameInput.trim()}
            className="h-12 px-5 rounded-xl font-extrabold text-base text-white transition disabled:opacity-40"
            style={{ backgroundColor: info.color }}
          >
            Name! ✨
          </motion.button>
        </div>
      </div>
    );
  }

  /* ── Egg (named but not hatched yet) ─────────────────────────── */
  if (!pet.hatched) {
    const stickersEarned = (kid.brushStickers ?? []).length;
    const cracksVisible = Math.min(3, Math.floor(stickersEarned / 1));
    return (
      <div
        className="rounded-3xl p-5 flex flex-col items-center gap-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${info.color}18 0%, ${info.color}08 100%)`,
          border: `2px solid ${info.color}55`,
          boxShadow: `0 0 24px ${info.color}22`,
        }}
      >
        {/* Background pulse glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(circle at 50% 40%, ${info.color}30 0%, transparent 65%)` }}
        />

        {/* Egg with cracks */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Pulsing outer ring */}
          <motion.div
            className="absolute rounded-full"
            style={{ width: 120, height: 120, border: `2px solid ${info.color}44` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* The egg */}
          <motion.span
            className="text-8xl relative z-10 select-none"
            animate={{
              rotate: [-10, 10, -10, 8, -8, 5, -5, 0],
              scale: [1, 1.07, 1, 1.1, 1],
              y: [0, -4, 0],
            }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 16px ${info.color}88)` }}
          >
            🥚
          </motion.span>

          {/* SVG cracks that appear as stickers are earned */}
          <svg
            className="absolute pointer-events-none z-20"
            width="90" height="110" viewBox="0 0 90 110" fill="none"
            style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }}
          >
            {CRACK_PATHS.slice(0, cracksVisible).map((d, i) => (
              <motion.path
                key={i}
                d={d}
                stroke="white"
                strokeWidth={i === 0 ? 2.5 : i === 1 ? 1.8 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: i === 0 ? 0.85 : i === 1 ? 0.7 : 0.6 }}
                transition={{ duration: 0.6, ease: 'easeIn' }}
              />
            ))}
          </svg>

          {/* Inner glow through cracks */}
          {cracksVisible > 0 && (
            <motion.div
              className="absolute rounded-full z-10"
              style={{ backgroundColor: info.color, width: 20, height: 20, filter: 'blur(10px)' }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Text */}
        <div className="text-center relative z-10">
          <motion.p
            className="font-extrabold text-xl"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.0, repeat: Infinity }}
          >
            "{pet.name}" is almost here!
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1">
            Brush for <strong>3 minutes</strong> to hatch your {info.label}! 🦕
          </p>
        </div>

        {/* Crack progress indicators */}
        <div className="flex gap-2 items-center relative z-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1"
              initial={false}
            >
              <motion.span
                className="text-2xl"
                animate={i < cracksVisible ? { rotate: [-8, 8, -8], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              >
                {i < cracksVisible ? '🔥' : '⭕'}
              </motion.span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                Brush {i + 1}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-xs font-bold relative z-10"
          style={{ color: info.color }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          {cracksVisible === 0 && '🥚 Keep brushing — your pet needs you!'}
          {cracksVisible === 1 && '🔥 The shell is cracking — keep going!'}
          {cracksVisible === 2 && '⚡ So close! One more 3-min brush!'}
          {cracksVisible === 3 && '💥 Ready to hatch — brush 3 min now!'}
        </motion.p>
      </div>
    );
  }

  /* ── Alive ───────────────────────────────────────────────────── */
  return (
    <div
      className="bg-card border-2 rounded-2xl p-4 relative overflow-hidden"
      style={{ borderColor: `${info.color}66` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 75% 20%, ${info.color}20 0%, transparent 65%)`,
        }}
      />

      <div className="relative flex items-start gap-3">
        {/* Pet avatar */}
        <div className="flex flex-col items-center shrink-0">
          <motion.span
            animate={
              hearts > 1
                ? { y: [0, -7, 0], rotate: [0, -4, 4, 0] }
                : { x: [-2, 2, -2] }
            }
            transition={{
              duration: hearts > 1 ? 2.2 : 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: hearts > 1 ? 1.5 : 0,
            }}
            className="text-5xl"
          >
            {info.emoji}
          </motion.span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-xl leading-none truncate">{pet.name}</h4>
            {pet.generation > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                Gen.{pet.generation + 1}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">{info.label}</p>

          {/* Health hearts */}
          <div className="flex gap-0.5 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                className="text-lg leading-none"
              >
                {i < hearts ? '❤️' : '🤍'}
              </motion.span>
            ))}
          </div>

          {hearts <= 2 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold mt-1.5"
              style={{ color: info.color }}
            >
              {hearts === 0
                ? '😰 Needs brushing urgently!'
                : hearts === 1
                  ? '⚠️ Very hungry — brush more!'
                  : '⚠️ Brush more to keep them happy!'}
            </motion.p>
          )}
        </div>
      </div>

      {/* Care items this week */}
      <div className="mt-3 pt-3 border-t border-border/40 relative">
        {careThisWeek.length > 0 ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Fed this week
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {careThisWeek.slice(-10).map((s, i) => (
                <motion.span
                  key={`${s.date}-${i}`}
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: Math.min(i * 0.04, 0.4) }}
                  className="text-xl"
                  title={s.name}
                >
                  {s.sticker}
                </motion.span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground font-semibold">
            🍽️ Brush for <strong>3 min</strong> to feed {pet.name}!
          </p>
        )}
      </div>
    </div>
  );
}
