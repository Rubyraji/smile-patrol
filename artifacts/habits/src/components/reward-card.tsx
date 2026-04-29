import { motion } from 'framer-motion';
import { Lock, Sparkles, Gift } from 'lucide-react';
import type { Kid, Reward } from '@/lib/store';
import { cn } from '@/lib/utils';

type Props = {
  kid: Kid;
  weekCount: number;
  weekTotal: number;
  reward: Reward | undefined;
  onClaim: () => void;
};

export function RewardCard({ kid, weekCount, weekTotal, reward, onClaim }: Props) {
  const complete = weekCount >= weekTotal;
  const pct = Math.min(100, (weekCount / weekTotal) * 100);
  const remaining = Math.max(0, weekTotal - weekCount);

  // State 1: already unlocked + claimed (sticker permanently displayed)
  if (reward) {
    return (
      <div
        className="rounded-3xl p-5 relative overflow-hidden border-2"
        style={{
          background: `linear-gradient(135deg, ${kid.color}26, ${kid.color}10)`,
          borderColor: `${kid.color}66`,
        }}
        data-testid="reward-card-claimed"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="text-5xl shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md"
          >
            {reward.sticker}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              This week's reward
            </p>
            <p className="text-lg font-bold leading-tight" data-testid="reward-name">
              {reward.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Earned for brushing twice every day. Amazing!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: complete, awaiting claim — pulsing chest
  if (complete) {
    return (
      <motion.button
        onClick={onClaim}
        data-testid="reward-claim-button"
        className="w-full rounded-3xl p-5 relative overflow-hidden border-2 text-left active:scale-[0.99] transition-transform"
        style={{
          background: `linear-gradient(135deg, ${kid.color}40, ${kid.color}1A)`,
          borderColor: kid.color,
        }}
        animate={{ boxShadow: [`0 0 0 0 ${kid.color}55`, `0 0 0 14px ${kid.color}00`] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="text-5xl shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md"
          >
            🎁
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1" style={{ color: kid.color }}>
              <Sparkles className="h-3 w-3" />
              Reward ready!
            </p>
            <p className="text-lg font-bold leading-tight">Tap to open your gift</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You finished every daily goal this week. Way to go!
            </p>
          </div>
        </div>
      </motion.button>
    );
  }

  // State 3: in progress — locked chest with progress bar
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden border bg-card"
      data-testid="reward-card-progress"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="relative shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-muted text-4xl opacity-70">
          <Gift className="h-8 w-8 text-muted-foreground" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border flex items-center justify-center">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
            Weekly reward
          </p>
          <p className="text-base font-bold leading-tight">
            {remaining} more goal{remaining === 1 ? '' : 's'} to unlock!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Finish all your daily tasks every day to earn a sticker.
          </p>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full')}
          style={{ backgroundColor: kid.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] font-semibold text-muted-foreground">
          {weekCount} / {weekTotal} goals
        </span>
        <span className="text-[10px] font-semibold" style={{ color: kid.color }}>
          {Math.floor(pct)}%
        </span>
      </div>
    </div>
  );
}
