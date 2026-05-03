import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Kid, type Session } from '@/lib/store';

interface Props {
  kid: Kid;
  onMarkBrush: (dateStr: string, session: Session) => void;
  onMarkTask: (taskId: string, dateStr: string) => void;
}

const DISMISS_KEY = 'brush.dismissedYesterday.v1';

export function MissedYesterdayBanner({ kid, onMarkBrush, onMarkTask }: Props) {
  const yesterday = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const todayStr  = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === todayStr; }
    catch { return false; }
  });

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, todayStr); } catch { /* ok */ }
    setDismissed(true);
  };

  if (dismissed) return null;

  const yBrushings  = kid.brushings[yesterday] ?? {};
  const missedAM    = !yBrushings.morning;
  const missedPM    = !yBrushings.afternoon;
  const missedTasks = kid.tasks.filter((t) => !kid.taskCompletions[t.id]?.[yesterday]);

  if (!missedAM && !missedPM && missedTasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 px-4 py-3"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">📋</span>
          <div>
            <p className="text-sm font-black text-amber-900 dark:text-amber-100 leading-tight">
              Yesterday's gaps
            </p>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Tap any item to mark it done
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="w-7 h-7 rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Missed items as tappable pills */}
      <div className="flex flex-wrap gap-2">
        {missedAM && (
          <MissedPill
            emoji="☀️"
            label="Morning brush"
            color={kid.color}
            onMark={() => onMarkBrush(yesterday, 'morning')}
          />
        )}
        {missedPM && (
          <MissedPill
            emoji="🌙"
            label="Bedtime brush"
            color={kid.color}
            onMark={() => onMarkBrush(yesterday, 'afternoon')}
          />
        )}
        {missedTasks.map((t) => (
          <MissedPill
            key={t.id}
            emoji={t.emoji}
            label={t.name}
            color={kid.color}
            onMark={() => onMarkTask(t.id, yesterday)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Individual pill ───────────────────────────────────────────────────────────

function MissedPill({
  emoji,
  label,
  color,
  onMark,
}: {
  emoji: string;
  label: string;
  color: string;
  onMark: () => void;
}) {
  const [ticked, setTicked] = useState(false);

  const handleClick = () => {
    setTicked(true);
    onMark();
  };

  return (
    <AnimatePresence>
      {!ticked && (
        <motion.button
          type="button"
          onClick={handleClick}
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.18 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold
                     bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-700
                     text-amber-900 dark:text-amber-100 hover:border-amber-500 transition-colors"
          style={{ '--pill-color': color } as React.CSSProperties}
        >
          <span>{emoji}</span>
          <span>{label}</span>
          <Check className="h-3 w-3 text-amber-500" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
