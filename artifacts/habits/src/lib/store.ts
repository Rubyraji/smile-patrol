import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { format, startOfWeek, addDays } from 'date-fns';
import { DEFAULT_AGE, type ToothId } from './teeth';
import { sanitizeName } from './sanitize';

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

export type CareCategory = 'food' | 'water' | 'activity';

export type ShopCategory = 'food' | 'exercise' | 'sleep';

export type ShopItem = {
  id: string;
  emoji: string;
  name: string;
  category: ShopCategory;
  cost: number;
  description: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  // Food
  { id: 'carrot',   emoji: '🥕', name: 'Carrot Crunch',     category: 'food',     cost: 3,  description: 'Crunchy and healthy!' },
  { id: 'meat',     emoji: '🍖', name: 'Meaty Bone',         category: 'food',     cost: 5,  description: 'A delicious meaty treat!' },
  { id: 'egg',      emoji: '🥚', name: 'Scrambled Egg',      category: 'food',     cost: 4,  description: 'Protein-packed breakfast!' },
  { id: 'water',    emoji: '💧', name: 'Fresh Water',         category: 'food',     cost: 2,  description: 'Cool and refreshing!' },
  // Exercise
  { id: 'walk',     emoji: '🚶', name: 'Short Walk',          category: 'exercise', cost: 3,  description: 'A nice stroll outside!' },
  { id: 'fetch',    emoji: '🎾', name: 'Fetch!',              category: 'exercise', cost: 4,  description: 'Throw and run!' },
  { id: 'jumping',  emoji: '🦘', name: 'Jumping Fun',         category: 'exercise', cost: 4,  description: 'Bounce bounce bounce!' },
  { id: 'flying',   emoji: '🦋', name: 'Flying Adventure',   category: 'exercise', cost: 6,  description: 'Soar through the sky!' },
  // Sleep
  { id: 'nap2',     emoji: '😴', name: 'Quick Nap',           category: 'sleep',    cost: 2,  description: '2 hours of rest!' },
  { id: 'sleep4',   emoji: '🛌', name: 'Afternoon Snooze',    category: 'sleep',    cost: 3,  description: '4 hours of cosy sleep!' },
  { id: 'sleep6',   emoji: '💤', name: 'Good Sleep',          category: 'sleep',    cost: 4,  description: '6 hours of sweet dreams!' },
  { id: 'sleep8',   emoji: '🌙', name: 'Full Night\'s Sleep', category: 'sleep',    cost: 6,  description: '8 hours all night long!' },
];

export type ShopPurchase = {
  id: string;
  itemId: string;
  purchasedAt: string; // ISO
};

export type BrushSticker = {
  date: string;       // 'yyyy-MM-dd'
  sticker: string;    // emoji
  name: string;
  careCategory?: CareCategory;
};

// ── Virtual Pet ────────────────────────────────────────────────────────────

export type PetSpecies = 'cat' | 'dog' | 'axolotl' | 'dino' | 'unicorn' | 'alien';

export type Pet = {
  species: PetSpecies;
  name: string;
  generation: number;           // 0 = first pet, increments on death
  createdWeek: string;          // week-start 'yyyy-MM-dd' when assigned
  hatched: boolean;             // false only while dino is still an egg
  lastDeathCheckWeek: string;   // last week-start we ran the death check
};

export type PetSpeciesInfo = {
  key: PetSpecies;
  label: string;
  emoji: string;
  color: string;
  defaultName: string;
};

export const PET_SPECIES_LIST: PetSpeciesInfo[] = [
  { key: 'cat',     label: 'Cat',       emoji: '🐱', color: '#FF9F9F', defaultName: 'Whiskers' },
  { key: 'dog',     label: 'Dog',       emoji: '🐶', color: '#FFCA3A', defaultName: 'Buddy'    },
  { key: 'axolotl', label: 'Axolotl',   emoji: '🦎', color: '#FF85C2', defaultName: 'Axie'     },
  { key: 'dino',    label: 'Dinosaur',  emoji: '🦕', color: '#7BC67E', defaultName: 'Rex'      },
  { key: 'unicorn', label: 'Unicorn',   emoji: '🦄', color: '#C084FC', defaultName: 'Sparkle'  },
  { key: 'alien',   label: 'Cute Alien',emoji: '👾', color: '#34D399', defaultName: 'Zorp'     },
];

export type PetCareItem = {
  emoji: string;
  name: string;
  category: CareCategory;
};

export const PET_CARE_ITEMS: PetCareItem[] = [
  { emoji: '🍖', name: 'Yummy Bone',    category: 'food'     },
  { emoji: '🐟', name: 'Fresh Fish',    category: 'food'     },
  { emoji: '🥕', name: 'Carrot Crunch', category: 'food'     },
  { emoji: '🍎', name: 'Apple Treat',   category: 'food'     },
  { emoji: '🫐', name: 'Berry Snack',   category: 'food'     },
  { emoji: '💧', name: 'Fresh Water',   category: 'water'    },
  { emoji: '🌊', name: 'Splash Time',   category: 'water'    },
  { emoji: '🛁', name: 'Spa Bath',      category: 'water'    },
  { emoji: '🦮', name: 'Walkies!',      category: 'activity' },
  { emoji: '⚽', name: 'Playtime!',     category: 'activity' },
  { emoji: '🎾', name: 'Fetch!',        category: 'activity' },
  { emoji: '🌿', name: 'Garden Run',    category: 'activity' },
];

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
  pet: Pet | null;               // virtual pet; null until first assigned
  purchases: ShopPurchase[];     // items bought from pet shop
};

export const TASK_PRESETS: Array<{ name: string; emoji: string; time: TaskTime }> = [
  { name: 'Floss', emoji: '🧵', time: 'anytime' },
  { name: 'Tooth cream', emoji: '🪥', time: 'anytime' },
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
  section?: string;
}> = [
  {
    key: 'floss',
    name: 'Floss',
    emoji: '🧵',
    time: 'anytime',
    title: 'Track flossing',
    subtitle: 'Adds a daily floss check to the Today list.',
    section: 'Dental extras',
  },
  {
    key: 'tooth-cream',
    name: 'Tooth cream',
    emoji: '🪥',
    time: 'anytime',
    title: 'Track tooth cream',
    subtitle: 'Adds a daily tooth cream step right after flossing.',
    section: 'Dental extras',
  },
  {
    key: 'pet-feed',
    name: 'Feed your pet',
    emoji: '🍖',
    time: 'anytime',
    title: 'Feed your pet',
    subtitle: 'Remind them to give their pet a meal. Earns 3 pts 🐾',
    section: 'Pet care',
  },
  {
    key: 'pet-exercise',
    name: 'Exercise your pet',
    emoji: '🏃',
    time: 'anytime',
    title: 'Exercise your pet',
    subtitle: 'A walk or playtime session. Earns 3 pts 🐾',
    section: 'Pet care',
  },
  {
    key: 'pet-sleep',
    name: "Pet's bedtime",
    emoji: '💤',
    time: 'night',
    title: "Pet's bedtime routine",
    subtitle: 'Tuck in the pet before lights out. Earns 3 pts 🐾',
    section: 'Pet care',
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
      purchases: [],
      pet: {
        species: 'cat',
        name: 'Whiskers',
        generation: 0,
        createdWeek: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        hatched: true,
        lastDeathCheckWeek: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      },
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
      purchases: [],
      pet: {
        species: 'dino',
        name: '',
        generation: 0,
        createdWeek: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        hatched: false,
        lastDeathCheckWeek: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      },
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
    pet: (kid.pet as Pet | undefined) ?? null,
    purchases: (kid as Partial<Kid>).purchases ?? [],
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
          name: sanitizeName(name) || 'Kiddo',
          emoji: emoji ?? KID_EMOJIS[prev.length % KID_EMOJIS.length],
          color: color ?? KID_COLORS[prev.length % KID_COLORS.length],
          age,
          missingTeeth: [],
          brushings: {},
          rewards: [],
          tasks: [],
          taskCompletions: {},
          brushStickers: [],
          purchases: [],
          pet: null,
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
      const sanitised = { ...updates };
      if (typeof sanitised.name === 'string') sanitised.name = sanitizeName(sanitised.name) || 'Kiddo';
      setKids((prev) => prev.map((k) => (k.id === id ? { ...k, ...sanitised } : k)));
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
        const idx = k.brushStickers.length % PET_CARE_ITEMS.length;
        const pick = PET_CARE_ITEMS[idx];
        // Hatch the dino egg on the first 3-min brush
        const pet =
          k.pet && !k.pet.hatched && k.pet.species === 'dino'
            ? { ...k.pet, hatched: true }
            : k.pet;
        return {
          ...k,
          pet,
          brushStickers: [
            ...k.brushStickers,
            { date: dateStr, sticker: pick.emoji, name: pick.name, careCategory: pick.category },
          ],
        };
      }),
    );
  }, []);

  // ── Virtual pet management ─────────────────────────────────────────────

  const assignNewPet = useCallback((kidId: string) => {
    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const speciesIdx = Math.floor(Math.random() * PET_SPECIES_LIST.length);
    const species = PET_SPECIES_LIST[speciesIdx];
    const newPet: Pet = {
      species: species.key,
      name: '',
      generation: 0,
      createdWeek: weekStart,
      hatched: species.key !== 'dino',
      lastDeathCheckWeek: weekStart,
    };
    setKids((prev) =>
      prev.map((k) => (k.id !== kidId ? k : { ...k, pet: newPet })),
    );
  }, []);

  const namePet = useCallback((kidId: string, name: string) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId || !k.pet) return k;
        return { ...k, pet: { ...k.pet, name: sanitizeName(name) || k.pet.name || 'Buddy' } };
      }),
    );
  }, []);

  const checkPetDeath = useCallback(
    (kidId: string): string | null => {
      const kid = kids.find((k) => k.id === kidId);
      if (!kid?.pet) return null;

      const now = new Date();
      const currentWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // Already checked this week
      if (kid.pet.lastDeathCheckWeek === currentWeekStart) return null;

      // Pet created this week — just update check week, no death possible
      if (kid.pet.createdWeek >= currentWeekStart) {
        setKids((prev) =>
          prev.map((k) =>
            k.id !== kidId || !k.pet
              ? k
              : { ...k, pet: { ...k.pet, lastDeathCheckWeek: currentWeekStart } },
          ),
        );
        return null;
      }

      // Check previous week (7 days back from current week start)
      const prevWeekDays = getWeekDays(addDays(now, -7));
      const prevWeekBrushCount = countWeekBrushings(kid, prevWeekDays);

      if (prevWeekBrushCount >= 12) {
        // Pet survives — update check week
        setKids((prev) =>
          prev.map((k) =>
            k.id !== kidId || !k.pet
              ? k
              : { ...k, pet: { ...k.pet, lastDeathCheckWeek: currentWeekStart } },
          ),
        );
        return null;
      }

      // Pet dies — replace with a new random species
      const prevName = kid.pet.name || 'your pet';
      const gen = kid.pet.generation + 1;
      const speciesIdx = Math.floor(Math.random() * PET_SPECIES_LIST.length);
      const species = PET_SPECIES_LIST[speciesIdx];
      const newPet: Pet = {
        species: species.key,
        name: '',
        generation: gen,
        createdWeek: currentWeekStart,
        hatched: species.key !== 'dino',
        lastDeathCheckWeek: currentWeekStart,
      };
      setKids((prev) =>
        prev.map((k) => (k.id !== kidId ? k : { ...k, pet: newPet })),
      );
      return prevName;
    },
    [kids],
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

  const setKidsFromRemote = useCallback((updater: (prev: Kid[]) => Kid[]) => {
    setKids(updater);
  }, []);

  const buyShopItem = useCallback((kidId: string, itemId: string): boolean => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;
    let success = false;
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        if (getSpendablePoints(k) < item.cost) return k;
        const purchase: ShopPurchase = {
          id: nanoid(),
          itemId,
          purchasedAt: new Date().toISOString(),
        };
        success = true;
        return { ...k, purchases: [...(k.purchases ?? []), purchase] };
      })
    );
    return success;
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
    assignNewPet,
    namePet,
    checkPetDeath,
    buyShopItem,
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

/**
 * Returns a 0–5 heart count for the kid's virtual pet based on brushing
 * compliance in the given week. Loses 1 heart per missed session (max 5).
 */
export function getPetHappiness(kid: Kid, weekDays: Date[]): number {
  const brushCount = countWeekBrushings(kid, weekDays);
  const missedSessions = Math.max(0, 14 - brushCount);
  return Math.max(0, 5 - missedSessions);
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
// ── Points system ─────────────────────────────────────────────────────────────

export const POINT_VALUES = {
  brush:       5,   // per brushing session (any duration)
  bonus3min:   5,   // extra when a 3-min brush sticker exists for that session
  floss:       3,
  toothCream:  3,
  petFood:     3,   // feed your pet task
  petExercise: 3,   // exercise your pet task
  petSleep:    3,   // pet's bedtime task
  task:        2,   // any other task
  perfectDay:  5,   // all sessions + all tasks done on the same day
} as const;

export const PET_CARE_TASK_NAMES = ["Feed your pet", "Exercise your pet", "Pet's bedtime"] as const;

export type DayPoints = {
  brushPoints:  number;
  bonusPoints:  number; // 3-min sticker bonuses
  taskPoints:   number;
  perfectBonus: number;
  total:        number;
};

export function getPointsForDate(kid: Kid, dateStr: string): DayPoints {
  const rec = kid.brushings[dateStr] ?? {};
  let brushPoints = 0;
  let sessionsDone = 0;
  for (const s of ['morning', 'afternoon'] as Session[]) {
    if (rec[s]) { brushPoints += POINT_VALUES.brush; sessionsDone++; }
  }

  // Each brushSticker on this date = one 3-min brush was completed
  const stickersToday = (kid.brushStickers ?? []).filter((s) => s.date === dateStr).length;
  const bonusPoints = stickersToday * POINT_VALUES.bonus3min;

  let taskPoints = 0;
  let tasksDone = 0;
  for (const task of kid.tasks) {
    if (kid.taskCompletions[task.id]?.[dateStr]) {
      tasksDone++;
      if      (task.name === 'Floss')            taskPoints += POINT_VALUES.floss;
      else if (task.name === 'Tooth cream')      taskPoints += POINT_VALUES.toothCream;
      else if (task.name === 'Feed your pet')    taskPoints += POINT_VALUES.petFood;
      else if (task.name === 'Exercise your pet') taskPoints += POINT_VALUES.petExercise;
      else if (task.name === "Pet's bedtime")    taskPoints += POINT_VALUES.petSleep;
      else                                       taskPoints += POINT_VALUES.task;
    }
  }

  const allDone = sessionsDone === 2 && tasksDone === kid.tasks.length && kid.tasks.length > 0;
  const perfectBonus = allDone ? POINT_VALUES.perfectDay : 0;

  return { brushPoints, bonusPoints, taskPoints, perfectBonus,
           total: brushPoints + bonusPoints + taskPoints + perfectBonus };
}

export function getTotalPointsEarned(kid: Kid): number {
  const dates = new Set<string>();
  Object.keys(kid.brushings).forEach((d) => dates.add(d));
  for (const completions of Object.values(kid.taskCompletions)) {
    Object.keys(completions).forEach((d) => dates.add(d));
  }
  return Array.from(dates).reduce(
    (sum, d) => sum + getPointsForDate(kid, d).total,
    0,
  );
}

export function getTotalPointsSpent(kid: Kid): number {
  return (kid.purchases ?? []).reduce((sum, p) => {
    const item = SHOP_ITEMS.find((i) => i.id === p.itemId);
    return sum + (item?.cost ?? 0);
  }, 0);
}

export function getSpendablePoints(kid: Kid): number {
  return Math.max(0, getTotalPointsEarned(kid) - getTotalPointsSpent(kid));
}

export function getWeeklyPoints(kid: Kid, weekDays: Date[]): number {
  return weekDays.reduce(
    (sum, d) => sum + getPointsForDate(kid, format(d, 'yyyy-MM-dd')).total,
    0,
  );
}

export type PointsLevel = { label: string; emoji: string; nextAt: number | null };

export function getPointsLevel(pts: number): PointsLevel {
  if (pts <  30) return { label: 'Just Starting',   emoji: '🌱', nextAt: 30  };
  if (pts <  80) return { label: 'Good Brusher',    emoji: '⭐', nextAt: 80  };
  if (pts < 140) return { label: 'Dental Champion', emoji: '🏆', nextAt: 140 };
  if (pts < 200) return { label: 'Super Brusher',   emoji: '🚀', nextAt: 200 };
  return               { label: 'Brushing Legend',  emoji: '👑', nextAt: null };
}

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
