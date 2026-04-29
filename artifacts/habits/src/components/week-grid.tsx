import { format, isSameDay, isAfter } from 'date-fns';
import { Sun, Moon, Check } from 'lucide-react';
import { type Kid, type Session, getWeekDays } from '@/lib/store';
import { cn } from '@/lib/utils';

type Props = {
  kid: Kid;
  onToggle: (dateStr: string, session: Session) => void;
};

export function WeekGrid({ kid, onToggle }: Props) {
  const days = getWeekDays();
  const today = new Date();

  return (
    <div className="rounded-3xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 sm:gap-x-4 gap-y-1 items-center">
        <div />
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2">
          <Sun className="h-3.5 w-3.5" />
          AM
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2">
          <Moon className="h-3.5 w-3.5" />
          PM
        </div>

        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const rec = kid.brushings[key] ?? {};
          const isToday = isSameDay(d, today);
          const isFuture = isAfter(d, today) && !isToday;
          const dayLabel = format(d, 'EEE');
          const dayNum = format(d, 'd');

          return (
            <DayRow
              key={key}
              dayLabel={dayLabel}
              dayNum={dayNum}
              isToday={isToday}
              isFuture={isFuture}
              morning={!!rec.morning}
              afternoon={!!rec.afternoon}
              color={kid.color}
              onMorning={() => onToggle(key, 'morning')}
              onAfternoon={() => onToggle(key, 'afternoon')}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayRow({
  dayLabel,
  dayNum,
  isToday,
  isFuture,
  morning,
  afternoon,
  color,
  onMorning,
  onAfternoon,
}: {
  dayLabel: string;
  dayNum: string;
  isToday: boolean;
  isFuture: boolean;
  morning: boolean;
  afternoon: boolean;
  color: string;
  onMorning: () => void;
  onAfternoon: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 py-2 pr-2',
          isFuture && 'opacity-50'
        )}
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center w-11 h-11 rounded-2xl',
            isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          <span className="text-[10px] font-semibold uppercase leading-none">{dayLabel}</span>
          <span className="text-base font-bold leading-tight">{dayNum}</span>
        </div>
      </div>
      <CheckCell checked={morning} disabled={isFuture} onClick={onMorning} color={color} />
      <CheckCell checked={afternoon} disabled={isFuture} onClick={onAfternoon} color={color} />
    </>
  );
}

function CheckCell({
  checked,
  disabled,
  onClick,
  color,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      data-testid={`brush-check-${checked ? 'on' : 'off'}`}
      className={cn(
        'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all',
        'border-2',
        checked
          ? 'shadow-sm scale-100'
          : 'bg-background border-dashed border-border hover:border-foreground/30 active:scale-95',
        disabled && 'cursor-not-allowed opacity-40'
      )}
      style={
        checked
          ? { backgroundColor: color, borderColor: color }
          : undefined
      }
    >
      {checked && <Check className="h-6 w-6 text-white" strokeWidth={3} />}
    </button>
  );
}
