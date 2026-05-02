import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { nanoid } from 'nanoid';
import type { Kid, BrushRecord } from './store';

const FAMILY_KEY = 'brush.family.v2';
const DEVICE_KEY  = 'brush.deviceId.v1';

type FamilyConfig = {
  code: string;
  deviceName: string;
};

type SyncStatus = 'idle' | 'syncing' | 'error';

type FamilySyncCtx = {
  familyCode: string | null;
  deviceId: string;
  deviceName: string;
  isLinked: boolean;
  status: SyncStatus;
  lastSyncAt: Date | null;
  lastError: string | null;
  createFamily: () => Promise<string>;
  joinFamily: (code: string) => Promise<Kid[] | null>;
  leaveFamily: () => void;
  pushNow: (kids: Kid[]) => Promise<void>;
  setDeviceName: (name: string) => void;
};

const Ctx = createContext<FamilySyncCtx | null>(null);

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = nanoid(12); localStorage.setItem(DEVICE_KEY, id); }
  return id;
}

function loadConfig(): FamilyConfig | null {
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    if (raw) return JSON.parse(raw) as FamilyConfig;
  } catch { /* ignore */ }
  return null;
}

function saveConfig(cfg: FamilyConfig | null) {
  if (cfg) localStorage.setItem(FAMILY_KEY, JSON.stringify(cfg));
  else localStorage.removeItem(FAMILY_KEY);
}

function getDefaultDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android.*Mobile/.test(ua)) return 'Android Phone';
  if (/Android/.test(ua)) return 'Android Tablet';
  return 'Browser';
}

// ── Merge logic ────────────────────────────────────────────────────────────
// Union brushings and taskCompletions so that both parents' entries survive.
function mergeBrushings(
  a: Record<string, BrushRecord>,
  b: Record<string, BrushRecord>,
): Record<string, BrushRecord> {
  const all = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: Record<string, BrushRecord> = {};
  for (const date of all) {
    out[date] = {
      morning:   !!(a[date]?.morning   || b[date]?.morning),
      afternoon: !!(a[date]?.afternoon || b[date]?.afternoon),
    };
  }
  return out;
}

function mergeTaskCompletions(
  a: Record<string, Record<string, boolean>>,
  b: Record<string, Record<string, boolean>>,
): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = {};
  const allTaskIds = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const taskId of allTaskIds) {
    const aMap = a[taskId] ?? {};
    const bMap = b[taskId] ?? {};
    const allDates = new Set([...Object.keys(aMap), ...Object.keys(bMap)]);
    out[taskId] = {};
    for (const d of allDates) out[taskId][d] = !!(aMap[d] || bMap[d]);
  }
  return out;
}

export function mergeKids(local: Kid[], remote: Kid[]): Kid[] {
  const map = new Map<string, Kid>();
  for (const k of local)  map.set(k.id, k);
  for (const rk of remote) {
    const lk = map.get(rk.id);
    if (!lk) {
      map.set(rk.id, rk);
    } else {
      map.set(rk.id, {
        ...rk,
        ...lk,
        brushings:       mergeBrushings(lk.brushings, rk.brushings),
        taskCompletions: mergeTaskCompletions(lk.taskCompletions, rk.taskCompletions),
        rewards: lk.rewards.length >= rk.rewards.length ? lk.rewards : rk.rewards,
      });
    }
  }
  // Preserve local ordering; append remote-only kids at the end.
  const result = local.map((k) => map.get(k.id)!);
  for (const rk of remote) {
    if (!local.find((lk) => lk.id === rk.id)) result.push(map.get(rk.id)!);
  }
  return result;
}

// ── Provider ────────────────────────────────────────────────────────────────
export function FamilySyncProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FamilyConfig | null>(loadConfig);
  const [deviceId] = useState(getDeviceId);
  const [deviceName, setDeviceNameState] = useState(
    () => loadConfig()?.deviceName ?? getDefaultDeviceName(),
  );
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const setDeviceName = useCallback((name: string) => {
    setDeviceNameState(name);
    setConfig((prev) => (prev ? { ...prev, deviceName: name } : prev));
  }, []);

  useEffect(() => {
    if (config) saveConfig(config);
    else saveConfig(null);
  }, [config]);

  const createFamily = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/family/create', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create family');
    const { code } = (await res.json()) as { code: string };
    const cfg: FamilyConfig = { code, deviceName };
    setConfig(cfg);
    return code;
  }, [deviceName]);

  const joinFamily = useCallback(async (raw: string): Promise<Kid[] | null> => {
    const code = raw.trim().toUpperCase();
    const res = await fetch('/api/family/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.status === 404) throw new Error('Family not found — check the code and try again.');
    if (!res.ok) throw new Error('Failed to join family');
    const data = (await res.json()) as { code: string; payload: { kids: Kid[] } | null };
    setConfig({ code: data.code, deviceName });
    setLastSyncAt(new Date());
    return data.payload?.kids ?? null;
  }, [deviceName]);

  const leaveFamily = useCallback(() => {
    setConfig(null);
    setLastSyncAt(null);
    setLastError(null);
    setStatus('idle');
  }, []);

  const pushNow = useCallback(async (kids: Kid[]) => {
    if (!config) return;
    setStatus('syncing');
    setLastError(null);
    try {
      const res = await fetch(`/api/family/${config.code}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { kids }, deviceId, deviceName }),
      });
      if (!res.ok) throw new Error(`Sync failed (${res.status})`);
      setLastSyncAt(new Date());
      setStatus('idle');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync error';
      setLastError(msg);
      setStatus('error');
    }
  }, [config, deviceId, deviceName]);

  const value: FamilySyncCtx = {
    familyCode: config?.code ?? null,
    deviceId,
    deviceName,
    isLinked: !!config,
    status,
    lastSyncAt,
    lastError,
    createFamily,
    joinFamily,
    leaveFamily,
    pushNow,
    setDeviceName,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFamilySync() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFamilySync must be used inside FamilySyncProvider');
  return ctx;
}
