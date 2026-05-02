import { Link, useLocation } from 'wouter';
import { Home as HomeIcon, Timer, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const [location] = useLocation();

  // Hide nav on the brush page (full-focus timer screen)
  if (location === '/brush') return null;

  const items = [
    { href: '/', label: 'Home', icon: HomeIcon, match: (p: string) => p === '/' },
    { href: '/brush', label: 'Brush', icon: Timer, match: (p: string) => p === '/brush' },
    { href: '/kids', label: 'Kids', icon: Users, match: (p: string) => p === '/kids' },
    { href: '/settings', label: 'Settings', icon: Settings, match: (p: string) => p === '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/85 backdrop-blur-md pb-safe z-20">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(location);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-full transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={cn('h-5 w-5 mb-1', active && 'fill-primary/20')} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
