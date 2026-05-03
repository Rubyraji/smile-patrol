import { useMemo, useState } from 'react';
// useMemo is used in both PointsLeaderboard and the page component
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Flame, Award } from 'lucide-react';
import { useKidsContext as useKids } from '@/lib/kids-context';
import { CertificateModal } from '@/components/certificate-modal';
import {
  getWeekDays,
  getWeekProgress,
  getWeeklyPoints,
  getPointsLevel,
  getPetHappiness,
  getStreak,
  PET_SPECIES_LIST,
  type Kid,
} from '@/lib/store';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function MiniWeekGrid({ kid, weekDays }: { kid: Kid; weekDays: Date[] }) {
  return (
    <div className="flex gap-1.5">
      {weekDays.map((day, i) => {
        const key = format(day, 'yyyy-MM-dd');
        const rec = kid.brushings[key] ?? {};
        const am = !!rec.morning;
        const pm = !!rec.afternoon;
        const isToday = key === format(new Date(), 'yyyy-MM-dd');
        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'text-[9px] font-bold uppercase leading-none',
                isToday ? 'text-primary' : 'text-muted-foreground/50',
              )}
            >
              {DAY_LABELS[i]}
            </span>
            {/* AM dot */}
            <div
              className={cn(
                'w-3.5 h-3.5 rounded-full transition-colors',
                am
                  ? 'bg-primary'
                  : isToday
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-muted',
              )}
            />
            {/* PM dot */}
            <div
              className={cn(
                'w-3.5 h-3.5 rounded-full transition-colors',
                pm
                  ? 'bg-primary'
                  : isToday
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-muted',
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

function HeartRow({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn('text-sm leading-none', i < filled ? 'opacity-100' : 'opacity-20')}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color ?? 'hsl(var(--primary))' }}
      />
    </div>
  );
}

// ── Points leaderboard ────────────────────────────────────────────────────────

function PointsLeaderboard({ kids, weekDays }: { kids: Kid[]; weekDays: Date[] }) {
  const ranked = useMemo(() => {
    return [...kids]
      .map((kid) => ({ kid, pts: getWeeklyPoints(kid, weekDays) }))
      .sort((a, b) => b.pts - a.pts);
  }, [kids, weekDays]);

  const topPts = ranked[0]?.pts ?? 1;

  return (
    <div className="bg-card rounded-3xl border-2 border-amber-200 p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none">
            Points leaderboard
          </p>
          <p className="text-[11px] text-muted-foreground font-semibold">This week</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {ranked.map(({ kid, pts }, i) => {
          const level = getPointsLevel(pts);
          const barPct = topPts === 0 ? 0 : Math.round((pts / topPts) * 100);
          const isLeader = i === 0 && pts > 0;
          return (
            <div key={kid.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                {/* Rank / crown */}
                <span className="text-base leading-none w-5 shrink-0 text-center">
                  {isLeader ? '👑' : `${i + 1}.`}
                </span>
                {/* Kid avatar */}
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: kid.color }}
                >
                  {kid.emoji}
                </div>
                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black truncate">{kid.name}</span>
                  <span
                    className="ml-1.5 text-[10px] font-bold"
                    style={{ color: kid.color }}
                  >
                    {level.emoji} {level.label}
                  </span>
                </div>
                {/* Points */}
                <span
                  className="text-sm font-black tabular-nums shrink-0"
                  style={{ color: kid.color }}
                >
                  {pts} pts
                </span>
              </div>
              {/* Bar */}
              <div className="ml-7 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: isLeader ? '#F59E0B' : kid.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {ranked.every(({ pts }) => pts === 0) && (
        <p className="text-center text-xs text-muted-foreground font-semibold pt-1">
          Start brushing to get on the board! 🦷
        </p>
      )}
    </div>
  );
}

// ── Per-kid summary card ──────────────────────────────────────────────────────

function KidSummaryCard({
  kid,
  weekDays,
  onCertificate,
}: {
  kid: Kid;
  weekDays: Date[];
  onCertificate: () => void;
}) {
  const progress = getWeekProgress(kid, weekDays);
  const weekPts  = getWeeklyPoints(kid, weekDays);
  const level    = getPointsLevel(weekPts);
  const streak = getStreak(kid);
  const petHappiness = getPetHappiness(kid, weekDays);
  const petInfo = kid.pet
    ? PET_SPECIES_LIST.find((s) => s.key === kid.pet!.species) ?? null
    : null;

  const brushPct = Math.round((progress.brushDone / progress.brushTotal) * 100);

  return (
    <div
      className="bg-card rounded-3xl border-2 p-5 space-y-4 shadow-sm"
      style={{ borderColor: `${kid.color}55` }}
    >
      {/* ── Kid header ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
          style={{ backgroundColor: kid.color }}
        >
          {kid.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-black leading-none truncate">{kid.name}</p>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Age {kid.age ?? '?'} · {kid.tasks.length} extra{kid.tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Streak badge */}
        <div
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl shrink-0"
          style={{ backgroundColor: streak > 0 ? '#FF6B3520' : 'hsl(var(--muted))' }}
        >
          <Flame
            className="h-4 w-4"
            style={{ color: streak > 0 ? '#FF6B35' : 'hsl(var(--muted-foreground))' }}
          />
          <span
            className="text-sm font-black"
            style={{ color: streak > 0 ? '#FF6B35' : 'hsl(var(--muted-foreground))' }}
          >
            {streak}
          </span>
        </div>
        {/* Certificate button */}
        <button
          type="button"
          onClick={onCertificate}
          title="Print certificate"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 shrink-0"
          style={{ backgroundColor: `${kid.color}22`, color: kid.color }}
        >
          <Award className="h-4 w-4" />
        </button>
      </div>

      {/* ── Points badge row ────────────────────────── */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2"
        style={{ backgroundColor: `${kid.color}12` }}
      >
        <span className="text-base leading-none">{level.emoji}</span>
        <span className="text-xs font-black" style={{ color: kid.color }}>
          {level.label}
        </span>
        <span className="text-xs text-muted-foreground font-semibold flex-1">
          · {weekPts} pts this week
        </span>
        {level.nextAt && (
          <span className="text-[10px] font-bold text-muted-foreground">
            {level.nextAt - weekPts} to next level
          </span>
        )}
      </div>

      {/* ── Mini week grid ──────────────────────────── */}
      <MiniWeekGrid kid={kid} weekDays={weekDays} />

      {/* ── Progress bars ───────────────────────────── */}
      <div className="space-y-2.5">
        {/* Brushing */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Brushing this week</span>
            <span className="text-xs font-black" style={{ color: kid.color }}>
              {progress.brushDone}/{progress.brushTotal}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ProgressBar value={progress.brushDone} max={progress.brushTotal} color={kid.color} />
            <span className="text-xs font-bold text-muted-foreground w-8 text-right shrink-0">
              {brushPct}%
            </span>
          </div>
        </div>

        {/* Tasks — only if kid has tasks */}
        {progress.tasksTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Daily extras</span>
              <span className="text-xs font-black text-muted-foreground">
                {progress.tasksDone}/{progress.tasksTotal}
              </span>
            </div>
            <ProgressBar
              value={progress.tasksDone}
              max={progress.tasksTotal}
              color={`${kid.color}cc`}
            />
          </div>
        )}
      </div>

      {/* ── Pet section ─────────────────────────────── */}
      {kid.pet ? (
        <div
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
          style={{ backgroundColor: `${petInfo?.color ?? kid.color}18` }}
        >
          <span className="text-2xl leading-none">
            {kid.pet.hatched ? petInfo?.emoji ?? '🐾' : '🥚'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black leading-none truncate">
              {kid.pet.name || petInfo?.defaultName}
              {!kid.pet.hatched && (
                <span className="text-muted-foreground font-semibold"> · egg</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground font-semibold">
              {petInfo?.label} · Gen {kid.pet.generation + 1}
            </p>
          </div>
          <div className="shrink-0">
            <HeartRow filled={petHappiness} />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 bg-muted/60">
          <span className="text-xl">🪺</span>
          <p className="text-xs font-semibold text-muted-foreground">
            No pet yet — complete a 3-min brush to unlock one!
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Family() {
  const { kids } = useKids();
  const [certKid, setCertKid] = useState<Kid | null>(null);

  const weekDays = useMemo(() => {
    const today = new Date();
    return getWeekDays(today);
  }, []);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;

  // Family-wide totals
  const totals = useMemo(() => {
    let brushDone = 0;
    let brushTotal = 0;
    for (const kid of kids) {
      const p = getWeekProgress(kid, weekDays);
      brushDone += p.brushDone;
      brushTotal += p.brushTotal;
    }
    return { brushDone, brushTotal };
  }, [kids, weekDays]);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-background/85 backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-black flex items-center gap-2.5 leading-none mb-0.5">
            <span>📋</span>
            <span>Family</span>
          </h1>
          <p className="text-sm font-semibold text-muted-foreground pl-1">{weekLabel}</p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 space-y-4">
        {/* ── Family-wide summary strip ────────────────────────────── */}
        {kids.length > 1 && (
          <div className="bg-primary/8 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">👪</span>
            <div className="flex-1">
              <p className="text-sm font-black">
                {totals.brushDone} of {totals.brushTotal} family brushes done
              </p>
              <div className="flex items-center gap-2 mt-1">
                <ProgressBar value={totals.brushDone} max={totals.brushTotal} />
                <span className="text-xs font-bold text-muted-foreground w-8 text-right shrink-0">
                  {totals.brushTotal === 0
                    ? '0%'
                    : `${Math.round((totals.brushDone / totals.brushTotal) * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Points leaderboard (2+ kids only) ───────────────────── */}
        {kids.length > 1 && (
          <PointsLeaderboard kids={kids} weekDays={weekDays} />
        )}

        {/* ── Per-kid cards ────────────────────────────────────────── */}
        {kids.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-5xl">👶</p>
            <p className="font-bold text-muted-foreground">No kids added yet.</p>
            <p className="text-sm text-muted-foreground">Add a child in the Kids tab to get started.</p>
          </div>
        ) : (
          kids.map((kid) => (
            <KidSummaryCard
              key={kid.id}
              kid={kid}
              weekDays={weekDays}
              onCertificate={() => setCertKid(kid)}
            />
          ))
        )}

        {/* ── Legend ──────────────────────────────────────────────── */}
        {kids.length > 0 && (
          <div className="flex items-center gap-4 justify-center pt-1 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold text-muted-foreground">Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-[11px] font-semibold text-muted-foreground">Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <span className="text-[11px] font-semibold text-muted-foreground">
                Top row = morning · Bottom = evening
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Certificate modal ────────────────────────────────────────── */}
      {certKid && (
        <CertificateModal kid={certKid} onClose={() => setCertKid(null)} />
      )}
    </div>
  );
}
