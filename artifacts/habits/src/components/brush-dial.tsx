import { motion } from 'framer-motion';

type Props = {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  pulse?: boolean;
};

export function BrushDial({
  progress,
  size = 300,
  strokeWidth = 22,
  color,
  trackColor = 'hsl(var(--primary) / 0.10)',
  children,
  pulse = false,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c - clamped * c;
  const fill = color ?? 'hsl(var(--primary))';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        animate={pulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={pulse ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <defs>
          <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fill} stopOpacity="0.85" />
            <stop offset="100%" stopColor={fill} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#dialGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 200ms linear' }}
        />
      </motion.svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
