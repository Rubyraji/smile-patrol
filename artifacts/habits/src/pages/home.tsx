import { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useKidsContext as useKids } from '@/lib/kids-context';
import {
  getWeekDays,
  getStreak,
  getFamilyStreak,
  getWeekStartKey,
  getWeekReward,
  isWeekComplete,
  getWeekProgress,
  type Reward,
} from '@/lib/store';
import { WeekGrid } from '@/components/week-grid';
import { TaskWeekGrid } from '@/components/task-week-grid';
import { KidSwitcher } from '@/components/kid-switcher';
import { RewardCard } from '@/components/reward-card';
import { StickerCollection } from '@/components/sticker-collection';
import { PetCard } from '@/components/pet-card';
import { RewardCelebration } from '@/components/reward-celebration';
import { TodayChecklist } from '@/components/today-checklist';
import { MissedYesterdayBanner } from '@/components/missed-yesterday-banner';
import { PointsCard } from '@/components/points-card';
import { FunFactCard } from '@/components/fun-fact-card';
import { Button } from '@/components/ui/button';
import { type Session } from '@/lib/store';

export default function Home() {
  const {
    kids,
    activeKid,
    activeId,
    setActiveId,
    toggleSession,
    addKid,
    unlockWeekReward,
    toggleTaskCompletion,
    assignNewPet,
    namePet,
    checkPetDeath,
  } = useKids();
  const weekDays = getWeekDays();
  const weekStartKey = getWeekStartKey();

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

  const progress = getWeekProgress(activeKid, weekDays);
  const streak = getStreak(activeKid);
  const familyStreak = getFamilyStreak(kids);

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
              <h1 className="text-4xl font-black flex items-center gap-2.5 leading-none mb-0.5">
                <span className="relative inline-flex items-center justify-center w-10 h-10 shrink-0">
                  {/* Molar SVG — wide crown with 4 cusps + two diverging roots */}
                  <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer molar shape: wide crown, four cusps on top, two roots */}
                    <path
                      d="
                        M7 30 C6 24 6 18 7 14 C8 10 10 7 12 7 C13 6 15 6 16 8 C17 10 18 11 20 11
                        C22 11 23 10 24 8 C25 6 27 6 28 8 C29 10 30 11 32 11
                        C34 11 35 10 36 8 C37 6 39 7 40 9 C41 11 42 15 42 18
                        C42 22 41 26 41 30
                        L36 30 C36 34 37 38 37 42 C37 44 35 44 34 42 C33 40 32 36 30 32
                        L28 32 C28 33 26 34 24 34 C22 34 20 33 20 32
                        L18 32 C16 36 15 40 14 42 C13 44 11 44 11 42 C11 38 12 34 12 30
                        Z
                      "
                      fill="white"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* Central occlusal fissure */}
                    <path
                      d="M16 20 C18 22 20 21 24 22 C28 23 30 21 32 20"
                      stroke="#DDE3EC"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Crown highlight */}
                    <path
                      d="M10 13 C12 11 16 11 18 13"
                      stroke="#F1F5F9"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Sparkles */}
                  <motion.span
                    className="absolute text-[10px] leading-none select-none"
                    style={{ top: -2, right: -1 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 20, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                  >✦</motion.span>
                  <motion.span
                    className="absolute text-[8px] leading-none select-none"
                    style={{ top: 3, left: -2 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], rotate: [0, -15, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.45 }}
                  >✦</motion.span>
                  <motion.span
                    className="absolute text-[7px] leading-none select-none"
                    style={{ bottom: 4, right: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.3, 1.1, 0.3] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: 0.9 }}
                  >✦</motion.span>
                  <motion.span
                    className="absolute text-[6px] leading-none select-none"
                    style={{ bottom: 1, left: 1 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: 1.3 }}
                  >✦</motion.span>
                </span>
                <span>Toothbrush Hero</span>
              </h1>
              <p className="text-sm font-semibold text-muted-foreground pl-1">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
            </div>
          </div>
          <KidSwitcher kids={kids} activeId={activeId} onSelect={setActiveId} />
        </div>
      </header>

      <main className="px-5 max-w-md mx-auto space-y-5">
        {/* Slim hero — kid greeting + streak */}
        <div
          className="rounded-3xl p-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${activeKid.color}33, ${activeKid.color}11)`,
            border: `1.5px solid ${activeKid.color}55`,
          }}
        >
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
              className="text-3xl w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: activeKid.color }}
            >
              {activeKid.emoji}
            </motion.span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Hi there!</p>
              <h2 className="text-2xl font-bold truncate leading-tight" data-testid="active-kid-name">
                {activeKid.name}
              </h2>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
              <div
                className="flex items-center gap-1 text-orange-500 font-bold text-xl"
                data-testid="streak-count"
              >
                <Flame className="h-6 w-6 fill-orange-400" />
                {streak}
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                day streak
              </span>
            </div>
          </div>
        </div>

        {/* Family streak — shown when there are 2+ kids */}
        {kids.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-3 rounded-2xl bg-card border px-4 py-3"
            data-testid="family-streak-banner"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-orange-500 fill-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground leading-none mb-0.5">
                Family streak
              </p>
              <p className="text-sm font-bold leading-none">
                {familyStreak === 0 ? (
                  <span className="text-muted-foreground font-medium">
                    Complete everyone's goals today to start one!
                  </span>
                ) : (
                  <>
                    <span className="text-orange-500 text-base">{familyStreak}</span>
                    <span className="text-muted-foreground font-medium ml-1">
                      {familyStreak === 1 ? 'day — keep it up!' : 'days in a row — amazing!'}
                    </span>
                  </>
                )}
              </p>
            </div>
            {familyStreak >= 3 && (
              <span className="text-xl shrink-0" aria-hidden>
                {familyStreak >= 14 ? '🏆' : familyStreak >= 7 ? '🌟' : '🔥'}
              </span>
            )}
          </motion.div>
        )}

        {/* Missed-yesterday catch-up banner */}
        <MissedYesterdayBanner
          kid={activeKid}
          onMarkBrush={(dateStr, session: Session) =>
            toggleSession(activeKid.id, dateStr, session)
          }
          onMarkTask={(taskId, dateStr) =>
            toggleTaskCompletion(activeKid.id, taskId, dateStr)
          }
        />

        {/* TODAY — primary kid surface */}
        <TodayChecklist
          kid={activeKid}
          onToggleTask={(taskId, dateStr) =>
            toggleTaskCompletion(activeKid.id, taskId, dateStr)
          }
        />

        {/* Daily fun fact */}
        <FunFactCard kid={activeKid} />

        {/* Points */}
        <PointsCard kid={activeKid} />

        {/* Weekly reward */}
        <RewardCard
          kid={activeKid}
          weekCount={progress.totalDone}
          weekTotal={progress.totalGoal}
          reward={currentWeekReward}
          onClaim={handleClaim}
        />

        {/* Virtual pet */}
        <PetCard
          kid={activeKid}
          onAssign={assignNewPet}
          onName={namePet}
          onCheckDeath={checkPetDeath}
        />

        {/* Weekly reward sticker collection */}
        <StickerCollection rewards={activeKid.rewards} color={activeKid.color} />

        {/* Parent view — week grid (smaller, subdued) */}
        <details className="rounded-2xl border bg-card overflow-hidden group">
          <summary className="px-4 py-3 cursor-pointer list-none flex items-center justify-between font-semibold text-sm text-muted-foreground hover:bg-muted/40 transition">
            <span>This week's history</span>
            <span className="text-xs">
              {progress.brushDone} / {progress.brushTotal} brushes
              <span className="ml-2 inline-block group-open:rotate-180 transition-transform">
                ▾
              </span>
            </span>
          </summary>
          <div className="px-4 pb-4 pt-1 space-y-4">
            <WeekGrid kid={activeKid} onToggle={(d, s) => toggleSession(activeKid.id, d, s)} />
            {activeKid.tasks.length > 0 && (
              <TaskWeekGrid
                kid={activeKid}
                onToggle={(taskId, dateStr) =>
                  toggleTaskCompletion(activeKid.id, taskId, dateStr)
                }
              />
            )}
            <p className="text-[11px] text-muted-foreground text-center">
              Tap any cell to mark or unmark.
            </p>
          </div>
        </details>
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
