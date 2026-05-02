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

  /* ── No pet yet ─────────────────────────────────────────────── */
  if (!pet) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onAssign(kid.id)}
        className="w-full bg-card border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2"
        style={{ borderColor: 'hsl(var(--primary) / 0.4)' }}
      >
        <motion.span
          animate={{ rotate: [0, -12, 12, -12, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3 }}
          className="text-5xl"
        >
          🎊
        </motion.span>
        <p className="font-extrabold text-base">A mystery pet is waiting!</p>
        <p className="text-xs text-muted-foreground font-semibold">Tap to meet your new friend</p>
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

  /* ── Egg (dino not hatched) ──────────────────────────────────── */
  if (!pet.hatched) {
    return (
      <div
        className="bg-card border-2 rounded-2xl p-5 flex flex-col items-center gap-3"
        style={{ borderColor: `${info.color}88`, background: `linear-gradient(135deg, ${info.color}12, transparent)` }}
      >
        <motion.span
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl"
        >
          🥚
        </motion.span>
        <div className="text-center">
          <p className="font-extrabold text-xl">"{pet.name}" is almost here!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Brush for <strong>3 minutes</strong> to hatch your Dinosaur! 🦕
          </p>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: '15%' }}
            animate={{ width: ['15%', '75%', '50%', '80%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ backgroundColor: info.color }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-semibold">
          Tap the egg is almost ready to hatch...
        </p>
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
