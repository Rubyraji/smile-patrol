import { useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  Copy,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useNotifications, notificationSupported } from '@/lib/notifications';
import { useFamilySync } from '@/lib/family-sync';
import { useKidsContext } from '@/lib/kids-context';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 bg-muted/60 border rounded-xl px-4 py-2.5 font-mono text-2xl font-bold tracking-[0.2em] hover:bg-muted transition active:scale-95"
      aria-label={`Copy family code ${code}`}
    >
      {code}
      {copied
        ? <Check className="h-4 w-4 text-green-500 shrink-0" />
        : <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
      }
    </button>
  );
}

type FamilyView = 'home' | 'creating' | 'joining';

function FamilySection() {
  const {
    familyCode,
    deviceName,
    isLinked,
    status,
    lastSyncAt,
    lastError,
    createFamily,
    joinFamily,
    leaveFamily,
    pushNow,
    setDeviceName,
  } = useFamilySync();
  const { kids } = useKidsContext();

  const [view, setView] = useState<FamilyView>('home');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(deviceName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    setBusy(true);
    try {
      await createFamily();
      setView('home');
    } catch {
      // fall through — show linked state on success, error toast on fail
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 6) {
      setJoinError('Enter the 6-character code from another device.');
      return;
    }
    setBusy(true);
    setJoinError('');
    try {
      await joinFamily(joinCode.trim());
      setView('home');
      setJoinCode('');
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Could not join — check the code.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveName = () => {
    const trimmed = draftName.trim() || deviceName;
    setDeviceName(trimmed);
    setDraftName(trimmed);
    setEditingName(false);
  };

  const fmtTime = (d: Date) => {
    const diff = Math.round((Date.now() - d.getTime()) / 1000);
    if (diff < 5)  return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    return `${m}m ago`;
  };

  if (!isLinked) {
    if (view === 'creating') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This creates a unique 6-character code. Share it with other family members to let them join on their device.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-xl"
              onClick={handleCreate}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create family'}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setView('home')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (view === 'joining') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter the 6-character code shown on another device in your family.
          </p>
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="font-mono text-lg uppercase tracking-widest rounded-xl text-center"
              aria-label="Family code"
              onKeyDown={(e) => e.key === 'Enter' && void handleJoin()}
            />
            <Button
              className="rounded-xl shrink-0"
              onClick={handleJoin}
              disabled={busy || joinCode.trim().length < 6}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setView('home'); setJoinError(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {joinError && (
            <p className="text-xs text-destructive">{joinError}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Share brushing progress across phones and tablets. Each device joins using a family code.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl gap-2"
            onClick={() => setView('creating')}
          >
            <Users className="h-4 w-4" />
            Create family
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setView('joining')}
          >
            Join family
          </Button>
        </div>
      </div>
    );
  }

  // ── Linked state ──────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Family code — share to invite a device</p>
          {familyCode && <CodeDisplay code={familyCode} />}
        </div>
      </div>

      {/* Device name */}
      <div className="border-t pt-3">
        <p className="text-xs text-muted-foreground mb-1.5">This device's name</p>
        {editingName ? (
          <div className="flex gap-2">
            <Input
              ref={nameInputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="rounded-xl"
              maxLength={40}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
              aria-label="Device name"
            />
            <Button size="sm" className="rounded-xl shrink-0" onClick={handleSaveName}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            className="text-sm font-semibold hover:underline"
            onClick={() => { setDraftName(deviceName); setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 50); }}
          >
            {deviceName} <span className="text-muted-foreground font-normal text-xs">(tap to rename)</span>
          </button>
        )}
      </div>

      {/* Sync status */}
      <div className="border-t pt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium">
            {status === 'syncing' && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Syncing…
              </span>
            )}
            {status === 'error' && (
              <span className="text-destructive flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> {lastError ?? 'Sync error'}
              </span>
            )}
            {status === 'idle' && lastSyncAt && (
              <span className="text-muted-foreground">Last synced: {fmtTime(lastSyncAt)}</span>
            )}
            {status === 'idle' && !lastSyncAt && (
              <span className="text-muted-foreground">Not yet synced this session</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl gap-1.5 shrink-0"
          disabled={status === 'syncing'}
          onClick={() => void pushNow(kids)}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', status === 'syncing' && 'animate-spin')} />
          Sync now
        </Button>
      </div>

      {/* Leave */}
      <div className="border-t pt-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-xl gap-1.5 w-full justify-start">
              <LogOut className="h-4 w-4" />
              Leave family
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave family?</AlertDialogTitle>
              <AlertDialogDescription>
                This device will stop syncing. Your local data stays intact. Other devices keep the family and can continue syncing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={leaveFamily}
              >
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
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

        {/* Family sync */}
        <section className="rounded-2xl bg-card border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Family sync
          </p>
          <FamilySection />
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

        <footer className="pt-2 pb-4 text-center">
          <p className="text-[11px] text-muted-foreground/60 font-medium">
            © {new Date().getFullYear()} Radhika Arasu. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">
            Toothbrush Hero
          </p>
        </footer>
      </main>
    </div>
  );
}
