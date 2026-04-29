import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { format, startOfWeek, addDays } from 'date-fns';

export type Session = 'morning' | 'afternoon';
export type BrushRecord = Partial<Record<Session, boolean>>;

export type Reward = {
  weekStart: string; // 'yyyy-MM-dd' Monday
  sticker: string; // emoji
  name: string;
  unlockedAt: string; // ISO
};

export type Kid = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  brushings: Record<string, BrushRecord>;
  rewards: Reward[];
};

const STORAGE_KEY = 'brush.kids.v1';
const ACTIVE_KEY = 'brush.activeKid.v1';
const SEED_KEY = 'brush.seeded.v1';

export const KID_EMOJIS = ['🦄', '🦁', '🐼', '🐯', '🦊', '🐰', '🐻', '🐸', '🐵', '🐨', '🐶', '🐱'];
export const KID_COLORS = ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA', '#FB923C', '#F87171', '#22D3EE'];

export const REWARD_STICKERS: Array<{ emoji: string; name: string }> = [
  { emoji: '🏆', name: 'Golden Trophy' },
  { emoji: '🦷', name: 'Sparkly Tooth' },
  { emoji: '⭐', name: 'Super Star' },
  { emoji: '🎖️', name: 'Hero Medal' },
  { emoji: '🌟', name: 'Cosmic Star' },
  { emoji: '🏅', name: 'Champion Badge' },
  { emoji: '👑', name: 'Royal Crown' },
  { emoji: '🦸', name: 'Brush Hero' },
  { emoji: '🌈', name: 'Rainbow Smile' },
  { emoji: '🎁', name: 'Mystery Gift' },
  { emoji: '🚀', name: 'Rocket Brusher' },
  { emoji: '🐉', name: 'Dragon Slayer' },
];

function seedKids(): Kid[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
  return [
    {
      id: nanoid(),
      name: 'Lily',
      emoji: '🦄',
      color: '#F472B6',
      brushings: {
        [today]: { morning: true },
        [yesterday]: { morning: true, afternoon: true },
      },
      rewards: [],
    },
    {
      id: nanoid(),
      name: 'Max',
      emoji: '🦁',
      color: '#FBBF24',
      brushings: {
        [yesterday]: { morning: true },
      },
      rewards: [],
    },
  ];
}

function migrate(kid: Partial<Kid> & { id: string; name: string; emoji: string; color: string; brushings: Record<string, BrushRecord> }): Kid {
  return {
    ...kid,
    rewards: kid.rewards ?? [],
  };
}

function loadKids(): Kid[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Kid[];
      return parsed.map(migrate);
    }
  } catch (e) {
    console.error('Failed to load kids', e);
  }
  if (localStorage.getItem(SEED_KEY)) return [];
  const seed = seedKids();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  localStorage.setItem(SEED_KEY, '1');
  return seed;
}

export function useKids() {
  const [kids, setKids] = useState<Kid[]>(loadKids);
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    const stored = localStorage.getItem(ACTIVE_KEY);
    if (stored) return stored;
    const initial = loadKids();
    return initial[0]?.id ?? null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kids));
  }, [kids]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    if (kids.length === 0) {
      if (activeId !== null) setActiveIdState(null);
      return;
    }
    if (!activeId || !kids.find((k) => k.id === activeId)) {
      setActiveIdState(kids[0].id);
    }
  }, [kids, activeId]);

  const setActiveId = useCallback((id: string) => setActiveIdState(id), []);

  const addKid = useCallback(
    (name: string, emoji?: string, color?: string) => {
      const id = nanoid();
      setKids((prev) => {
        const newKid: Kid = {
          id,
          name: name.trim() || 'Kiddo',
          emoji: emoji ?? KID_EMOJIS[prev.length % KID_EMOJIS.length],
          color: color ?? KID_COLORS[prev.length % KID_COLORS.length],
          brushings: {},
          rewards: [],
        };
        return [...prev, newKid];
      });
      setActiveIdState(id);
      return id;
    },
    []
  );

  const removeKid = useCallback((id: string) => {
    setKids((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const updateKid = useCallback(
    (id: string, updates: Partial<Pick<Kid, 'name' | 'emoji' | 'color'>>) => {
      setKids((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)));
    },
    []
  );

  const setSession = useCallback(
    (kidId: string, dateStr: string, session: Session, value: boolean) => {
      setKids((prev) =>
        prev.map((k) => {
          if (k.id !== kidId) return k;
          const day = k.brushings[dateStr] ?? {};
          const next: BrushRecord = { ...day, [session]: value };
          return { ...k, brushings: { ...k.brushings, [dateStr]: next } };
        })
      );
    },
    []
  );

  const toggleSession = useCallback(
    (kidId: string, dateStr: string, session: Session) => {
      setKids((prev) =>
        prev.map((k) => {
          if (k.id !== kidId) return k;
          const day = k.brushings[dateStr] ?? {};
          const next: BrushRecord = { ...day, [session]: !day[session] };
          return { ...k, brushings: { ...k.brushings, [dateStr]: next } };
        })
      );
    },
    []
  );

  const unlockWeekReward = useCallback(
    (kidId: string, weekStartKey: string): Reward | null => {
      let unlocked: Reward | null = null;
      setKids((prev) =>
        prev.map((k) => {
          if (k.id !== kidId) return k;
          if (k.rewards.some((r) => r.weekStart === weekStartKey)) return k;
          const idx = k.rewards.length % REWARD_STICKERS.length;
          const pick = REWARD_STICKERS[idx];
          const reward: Reward = {
            weekStart: weekStartKey,
            sticker: pick.emoji,
            name: pick.name,
            unlockedAt: new Date().toISOString(),
          };
          unlocked = reward;
          return { ...k, rewards: [...k.rewards, reward] };
        })
      );
      return unlocked;
    },
    []
  );

  const activeKid = kids.find((k) => k.id === activeId) ?? null;

  return {
    kids,
    activeKid,
    activeId,
    setActiveId,
    addKid,
    removeKid,
    updateKid,
    setSession,
    toggleSession,
    unlockWeekReward,
  };
}

export function getCurrentSession(): Session {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : 'afternoon';
}

export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function countWeekBrushings(kid: Kid, weekDays: Date[]): number {
  let count = 0;
  for (const d of weekDays) {
    const key = format(d, 'yyyy-MM-dd');
    const rec = kid.brushings[key];
    if (rec?.morning) count++;
    if (rec?.afternoon) count++;
  }
  return count;
}

export function getWeekStartKey(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getWeekReward(kid: Kid, weekStartKey: string): Reward | undefined {
  return kid.rewards.find((r) => r.weekStart === weekStartKey);
}

export function isWeekComplete(kid: Kid, weekDays: Date[]): boolean {
  return countWeekBrushings(kid, weekDays) >= 14;
}

export function getStreak(kid: Kid): number {
  let streak = 0;
  let cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = format(cursor, 'yyyy-MM-dd');
    const rec = kid.brushings[key];
    if (rec?.morning && rec?.afternoon) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}
