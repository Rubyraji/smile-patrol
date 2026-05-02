import { useState } from 'react';
import { Link } from 'wouter';
import { Check, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { type Kid } from '@/lib/store';
import { cn } from '@/lib/utils';

type Goal = {
  id: string;
  emoji: string;
  label: string;
  hint: string;
  done: boolean;
  kind: 'brush' | 'task';
};

interface Props {
  kid: Kid;
  onToggleTask: (taskId: string, date: string) => void;
}

export function TodayChecklist({ kid, onToggleTask }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const brushings = kid.brushings[today] ?? {};
  const taskComps = kid.taskCompletions[today] ?? {};

  const anytimeTasks = kid.tasks.filter((t) => t.time !== 'night');
  const nightTasks = kid.tasks.filter((t) => t.time === 'night');

  const taskToGoal = (t: (typeof kid.tasks)[number], hint: string): Goal => ({
    id: `task-${t.id}`,
    emoji: t.emoji,
    label: t.name,
    hint,
    done: !!taskComps[t.id],
    kind: 'task',
  });

  const goals: Goal[] = [
    {
      id: 'morning',
      emoji: '☀️',
      label: 'Morning brush',
      hint: 'Tap to start the timer',
      done: !!brushings.morning,
      kind: 'brush',
    },
    ...anytimeTasks.map((t) => taskToGoal(t, 'Tap when finished')),
    {
      id: 'evening',
      emoji: '🌙',
      label: 'Bedtime brush',
      hint: 'Tap to start the timer',
      done: !!brushings.afternoon,
      kind: 'brush',
    },
    ...nightTasks.map((t) => taskToGoal(t, 'Do this right after the bedtime brush')),
  ];

  const doneCount = goals.filter((g) => g.done).length;
  const allDone = doneCount === goals.length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-2xl font-black flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <span>Today</span>
        </h3>
        <span
          className="text-sm font-extrabold px-3 py-1 rounded-full"
          style={{
            backgroundColor: allDone ? `${kid.color}22` : 'hsl(var(--muted))',
            color: allDone ? kid.color : 'hsl(var(--muted-foreground))',
          }}
          data-testid="today-progress"
        >
          {doneCount} / {goals.length} done
        </span>
      </div>

      <div className="space-y-2.5">
        {goals.map((g) =>
          g.kind === 'brush' ? (
            <BrushGoalCard key={g.id} goal={g} kidColor={kid.color} />
          ) : (
            <TaskGoalCard
              key={g.id}
              goal={g}
              kidColor={kid.color}
              onToggle={() => {
                const taskId = g.id.replace(/^task-/, '');
                onToggleTask(taskId, today);
              }}
            />
          ),
        )}
      </div>

      {allDone && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm font-bold mt-4"
          style={{ color: kid.color }}
        >
          <Sparkles className="inline h-4 w-4 mr-1" />
          All done for today! See you tomorrow!
        </motion.p>
      )}
    </section>
  );
}

function GoalCardInner({
  goal,
  kidColor,
  popKey,
}: {
  goal: Goal;
  kidColor: string;
  popKey: number;
}) {
  return (
    <div
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors',
        goal.done ? '' : 'bg-card',
      )}
      style={
        goal.done
          ? {
              borderColor: `${kidColor}66`,
              backgroundColor: `${kidColor}1f`,
            }
          : { borderColor: 'var(--border)' }
      }
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 relative overflow-hidden"
        style={{ backgroundColor: goal.done ? kidColor : `${kidColor}22` }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {goal.done ? (
            <motion.div
              key={`done-${popKey}`}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="h-9 w-9 text-white" strokeWidth={4} />
            </motion.div>
          ) : (
            <motion.span
              key="emoji"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center text-3xl"
            >
              {goal.emoji}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            'text-lg font-bold leading-tight',
            goal.done && 'line-through opacity-60',
          )}
        >
          {goal.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {goal.done ? 'Yay! All done 🎉' : goal.hint}
        </p>
      </div>

      <div
        className={cn(
          'w-9 h-9 rounded-full border-[3px] shrink-0 flex items-center justify-center transition',
        )}
        style={
          goal.done
            ? { backgroundColor: kidColor, borderColor: kidColor }
            : { borderColor: `${kidColor}66` }
        }
      >
        {goal.done && <Check className="h-5 w-5 text-white" strokeWidth={4} />}
      </div>
    </div>
  );
}

function BrushGoalCard({ goal, kidColor }: { goal: Goal; kidColor: string }) {
  const [pop, setPop] = useState(0);
  return (
    <motion.div whileTap={{ scale: 0.97 }}>
      <Link
        href="/brush"
        data-testid={`today-goal-${goal.id}`}
        className="block"
        onClick={() => setPop((p) => p + 1)}
      >
        <GoalCardInner goal={goal} kidColor={kidColor} popKey={pop} />
      </Link>
    </motion.div>
  );
}

function TaskGoalCard({
  goal,
  kidColor,
  onToggle,
}: {
  goal: Goal;
  kidColor: string;
  onToggle: () => void;
}) {
  const [pop, setPop] = useState(0);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        setPop((p) => p + 1);
        onToggle();
      }}
      data-testid={`today-goal-${goal.id}`}
      className="block w-full"
    >
      <GoalCardInner goal={goal} kidColor={kidColor} popKey={pop} />
    </motion.button>
  );
}
