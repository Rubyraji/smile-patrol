import { Link } from 'wouter';
import { Plus } from 'lucide-react';
import { type Kid } from '@/lib/store';
import { cn } from '@/lib/utils';

type Props = {
  kids: Kid[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function KidSwitcher({ kids, activeId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
      {kids.map((k) => {
        const active = k.id === activeId;
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => onSelect(k.id)}
            data-testid={`kid-pill-${k.id}`}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border-2 transition-all whitespace-nowrap shrink-0 active:scale-95',
              active
                ? 'shadow-sm text-foreground'
                : 'bg-card text-muted-foreground border-transparent hover:text-foreground'
            )}
            style={
              active
                ? { borderColor: k.color, backgroundColor: `${k.color}22` }
                : undefined
            }
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-base"
              style={{ backgroundColor: k.color }}
            >
              {k.emoji}
            </span>
            <span className="text-sm font-semibold">{k.name}</span>
          </button>
        );
      })}
      <Link
        href="/kids"
        className="shrink-0 w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        data-testid="add-kid-button"
        aria-label="Manage kids"
      >
        <Plus className="h-4 w-4" />
      </Link>
    </div>
  );
}
