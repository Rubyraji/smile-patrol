/**
 * pet-sprite.tsx — drawn pet characters with a proper walk cycle.
 *
 * Animation principles applied:
 *  - Asymmetric leg timing: quick forward recovery swing (38% of period),
 *    slow backward power stroke (62%). Feels alive, not robotic.
 *  - Body bob synced to stride: slight dip on footfall, rise at mid-stride.
 *  - Body sway: side-to-side roll at stride frequency adds weight & character.
 *  - Knee curve on legs using quadratic bezier path instead of a flat rect.
 *  - Ground shadow anchors the pet to the floor.
 *  - Soft highlight ellipse on body gives subtle 3-D depth.
 *  - Sitting state: legs relax, species-specific idle animation.
 *  - Cat blinks occasionally when sitting.
 */

import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import type { PetSpecies } from '@/lib/store';

interface SpriteProps { color: string; speed: number; walking: boolean; }

// ─── Shared helpers ──────────────────────────────────────────────────────────

/**
 * A single leg.
 * @param knee  Lateral bend of the knee (+ve = right, -ve = left). Gives a
 *              curved, organic shape instead of a flat rectangle.
 */
function Leg({
  hx, hy, color, phase, dur, len = 14, w = 5, walking = true, knee = 0,
}: {
  hx: number; hy: number; color: string; phase: 1 | -1; dur: number;
  len?: number; w?: number; walking?: boolean; knee?: number;
}) {
  return (
    <motion.g
      style={{ transformOrigin: `${hx}px ${hy}px` }}
      animate={{ rotate: walking ? [phase * -30, phase * 30, phase * -30] : 0 }}
      transition={
        walking
          ? {
              duration: dur,
              times: [0, 0.38, 1],          // quick swing, slow push
              ease: ['easeOut', 'easeIn'] as Easing[],
              repeat: Infinity,
            }
          : { duration: 0.35, ease: 'easeOut' as Easing }
      }
    >
      {/* Knee-curved leg */}
      <path
        d={`M ${hx} ${hy} Q ${hx + knee} ${hy + len * 0.55} ${hx} ${hy + len}`}
        stroke={color} strokeWidth={w} strokeLinecap="round" fill="none"
      />
      {/* Foot */}
      <circle cx={hx} cy={hy + len} r={w * 0.55} fill={color} />
    </motion.g>
  );
}

// Natural quadruped body bob: slight dip on footfall → rise at mid-stride
const quadBob = (walking: boolean, p: number) => ({
  animate: { y: walking ? [0, 1.5, -4, 1.5, 0] : [0, -1.5, 0] },
  transition: walking
    ? {
        duration: p,
        times: [0, 0.18, 0.5, 0.82, 1],
        ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] as Easing[],
        repeat: Infinity,
      }
    : { duration: 2, repeat: Infinity, ease: 'easeInOut' as Easing },
});

// ─── CAT ─────────────────────────────────────────────────────────────────────
function CatSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.38 / speed;
  const bob = quadBob(walking, p);
  return (
    <svg viewBox="0 0 90 74" width="90" height="74" overflow="visible">
      {/* Ground shadow */}
      <motion.ellipse
        cx="40" cy="68" rx="24" ry="3"
        fill="rgba(0,0,0,0.09)"
        animate={bob.animate}
        transition={bob.transition}
        style={{ scaleY: -1 }} // shadow stays down while body rises
      />

      {/* Body sway — side-to-side lean at stride frequency */}
      <motion.g
        style={{ transformOrigin: '40px 50px' }}
        animate={{ rotate: walking ? [-2.5, 2.5, -2.5] : 0 }}
        transition={
          walking
            ? { duration: p, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.4, ease: 'easeOut' }
        }
      >
        {/* Whole-body bob — tail is INSIDE so it never detaches */}
        <motion.g {...bob}>
          {/* Tail */}
          <motion.path
            d="M 20 44 C 6 38 1 24 9 13 C 13 7 21 11 18 19"
            stroke={color} strokeWidth="5.5" strokeLinecap="round" fill="none"
            style={{ transformOrigin: '20px 44px' }}
            animate={{ rotate: walking ? [-14, 14, -14] : [-26, 26, -26] }}
            transition={{
              duration: walking ? p * 2.2 : 0.85,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Back legs — knee bends backward */}
          <Leg hx={29} hy={52} color={color} phase={1}  dur={p} knee={-3} walking={walking} />
          <Leg hx={35} hy={52} color={color} phase={-1} dur={p} knee={-3} walking={walking} />

          {/* Body */}
          <ellipse cx="38" cy="44" rx="18" ry="12" fill={color} />
          {/* Body highlight */}
          <ellipse cx="41" cy="38" rx="9" ry="5.5" fill="rgba(255,255,255,0.22)" />

          {/* Front legs — knee bends forward */}
          <Leg hx={46} hy={52} color={color} phase={-1} dur={p} knee={3} walking={walking} />
          <Leg hx={52} hy={52} color={color} phase={1}  dur={p} knee={3} walking={walking} />

          {/* Neck */}
          <ellipse cx="52" cy="37" rx="7" ry="9" fill={color} />

          {/* Head — tilts curiously when sitting */}
          <motion.g
            style={{ transformOrigin: '56px 26px' }}
            animate={{ rotate: walking ? 0 : [0, 10, 0, -5, 0] }}
            transition={
              walking
                ? { duration: 0 }
                : { duration: 2.0, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <circle cx="56" cy="26" r="13" fill={color} />
            {/* Head highlight */}
            <ellipse cx="58" cy="20" rx="6" ry="4" fill="rgba(255,255,255,0.2)" />

            {/* Ears — tips well above the head */}
            <path d="M 43 19 L 47 3 L 55 18 Z" fill={color} />
            <path d="M 45 19 L 47 7 L 54 18 Z" fill="rgba(255,255,255,0.28)" />
            <path d="M 58 17 L 63 2 L 70 18 Z" fill={color} />
            <path d="M 60 17 L 63 6 L 69 18 Z" fill="rgba(255,255,255,0.28)" />

            {/* Eye — blinks when sitting */}
            <motion.g
              style={{ transformOrigin: '60px 25px' }}
              animate={!walking ? { scaleY: [1, 1, 1, 0.06, 1, 1, 1, 1, 1, 1] } : { scaleY: 1 }}
              transition={!walking ? { duration: 4.5, repeat: Infinity } : { duration: 0.15 }}
            >
              <circle cx="60" cy="25" r="4" fill="#1a1a2e" />
              <circle cx="61.4" cy="23.7" r="1.4" fill="white" />
            </motion.g>

            {/* Nose */}
            <ellipse cx="56" cy="30" rx="2" ry="1.3" fill="rgba(220,80,100,0.75)" />

            {/* Whiskers */}
            <line x1="58" y1="29"   x2="72" y2="26"   stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
            <line x1="58" y1="30.5" x2="73" y2="30.5" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
            <line x1="58" y1="32"   x2="72" y2="34"   stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ─── DOG ─────────────────────────────────────────────────────────────────────
function DogSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.34 / speed;
  const bob = quadBob(walking, p);
  return (
    <svg viewBox="0 0 90 74" width="90" height="74" overflow="visible">
      <motion.ellipse cx="42" cy="68" rx="26" ry="3" fill="rgba(0,0,0,0.09)"
        animate={bob.animate} transition={bob.transition} style={{ scaleY: -1 }}
      />

      <motion.g
        style={{ transformOrigin: '40px 50px' }}
        animate={{ rotate: walking ? [-2.5, 2.5, -2.5] : 0 }}
        transition={walking ? { duration: p, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      >
        <motion.g {...bob}>
          {/* Tail — happy wag, even faster when sitting */}
          <motion.path
            d="M 20 44 C 12 36 14 26 20 22"
            stroke={color} strokeWidth="6" strokeLinecap="round" fill="none"
            style={{ transformOrigin: '20px 44px' }}
            animate={{ rotate: [-28, 28, -28] }}
            transition={{ duration: walking ? p * 1.0 : 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Leg hx={28} hy={53} color={color} phase={1}  dur={p} len={15} w={6} knee={-3} walking={walking} />
          <Leg hx={35} hy={53} color={color} phase={-1} dur={p} len={15} w={6} knee={-3} walking={walking} />

          {/* Body */}
          <ellipse cx="38" cy="43" rx="19" ry="14" fill={color} />
          <ellipse cx="41" cy="36" rx="10" ry="6.5" fill="rgba(255,255,255,0.2)" />

          <Leg hx={46} hy={53} color={color} phase={-1} dur={p} len={15} w={6} knee={3} walking={walking} />
          <Leg hx={53} hy={53} color={color} phase={1}  dur={p} len={15} w={6} knee={3} walking={walking} />

          <ellipse cx="53" cy="36" rx="8" ry="9" fill={color} />
          <circle cx="57" cy="25" r="14" fill={color} />
          <ellipse cx="60" cy="19" rx="7" ry="4.5" fill="rgba(255,255,255,0.2)" />

          {/* Floppy ears — swing with stride, flap more when sitting */}
          <motion.path
            d="M 46 18 Q 40 24 42 36 Q 44 40 46 36 Q 44 26 48 20 Z"
            fill={`${color}cc`}
            style={{ transformOrigin: '47px 18px' }}
            animate={{ rotate: walking ? [-6, 6, -6] : [-14, 14, -14] }}
            transition={{ duration: walking ? p * 1.3 : 0.65, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 68 18 Q 74 24 72 36 Q 70 40 68 36 Q 70 26 66 20 Z"
            fill={`${color}cc`}
            style={{ transformOrigin: '67px 18px' }}
            animate={{ rotate: walking ? [6, -6, 6] : [14, -14, 14] }}
            transition={{ duration: walking ? p * 1.3 : 0.65, repeat: Infinity, ease: 'easeInOut' }}
          />

          <circle cx="52" cy="22" r="4.5" fill="#1a1a2e" />
          <circle cx="53.6" cy="20.7" r="1.6" fill="white" />
          <circle cx="63" cy="22" r="4.5" fill="#1a1a2e" />
          <circle cx="64.6" cy="20.7" r="1.6" fill="white" />

          <ellipse cx="57" cy="28" rx="3.5" ry="2.5" fill="rgba(60,30,10,0.7)" />
          <line x1="57" y1="30.5" x2="57" y2="34" stroke="rgba(60,30,10,0.45)" strokeWidth="1.5" strokeLinecap="round" />

          <motion.path
            d="M 53 34 Q 57 39 61 34"
            stroke="none" fill="rgba(230,80,100,0.9)"
            animate={{ d: walking
              ? ['M 53 34 Q 57 38 61 34', 'M 53 34 Q 57 40 61 34', 'M 53 34 Q 57 38 61 34']
              : ['M 53 34 Q 57 40 61 34', 'M 53 34 Q 57 43 61 34', 'M 53 34 Q 57 40 61 34']
            }}
            transition={{ duration: walking ? p * 1.5 : 0.7, repeat: Infinity }}
          />
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ─── AXOLOTL ─────────────────────────────────────────────────────────────────
function AxolotlSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.48 / speed;
  // Axolotl has a very low body — gentle undulation, no big bob
  return (
    <svg viewBox="0 0 96 70" width="96" height="70" overflow="visible">
      <ellipse cx="44" cy="66" rx="30" ry="2.5" fill="rgba(0,0,0,0.08)" />

      {/* Lateral undulation — the whole body snakes side-to-side */}
      <motion.g
        style={{ transformOrigin: '44px 46px' }}
        animate={{ rotate: walking ? [-3, 3, -3] : 0 }}
        transition={walking ? { duration: p, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
      >
        <motion.g
          animate={{ y: walking ? [0, -1.5, 0] : [0, -1, 0] }}
          transition={{
            duration: walking ? p : 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Tail fan */}
          <motion.path
            d="M 14 46 C 4 44 1 36 5 30 C 8 26 12 30 12 36"
            stroke={color} strokeWidth="7" strokeLinecap="round" fill="none"
            style={{ transformOrigin: '14px 46px' }}
            animate={{ rotate: [-14, 14, -14] }}
            transition={{ duration: p * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Leg hx={24} hy={51} color={color} phase={1}  dur={p} len={10} w={6} knee={-2} walking={walking} />
          <Leg hx={32} hy={51} color={color} phase={-1} dur={p} len={10} w={6} knee={-2} walking={walking} />

          {/* Long flat body */}
          <ellipse cx="44" cy="46" rx="26" ry="10" fill={color} />
          <ellipse cx="46" cy="41" rx="14" ry="5" fill="rgba(255,255,255,0.2)" />

          <Leg hx={54} hy={51} color={color} phase={-1} dur={p} len={10} w={6} knee={2} walking={walking} />
          <Leg hx={62} hy={51} color={color} phase={1}  dur={p} len={10} w={6} knee={2} walking={walking} />

          {/* Head */}
          <circle cx="68" cy="43" r="11" fill={color} />
          <ellipse cx="70" cy="38" rx="5" ry="3.5" fill="rgba(255,255,255,0.22)" />

          {/* Gills — each sways with a phase offset */}
          {[60, 67, 74].map((gx, i) => (
            <motion.path key={i}
              d={`M ${gx} 34 Q ${gx - 4 + i * 2} 23 ${gx - 1 + i * 2} 17`}
              stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"
              style={{ transformOrigin: `${gx}px 34px` }}
              animate={{ rotate: [-(12 - i * 3), (12 - i * 3), -(12 - i * 3)] }}
              transition={{
                duration: p * 1.1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.1,
              }}
            />
          ))}
          {([[58, 17], [65, 13], [73, 15]] as [number, number][]).map(([gx, gy], i) => (
            <circle key={i} cx={gx} cy={gy} r="2.8" fill={color} />
          ))}

          {/* Big bulgy eyes */}
          <circle cx="63" cy="35" r="5.5" fill="white" />
          <motion.circle cx="64" cy="35" r="3.5" fill="#1a1a2e"
            animate={!walking ? { scaleY: [1, 1, 1, 0.08, 1, 1, 1] } : { scaleY: 1 }}
            transition={!walking ? { duration: 3.5, repeat: Infinity } : { duration: 0.15 }}
            style={{ transformOrigin: '64px 35px' }}
          />
          <circle cx="64.8" cy="33.8" r="1.3" fill="white" />

          <circle cx="73" cy="35" r="5.5" fill="white" />
          <circle cx="74" cy="35" r="3.5" fill="#1a1a2e" />
          <circle cx="74.8" cy="33.8" r="1.3" fill="white" />

          <path d="M 63 46 Q 68 50 73 46" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ─── DINO (brachiosaurus) ────────────────────────────────────────────────────
function DinoSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.44 / speed;
  const bob = quadBob(walking, p);
  return (
    <svg viewBox="0 0 90 78" width="90" height="78" overflow="visible">
      <motion.ellipse cx="40" cy="72" rx="26" ry="3" fill="rgba(0,0,0,0.09)"
        animate={bob.animate} transition={bob.transition} style={{ scaleY: -1 }}
      />

      <motion.g
        style={{ transformOrigin: '40px 52px' }}
        animate={{ rotate: walking ? [-2, 2, -2] : 0 }}
        transition={walking ? { duration: p, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      >
        <motion.g {...bob}>
          {/* Tail — heavy and slow */}
          <motion.path
            d="M 20 46 C 8 50 2 46 4 37"
            stroke={color} strokeWidth="7" strokeLinecap="round" fill="none"
            style={{ transformOrigin: '20px 46px' }}
            animate={{ rotate: [-9, 9, -9] }}
            transition={{ duration: p * 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Leg hx={26} hy={52} color={color} phase={1}  dur={p} len={16} w={7} knee={-4} walking={walking} />
          <Leg hx={34} hy={52} color={color} phase={-1} dur={p} len={16} w={7} knee={-4} walking={walking} />

          <ellipse cx="38" cy="44" rx="18" ry="14" fill={color} />
          <ellipse cx="42" cy="36" rx="10" ry="6" fill="rgba(255,255,255,0.2)" />

          <Leg hx={46} hy={52} color={color} phase={-1} dur={p} len={16} w={7} knee={4} walking={walking} />
          <Leg hx={54} hy={52} color={color} phase={1}  dur={p} len={16} w={7} knee={4} walking={walking} />

          {/* Long neck — sways with stride; nods down to graze when sitting */}
          <motion.g
            style={{ transformOrigin: '52px 40px' }}
            animate={{ rotate: walking ? [-4, 4, -4] : [0, 14, 0] }}
            transition={{
              duration: walking ? p * 2.8 : 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M 52 44 Q 56 34 60 24 Q 63 16 68 10"
              stroke={color} strokeWidth="12" strokeLinecap="round" fill="none"
            />
            {/* Head */}
            <ellipse cx="68" cy="10" rx="9" ry="7" fill={color} />
            <ellipse cx="71" cy="6" rx="4.5" ry="3" fill="rgba(255,255,255,0.22)" />
            {/* Eye */}
            <circle cx="73" cy="8" r="3.5" fill="#1a1a2e" />
            <circle cx="74.4" cy="7" r="1.2" fill="white" />
            <circle cx="76.5" cy="11.5" r="1.3" fill="rgba(0,0,0,0.18)" />
            <path d="M 68 14 Q 72 17 76 14" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Spines */}
            {([[57, 28, 8], [62, 18, 7], [66, 10, 6]] as [number,number,number][]).map(([sx, sy, sh], i) => (
              <polygon key={i} points={`${sx},${sy} ${sx - 3},${sy - sh} ${sx + 3},${sy - sh}`}
                fill={`${color}bb`} />
            ))}
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ─── UNICORN ─────────────────────────────────────────────────────────────────
function UnicornSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.33 / speed;
  const bob = quadBob(walking, p);
  return (
    <svg viewBox="0 0 92 74" width="92" height="74" overflow="visible">
      <motion.ellipse cx="40" cy="68" rx="27" ry="3" fill="rgba(0,0,0,0.08)"
        animate={bob.animate} transition={bob.transition} style={{ scaleY: -1 }}
      />

      <motion.g
        style={{ transformOrigin: '40px 50px' }}
        animate={{ rotate: walking ? [-2, 2, -2] : 0 }}
        transition={walking ? { duration: p, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      >
        <motion.g {...bob}>
          {/* Multi-strand flowing tail */}
          <motion.g style={{ transformOrigin: '20px 44px' }}
            animate={{ rotate: [-18, 18, -18] }}
            transition={{ duration: p * 1.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M 20 44 C 8 38 4 26 10 18" stroke="#f0abfc" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <path d="M 20 44 C 5 42 2 30 8 22"  stroke="#818cf8" strokeWidth="4"   strokeLinecap="round" fill="none" />
            <path d="M 20 44 C 6 47 4 36 12 28" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </motion.g>

          {/* Back legs — long elegant */}
          <Leg hx={28} hy={52} color={color} phase={1}  dur={p} len={18} w={4.5} knee={-2} walking={walking} />
          <Leg hx={34} hy={52} color={color} phase={-1} dur={p} len={18} w={4.5} knee={-2} walking={walking} />

          <ellipse cx="38" cy="43" rx="20" ry="12" fill={color} />
          <ellipse cx="42" cy="37" rx="11" ry="5.5" fill="rgba(255,255,255,0.22)" />

          <Leg hx={47} hy={52} color={color} phase={-1} dur={p} len={18} w={4.5} knee={2} walking={walking} />
          <Leg hx={53} hy={52} color={color} phase={1}  dur={p} len={18} w={4.5} knee={2} walking={walking} />

          <ellipse cx="54" cy="35" rx="7" ry="10" fill={color} transform="rotate(-10 54 45)" />

          {/* Head — tosses mane when sitting */}
          <motion.g
            style={{ transformOrigin: '59px 24px' }}
            animate={{ rotate: walking ? 0 : [-7, 7, -7] }}
            transition={walking ? { duration: 0 } : { duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="59" cy="24" r="12" fill={color} />
            <ellipse cx="62" cy="18" rx="6" ry="3.5" fill="rgba(255,255,255,0.22)" />

            {/* Horn */}
            <motion.g style={{ transformOrigin: '58px 24px' }}
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: p * 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M 56 22 L 59 5 L 62 22 Z" fill="#fbbf24" />
              <path d="M 58 22 L 59 6 L 61 22 Z" fill="#fde68a" />
            </motion.g>

            {/* Mane — flowing strands */}
            <motion.g style={{ transformOrigin: '52px 28px' }}
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: p * 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M 51 26 C 44 21 43 33 48 37 C 43 35 41 45 48 47" stroke="#f0abfc" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M 51 26 C 47 18 44 30 50 35 C 45 34 43 43 50 46" stroke="#818cf8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 51 26 C 49 20 47 31 52 36 C 48 35 47 43 53 46" stroke="#fb7185" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </motion.g>

            <circle cx="63" cy="22" r="4" fill="#1a1a2e" />
            <circle cx="64.4" cy="20.8" r="1.5" fill="white" />
            <ellipse cx="59" cy="29" rx="1.8" ry="1.2" fill="rgba(180,80,160,0.5)" />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ─── ALIEN ────────────────────────────────────────────────────────────────────
function AlienSprite({ color, speed, walking }: SpriteProps) {
  const p = 0.4 / speed;
  return (
    <svg viewBox="0 0 86 74" width="86" height="74" overflow="visible">
      <ellipse cx="42" cy="68" rx="28" ry="3" fill="rgba(0,0,0,0.08)" />

      {/* Antennae outside the body bob so they sway independently */}
      <motion.g style={{ transformOrigin: '37px 30px' }}
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: p * 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M 37 30 Q 32 22 28 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <motion.circle cx="28" cy="11" r="4"
          fill={color}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: p * 1.5, repeat: Infinity }}
        />
      </motion.g>
      <motion.g style={{ transformOrigin: '47px 28px' }}
        animate={{ rotate: [10, -10, 10] }}
        transition={{ duration: p * 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M 47 28 Q 52 20 56 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <motion.circle cx="56" cy="9" r="4"
          fill={color}
          animate={{ scale: [1.3, 1, 1.3] }}
          transition={{ duration: p * 1.5, repeat: Infinity }}
        />
      </motion.g>

      <motion.g
        animate={{ y: walking ? [0, -3, 0] : [0, -2, 0] }}
        transition={{
          duration: walking ? p * 0.7 : 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Six tentacle legs — ripple in a wave */}
        {([22, 30, 38, 46, 54, 62] as number[]).map((lx, i) => (
          <Leg key={i} hx={lx} hy={54} color={color}
            phase={i % 2 === 0 ? 1 : -1}
            dur={p * (0.85 + i * 0.06)}
            len={11} w={4}
            knee={i % 2 === 0 ? -2 : 2}
            walking={walking}
          />
        ))}

        {/* Body blob */}
        <ellipse cx="42" cy="44" rx="22" ry="16" fill={color} />
        <ellipse cx="42" cy="34" rx="18" ry="14" fill={color} />
        <ellipse cx="44" cy="27" rx="10" ry="7" fill="rgba(255,255,255,0.18)" />

        {/* Eyes */}
        <ellipse cx="34" cy="30" rx="8.5" ry="11" fill="rgba(0,0,0,0.72)" />
        <ellipse cx="50" cy="30" rx="8.5" ry="11" fill="rgba(0,0,0,0.72)" />
        {/* Irises */}
        <motion.ellipse cx="34" cy="31" rx="5" ry="6.5" fill={`${color}88`}
          animate={{ scaleY: [1, 0.7, 1] }}
          transition={{ duration: p * 3, repeat: Infinity }}
          style={{ transformOrigin: '34px 31px' }}
        />
        <motion.ellipse cx="50" cy="31" rx="5" ry="6.5" fill={`${color}88`}
          animate={{ scaleY: [0.7, 1, 0.7] }}
          transition={{ duration: p * 3, repeat: Infinity }}
          style={{ transformOrigin: '50px 31px' }}
        />
        <circle cx="36" cy="26" r="3.5" fill="rgba(255,255,255,0.75)" />
        <circle cx="52" cy="26" r="3.5" fill="rgba(255,255,255,0.75)" />

        {/* Squiggly mouth */}
        <motion.path
          d="M 34 46 Q 38 51 42 46 Q 46 41 50 46"
          stroke="rgba(0,0,0,0.32)" strokeWidth="1.8" fill="none" strokeLinecap="round"
          animate={{ d: [
            'M 34 46 Q 38 51 42 46 Q 46 41 50 46',
            'M 34 46 Q 38 41 42 46 Q 46 51 50 46',
            'M 34 46 Q 38 51 42 46 Q 46 41 50 46',
          ]}}
          transition={{ duration: p * 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <circle cx="30" cy="42" r="2.5" fill="rgba(255,255,255,0.18)" />
        <circle cx="54" cy="44" r="2"   fill="rgba(255,255,255,0.18)" />
        <circle cx="42" cy="51" r="2"   fill="rgba(255,255,255,0.18)" />
      </motion.g>
    </svg>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
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
