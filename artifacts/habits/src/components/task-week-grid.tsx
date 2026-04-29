import { format, isSameDay, isAfter } from 'date-fns';
import { Check, ListChecks } from 'lucide-react';
import { type Kid, getWeekDays, isTaskDone, countWeekTaskCompletions } from '@/lib/store';
import { cn } from '@/lib/utils';

type Props = {
  kid: Kid;
  onToggle: (taskId: string, dateStr: string) => void;
};

export function TaskWeekGrid({ kid, onToggle }: Props) {
  const days = getWeekDays();
  const today = new Date();

  if (kid.tasks.length === 0) return null;

  return (
    <div className="rounded-3xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Daily extras
        </h4>
      </div>

      {/* Day labels header */}
      <div className="grid grid-cols-[1fr_repeat(7,minmax(0,1fr))] gap-x-1.5 sm:gap-x-2 mb-2">
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                'text-center text-[10px] font-bold uppercase tracking-tight',
                isToday ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {format(d, 'EEEEE')}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {kid.tasks.map((task) => {
          const done = countWeekTaskCompletions(kid, task.id, days);
          return (
            <div
              key={task.id}
              className="grid grid-cols-[1fr_repeat(7,minmax(0,1fr))] gap-x-1.5 sm:gap-x-2 items-center"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="text-xl shrink-0">{task.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" data-testid={`task-name-${task.id}`}>
                    {task.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {done} / 7
                  </p>
                </div>
              </div>
              {days.map((d) => {
                const key = format(d, 'yyyy-MM-dd');
                const isToday = isSameDay(d, today);
                const isFuture = isAfter(d, today) && !isToday;
                const checked = isTaskDone(kid, task.id, key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggle(task.id, key)}
                    disabled={isFuture}
                    aria-pressed={checked}
                    data-testid={`task-cell-${task.id}-${key}`}
                    className={cn(
                      'aspect-square rounded-lg flex items-center justify-center transition-all border-2',
                      checked
                        ? 'shadow-sm'
                        : 'bg-background border-dashed border-border hover:border-foreground/30 active:scale-95',
                      isFuture && 'cursor-not-allowed opacity-40',
                      isToday && !checked && 'ring-2 ring-primary/30'
                    )}
                    style={
                      checked
                        ? { backgroundColor: kid.color, borderColor: kid.color }
                        : undefined
                    }
                  >
                    {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
