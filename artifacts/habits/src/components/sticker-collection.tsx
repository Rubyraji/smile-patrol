import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Trophy } from 'lucide-react';
import type { Reward } from '@/lib/store';

type Props = {
  rewards: Reward[];
  color: string;
};

export function StickerCollection({ rewards, color }: Props) {
  const sorted = [...rewards].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <section data-testid="sticker-collection">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-bold flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-500" />
          Sticker collection
        </h3>
        <span className="text-sm font-semibold text-muted-foreground" data-testid="sticker-count">
          {rewards.length} earned
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="text-3xl mb-1 opacity-50">✨</div>
          <p className="text-sm text-muted-foreground">
            No stickers yet — finish a full week to earn your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {sorted.map((r, i) => (
            <motion.div
              key={r.weekStart}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="aspect-square rounded-2xl bg-card border flex flex-col items-center justify-center p-1.5 relative group"
              data-testid={`sticker-${r.weekStart}`}
              title={`${r.name} — week of ${format(parseISO(r.weekStart), 'MMM d')}`}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-20"
                style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
              />
              <div className="text-3xl relative">{r.sticker}</div>
              <div className="text-[9px] font-semibold text-muted-foreground mt-0.5 relative">
                {format(parseISO(r.weekStart), 'MMM d')}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
