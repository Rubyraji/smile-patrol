import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { format, startOfWeek, addDays } from 'date-fns';
import { DEFAULT_AGE, type ToothId } from './teeth';

export type Session = 'morning' | 'afternoon';
export type BrushRecord = Partial<Record<Session, boolean>>;

export type Reward = {
  weekStart: string; // 'yyyy-MM-dd' Monday
  sticker: string; // emoji
  name: string;
  unlockedAt: string; // ISO
};

export type TaskTime = 'anytime' | 'night';

export type Task = {
  id: string;
  name: string;
  emoji: string;
  time: TaskTime;
};

export type BrushSticker = {
  date: string;   // 'yyyy-MM-dd'
  sticker: string; // emoji
  name: string;
};

export type Kid = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  age: number; // years; controls which teeth are shown by default
  missingTeeth: ToothId[]; // overrides: explicit "this tooth is out / not yet in"
  brushings: Record<string, BrushRecord>;
  rewards: Reward[];
  tasks: Task[];
  taskCompletions: Record<string, Record<string, boolean>>; // taskId -> dateStr -> done
  brushStickers: BrushSticker[]; // earned by completing a 3-minute brush
};

export const TASK_PRESETS: Array<{ name: string; emoji: string; time: TaskTime }> = [
  { name: 'Floss', emoji: '🧵', time: 'anytime' },
  { name: 'Tooth cream', emoji: '🪥', time: 'night' },
  { name: 'Mouthwash', emoji: '💧', time: 'anytime' },
  { name: 'Tongue scrape', emoji: '👅', time: 'anytime' },
  { name: 'Replace brush head', emoji: '🔄', time: 'anytime' },
  { name: 'Drink water', emoji: '🥤', time: 'anytime' },
];

// The two most common extras get prominent on/off toggles in the kid editor.
export const QUICK_TOGGLE_PRESETS: Array<{
  key: string;
  name: string;
  emoji: string;
  time: TaskTime;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'floss',
    name: 'Floss',
    emoji: '🧵',
    time: 'anytime',
    title: 'Track flossing',
    subtitle: 'Adds a daily floss check to the Today list.',
  },
  {
    key: 'tooth-cream',
    name: 'Tooth cream',
    emoji: '🪥',
    time: 'night',
    title: 'Track tooth cream (night)',
    subtitle: 'Adds a bedtime tooth cream reminder after the evening brush.',
  },
];

export const TASK_EMOJIS = ['🧵', '🪥', '💧', '👅', '🔄', '🥤', '🍎', '🦷', '⏰', '💊', '🧴', '🌿'];

const STORAGE_KEY = 'brush.kids.v1';
const ACTIVE_KEY = 'brush.activeKid.v1';
const SEED_KEY = 'brush.seeded.v1';
const PARENT_KEY = 'brush.parent.v1';

// Parent settings — global (not per-kid).
//   parentPin: 4-digit string the parent enters to sign off on brushing.
//     Stored in localStorage in plaintext intentionally; this is a
//     kid-resistant gate, not a security feature.
//   requireParentSignoff: whether to require the PIN at the end of every
//     brush session. Both must be set for sign-off to actually apply.
export type ParentSettings = {
  parentPin: string | null;
  requireParentSignoff: boolean;
};

function loadParentSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(PARENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ParentSettings>;
      const pin =
        typeof parsed.parentPin === 'string' && /^\d{4}$/.test(parsed.parentPin)
          ? parsed.parentPin
          : null;
      return {
        parentPin: pin,
        requireParentSignoff: !!parsed.requireParentSignoff && !!pin,
      };
    }
  } catch (e) {
    console.error('Failed to load parent settings', e);
  }
  return { parentPin: null, requireParentSignoff: false };
}

export type CharacterCategory = {
  key: string;
  label: string;
  icon: string;
  characters: string[];
};

export const CHARACTER_CATEGORIES: CharacterCategory[] = [
  {
    key: 'animals',
    label: 'Animals',
    icon: '🐾',
    characters: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🦒', '🦓', '🐴', '🦌', '🐘',
      '🦔', '🦝', '🐺', '🦘', '🐿️', '🦥',
    ],
  },
  {
    key: 'birds',
    label: 'Birds',
    icon: '🦜',
    characters: ['🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦩', '🦚', '🦜', '🐓', '🦢'],
  },
  {
    key: 'sea',
    label: 'Sea',
    icon: '🐠',
    characters: [
      '🐙', '🐠', '🐟', '🐡', '🦈', '🐬', '🐳', '🐋',
      '🦭', '🦦', '🐊', '🦞', '🦀', '🦐', '🦑', '🐢',
    ],
  },
  {
    key: 'fantasy',
    label: 'Fantasy',
    icon: '🦄',
    characters: [
      '🦄', '🐉', '🦖', '🦕', '🧚', '🧜', '🧙', '🧝', '🧛',
      '🧞', '👻', '👽', '🤖', '👾', '🧌', '🧟',
    ],
  },
  {
    key: 'heroes',
    label: 'Heroes',
    icon: '🦸',
    characters: ['🦸', '🥷', '🤴', '👸', '🧑‍🚀', '🧑‍🚒', '🧑‍🍳', '🧑‍🎤', '🧑‍🎨', '🧑‍🌾', '🧑‍⚕️', '🕵️'],
  },
  {
    key: 'bugs',
    label: 'Bugs',
    icon: '🐝',
    characters: ['🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪲', '🪳', '🦗', '🕷️'],
  },
  {
    key: 'nature',
    label: 'Nature',
    icon: '🌟',
    characters: [
      '🌟', '⭐', '🌈', '☀️', '🌙', '⚡', '🔥', '❄️', '🌸',
      '🌺', '🌻', '🌷', '🌼', '🍀', '🌵', '🍄',
    ],
  },
];

// Flat list kept for back-compat (used as default avatar rotation when adding kids).
export const KID_EMOJIS: string[] = CHARACTER_CATEGORIES.flatMap((c) => c.characters);
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
  const flossId = nanoid();
  return [
    {
      id: nanoid(),
      name: 'Lily',
      emoji: '🦄',
      color: '#F472B6',
      age: 7,
      missingTeeth: [],
      brushings: {
        [today]: { morning: true },
        [yesterday]: { morning: true, afternoon: true },
      },
      rewards: [],
      tasks: [{ id: flossId, name: 'Floss', emoji: '🧵', time: 'anytime' }],
      taskCompletions: {
        [flossId]: { [yesterday]: true },
      },
      brushStickers: [],
    },
    {
      id: nanoid(),
      name: 'Max',
      emoji: '🦁',
      color: '#FBBF24',
      age: 5,
      missingTeeth: [],
      brushings: {
        [yesterday]: { morning: true },
      },
      rewards: [],
      tasks: [],
      taskCompletions: {},
      brushStickers: [],
    },
  ];
}

function migrate(
  kid: Partial<Kid> & {
    id: string;
    name: string;
    emoji: string;
    color: string;
    brushings: Record<string, BrushRecord>;
  },
): Kid {
  return {
    ...kid,
    age: typeof kid.age === 'number' ? kid.age : DEFAULT_AGE,
    missingTeeth: Array.isArray(kid.missingTeeth) ? kid.missingTeeth : [],
    rewards: kid.rewards ?? [],
    tasks: (kid.tasks ?? []).map((t) => ({
      ...t,
      time: (t as Partial<Task>).time ?? 'anytime',
    })),
    taskCompletions: kid.taskCompletions ?? {},
    brushStickers: kid.brushStickers ?? [],
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
  const [parentSettings, setParentSettingsState] = useState<ParentSettings>(loadParentSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kids));
  }, [kids]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem(PARENT_KEY, JSON.stringify(parentSettings));
  }, [parentSettings]);

  const setParentPin = useCallback((pin: string | null) => {
    setParentSettingsState((s) => ({
      // If clearing the PIN, also force the toggle off — can't require what doesn't exist.
      parentPin: pin,
      requireParentSignoff: pin ? s.requireParentSignoff : false,
    }));
  }, []);

  const setRequireParentSignoff = useCallback((val: boolean) => {
    setParentSettingsState((s) => ({
      ...s,
      // Only allow turning on if a PIN is actually set.
      requireParentSignoff: val && !!s.parentPin,
    }));
  }, []);

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
    (name: string, emoji?: string, color?: string, age: number = DEFAULT_AGE) => {
      const id = nanoid();
      setKids((prev) => {
        const newKid: Kid = {
          id,
          name: name.trim() || 'Kiddo',
          emoji: emoji ?? KID_EMOJIS[prev.length % KID_EMOJIS.length],
          color: color ?? KID_COLORS[prev.length % KID_COLORS.length],
          age,
          missingTeeth: [],
          brushings: {},
          rewards: [],
          tasks: [],
          taskCompletions: {},
          brushStickers: [],
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
    (
      id: string,
      updates: Partial<Pick<Kid, 'name' | 'emoji' | 'color' | 'age' | 'missingTeeth'>>,
    ) => {
      setKids((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)));
    },
    [],
  );

  const toggleMissingTooth = useCallback((id: string, toothId: ToothId) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        const has = k.missingTeeth.includes(toothId);
        const next = has
          ? k.missingTeeth.filter((t) => t !== toothId)
          : [...k.missingTeeth, toothId];
        return { ...k, missingTeeth: next };
      }),
    );
  }, []);

  const resetMissingTeeth = useCallback((id: string) => {
    setKids((prev) =>
      prev.map((k) => (k.id === id ? { ...k, missingTeeth: [] } : k)),
    );
  }, []);

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

  const addTask = useCallback(
    (kidId: string, name: string, emoji: string, time: TaskTime = 'anytime') => {
      const taskId = nanoid();
      setKids((prev) =>
        prev.map((k) => {
          if (k.id !== kidId) return k;
          const newTask: Task = { id: taskId, name: name.trim() || 'Task', emoji, time };
          return { ...k, tasks: [...k.tasks, newTask] };
        }),
      );
      return taskId;
    },
    [],
  );

  const updateTask = useCallback(
    (kidId: string, taskId: string, updates: Partial<Pick<Task, 'name' | 'emoji'>>) => {
      setKids((prev) =>
        prev.map((k) => {
          if (k.id !== kidId) return k;
          return {
            ...k,
            tasks: k.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
          };
        })
      );
    },
    []
  );

  const removeTask = useCallback((kidId: string, taskId: string) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const { [taskId]: _removed, ...restCompletions } = k.taskCompletions;
        return {
          ...k,
          tasks: k.tasks.filter((t) => t.id !== taskId),
          taskCompletions: restCompletions,
        };
      })
    );
  }, []);

  const toggleTaskCompletion = useCallback(
    (kidId: string, taskId: string, dateStr: string) => {
      setKids((prev) =>
        prev.map((k) => {
          if (k.id !== kidId) return k;
          const taskMap = k.taskCompletions[taskId] ?? {};
          const next = { ...taskMap, [dateStr]: !taskMap[dateStr] };
          return {
            ...k,
            taskCompletions: { ...k.taskCompletions, [taskId]: next },
          };
        })
      );
    },
    []
  );

  const awardBrushSticker = useCallback((kidId: string, dateStr: string) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const idx = k.brushStickers.length % REWARD_STICKERS.length;
        const pick = REWARD_STICKERS[idx];
        return {
          ...k,
          brushStickers: [
            ...k.brushStickers,
            { date: dateStr, sticker: pick.emoji, name: pick.name },
          ],
        };
      }),
    );
  }, []);

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

  const setKidsFromRemote = useCallback((updater: (prev: Kid[]) => Kid[]) => {
    setKids(updater);
  }, []);

  const activeKid = kids.find((k) => k.id === activeId) ?? null;

  return {
    kids,
    activeKid,
    activeId,
    setActiveId,
    addKid,
    removeKid,
    updateKid,
    toggleMissingTooth,
    resetMissingTeeth,
    setSession,
    toggleSession,
    unlockWeekReward,
    addTask,
    updateTask,
    removeTask,
    toggleTaskCompletion,
    setKidsFromRemote,
    awardBrushSticker,
    parentPin: parentSettings.parentPin,
    requireParentSignoff: parentSettings.requireParentSignoff,
    setParentPin,
    setRequireParentSignoff,
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

export function isTaskDone(kid: Kid, taskId: string, dateStr: string): boolean {
  return !!kid.taskCompletions[taskId]?.[dateStr];
}

export function countWeekTaskCompletions(kid: Kid, taskId: string, weekDays: Date[]): number {
  let count = 0;
  for (const d of weekDays) {
    if (isTaskDone(kid, taskId, format(d, 'yyyy-MM-dd'))) count++;
  }
  return count;
}

export type WeekProgress = {
  brushDone: number;
  brushTotal: number;
  tasksDone: number;
  tasksTotal: number;
  totalDone: number;
  totalGoal: number;
  complete: boolean;
};

export function getWeekProgress(kid: Kid, weekDays: Date[]): WeekProgress {
  const brushDone = countWeekBrushings(kid, weekDays);
  const brushTotal = 14;
  let tasksDone = 0;
  for (const t of kid.tasks) {
    tasksDone += countWeekTaskCompletions(kid, t.id, weekDays);
  }
  const tasksTotal = kid.tasks.length * 7;
  const totalDone = brushDone + tasksDone;
  const totalGoal = brushTotal + tasksTotal;
  return {
    brushDone,
    brushTotal,
    tasksDone,
    tasksTotal,
    totalDone,
    totalGoal,
    complete: totalDone >= totalGoal,
  };
}

export function isWeekComplete(kid: Kid, weekDays: Date[]): boolean {
  return getWeekProgress(kid, weekDays).complete;
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

/**
 * Number of consecutive days on which EVERY kid completed both brushes and
 * all their configured tasks.  Today is skipped when it isn't finished yet
 * so the streak doesn't reset mid-day.
 */
export function getFamilyStreak(kids: Kid[]): number {
  if (kids.length === 0) return 0;

  const isDayComplete = (dateStr: string): boolean =>
    kids.every((kid) => {
      const rec = kid.brushings[dateStr];
      if (!rec?.morning || !rec?.afternoon) return false;
      return kid.tasks.every((t) => !!kid.taskCompletions[t.id]?.[dateStr]);
    });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  // If today isn't done yet, start counting from yesterday so the streak
  // stays intact while the family works through today's goals.
  const startCursor = isDayComplete(todayStr)
    ? new Date()
    : addDays(new Date(), -1);

  let streak = 0;
  let cursor = startCursor;
  for (let i = 0; i < 365; i++) {
    const key = format(cursor, 'yyyy-MM-dd');
    if (isDayComplete(key)) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}
