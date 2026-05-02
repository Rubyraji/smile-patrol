import { motion } from 'framer-motion';
import { type Kid } from '@/lib/store';

interface Props {
  kid: Kid;
}

export function StickerShelf({ kid }: Props) {
  const stickers = kid.brushStickers ?? [];
  if (stickers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-extrabold flex items-center gap-1.5">
          <span>🎖️</span>
          <span>My Stickers</span>
        </h4>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
          {stickers.length} earned
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {stickers.map((s, i) => (
          <motion.div
            key={`${s.date}-${i}`}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 15,
              delay: Math.min(i * 0.04, 0.4),
            }}
            title={s.name}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border-2"
            style={{
              backgroundColor: `${kid.color}15`,
              borderColor: `${kid.color}44`,
            }}
          >
            {s.sticker}
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-2.5 font-semibold">
        Earned by brushing for 3 minutes ⭐
      </p>
    </motion.div>
  );
}
