import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { archOrder, type Tooth, type ToothArch, type ToothId, type ToothShape } from '@/lib/teeth';
import { cn } from '@/lib/utils';

type Highlight = ToothArch | 'both' | 'none';

type Props = {
  teeth: Tooth[];
  highlight?: Highlight;
  highlightColor?: string;
  size?: number;
  onToothClick?: (id: ToothId) => void;
  interactive?: boolean;
  className?: string;
};

const TOOTH_DIMS: Record<ToothShape, { w: number; h: number; r: number }> = {
  incisor: { w: 12, h: 20, r: 4 },
  canine: { w: 14, h: 24, r: 6 },
  premolar: { w: 16, h: 20, r: 7 },
  molar: { w: 20, h: 22, r: 6 },
};

export function DentalArches({
  teeth,
  highlight = 'none',
  highlightColor = 'hsl(var(--primary))',
  size = 280,
  onToothClick,
  interactive = false,
  className,
}: Props) {
  const upper = useMemo(() => archOrder('upper', teeth), [teeth]);
  const lower = useMemo(() => archOrder('lower', teeth), [teeth]);

  const cx = size / 2;
  const archGap = size * 0.1;
  const upperCenterY = size / 2 - archGap / 2;
  const lowerCenterY = size / 2 + archGap / 2;
  const rx = size * 0.42;
  const ry = size * 0.3;

  const renderArch = (arch: ToothArch, archTeeth: Tooth[], centerY: number) => {
    const total = archTeeth.length;
    const isHighlighted = (presence: Tooth['presence']) =>
      presence !== 'absent' && (highlight === arch || highlight === 'both');

    return archTeeth.map((tooth, i) => {
      const t = total === 1 ? 0.5 : i / (total - 1);
      const angleDeg = 14 + 152 * t; // 14°..166°
      const angle = (angleDeg * Math.PI) / 180;
      const x = cx - rx * Math.cos(angle);
      const yOff = ry * Math.sin(angle);
      const y = arch === 'upper' ? centerY - yOff : centerY + yOff;
      const rot = arch === 'upper' ? angleDeg - 90 : 90 - angleDeg;
      const dims = TOOTH_DIMS[tooth.shape];
      const present = tooth.presence !== 'absent';
      const highlighted = isHighlighted(tooth.presence);
      const isPrimary = tooth.presence === 'primary';

      return (
        <g
          key={tooth.id}
          transform={`translate(${x} ${y}) rotate(${rot})`}
          onClick={interactive ? () => onToothClick?.(tooth.id) : undefined}
          className={cn(interactive && 'cursor-pointer')}
          aria-label={`${tooth.label} (${tooth.presence})`}
          data-testid={`tooth-${tooth.id}`}
        >
          {/* Larger invisible hit target for tapping in interactive mode */}
          {interactive && (
            <rect
              x={-dims.w / 2 - 4}
              y={-dims.h / 2 - 4}
              width={dims.w + 8}
              height={dims.h + 8}
              rx={dims.r + 4}
              fill="transparent"
            />
          )}
          {present ? (
            <motion.rect
              x={-dims.w / 2}
              y={-dims.h / 2}
              width={dims.w}
              height={dims.h}
              rx={dims.r}
              ry={dims.r}
              fill={highlighted ? highlightColor : '#ffffff'}
              stroke={
                highlighted
                  ? highlightColor
                  : isPrimary
                    ? 'hsl(var(--muted-foreground) / 0.55)'
                    : 'hsl(var(--muted-foreground) / 0.4)'
              }
              strokeWidth={highlighted ? 2 : 1.2}
              initial={false}
              animate={
                highlighted
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={
                highlighted
                  ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
            />
          ) : (
            <rect
              x={-dims.w / 2}
              y={-dims.h / 2}
              width={dims.w}
              height={dims.h}
              rx={dims.r}
              ry={dims.r}
              fill="none"
              stroke="hsl(var(--muted-foreground) / 0.35)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          )}
          {present && isPrimary && (
            <circle
              r={1.6}
              cx={0}
              cy={dims.h / 2 - 4}
              fill={highlighted ? '#ffffff' : highlightColor}
              opacity={0.75}
            />
          )}
        </g>
      );
    });
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Dental arches"
    >
      {/* Faint mouth-line between arches */}
      <line
        x1={cx - rx * 0.95}
        y1={size / 2}
        x2={cx + rx * 0.95}
        y2={size / 2}
        stroke="hsl(var(--muted-foreground) / 0.2)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      {renderArch('upper', upper, upperCenterY)}
      {renderArch('lower', lower, lowerCenterY)}
    </svg>
  );
}
