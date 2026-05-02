import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PetSpeciesInfo } from '@/lib/store';

interface Props {
  petInfo: PetSpeciesInfo;
  petName: string;
  onComplete: () => void;
}

type Stage = 'wobble' | 'crack' | 'burst' | 'reveal';

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFD166', '#06D6A0', '#C084FC',
  '#FB923C', '#34D399', '#F472B6', '#60A5FA',
  '#FBBF24', '#A78BFA', '#4ADE80', '#F87171',
];

// Precompute particle data outside the component so it never changes between renders.
const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360 + Math.random() * 18 - 9;
  const dist = 90 + Math.random() * 70;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * dist,
    y: Math.sin(rad) * dist,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 8 + Math.random() * 8,
    delay: Math.random() * 0.15,
  };
});

export function EggHatchAnimation({ petInfo, petName, onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('wobble');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setStage('crack'),  1800);
    const t2 = setTimeout(() => setStage('burst'),  3200);
    const t3 = setTimeout(() => setStage('reveal'), 3550);
    const t4 = setTimeout(() => onCompleteRef.current(), 6400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(10, 5, 25, 0.82)', backdropFilter: 'blur(6px)' }}
      onClick={() => onCompleteRef.current()}
      data-testid="hatch-overlay"
    >
      <div className="relative flex flex-col items-center gap-6 select-none">

        {/* ── Confetti particles ────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {(stage === 'burst' || stage === 'reveal') &&
              PARTICLES.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ width: p.size, height: p.size, backgroundColor: p.color }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    scale: [0, 1.4, 1],
                    opacity: [1, 1, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, delay: p.delay, ease: 'easeOut' }}
                />
              ))}
          </AnimatePresence>
        </div>

        {/* ── Egg / pet stage display ───────────────────────────── */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <AnimatePresence mode="wait">

            {/* Wobble stage */}
            {stage === 'wobble' && (
              <motion.span
                key="wobble"
                className="text-9xl absolute"
                animate={{
                  rotate: [-6, 6, -6, 5, -5, 4, -4, 3, -3, 0],
                  y: [0, -4, 0, -3, 0],
                }}
                transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
              >
                🥚
              </motion.span>
            )}

            {/* Crack stage */}
            {stage === 'crack' && (
              <motion.div
                key="crack"
                className="relative flex items-center justify-center"
                initial={{ scale: 1 }}
              >
                {/* Egg with intense wobble */}
                <motion.span
                  className="text-9xl"
                  animate={{
                    rotate: [-14, 14, -14, 14, -12, 12, -10, 10],
                    scale: [1, 1.06, 1, 1.1, 1, 1.14],
                  }}
                  transition={{ duration: 0.55, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
                >
                  🥚
                </motion.span>

                {/* SVG crack lines overlaid on top of the egg */}
                <svg
                  className="absolute pointer-events-none"
                  width="90"
                  height="110"
                  viewBox="0 0 90 110"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }}
                >
                  {/* Main crack — zigzag from top-centre down */}
                  <motion.path
                    d="M 45 8 L 38 30 L 50 44 L 35 75"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeIn' }}
                  />
                  {/* Side crack — upper-right */}
                  <motion.path
                    d="M 60 22 L 53 38 L 63 50"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{ duration: 0.4, delay: 0.35, ease: 'easeIn' }}
                  />
                  {/* Small crack — left side */}
                  <motion.path
                    d="M 30 45 L 23 58"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 0.3, delay: 0.55, ease: 'easeIn' }}
                  />
                </svg>

                {/* Glowing inner light peeking through cracks */}
                <motion.div
                  className="absolute rounded-full"
                  style={{ backgroundColor: petInfo.color, width: 24, height: 24, filter: 'blur(8px)' }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 0.6, 0.4, 0.8], scale: [0.5, 1, 0.8, 1.2] }}
                  transition={{ duration: 0.8, delay: 0.3, repeat: Infinity, repeatType: 'reverse' }}
                />
              </motion.div>
            )}

            {/* Burst stage — egg pops */}
            {stage === 'burst' && (
              <motion.span
                key="burst"
                className="text-9xl absolute"
                initial={{ scale: 1.1 }}
                animate={{ scale: 4, opacity: 0, rotate: 15 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                🥚
              </motion.span>
            )}

            {/* Reveal stage — pet bounces in */}
            {stage === 'reveal' && (
              <motion.span
                key="pet"
                className="text-9xl absolute"
                initial={{ scale: 0, rotate: -25, y: 20 }}
                animate={{ scale: [0, 1.4, 0.85, 1.1, 1], rotate: [-25, 10, -5, 3, 0], y: [20, -12, 4, -2, 0] }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                {petInfo.emoji}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ── Name + label reveal ───────────────────────────────── */}
        <AnimatePresence>
          {stage === 'reveal' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 18, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.65, type: 'spring', stiffness: 220, damping: 18 }}
              className="text-center"
            >
              <p
                className="text-4xl font-black text-white drop-shadow-lg tracking-tight"
                style={{ textShadow: `0 0 30px ${petInfo.color}99` }}
              >
                {petName}
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="text-white/80 text-base font-bold mt-1"
              >
                {petInfo.label} hatched! 🎉
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ delay: 2.2, duration: 1.4, repeat: Infinity }}
                className="text-white/50 text-xs font-semibold mt-3 uppercase tracking-widest"
              >
                Tap to continue
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Radial glow behind pet ────────────────────────────── */}
        {stage === 'reveal' && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 220,
              height: 220,
              background: `radial-gradient(circle, ${petInfo.color}55 0%, transparent 70%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.6, 1.2], opacity: [0, 0.8, 0.5] }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )}
      </div>
    </motion.div>
  );
}
