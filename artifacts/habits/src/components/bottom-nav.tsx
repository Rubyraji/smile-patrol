import { Link, useLocation } from 'wouter';
import { Home as HomeIcon, Timer, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    emoji: '🏠',
    match: (p: string) => p === '/',
  },
  {
    href: '/brush',
    label: 'Brush',
    icon: Timer,
    emoji: '🦷',
    match: (p: string) => p === '/brush',
  },
  {
    href: '/kids',
    label: 'Kids',
    icon: Users,
    emoji: '👦',
    match: (p: string) => p === '/kids',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    emoji: '⚙️',
    match: (p: string) => p === '/settings',
  },
];

export function BottomNav() {
  const [location] = useLocation();

  if (location === '/brush') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 pb-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="max-w-md mx-auto px-4 pb-2">
        <div
          className="bg-card rounded-3xl border shadow-md flex items-stretch justify-around px-1 h-[62px]"
          style={{ boxShadow: '0 4px 20px rgba(80,60,140,0.12)' }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.match(location);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className="flex flex-col items-center justify-center flex-1 gap-0.5 py-1.5 transition-opacity active:opacity-70"
                aria-label={item.label}
              >
                <div
                  className={cn(
                    'w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200',
                    active
                      ? 'bg-primary/15 scale-105'
                      : 'scale-100',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[22px] w-[22px] transition-colors duration-200',
                      active ? 'text-primary' : 'text-muted-foreground/70',
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    'text-[11px] font-bold leading-none transition-colors duration-200',
                    active ? 'text-primary' : 'text-muted-foreground/60',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
