import { Link } from 'wouter';
import { ArrowLeft, Bell, BellOff, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useNotifications, notificationSupported } from '@/lib/notifications';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

function TimeInput({
  label,
  emoji,
  value,
  onChange,
  disabled,
}: {
  label: string;
  emoji: string;
  value: string;
  onChange: (t: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3 border-t',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border bg-muted/50 px-3 py-1.5 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label={`${label} reminder time`}
      />
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, permission, setEnabled, setMorningTime, setEveningTime } =
    useNotifications();

  const notifSupported = notificationSupported();
  const denied = permission === 'denied';

  return (
    <div className="min-h-screen pb-32 px-5 pt-4">
      <header className="flex items-center gap-3 mb-6 max-w-md mx-auto">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-muted active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="max-w-md mx-auto space-y-5">
        {/* Appearance */}
        <section className="rounded-2xl bg-card border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Appearance
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">Dark mode</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'On' : 'Off'}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              aria-label="Toggle dark mode"
            />
          </div>
        </section>

        {/* Reminders */}
        <section className="rounded-2xl bg-card border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Brush reminders
          </p>

          {!notifSupported && (
            <p className="text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2 mb-3">
              Your browser doesn't support notifications.
            </p>
          )}

          {denied && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 mb-3">
              Notifications are blocked. Allow them in your browser settings, then come back here.
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {settings.enabled ? (
                  <Bell className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">Daily reminders</p>
                <p className="text-xs text-muted-foreground">
                  {settings.enabled
                    ? 'Notifying at set times'
                    : 'Off — tap to enable'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => void setEnabled(v)}
              disabled={!notifSupported || denied}
              aria-label="Enable brush reminders"
              data-testid="reminders-switch"
            />
          </div>

          <TimeInput
            label="Morning brush"
            emoji="🌞"
            value={settings.morningTime}
            onChange={setMorningTime}
            disabled={!settings.enabled}
          />
          <TimeInput
            label="Bedtime brush"
            emoji="🌙"
            value={settings.eveningTime}
            onChange={setEveningTime}
            disabled={!settings.enabled}
          />

          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Reminders fire while this tab is open. For reliable notifications, keep the app pinned or add it to your home screen.
          </p>
        </section>
      </main>
    </div>
  );
}
