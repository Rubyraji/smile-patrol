import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { format } from 'date-fns';

const NOTIF_KEY = 'brush.notifications.v1';

export type NotificationSettings = {
  enabled: boolean;
  morningTime: string; // "HH:MM" 24-hour
  eveningTime: string;
};

const DEFAULTS: NotificationSettings = {
  enabled: false,
  morningTime: '07:30',
  eveningTime: '19:30',
};

function isValidTime(t: unknown): t is string {
  return typeof t === 'string' && /^\d{2}:\d{2}$/.test(t);
}

function load(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<NotificationSettings>;
      return {
        enabled: !!p.enabled,
        morningTime: isValidTime(p.morningTime) ? p.morningTime : DEFAULTS.morningTime,
        eveningTime: isValidTime(p.eveningTime) ? p.eveningTime : DEFAULTS.eveningTime,
      };
    }
  } catch {}
  return { ...DEFAULTS };
}

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

type ContextValue = {
  settings: NotificationSettings;
  permission: NotificationPermission | 'unsupported';
  setEnabled: (val: boolean) => Promise<void>;
  setMorningTime: (t: string) => void;
  setEveningTime: (t: string) => void;
};

const Ctx = createContext<ContextValue | null>(null);

function useScheduler(settings: NotificationSettings) {
  useEffect(() => {
    if (!settings.enabled) return;
    if (!notificationSupported()) return;

    const lastFired: Record<string, string> = {};

    const check = () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const cur = `${hh}:${mm}`;

      if (cur === settings.morningTime && lastFired.morning !== today) {
        lastFired.morning = today;
        new Notification('🪥 Toothbrush Hero', {
          body: "Time for morning brushing! 🌞",
          icon: '/favicon.ico',
          tag: `brush-morning-${today}`,
        });
      }
      if (cur === settings.eveningTime && lastFired.evening !== today) {
        lastFired.evening = today;
        new Notification('🪥 Toothbrush Hero', {
          body: "Bedtime brush time! 🌙",
          icon: '/favicon.ico',
          tag: `brush-evening-${today}`,
        });
      }
    };

    check();
    const id = window.setInterval(check, 30_000); // check every 30 s for accuracy
    return () => window.clearInterval(id);
  }, [settings.enabled, settings.morningTime, settings.eveningTime]);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(load);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationSupported() ? Notification.permission : 'unsupported',
  );

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(settings));
  }, [settings]);

  const setEnabled = useCallback(async (val: boolean) => {
    if (val && notificationSupported()) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;
    }
    setSettings((s) => ({ ...s, enabled: val }));
  }, []);

  const setMorningTime = useCallback((t: string) => {
    setSettings((s) => ({ ...s, morningTime: t }));
  }, []);

  const setEveningTime = useCallback((t: string) => {
    setSettings((s) => ({ ...s, eveningTime: t }));
  }, []);

  useScheduler(settings);

  return (
    <Ctx.Provider value={{ settings, permission, setEnabled, setMorningTime, setEveningTime }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications(): ContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
