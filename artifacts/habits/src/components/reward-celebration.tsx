import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Reward } from '@/lib/store';

type Props = {
  reward: Reward | null;
  kidName: string;
  kidColor: string;
  onClose: () => void;
};

const CONFETTI_EMOJI = ['🎉', '✨', '⭐', '🎊', '💫', '🌟'];

export function RewardCelebration({ reward, kidName, kidColor, onClose }: Props) {
  useEffect(() => {
    if (!reward) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reward, onClose]);

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          data-testid="reward-celebration"
        >
          {/* Floating confetti emojis */}
          {Array.from({ length: 16 }).map((_, i) => {
            const left = (i * 53) % 100;
            const delay = (i % 6) * 0.15;
            const dur = 2.6 + (i % 4) * 0.4;
            return (
              <motion.span
                key={i}
                className="absolute text-2xl pointer-events-none select-none"
                style={{ left: `${left}%`, top: '-10%' }}
                initial={{ y: 0, rotate: 0, opacity: 0 }}
                animate={{
                  y: '120vh',
                  rotate: 360 + (i % 2 === 0 ? 180 : -180),
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: dur, delay, ease: 'easeIn', repeat: Infinity, repeatDelay: 1 }}
              >
                {CONFETTI_EMOJI[i % CONFETTI_EMOJI.length]}
              </motion.span>
            );
          })}

          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 200 }}
            className="relative w-full max-w-sm rounded-3xl bg-card border-2 shadow-2xl p-8 text-center overflow-hidden"
            style={{ borderColor: kidColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition"
              aria-label="Close"
              data-testid="celebration-close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glow background */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: `radial-gradient(circle at center top, ${kidColor}, transparent 60%)` }}
            />

            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground relative">
              You did it, {kidName}!
            </p>
            <h2 className="text-3xl font-bold mt-1 mb-6 relative">Reward unlocked</h2>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.2 }}
              className="relative mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-4 shadow-lg"
              style={{ background: `radial-gradient(circle at 30% 30%, ${kidColor}, ${kidColor}AA)` }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                className="text-7xl"
              >
                {reward.sticker}
              </motion.div>
            </motion.div>

            <h3 className="text-xl font-bold mb-1 relative" data-testid="celebration-name">
              {reward.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 relative">
              You brushed twice every day this week. That's 14 brushes — incredible work!
            </p>

            <button
              onClick={onClose}
              data-testid="celebration-awesome"
              className="w-full h-12 rounded-2xl font-bold text-white shadow-md active:scale-[0.98] transition-transform relative"
              style={{ backgroundColor: kidColor }}
            >
              Awesome! 🎉
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
