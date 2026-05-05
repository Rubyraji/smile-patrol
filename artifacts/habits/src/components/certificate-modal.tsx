import { useRef, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { type Kid, getStreak, getWeekProgress, getWeekDays, PET_SPECIES_LIST } from '@/lib/store';
import { format } from 'date-fns';

// ── Certificate dimensions (fixed, in px) ────────────────────────────────────

const CERT_W = 620;
const CERT_H = 880;

// ── Achievement label from kid stats ─────────────────────────────────────────

function achievement(streak: number, pct: number): string {
  if (pct === 100)   return 'Perfect Week Champion';
  if (streak >= 30)  return '30-Day Brushing Legend';
  if (streak >= 14)  return '2-Week Streak Champion';
  if (streak >= 7)   return '7-Day Streak Champion';
  return 'Dedicated Young Brusher';
}

// ── The printable certificate (inline styles only — html2canvas-safe) ─────────

interface CertProps {
  kid: Kid;
  streak: number;
  brushPct: number;
  petEmoji: string;
  petName: string;
  awardTitle: string;
  dateStr: string;
}

function CertificateContent({
  kid,
  streak,
  brushPct,
  petEmoji,
  petName,
  awardTitle,
  dateStr,
  innerRef,
}: CertProps & { innerRef: React.RefObject<HTMLDivElement | null> }) {
  const c = kid.color;
  const cLight = `${c}18`;
  const cMid   = `${c}55`;
  const cBorder = `${c}99`;

  return (
    <div
      ref={innerRef}
      style={{
        width:  CERT_W,
        height: CERT_H,
        background: `radial-gradient(ellipse at 50% -5%, ${c}28 0%, #FDFCF8 55%)`,
        border: `7px solid ${c}`,
        borderRadius: 28,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 36px 22px',
        fontFamily: '"Nunito", "Segoe UI", system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Inner accent border */}
      <div style={{
        position: 'absolute', inset: 13,
        border: `2px solid ${cBorder}`,
        borderRadius: 18,
        pointerEvents: 'none',
      }} />

      {/* Corner stars */}
      {[
        { top: 9,    left: 13  },
        { top: 9,    right: 13 },
        { bottom: 9, left: 13  },
        { bottom: 9, right: 13 },
      ].map((pos, i) => (
        <span key={i} style={{ position: 'absolute', fontSize: 24, lineHeight: 1, ...pos }}>⭐</span>
      ))}

      {/* ── App brand ── */}
      <div style={{ fontSize: 12, fontWeight: 800, color: c, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 2 }}>
        🦷 Smile Patrol
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: '#1A1A2E', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
        Certificate of Achievement
      </div>

      {/* ── Divider ── */}
      <div style={{ width: '75%', height: 1, background: `linear-gradient(to right, transparent, ${cMid}, transparent)`, marginBottom: 22 }} />

      {/* ── Kid avatar ── */}
      <div style={{
        width: 86, height: 86, borderRadius: 22,
        backgroundColor: c,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, lineHeight: 1,
        boxShadow: `0 6px 20px ${c}44`,
        marginBottom: 16,
      }}>
        {kid.emoji}
      </div>

      {/* ── This certifies that ── */}
      <div style={{ fontSize: 12, color: '#888', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
        THIS CERTIFIES THAT
      </div>

      {/* ── Kid name ── */}
      <div style={{ fontSize: 44, fontWeight: 900, color: c, lineHeight: 1.1, marginBottom: 6, textAlign: 'center' }}>
        {kid.name}
      </div>

      <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        is proudly awarded the title of
      </div>

      {/* ── Award title ── */}
      <div style={{
        fontSize: 20, fontWeight: 900, color: '#1A1A2E',
        background: `linear-gradient(135deg, ${cLight}, ${cMid})`,
        border: `2px solid ${cBorder}`,
        borderRadius: 14,
        padding: '9px 28px',
        marginBottom: 22,
        textAlign: 'center',
        letterSpacing: '0.02em',
      }}>
        🏆 {awardTitle}
      </div>

      {/* ── Divider ── */}
      <div style={{ width: '75%', height: 1, background: `linear-gradient(to right, transparent, ${cMid}, transparent)`, marginBottom: 22 }} />

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22 }}>
        <div style={{ textAlign: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#FF6B35', lineHeight: 1 }}>🔥 {streak}</div>
          <div style={{ fontSize: 10, color: '#999', fontWeight: 800, letterSpacing: '0.1em', marginTop: 4 }}>DAY STREAK</div>
        </div>
        <div style={{ width: 1, background: '#E8E0D8', alignSelf: 'stretch' }} />
        <div style={{ textAlign: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: c, lineHeight: 1 }}>{brushPct}%</div>
          <div style={{ fontSize: 10, color: '#999', fontWeight: 800, letterSpacing: '0.1em', marginTop: 4 }}>THIS WEEK</div>
        </div>
      </div>

      {/* ── Pet section ── */}
      {petName ? (
        <div style={{
          background: `${cLight}`,
          border: `1.5px solid ${cMid}`,
          borderRadius: 14,
          padding: '10px 24px',
          textAlign: 'center',
          marginBottom: 22,
          minWidth: 220,
        }}>
          <div style={{ fontSize: 10, color: '#AAA', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 4 }}>COMPANION PET</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A2E' }}>
            {petEmoji} {petName}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 22 }} />
      )}

      {/* ── Divider ── */}
      <div style={{ width: '75%', height: 1, background: `linear-gradient(to right, transparent, ${cMid}, transparent)`, marginBottom: 16 }} />

      {/* ── Awarded date ── */}
      <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 6 }}>
        Awarded on {dateStr}
      </div>

      {/* ── Signature line ── */}
      <div style={{ width: 140, borderTop: `1.5px solid #DDD`, marginBottom: 4, marginTop: 8 }} />
      <div style={{ fontSize: 11, color: '#BBBBBB', fontWeight: 700 }}>Radhika Arasu</div>
      <div style={{ fontSize: 10, color: '#CCCCCC', marginBottom: 12 }}>Smile Patrol</div>

      {/* ── Copyright ── */}
      <div style={{ marginTop: 'auto', fontSize: 9, color: '#CCCCCC', fontWeight: 600, letterSpacing: '0.06em' }}>
        © {new Date().getFullYear()} RADHIKA ARASU · ALL RIGHTS RESERVED · SMILE PATROL
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface Props {
  kid: Kid;
  onClose: () => void;
}

export function CertificateModal({ kid, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const weekDays  = getWeekDays(new Date());
  const progress  = getWeekProgress(kid, weekDays);
  const streak    = getStreak(kid);
  const brushPct  = progress.brushTotal === 0 ? 0 : Math.round((progress.brushDone / progress.brushTotal) * 100);
  const petInfo   = kid.pet ? PET_SPECIES_LIST.find(s => s.key === kid.pet!.species) : null;
  const petEmoji  = kid.pet?.hatched ? (petInfo?.emoji ?? '') : '🥚';
  const petName   = kid.pet?.name || petInfo?.defaultName || '';
  const awardTitle = achievement(streak, brushPct);
  const dateStr   = format(new Date(), 'MMMM d, yyyy');

  // Preview scale — fit inside a ~340px modal content area
  const PREVIEW_W = 340;
  const scale = PREVIEW_W / CERT_W;
  const previewH = CERT_H * scale;

  async function handleDownload() {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pgW = pdf.internal.pageSize.getWidth();
      const pgH = pdf.internal.pageSize.getHeight();

      const margin = 12;
      const drawW  = pgW - margin * 2;
      const drawH  = drawW * (CERT_H / CERT_W);
      const drawY  = (pgH - drawH) / 2;

      pdf.addImage(imgData, 'PNG', margin, drawY, drawW, drawH);
      pdf.save(`${kid.name}-certificate.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  const certProps: CertProps = { kid, streak, brushPct, petEmoji, petName, awardTitle, dateStr };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-xl font-black">🏆 Certificate</p>
            <p className="text-xs text-muted-foreground font-semibold">Preview &amp; download as PDF</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Certificate preview — scaled down visually, but the real element is captured */}
        <div className="px-5 pb-4">
          <div
            style={{ width: PREVIEW_W, height: previewH, overflow: 'hidden', margin: '0 auto', borderRadius: 12 }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CERT_W, height: CERT_H }}>
              <CertificateContent {...certProps} innerRef={certRef} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border-2 font-bold text-sm text-muted-foreground border-border hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 h-12 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: kid.color }}
          >
            {downloading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Download className="h-4 w-4" /> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
