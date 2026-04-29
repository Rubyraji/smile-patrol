import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Sparkles, Flame, Play } from 'lucide-react';
import { format } from 'date-fns';
import {
  useKids,
  getCurrentSession,
  getWeekDays,
  countWeekBrushings,
  getStreak,
  getWeekStartKey,
  getWeekReward,
  isWeekComplete,
  type Reward,
} from '@/lib/store';
import { WeekGrid } from '@/components/week-grid';
import { KidSwitcher } from '@/components/kid-switcher';
import { RewardCard } from '@/components/reward-card';
import { StickerCollection } from '@/components/sticker-collection';
import { RewardCelebration } from '@/components/reward-celebration';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { kids, activeKid, activeId, setActiveId, toggleSession, addKid, unlockWeekReward } =
    useKids();
  const weekDays = getWeekDays();
  const weekStartKey = getWeekStartKey();
  const session = getCurrentSession();

  const [celebration, setCelebration] = useState<Reward | null>(null);
  const lastClaimedRef = useRef<Set<string>>(new Set());

  // Auto-celebrate any newly unlocked week rewards
  useEffect(() => {
    if (!activeKid) return;
    const r = getWeekReward(activeKid, weekStartKey);
    if (r) {
      const key = `${activeKid.id}:${r.weekStart}`;
      if (!lastClaimedRef.current.has(key)) {
        lastClaimedRef.current.add(key);
      }
    }
  }, [activeKid, weekStartKey]);

  if (kids.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pb-24">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🪥</div>
          <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
          <p className="text-muted-foreground mb-6">
            Let's add your first little brusher to get started.
          </p>
          <Button
            size="lg"
            onClick={() => addKid('Kiddo')}
            data-testid="empty-add-kid"
            className="rounded-full"
          >
            Add a kid
          </Button>
        </div>
      </div>
    );
  }

  if (!activeKid) return null;

  const weekCount = countWeekBrushings(activeKid, weekDays);
  const weekTotal = 14;
  const streak = getStreak(activeKid);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayRec = activeKid.brushings[today] ?? {};
  const sessionDone = !!todayRec[session];

  const currentWeekReward = getWeekReward(activeKid, weekStartKey);
  const weekDone = isWeekComplete(activeKid, weekDays);

  const handleClaim = () => {
    if (!activeKid) return;
    const newReward = unlockWeekReward(activeKid.id, weekStartKey);
    if (newReward) {
      setCelebration(newReward);
      lastClaimedRef.current.add(`${activeKid.id}:${newReward.weekStart}`);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-background/85 backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🪥</span>
                <span>Brush Buddies</span>
              </h1>
            </div>
          </div>
          <KidSwitcher kids={kids} activeId={activeId} onSelect={setActiveId} />
        </div>
      </header>

      <main className="px-5 max-w-md mx-auto space-y-5">
        {/* Hero card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${activeKid.color}33, ${activeKid.color}11)`,
            border: `1.5px solid ${activeKid.color}55`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-2xl w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: activeKid.color }}
                >
                  {activeKid.emoji}
                </span>
                <h2 className="text-xl font-bold truncate" data-testid="active-kid-name">
                  {activeKid.name}
                </h2>
              </div>
              <p className="text-sm text-foreground/80">
                {sessionDone
                  ? `Great job! ${session === 'morning' ? 'Morning' : 'Evening'} brush is done. ✨`
                  : `Time for ${session === 'morning' ? 'morning' : 'evening'} brushing!`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div
                className="flex items-center gap-1 text-orange-500 font-bold text-lg"
                data-testid="streak-count"
              >
                <Flame className="h-5 w-5 fill-orange-400" />
                {streak}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                day streak
              </span>
            </div>
          </div>

          <Link href="/brush">
            <Button
              size="lg"
              data-testid="start-brushing-button"
              className="w-full mt-5 rounded-2xl h-14 text-base font-bold shadow-md gap-2"
              style={{ backgroundColor: activeKid.color, color: '#fff' }}
            >
              <Play className="h-5 w-5 fill-white" />
              Start Brushing
            </Button>
          </Link>
        </div>

        {/* Weekly reward */}
        <RewardCard
          kid={activeKid}
          weekCount={weekCount}
          weekTotal={weekTotal}
          reward={currentWeekReward}
          onClaim={handleClaim}
        />

        {/* Week progress grid */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              This week
            </h3>
            <span
              className="text-sm font-semibold text-muted-foreground"
              data-testid="week-progress-text"
            >
              {weekCount} / {weekTotal} brushes
            </span>
          </div>
          <WeekGrid kid={activeKid} onToggle={(d, s) => toggleSession(activeKid.id, d, s)} />
          <p className="text-xs text-muted-foreground text-center mt-3">
            Tap any cell to mark a brush manually.
          </p>
        </section>

        {/* Sticker collection */}
        <StickerCollection rewards={activeKid.rewards} color={activeKid.color} />
      </main>

      <RewardCelebration
        reward={celebration}
        kidName={activeKid.name}
        kidColor={activeKid.color}
        onClose={() => setCelebration(null)}
      />

      {/* Hint to keep parents informed when ready to claim but not yet claimed */}
      {weekDone && !currentWeekReward && (
        <div className="sr-only" aria-live="polite">
          Reward ready to claim
        </div>
      )}
    </div>
  );
}
