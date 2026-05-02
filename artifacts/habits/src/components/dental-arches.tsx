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
  brushedSurfaces?: BrushedMap;
  brushColor?: string;
  size?: number;
  onToothClick?: (id: ToothId) => void;
  interactive?: boolean;
  className?: string;
};

// Outer width (labial/buccal side), inner width (lingual/palatal side), height, corner-radius
type ToothDims = { ow: number; iw: number; h: number; r: number };

const TOOTH_DIMS: Record<ToothShape, ToothDims> = {
  incisor:  { ow: 13, iw:  9, h: 21, r: 5.5 },
  canine:   { ow: 13, iw:  6, h: 25, r: 5.5 },
  premolar: { ow: 16, iw: 13, h: 21, r: 6.5 },
  molar:    { ow: 20, iw: 17, h: 24, r: 7.5 },
};

// Scale down primary teeth — they are smaller and more rounded.
const PRIMARY_SCALE = 0.82;

// Band proportions (outer : biting : inner) of the tooth height.
const BAND_RATIOS: Record<ToothShape, [number, number, number]> = {
  incisor:  [0.30, 0.40, 0.30],
  canine:   [0.30, 0.40, 0.30],
  premolar: [0.26, 0.48, 0.26],
  molar:    [0.24, 0.52, 0.24],
};

// Build a trapezoidal outline path (occlusal view).
// ow = outer (labial/buccal) width  — rendered at y = -h/2
// iw = inner (lingual/palatal) width — rendered at y = +h/2
function toothPath(ow: number, iw: number, h: number, r: number): string {
  const t = -h / 2;
  const b = h / 2;
  const lt = -ow / 2, rt = ow / 2;
  const lb = -iw / 2, rb = iw / 2;
  // Clamp corner radius so it doesn't exceed half the narrowest width
  const rT = Math.min(r, ow / 2 - 0.5);
  const rB = Math.min(r, iw / 2 - 0.5);
  return [
    `M ${lt + rT} ${t}`,
    `L ${rt - rT} ${t}`,
    `Q ${rt} ${t} ${rt} ${t + rT}`,
    `L ${rb} ${b - rB}`,
    `Q ${rb} ${b} ${rb - rB} ${b}`,
    `L ${lb + rB} ${b}`,
    `Q ${lb} ${b} ${lb} ${b - rB}`,
    `L ${lt} ${t + rT}`,
    `Q ${lt} ${t} ${lt + rT} ${t}`,
    `Z`,
  ].join(' ');
}

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
  const rx = size * 0.43;
  const ry = size * 0.29;

  const renderArch = (arch: ToothArch, archTeeth: Tooth[], centerY: number) => {
    const layoutTeeth = interactive
      ? archTeeth
      : archTeeth.filter((t) => t.presence !== 'absent');
    const total = layoutTeeth.length;

    // Width-proportional angular spacing: wider teeth (molars) get more arc room
    // so they never crowd into their neighbours.
    const toothOW = layoutTeeth.map((t) => {
      const base = TOOTH_DIMS[t.shape];
      const s = t.presence === 'primary' ? PRIMARY_SCALE : 1;
      return base.ow * s;
    });
    const totalOW = toothOW.reduce((a, b) => a + b, 0);

    let cumOW = 0;
    return layoutTeeth.map((tooth, i) => {
      const w = toothOW[i];
      const t = total === 1 ? 0.5 : (cumOW + w / 2) / totalOW;
      cumOW += w;
      const angleDeg = 14 + 152 * t;
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
      <line
        x1={cx - rx * 0.95}
        y1={size / 2}
        x2={cx + rx * 0.95}
        y2={size / 2}
        stroke="hsl(var(--muted-foreground) / 0.15)"
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
  const base = TOOTH_DIMS[tooth.shape];
  const scale = tooth.presence === 'primary' ? PRIMARY_SCALE : 1;
  const dims: ToothDims = {
    ow: base.ow * scale,
    iw: base.iw * scale,
    h:  base.h  * scale,
    r:  base.r  * scale,
  };

  const present = tooth.presence !== 'absent';
  const isPrimary = tooth.presence === 'primary';

  const topSurface: ToothSurface = tooth.arch === 'upper' ? 'outer' : 'inner';
  const bottomSurface: ToothSurface = tooth.arch === 'upper' ? 'inner' : 'outer';

  const [topRatio, midRatio, bottomRatio] = BAND_RATIOS[tooth.shape];
  const topH   = dims.h * topRatio;
  const midH   = dims.h * midRatio;
  const bottomH = dims.h * bottomRatio;
  const topY    = -dims.h / 2;
  const midY    = topY + topH;
  const bottomY = midY + midH;

  const fillFor = (s: ToothSurface) => (brushed.has(s) ? brushColor : '#ffffff');
  const outline = toothPath(dims.ow, dims.iw, dims.h, dims.r);

  // Max width for the band rects (they will be clipped anyway)
  const maxW = Math.max(dims.ow, dims.iw);
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
      {interactive && (
        <rect
          x={-maxW / 2 - 5}
          y={-dims.h / 2 - 5}
          width={maxW + 10}
          height={dims.h + 10}
          rx={dims.r + 4}
          fill="transparent"
        />
      )}

      {present ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={outline} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {/* Outer surface band */}
            <rect
              x={-maxW / 2}
              y={topY}
              width={maxW}
              height={topH}
              fill={fillFor(topSurface)}
              style={{ transition }}
            />
            {/* Biting / occlusal band */}
            <rect
              x={-maxW / 2}
              y={midY}
              width={maxW}
              height={midH}
              fill={fillFor('biting')}
              style={{ transition }}
            />
            {/* Inner surface band */}
            <rect
              x={-maxW / 2}
              y={bottomY}
              width={maxW}
              height={bottomH}
              fill={fillFor(bottomSurface)}
              style={{ transition }}
            />
            {/* Faint surface dividers */}
            <line
              x1={-maxW / 2} x2={maxW / 2}
              y1={midY} y2={midY}
              stroke="rgba(0,0,0,0.07)" strokeWidth={0.6}
            />
            <line
              x1={-maxW / 2} x2={maxW / 2}
              y1={bottomY} y2={bottomY}
              stroke="rgba(0,0,0,0.07)" strokeWidth={0.6}
            />
            {/* Anatomical detail */}
            <ToothAnatomy
              shape={tooth.shape}
              dims={dims}
              midY={midY}
              midH={midH}
              isPrimary={isPrimary}
            />
          </g>
          {/* Crisp outline on top */}
          <path
            d={outline}
            fill="none"
            stroke={
              isPrimary
                ? 'hsl(var(--muted-foreground) / 0.5)'
                : 'hsl(var(--muted-foreground) / 0.45)'
            }
            strokeWidth={1.3}
          />
          {/* Primary tooth dot indicator */}
          {isPrimary && (
            <circle
              r={1.5}
              cx={0}
              cy={dims.h / 2 + 3.5}
              fill={brushColor}
              opacity={0.5}
            />
          )}
        </>
      ) : (
        // Absent slot — dashed outline
        <path
          d={toothPath(base.ow, base.iw, base.h, base.r)}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.3)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      )}
    </g>
  );
}

function ToothAnatomy({
  shape,
  dims,
  midY,
  midH,
  isPrimary,
}: {
  shape: ToothShape;
  dims: ToothDims;
  midY: number;
  midH: number;
  isPrimary: boolean;
}) {
  const c = 'rgba(50, 35, 25, 0.20)';    // cusp/groove color
  const cuspY = midY + midH / 2;          // vertical centre of biting zone
  const { ow, iw } = dims;
  const avgW = (ow + iw) / 2;

  if (shape === 'incisor') {
    // Mamelons: 3 tiny rounded bumps along the incisal edge
    if (!isPrimary) {
      const spacing = avgW * 0.22;
      return (
        <>
          {[-1, 0, 1].map((n) => (
            <ellipse
              key={n}
              cx={n * spacing}
              cy={cuspY}
              rx={2.2}
              ry={1.3}
              fill={c}
            />
          ))}
        </>
      );
    }
    // Primary incisors: simple incisal line
    return (
      <line
        x1={-avgW / 2 + 2} x2={avgW / 2 - 2}
        y1={cuspY} y2={cuspY}
        stroke={c} strokeWidth={1}
      />
    );
  }

  if (shape === 'canine') {
    // Single prominent cusp ridge
    const tipY = midY + midH * 0.35;
    const baseW = avgW * 0.55;
    return (
      <>
        <ellipse cx={0} cy={tipY} rx={baseW / 2} ry={midH * 0.28} fill={c} />
        {/* Cusp tip highlight */}
        <ellipse cx={0} cy={tipY - midH * 0.06} rx={2} ry={1.4} fill="rgba(255,255,255,0.45)" />
      </>
    );
  }

  if (shape === 'premolar') {
    // Two cusps (buccal outer + lingual inner) separated by central groove
    const halfX = avgW * 0.22;
    const cuspR = isPrimary ? 2.8 : 3.2;
    return (
      <>
        {/* Buccal cusp (outer side = top of local coords) */}
        <ellipse cx={0} cy={midY + midH * 0.28} rx={cuspR} ry={cuspR * 0.85} fill={c} />
        {/* Lingual cusp (inner side) */}
        <ellipse cx={0} cy={midY + midH * 0.72} rx={cuspR * 0.82} ry={cuspR * 0.75} fill={c} />
        {/* Central fissure */}
        <line
          x1={-halfX} x2={halfX}
          y1={cuspY} y2={cuspY}
          stroke={c} strokeWidth={0.9} strokeLinecap="round"
        />
      </>
    );
  }

  // Molar — 4 cusps in 2×2 grid with H-fissure
  const offX = avgW * 0.22;
  const offY = midH * 0.22;
  const cuspR = isPrimary ? 2.8 : 3.2;
  const grooveC = 'rgba(50, 35, 25, 0.15)';
  return (
    <>
      {/* 4 cusps */}
      <ellipse cx={-offX} cy={cuspY - offY} rx={cuspR} ry={cuspR * 0.9} fill={c} />
      <ellipse cx={ offX} cy={cuspY - offY} rx={cuspR} ry={cuspR * 0.9} fill={c} />
      <ellipse cx={-offX} cy={cuspY + offY} rx={cuspR * 0.88} ry={cuspR * 0.8} fill={c} />
      <ellipse cx={ offX} cy={cuspY + offY} rx={cuspR * 0.88} ry={cuspR * 0.8} fill={c} />
      {/* H-shaped central fissure */}
      <line x1={-offX} x2={offX}  y1={cuspY} y2={cuspY}      stroke={grooveC} strokeWidth={0.9} strokeLinecap="round" />
      <line x1={0}     x2={0}     y1={midY + midH * 0.18} y2={midY + midH * 0.82} stroke={grooveC} strokeWidth={0.8} strokeLinecap="round" />
    </>
  );
}
