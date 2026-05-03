import { useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import {
  getWeekDays,
  getWeeklyPoints,
  getPointsForDate,
  getPointsLevel,
  POINT_VALUES,
  type Kid,
} from '@/lib/store';

interface Props {
  kid: Kid;
}

export function PointsCard({ kid }: Props) {
  const weekDays  = useMemo(() => getWeekDays(), []);
  const today     = format(new Date(), 'yyyy-MM-dd');
  const weekPts   = getWeeklyPoints(kid, weekDays);
  const todayPts  = getPointsForDate(kid, today);
  const level     = getPointsLevel(weekPts);

  // progress bar within the current level band
  const bands = [0, 30, 80, 140, 200];
  const levelFloor = bands.findLast((b) => weekPts >= b) ?? 0;
  const levelCeil  = level.nextAt ?? levelFloor + 60; // legend cap
  const barPct     = Math.min(100, ((weekPts - levelFloor) / (levelCeil - levelFloor)) * 100);

  return (
    <div
      className="rounded-3xl border bg-card p-5 space-y-4 shadow-sm"
      data-testid="points-card"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0"
            style={{ backgroundColor: `${kid.color}22` }}
          >
            {level.emoji}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              This week's points
            </p>
            <div className="flex items-baseline gap-1.5">
              <motion.span
                key={weekPts}
                initial={{ scale: 1.2, color: kid.color }}
                animate={{ scale: 1, color: 'currentColor' }}
                transition={{ duration: 0.4 }}
                className="text-3xl font-black tabular-nums leading-none"
              >
                {weekPts}
              </motion.span>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Level badge */}
        <div
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-black text-white"
          style={{ backgroundColor: kid.color }}
        >
          {level.label}
        </div>
      </div>

      {/* Progress to next level */}
      <div className="space-y-1.5">
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: kid.color }}
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">
            {level.nextAt
              ? `${weekPts} / ${level.nextAt} pts to ${getPointsLevel(level.nextAt).emoji} ${getPointsLevel(level.nextAt).label}`
              : '🏆 Maximum level reached!'}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: kid.color }}>
            {Math.floor(barPct)}%
          </span>
        </div>
      </div>

      {/* Today's breakdown */}
      <div
        className="rounded-2xl p-3"
        style={{ backgroundColor: `${kid.color}10` }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Today's points
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <BreakdownItem
            emoji="🦷"
            label="Brushing"
            pts={todayPts.brushPoints}
            color={kid.color}
          />
          {todayPts.bonusPoints > 0 && (
            <BreakdownItem
              emoji="⭐"
              label="3-min bonus"
              pts={todayPts.bonusPoints}
              color={kid.color}
            />
          )}
          {todayPts.taskPoints > 0 && (
            <BreakdownItem
              emoji="✅"
              label="Tasks"
              pts={todayPts.taskPoints}
              color={kid.color}
            />
          )}
          {todayPts.perfectBonus > 0 && (
            <BreakdownItem
              emoji="🌟"
              label="Perfect day!"
              pts={todayPts.perfectBonus}
              color={kid.color}
            />
          )}
          {todayPts.total === 0 && (
            <p className="text-xs text-muted-foreground font-semibold">
              Start brushing to earn points today!
            </p>
          )}
        </div>
        {todayPts.total > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Today total</span>
            <span className="text-sm font-black" style={{ color: kid.color }}>
              {todayPts.total} pts ⭐
            </span>
          </div>
        )}
      </div>

      {/* Points guide */}
      <div className="rounded-2xl border border-dashed p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          How to earn more
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <GuideRow emoji="🦷" label="2-min brush" pts={POINT_VALUES.brush} />
          <GuideRow emoji="⭐" label="3-min brush" pts={POINT_VALUES.brush + POINT_VALUES.bonus3min} />
          <GuideRow emoji="🧵" label="Floss"        pts={POINT_VALUES.floss} />
          <GuideRow emoji="🪥" label="Tooth cream"  pts={POINT_VALUES.toothCream} />
          <GuideRow emoji="✅" label="Other tasks"  pts={POINT_VALUES.task} />
          <GuideRow emoji="🌟" label="Perfect day"  pts={POINT_VALUES.perfectDay} bonus />
        </div>
      </div>
    </div>
  );
}

function BreakdownItem({ emoji, label, pts, color }: { emoji: string; label: string; pts: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-xs font-black" style={{ color }}>{pts}</span>
    </div>
  );
}

function GuideRow({ emoji, label, pts, bonus }: { emoji: string; label: string; pts: number; bonus?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm leading-none">{emoji}</span>
      <span className="text-[11px] font-semibold text-muted-foreground flex-1 truncate">{label}</span>
      <span className="text-[11px] font-black text-foreground tabular-nums">
        {bonus ? '+' : ''}{pts} pts
      </span>
    </div>
  );
}
