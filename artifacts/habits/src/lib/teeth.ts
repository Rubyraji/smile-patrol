// Pediatric dental eruption / shedding model used to render age-appropriate
// dental arches in the brushing timer and the kid editor.
//
// Eruption ages are simplified averages drawn from common pediatric charts.
// They are deliberately rounded — Toothbrush Hero is a brushing tracker, not a
// clinical tool. Parents can override individual teeth via `missingTeeth`.

export type ToothPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ToothSide = 'L' | 'R';
export type ToothArch = 'upper' | 'lower';
export type ToothShape = 'incisor' | 'canine' | 'premolar' | 'molar';
export type ToothPresence = 'absent' | 'primary' | 'permanent';

// The three surfaces of a tooth that get brushed.
//   outer  = buccal (cheek-side) for molars / facial (lip-side) for incisors
//   biting = occlusal (chewing) for molars / incisal (edge) for front teeth
//   inner  = palatal for upper teeth / lingual for lower teeth
export type ToothSurface = 'outer' | 'biting' | 'inner';

export const TOOTH_SURFACES: ToothSurface[] = ['outer', 'biting', 'inner'];

export type BrushedMap = Map<ToothId, Set<ToothSurface>>;

export type ToothId = string; // `${arch}-${side}-${position}`

export type Tooth = {
  id: ToothId;
  arch: ToothArch;
  side: ToothSide;
  position: ToothPosition;
  shape: ToothShape;
  label: string;
  presence: ToothPresence;
};

export const ALL_POSITIONS: ToothPosition[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const DEFAULT_AGE = 7;
export const MIN_AGE = 1;
export const MAX_AGE = 18;

export function toothIdOf(
  arch: ToothArch,
  side: ToothSide,
  position: ToothPosition,
): ToothId {
  return `${arch}-${side}-${position}`;
}

const SHAPE_BY_POSITION: Record<ToothPosition, ToothShape> = {
  1: 'incisor',
  2: 'incisor',
  3: 'canine',
  4: 'premolar',
  5: 'premolar',
  6: 'molar',
  7: 'molar',
  8: 'molar',
};

const POSITION_NAME: Record<ToothPosition, string> = {
  1: 'central incisor',
  2: 'lateral incisor',
  3: 'canine',
  4: 'first premolar',
  5: 'second premolar',
  6: 'first molar',
  7: 'second molar',
  8: 'third molar',
};

type Eruption = {
  primary?: { erupt: number; shed: number };
  permanent: { erupt: number };
};

const ERUPTION: Record<ToothArch, Record<ToothPosition, Eruption>> = {
  upper: {
    1: { primary: { erupt: 0.7, shed: 7 }, permanent: { erupt: 7 } },
    2: { primary: { erupt: 0.9, shed: 8 }, permanent: { erupt: 8 } },
    3: { primary: { erupt: 1.5, shed: 11 }, permanent: { erupt: 11 } },
    4: { primary: { erupt: 1.3, shed: 10 }, permanent: { erupt: 10 } },
    5: { primary: { erupt: 2.2, shed: 11 }, permanent: { erupt: 11 } },
    6: { permanent: { erupt: 6 } },
    7: { permanent: { erupt: 12 } },
    8: { permanent: { erupt: 18 } },
  },
  lower: {
    1: { primary: { erupt: 0.55, shed: 6 }, permanent: { erupt: 6 } },
    2: { primary: { erupt: 0.6, shed: 7 }, permanent: { erupt: 7 } },
    3: { primary: { erupt: 1.5, shed: 10 }, permanent: { erupt: 10 } },
    4: { primary: { erupt: 1.3, shed: 10 }, permanent: { erupt: 10 } },
    5: { primary: { erupt: 2.0, shed: 11 }, permanent: { erupt: 11 } },
    6: { permanent: { erupt: 6 } },
    7: { permanent: { erupt: 12 } },
    8: { permanent: { erupt: 18 } },
  },
};

function presenceForAge(
  arch: ToothArch,
  position: ToothPosition,
  age: number,
): ToothPresence {
  const e = ERUPTION[arch][position];
  if (e.primary && age >= e.primary.erupt && age < e.primary.shed) return 'primary';
  if (age >= e.permanent.erupt) return 'permanent';
  return 'absent';
}

export function getTeethForAge(
  age: number,
  missingOverrides: ToothId[] = [],
): Tooth[] {
  const missing = new Set(missingOverrides);
  const out: Tooth[] = [];
  for (const arch of ['upper', 'lower'] as ToothArch[]) {
    for (const side of ['L', 'R'] as ToothSide[]) {
      for (const position of ALL_POSITIONS) {
        const id = toothIdOf(arch, side, position);
        const presence: ToothPresence = missing.has(id)
          ? 'absent'
          : presenceForAge(arch, position, age);
        out.push({
          id,
          arch,
          side,
          position,
          shape: SHAPE_BY_POSITION[position],
          label: `${arch === 'upper' ? 'Upper' : 'Lower'} ${
            side === 'L' ? 'left' : 'right'
          } ${POSITION_NAME[position]}`,
          presence,
        });
      }
    }
  }
  return out;
}

// Order an arch's teeth as they appear from the viewer's left to right
// (i.e. patient's right side appears on the left, like looking at a face).
export function archOrder(arch: ToothArch, teeth: Tooth[]): Tooth[] {
  const inArch = teeth.filter((t) => t.arch === arch);
  const right = inArch
    .filter((t) => t.side === 'R')
    .sort((a, b) => b.position - a.position); // R8..R1
  const left = inArch
    .filter((t) => t.side === 'L')
    .sort((a, b) => a.position - b.position); // L1..L8
  return [...right, ...left];
}

export function countPresent(teeth: Tooth[]): number {
  return teeth.filter((t) => t.presence !== 'absent').length;
}

// Given the elapsed time (ms) of a brushing session, determine which surfaces
// have been brushed for each tooth.
//
// Schedule:
//   * 0..archDurationMs                  — upper arch sweep
//       inside it: 3 equal passes (outer → biting → inner)
//       each pass sweeps RHS to LHS through every present tooth in that arch
//   * archDurationMs..2*archDurationMs   — lower arch sweep, same 3 passes
export function computeBrushedSurfaces(
  elapsedMs: number,
  teeth: Tooth[],
  archDurationMs = 60_000,
): BrushedMap {
  const result: BrushedMap = new Map();
  const surfaceMs = archDurationMs / TOOTH_SURFACES.length;

  const fillArch = (arch: ToothArch, startMs: number) => {
    const present = archOrder(arch, teeth).filter((t) => t.presence !== 'absent');
    if (present.length === 0) return;
    const perTooth = surfaceMs / present.length;

    for (let s = 0; s < TOOTH_SURFACES.length; s++) {
      const surfaceStart = startMs + s * surfaceMs;
      const sElapsed = elapsedMs - surfaceStart;
      if (sElapsed <= 0) continue;
      const teethDone = Math.min(present.length, Math.floor(sElapsed / perTooth));
      for (let i = 0; i < teethDone; i++) {
        const id = present[i].id;
        let set = result.get(id);
        if (!set) {
          set = new Set<ToothSurface>();
          result.set(id, set);
        }
        set.add(TOOTH_SURFACES[s]);
      }
    }
  };

  fillArch('upper', 0);
  fillArch('lower', archDurationMs);

  return result;
}

// All present teeth fully brushed — used for the "completed" celebration state.
export function allBrushed(teeth: Tooth[]): BrushedMap {
  const result: BrushedMap = new Map();
  for (const t of teeth) {
    if (t.presence !== 'absent') {
      result.set(t.id, new Set<ToothSurface>(TOOTH_SURFACES));
    }
  }
  return result;
}
