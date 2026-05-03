export type BrushThemeKey = 'default' | 'space' | 'ocean' | 'jungle';

export type BrushThemeZone = {
  emoji: string;
  label: string;
  hint: string;
};

export type BrushTheme = {
  key: BrushThemeKey;
  label: string;
  emoji: string;
  color: string;
  zones: [BrushThemeZone, BrushThemeZone];
  zoneSwitchMsgs: string[];
  almostDoneMsgs: string[];
};

export const BRUSH_THEMES: Record<BrushThemeKey, BrushTheme> = {
  default: {
    key: 'default',
    label: 'Classic',
    emoji: '🦷',
    color: '',         // signals "use kid color"
    zones: [
      { emoji: '⬆️', label: 'Top teeth',    hint: 'Brush the teeth on top — front and back!' },
      { emoji: '⬇️', label: 'Bottom teeth', hint: 'Now brush the bottom teeth — front and back!' },
    ],
    zoneSwitchMsgs: [
      'Halfway there! Keep going! 💪',
      'Amazing! Now the bottom teeth! ⬇️',
      "You're a brushing hero! 🦸",
      'Halfway done — superstar! ⭐',
      'Switch zones! Great work so far! 🌟',
    ],
    almostDoneMsgs: [
      'Almost done! Hold on! 🎉',
      'Just a few more seconds! 🏁',
      "You're so close! Don't stop! 🚀",
      'Final stretch — keep going! 💫',
    ],
  },

  space: {
    key: 'space',
    label: 'Space',
    emoji: '🚀',
    color: '#6366f1',
    zones: [
      { emoji: '🌌', label: 'Upper Galaxy', hint: 'Blast through the top teeth — front and back!' },
      { emoji: '🪐', label: 'Lower Galaxy',  hint: 'Launch to the bottom teeth — front and back!' },
    ],
    zoneSwitchMsgs: [
      'Galaxy halfway point! Keep blasting! 🚀',
      "You're an astronaut brusher! 👨‍🚀",
      'Houston, we have clean teeth! 🛸',
      'Halfway to the stars! Keep going! ✨',
    ],
    almostDoneMsgs: [
      'Almost back at base! 🚀',
      'Final orbit — hang on! 🛸',
      'Countdown to clean teeth! 3…2…1… 🌟',
      'Space hero — almost done! 👾',
    ],
  },

  ocean: {
    key: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    color: '#0ea5e9',
    zones: [
      { emoji: '🐠', label: 'Surface Waters', hint: 'Dive through the top teeth — front and back!' },
      { emoji: '🦈', label: 'Deep Ocean',     hint: 'Now dive to the bottom teeth — front and back!' },
    ],
    zoneSwitchMsgs: [
      'Dive to the deep waters! 🌊',
      'Halfway there, little mermaid! 🧜',
      'Splashing good job! Keep going! 🐟',
      'Ocean explorer — halfway done! 🐙',
    ],
    almostDoneMsgs: [
      'Almost ashore! 🏄',
      'Final splash — keep going! 🌊',
      'Surface in a few seconds! 🐠',
      'Almost back on the beach! 🦀',
    ],
  },

  jungle: {
    key: 'jungle',
    label: 'Jungle',
    emoji: '🌿',
    color: '#22c55e',
    zones: [
      { emoji: '🦜', label: 'Treetops',     hint: 'Swing through the top teeth — front and back!' },
      { emoji: '🐊', label: 'Forest Floor', hint: 'Now stomp through the bottom teeth — front and back!' },
    ],
    zoneSwitchMsgs: [
      'Swing to the forest floor! 🐒',
      'Halfway through the jungle! 🌿',
      'Jungle explorer — halfway there! 🦁',
      'Almost to the river — keep going! 🐊',
    ],
    almostDoneMsgs: [
      "Almost at the jungle's end! 🌟",
      'Final vines — keep swinging! 🦜',
      'Nearly through the thicket! 🌿',
      'Jungle champion — almost done! 🏆',
    ],
  },
};

export const THEME_ORDER: BrushThemeKey[] = ['default', 'space', 'ocean', 'jungle'];
