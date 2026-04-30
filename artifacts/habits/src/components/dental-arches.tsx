import { useId, useMemo } from 'react';
import {
  TOOTH_SURFACES,
  archOrder,
  type BrushedMap,
  type Tooth,
  type ToothArch,
  type ToothId,
  type ToothShape,
  type ToothSurface,
} from '@/lib/teeth';
import { cn } from '@/lib/utils';

type Props = {
  teeth: Tooth[];
  /**
   * Map of tooth id → set of surfaces that have been brushed. When omitted,
   * all teeth render in their unbrushed state.
   */
  brushedSurfaces?: BrushedMap;
  /** Color used to fill brushed surfaces (typically the kid's color). */
  brushColor?: string;
  size?: number;
  onToothClick?: (id: ToothId) => void;
  interactive?: boolean;
  className?: string;
};

const TOOTH_DIMS: Record<ToothShape, { w: number; h: number; r: number }> = {
  incisor: { w: 14, h: 22, r: 5 },
  canine: { w: 15, h: 24, r: 6 },
  premolar: { w: 18, h: 22, r: 7 },
  molar: { w: 22, h: 24, r: 7 },
};

// Band proportions of tooth height: outer / biting / inner.
const BAND_RATIOS: Record<ToothShape, [number, number, number]> = {
  incisor: [0.36, 0.28, 0.36],
  canine: [0.36, 0.28, 0.36],
  premolar: [0.3, 0.4, 0.3],
  molar: [0.27, 0.46, 0.27],
};

const EMPTY_BRUSHED = new Set<ToothSurface>();

export function DentalArches({
  teeth,
  brushedSurfaces,
  brushColor = 'hsl(var(--primary))',
  size = 280,
  onToothClick,
  interactive = false,
  className,
}: Props) {
  const upper = useMemo(() => archOrder('upper', teeth), [teeth]);
  const lower = useMemo(() => archOrder('lower', teeth), [teeth]);
  const reactId = useId();

  const cx = size / 2;
  const archGap = size * 0.1;
  const upperCenterY = size / 2 - archGap / 2;
  const lowerCenterY = size / 2 + archGap / 2;
  const rx = size * 0.42;
  const ry = size * 0.3;

  const renderArch = (arch: ToothArch, archTeeth: Tooth[], centerY: number) => {
    const total = archTeeth.length;

    return archTeeth.map((tooth, i) => {
      const t = total === 1 ? 0.5 : i / (total - 1);
      const angleDeg = 14 + 152 * t; // 14°..166°
      const angle = (angleDeg * Math.PI) / 180;
      const x = cx - rx * Math.cos(angle);
      const yOff = ry * Math.sin(angle);
      const y = arch === 'upper' ? centerY - yOff : centerY + yOff;
      const rot = arch === 'upper' ? angleDeg - 90 : 90 - angleDeg;

      return (
        <ToothGlyph
          key={tooth.id}
          tooth={tooth}
          x={x}
          y={y}
          rot={rot}
          brushed={brushedSurfaces?.get(tooth.id) ?? EMPTY_BRUSHED}
          brushColor={brushColor}
          interactive={interactive}
          onClick={interactive ? onToothClick : undefined}
          clipIdPrefix={reactId}
        />
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

type ToothGlyphProps = {
  tooth: Tooth;
  x: number;
  y: number;
  rot: number;
  brushed: Set<ToothSurface>;
  brushColor: string;
  interactive: boolean;
  onClick?: (id: ToothId) => void;
  clipIdPrefix: string;
};

function ToothGlyph({
  tooth,
  x,
  y,
  rot,
  brushed,
  brushColor,
  interactive,
  onClick,
  clipIdPrefix,
}: ToothGlyphProps) {
  const dims = TOOTH_DIMS[tooth.shape];
  const present = tooth.presence !== 'absent';
  const isPrimary = tooth.presence === 'primary';

  // Within local tooth coords (after rotation):
  //   * Upper teeth: -y points OUT of the mouth (cheek/lip side),
  //                  +y points INTO the mouth (palate side)
  //   * Lower teeth: -y points INTO the mouth (tongue side),
  //                  +y points OUT of the mouth (cheek/lip side)
  // So the "top" band of the rect is `outer` for the upper arch and `inner`
  // for the lower arch, and vice versa for the "bottom" band.
  const topSurface: ToothSurface = tooth.arch === 'upper' ? 'outer' : 'inner';
  const bottomSurface: ToothSurface = tooth.arch === 'upper' ? 'inner' : 'outer';

  const [topRatio, midRatio, bottomRatio] = BAND_RATIOS[tooth.shape];
  const topH = dims.h * topRatio;
  const midH = dims.h * midRatio;
  const bottomH = dims.h * bottomRatio;
  const topY = -dims.h / 2;
  const midY = topY + topH;
  const bottomY = midY + midH;

  const fillFor = (s: ToothSurface) =>
    brushed.has(s) ? brushColor : '#ffffff';

  const clipId = `tooth-clip-${clipIdPrefix}-${tooth.id}`;
  const transition = 'fill 220ms ease-out';

  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot})`}
      onClick={interactive && onClick ? () => onClick(tooth.id) : undefined}
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
        <>
          <defs>
            <clipPath id={clipId}>
              <rect
                x={-dims.w / 2}
                y={-dims.h / 2}
                width={dims.w}
                height={dims.h}
                rx={dims.r}
                ry={dims.r}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {/* Top band */}
            <rect
              x={-dims.w / 2}
              y={topY}
              width={dims.w}
              height={topH}
              fill={fillFor(topSurface)}
              style={{ transition }}
            />
            {/* Middle / biting band */}
            <rect
              x={-dims.w / 2}
              y={midY}
              width={dims.w}
              height={midH}
              fill={fillFor('biting')}
              style={{ transition }}
            />
            {/* Bottom band */}
            <rect
              x={-dims.w / 2}
              y={bottomY}
              width={dims.w}
              height={bottomH}
              fill={fillFor(bottomSurface)}
              style={{ transition }}
            />
            {/* Faint band dividers to hint at the three surfaces */}
            <line
              x1={-dims.w / 2}
              x2={dims.w / 2}
              y1={midY}
              y2={midY}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={0.5}
            />
            <line
              x1={-dims.w / 2}
              x2={dims.w / 2}
              y1={bottomY}
              y2={bottomY}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={0.5}
            />
            {/* Anatomical cusps / incisal edge */}
            <ToothAnatomy
              shape={tooth.shape}
              w={dims.w}
              midY={midY}
              midH={midH}
            />
          </g>
          {/* Crisp outline on top */}
          <rect
            x={-dims.w / 2}
            y={-dims.h / 2}
            width={dims.w}
            height={dims.h}
            rx={dims.r}
            ry={dims.r}
            fill="none"
            stroke={
              isPrimary
                ? 'hsl(var(--muted-foreground) / 0.55)'
                : 'hsl(var(--muted-foreground) / 0.45)'
            }
            strokeWidth={1.2}
          />
          {/* Primary tooth indicator dot — sits below the tooth (away from mouth opening) */}
          {isPrimary && (
            <circle
              r={1.5}
              cx={0}
              cy={dims.h / 2 + 3}
              fill={brushColor}
              opacity={0.55}
            />
          )}
        </>
      ) : (
        // Absent slot — dashed outline
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
    </g>
  );
}

function ToothAnatomy({
  shape,
  w,
  midY,
  midH,
}: {
  shape: ToothShape;
  w: number;
  midY: number;
  midH: number;
}) {
  const cuspColor = 'rgba(60, 40, 40, 0.22)';
  const cuspCenterY = midY + midH / 2;

  if (shape === 'incisor') {
    // Incisal edge — a thin line across the biting band
    return (
      <line
        x1={-w / 2 + 1.5}
        x2={w / 2 - 1.5}
        y1={cuspCenterY}
        y2={cuspCenterY}
        stroke={cuspColor}
        strokeWidth={0.8}
      />
    );
  }
  if (shape === 'canine') {
    // Single pointy cusp — small triangle in the middle
    const cuspW = 3;
    const cuspH = 2.5;
    return (
      <path
        d={`M ${-cuspW} ${cuspCenterY + cuspH / 2} L 0 ${cuspCenterY - cuspH / 2} L ${cuspW} ${cuspCenterY + cuspH / 2}`}
        fill="none"
        stroke={cuspColor}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
    );
  }
  if (shape === 'premolar') {
    // Two cusps side by side
    return (
      <>
        <circle cx={-w / 5} cy={cuspCenterY} r={1.6} fill={cuspColor} />
        <circle cx={w / 5} cy={cuspCenterY} r={1.6} fill={cuspColor} />
      </>
    );
  }
  // molar — four cusps in a 2×2 pattern with a faint central fissure
  const offX = w / 4;
  const offY = midH / 5;
  return (
    <>
      <circle cx={-offX} cy={cuspCenterY - offY} r={1.5} fill={cuspColor} />
      <circle cx={offX} cy={cuspCenterY - offY} r={1.5} fill={cuspColor} />
      <circle cx={-offX} cy={cuspCenterY + offY} r={1.5} fill={cuspColor} />
      <circle cx={offX} cy={cuspCenterY + offY} r={1.5} fill={cuspColor} />
      <line
        x1={-w / 2 + 2}
        x2={w / 2 - 2}
        y1={cuspCenterY}
        y2={cuspCenterY}
        stroke={cuspColor}
        strokeWidth={0.5}
      />
    </>
  );
}
