import { motion } from 'framer-motion';
import type { PetSpecies } from '@/lib/store';

interface SpriteProps {
  color: string;
  speed: number;
  walking: boolean;
}

function Leg({
  hx, hy, color, phase, dur, len = 14, w = 5, walking = true,
}: {
  hx: number; hy: number; color: string; phase: 1 | -1; dur: number;
  len?: number; w?: number; walking?: boolean;
}) {
  return (
    <motion.g
      style={{ transformOrigin: `${hx}px ${hy}px` }}
      animate={{ rotate: walking ? [phase * -24, phase * 24, phase * -24] : 0 }}
      transition={
        walking
          ? { duration: dur, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.35, ease: 'easeOut' }
      }
    >
      <rect x={hx - w / 2} y={hy} width={w} height={len} rx={w / 2} fill={color} />
    </motion.g>
  );
}

function CatSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.38 / speed;
  return (
    <svg viewBox="0 0 90 72" width="90" height="72" overflow="visible">
      {/* Whole-body bob — tail is INSIDE this group so it stays attached */}
      <motion.g
        animate={{ y: walking ? [0, -2.5, 0] : [0, -1, 0] }}
        transition={{
          duration: walking ? p : 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Tail — inside body group, pivots from left of body */}
        <motion.path
          d="M 20 44 C 6 38 1 24 9 13 C 13 7 21 11 18 19"
          stroke={color} strokeWidth="5.5" strokeLinecap="round" fill="none"
          style={{ transformOrigin: '20px 44px' }}
          animate={{ rotate: walking ? [-14, 14, -14] : [-22, 22, -22] }}
          transition={{
            duration: walking ? p * 2.2 : 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Back legs */}
        <Leg hx={29} hy={52} color={color} phase={1}  dur={p} walking={walking} />
        <Leg hx={35} hy={52} color={color} phase={-1} dur={p} walking={walking} />

        {/* Body */}
        <ellipse cx="38" cy="44" rx="18" ry="12" fill={color} />

        {/* Front legs */}
        <Leg hx={46} hy={52} color={color} phase={-1} dur={p} walking={walking} />
        <Leg hx={52} hy={52} color={color} phase={1}  dur={p} walking={walking} />

        {/* Neck */}
        <ellipse cx="52" cy="37" rx="7" ry="9" fill={color} />

        {/* Head — tilts when sitting */}
        <motion.g
          style={{ transformOrigin: '56px 26px' }}
          animate={{ rotate: walking ? 0 : [0, 9, 0, -4, 0] }}
          transition={
            walking
              ? { duration: 0 }
              : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <circle cx="56" cy="26" r="13" fill={color} />

          {/* LEFT ear — tip well above the head */}
          <polygon points="47,3 43,19 54,18" fill={color} />
          <polygon points="47,7 45,18 53,17" fill="rgba(255,255,255,0.3)" />

          {/* RIGHT ear */}
          <polygon points="63,2 59,18 70,18" fill={color} />
          <polygon points="63,6 61,17 69,17" fill="rgba(255,255,255,0.3)" />

          {/* Eye */}
          <circle cx="60" cy="25" r="4" fill="#1a1a2e" />
          <circle cx="61.4" cy="23.7" r="1.4" fill="white" />

          {/* Nose */}
          <ellipse cx="56" cy="30" rx="2" ry="1.3" fill="rgba(220,80,100,0.75)" />

          {/* Whiskers */}
          <line x1="58" y1="29" x2="72" y2="26" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          <line x1="58" y1="30.5" x2="73" y2="30.5" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          <line x1="58" y1="32" x2="72" y2="34" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
        </motion.g>
      </motion.g>
    </svg>
  );
}

function DogSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.36 / speed;
  return (
    <svg viewBox="0 0 90 72" width="90" height="72" overflow="visible">
      <motion.g
        animate={{ y: walking ? [0, -3, 0] : [0, -1, 0] }}
        transition={{
          duration: walking ? p : 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Tail — short, upright, fast wag */}
        <motion.path
          d="M 20 44 C 12 36 14 26 20 22"
          stroke={color} strokeWidth="6" strokeLinecap="round" fill="none"
          style={{ transformOrigin: '20px 44px' }}
          animate={{ rotate: [-24, 24, -24] }}
          transition={{ duration: walking ? p * 1.1 : 0.35, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Back legs */}
        <Leg hx={28} hy={53} color={color} phase={1}  dur={p} len={15} w={6} walking={walking} />
        <Leg hx={35} hy={53} color={color} phase={-1} dur={p} len={15} w={6} walking={walking} />

        {/* Body */}
        <ellipse cx="38" cy="43" rx="19" ry="14" fill={color} />

        {/* Front legs */}
        <Leg hx={46} hy={53} color={color} phase={-1} dur={p} len={15} w={6} walking={walking} />
        <Leg hx={53} hy={53} color={color} phase={1}  dur={p} len={15} w={6} walking={walking} />

        {/* Neck */}
        <ellipse cx="53" cy="36" rx="8" ry="9" fill={color} />

        {/* Head */}
        <circle cx="57" cy="25" r="14" fill={color} />

        {/* Floppy ears — swing when sitting */}
        <motion.ellipse cx="47" cy="29" rx="5" ry="10" fill={`${color}cc`}
          transform="rotate(-15 47 20)" style={{ transformOrigin: '47px 20px' }}
          animate={{ rotate: walking ? [-5, 5, -5] : [-10, 10, -10] }}
          transition={{ duration: walking ? p * 1.4 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.ellipse cx="67" cy="29" rx="5" ry="10" fill={`${color}cc`}
          transform="rotate(15 67 20)" style={{ transformOrigin: '67px 20px' }}
          animate={{ rotate: walking ? [5, -5, 5] : [10, -10, 10] }}
          transition={{ duration: walking ? p * 1.4 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Eyes */}
        <circle cx="52" cy="22" r="4.5" fill="#1a1a2e" />
        <circle cx="53.6" cy="20.7" r="1.6" fill="white" />
        <circle cx="63" cy="22" r="4.5" fill="#1a1a2e" />
        <circle cx="64.6" cy="20.7" r="1.6" fill="white" />

        {/* Nose */}
        <ellipse cx="57" cy="28" rx="3.5" ry="2.5" fill="rgba(80,40,20,0.75)" />
        <line x1="57" y1="30.5" x2="57" y2="34" stroke="rgba(80,40,20,0.5)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tongue */}
        <motion.ellipse cx="57" cy="35" rx="3.5" ry="3" fill="rgba(230,80,100,0.9)"
          animate={{ scaleY: [1, 1.15, 1] }}
          transition={{ duration: p, repeat: Infinity }}
        />
      </motion.g>
    </svg>
  );
}

function AxolotlSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.5 / speed;
  return (
    <svg viewBox="0 0 96 70" width="96" height="70" overflow="visible">
      <motion.g
        animate={{ y: walking ? [0, -2, 0] : [0, -1, 0] }}
        transition={{
          duration: walking ? p : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Tail */}
        <motion.path
          d="M 14 46 C 4 42 2 34 6 30 C 10 26 14 30 14 34"
          stroke={color} strokeWidth="7" strokeLinecap="round" fill="none"
          style={{ transformOrigin: '14px 46px' }}
          animate={{ rotate: [-12, 12, -12] }}
          transition={{ duration: p * 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Short stubby legs */}
        <Leg hx={24} hy={51} color={color} phase={1}  dur={p} len={10} w={6} walking={walking} />
        <Leg hx={32} hy={51} color={color} phase={-1} dur={p} len={10} w={6} walking={walking} />

        {/* Body */}
        <ellipse cx="44" cy="46" rx="26" ry="10" fill={color} />

        <Leg hx={54} hy={51} color={color} phase={-1} dur={p} len={10} w={6} walking={walking} />
        <Leg hx={62} hy={51} color={color} phase={1}  dur={p} len={10} w={6} walking={walking} />

        {/* Head */}
        <circle cx="68" cy="43" r="11" fill={color} />

        {/* Gills — flutter individually */}
        {[60, 67, 74].map((gx, i) => (
          <motion.path key={i}
            d={`M ${gx} 34 Q ${gx - 5 + i * 3} 24 ${gx - 2 + i * 2} 18`}
            stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"
            style={{ transformOrigin: `${gx}px 34px` }}
            animate={{ rotate: [-(10 - i * 3), (10 - i * 3), -(10 - i * 3)] }}
            transition={{ duration: p * 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
          />
        ))}
        {[[58, 18], [65, 14], [73, 16]].map(([gx, gy], i) => (
          <circle key={i} cx={gx} cy={gy} r="2.5" fill={color} />
        ))}

        {/* Eyes */}
        <circle cx="63" cy="35" r="5.5" fill="white" />
        <circle cx="64" cy="35" r="3.5" fill="#1a1a2e" />
        <circle cx="64.8" cy="33.8" r="1.2" fill="white" />
        <circle cx="73" cy="35" r="5.5" fill="white" />
        <circle cx="74" cy="35" r="3.5" fill="#1a1a2e" />
        <circle cx="74.8" cy="33.8" r="1.2" fill="white" />

        {/* Smile */}
        <path d="M 63 46 Q 68 50 73 46" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

function DinoSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.44 / speed;
  return (
    <svg viewBox="0 0 90 75" width="90" height="75" overflow="visible">
      <motion.g
        animate={{ y: walking ? [0, -3, 0] : [0, -1, 0] }}
        transition={{
          duration: walking ? p : 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Tail */}
        <motion.path
          d="M 20 46 C 8 48 2 44 4 36"
          stroke={color} strokeWidth="7" strokeLinecap="round" fill="none"
          style={{ transformOrigin: '20px 46px' }}
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: p * 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Back legs */}
        <Leg hx={26} hy={52} color={color} phase={1}  dur={p} len={16} w={7} walking={walking} />
        <Leg hx={34} hy={52} color={color} phase={-1} dur={p} len={16} w={7} walking={walking} />

        {/* Body */}
        <ellipse cx="38" cy="44" rx="18" ry="14" fill={color} />

        {/* Front legs */}
        <Leg hx={46} hy={52} color={color} phase={-1} dur={p} len={16} w={7} walking={walking} />
        <Leg hx={54} hy={52} color={color} phase={1}  dur={p} len={16} w={7} walking={walking} />

        {/* Long neck — nods when sitting */}
        <motion.g
          style={{ transformOrigin: '52px 38px' }}
          animate={{ rotate: walking ? [-4, 4, -4] : [0, 12, 0] }}
          transition={{
            duration: walking ? p * 3 : 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ellipse cx="56" cy="30" rx="7" ry="10" fill={color} transform="rotate(-20 56 40)" />
          <ellipse cx="62" cy="18" rx="6" ry="10" fill={color} transform="rotate(-10 62 28)" />
          <ellipse cx="68" cy="10" rx="9" ry="7" fill={color} />
          <circle cx="73" cy="8" r="3" fill="#1a1a2e" />
          <circle cx="74.2" cy="7" r="1" fill="white" />
          <circle cx="76" cy="11" r="1.2" fill="rgba(0,0,0,0.2)" />
          <path d="M 68 14 Q 72 17 76 14" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {[[56, 22], [61, 14], [66, 7]].map(([sx, sy], i) => (
            <polygon key={i} points={`${sx},${sy} ${sx - 3},${sy - 7} ${sx + 3},${sy - 7}`}
              fill={`${color}aa`} />
          ))}
        </motion.g>
      </motion.g>
    </svg>
  );
}

function UnicornSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.35 / speed;
  return (
    <svg viewBox="0 0 90 74" width="90" height="74" overflow="visible">
      <motion.g
        animate={{ y: walking ? [0, -2.5, 0] : [0, -1, 0] }}
        transition={{
          duration: walking ? p : 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Flowing tail */}
        <motion.g style={{ transformOrigin: '20px 43px' }}
          animate={{ rotate: [-16, 16, -16] }}
          transition={{ duration: p * 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M 20 43 C 8 38 4 28 10 20" stroke="#f0abfc" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 20 43 C 5 42 2 32 8 24" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 20 43 C 6 46 4 36 12 28" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </motion.g>

        {/* Back legs */}
        <Leg hx={28} hy={52} color={color} phase={1}  dur={p} len={17} w={4.5} walking={walking} />
        <Leg hx={34} hy={52} color={color} phase={-1} dur={p} len={17} w={4.5} walking={walking} />

        {/* Body */}
        <ellipse cx="38" cy="43" rx="20" ry="12" fill={color} />

        {/* Front legs */}
        <Leg hx={47} hy={52} color={color} phase={-1} dur={p} len={17} w={4.5} walking={walking} />
        <Leg hx={53} hy={52} color={color} phase={1}  dur={p} len={17} w={4.5} walking={walking} />

        {/* Neck */}
        <ellipse cx="54" cy="35" rx="7" ry="10" fill={color} transform="rotate(-10 54 45)" />

        {/* Head — shakes mane when sitting */}
        <motion.g
          style={{ transformOrigin: '59px 24px' }}
          animate={{ rotate: walking ? 0 : [-6, 6, -6] }}
          transition={
            walking
              ? { duration: 0 }
              : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <circle cx="59" cy="24" r="12" fill={color} />

          {/* Horn */}
          <motion.g style={{ transformOrigin: '58px 24px' }}
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: p * 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <polygon points="56,12 60,13 60,24" fill="#fbbf24" />
            <polygon points="58,10 60,11 59,22" fill="#fde68a" />
          </motion.g>

          {/* Mane */}
          <motion.g style={{ transformOrigin: '52px 28px' }}
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: p * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M 52 28 C 46 22 44 32 48 36 C 44 34 42 44 48 46" stroke="#f0abfc" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 52 28 C 48 20 45 30 50 35 C 46 34 44 42 50 45" stroke="#818cf8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </motion.g>

          <circle cx="63" cy="22" r="4" fill="#1a1a2e" />
          <circle cx="64.4" cy="20.8" r="1.5" fill="white" />
          <ellipse cx="59" cy="29" rx="1.8" ry="1.2" fill="rgba(180,80,160,0.5)" />
        </motion.g>
      </motion.g>
    </svg>
  );
}

function AlienSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.42 / speed;
  return (
    <svg viewBox="0 0 86 72" width="86" height="72" overflow="visible">
      {/* Antennae */}
      <motion.g style={{ transformOrigin: '38px 28px' }}
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: p * 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="34" y1="28" x2="28" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="11" r="3.5" fill={color} />
      </motion.g>
      <motion.g style={{ transformOrigin: '44px 26px' }}
        animate={{ rotate: [8, -8, 8] }}
        transition={{ duration: p * 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="48" y1="26" x2="54" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="54" cy="9" r="3.5" fill={color} />
      </motion.g>

      <motion.g
        animate={{ y: walking ? [0, -3, 0] : [0, -2, 0] }}
        transition={{
          duration: walking ? p : 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {[22, 30, 38, 46, 54, 62].map((lx, i) => (
          <Leg key={i} hx={lx} hy={54} color={color}
            phase={i % 2 === 0 ? 1 : -1} dur={p * (0.9 + i * 0.05)}
            len={11} w={4} walking={walking}
          />
        ))}

        <ellipse cx="42" cy="44" rx="22" ry="16" fill={color} />
        <ellipse cx="42" cy="34" rx="18" ry="14" fill={color} />

        <ellipse cx="34" cy="30" rx="8" ry="10" fill="rgba(0,0,0,0.7)" />
        <ellipse cx="50" cy="30" rx="8" ry="10" fill="rgba(0,0,0,0.7)" />
        <circle cx="36" cy="26" r="3.5" fill="rgba(255,255,255,0.7)" />
        <circle cx="52" cy="26" r="3.5" fill="rgba(255,255,255,0.7)" />
        <circle cx="34" cy="31" r="4" fill="rgba(255,255,255,0.15)" />
        <circle cx="50" cy="31" r="4" fill="rgba(255,255,255,0.15)" />

        <motion.path
          d="M 34 46 Q 38 50 42 46 Q 46 42 50 46"
          stroke="rgba(0,0,0,0.3)" strokeWidth="1.8" fill="none" strokeLinecap="round"
          animate={{ d: [
            'M 34 46 Q 38 50 42 46 Q 46 42 50 46',
            'M 34 46 Q 38 42 42 46 Q 46 50 50 46',
            'M 34 46 Q 38 50 42 46 Q 46 42 50 46',
          ]}}
          transition={{ duration: p * 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <circle cx="30" cy="42" r="2.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="54" cy="44" r="2" fill="rgba(255,255,255,0.2)" />
        <circle cx="42" cy="50" r="2" fill="rgba(255,255,255,0.2)" />
      </motion.g>
    </svg>
  );
}

export interface PetSpriteProps {
  species: PetSpecies;
  color: string;
  speed: number;
  walking: boolean;
}

export function PetSprite({ species, color, speed, walking }: PetSpriteProps) {
  const props = { color, speed, walking };
  switch (species) {
    case 'cat':     return <CatSprite     {...props} />;
    case 'dog':     return <DogSprite     {...props} />;
    case 'axolotl': return <AxolotlSprite {...props} />;
    case 'dino':    return <DinoSprite    {...props} />;
    case 'unicorn': return <UnicornSprite {...props} />;
    case 'alien':   return <AlienSprite   {...props} />;
  }
}
