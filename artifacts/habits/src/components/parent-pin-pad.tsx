import { useEffect, useState } from 'react';
import { Delete, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PIN_LEN = 4;

export type PinPadMode = 'verify' | 'set' | 'change';

type Phase =
  | 'enter' // verify mode: just enter PIN once
  | 'setNew' // set mode: enter the new PIN
  | 'confirmNew' // set mode: re-enter to confirm
  | 'enterCurrent' // change mode: enter current PIN first
  | 'setNewChange' // change mode: enter the new PIN
  | 'confirmNewChange'; // change mode: re-enter new PIN

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PinPadMode;
  /** Required for `verify` and `change` modes. */
  expectedPin?: string | null;
  /**
   * Called with the validated / newly chosen PIN.
   * In `verify` mode this is the same string as `expectedPin`.
   */
  onSuccess: (pin: string) => void;
  title?: string;
  subtitle?: string;
  accentColor?: string;
};

function initialPhase(mode: PinPadMode): Phase {
  if (mode === 'set') return 'setNew';
  if (mode === 'change') return 'enterCurrent';
  return 'enter';
}

export function ParentPinPad({
  open,
  onOpenChange,
  mode,
  expectedPin,
  onSuccess,
  title,
  subtitle,
  accentColor = 'hsl(var(--primary))',
}: Props) {
  const [phase, setPhase] = useState<Phase>(() => initialPhase(mode));
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  // Reset on open / mode change
  useEffect(() => {
    if (open) {
      setPhase(initialPhase(mode));
      setFirst('');
      setPin('');
      setError(null);
    }
  }, [open, mode]);

  const triggerShake = () => setShakeKey((k) => k + 1);

  const submit = (entered: string) => {
    if (mode === 'verify') {
      if (entered === expectedPin) {
        onSuccess(entered);
        onOpenChange(false);
      } else {
        setError("That PIN doesn't match. Try again.");
        setPin('');
        triggerShake();
      }
      return;
    }

    if (mode === 'set') {
      if (phase === 'setNew') {
        setFirst(entered);
        setPin('');
        setError(null);
        setPhase('confirmNew');
      } else if (phase === 'confirmNew') {
        if (entered === first) {
          onSuccess(entered);
          onOpenChange(false);
        } else {
          setError("PINs don't match. Let's start over.");
          setFirst('');
          setPin('');
          setPhase('setNew');
          triggerShake();
        }
      }
      return;
    }

    // change
    if (phase === 'enterCurrent') {
      if (entered === expectedPin) {
        setPin('');
        setError(null);
        setPhase('setNewChange');
      } else {
        setError("That doesn't match your current PIN. Try again.");
        setPin('');
        triggerShake();
      }
    } else if (phase === 'setNewChange') {
      setFirst(entered);
      setPin('');
      setError(null);
      setPhase('confirmNewChange');
    } else if (phase === 'confirmNewChange') {
      if (entered === first) {
        onSuccess(entered);
        onOpenChange(false);
      } else {
        setError("New PINs don't match. Let's pick a new one.");
        setFirst('');
        setPin('');
        setPhase('setNewChange');
        triggerShake();
      }
    }
  };

  const handleKey = (key: string) => {
    setError(null);
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === 'clear') {
      setPin('');
      return;
    }
    if (pin.length >= PIN_LEN) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LEN) {
      // Small delay so the last dot animates in before we evaluate
      window.setTimeout(() => submit(next), 130);
    }
  };

  const heading =
    title ??
    (mode === 'set'
      ? 'Set parent PIN'
      : mode === 'change'
        ? 'Change parent PIN'
        : 'Parent PIN');

  const sub =
    subtitle ??
    (mode === 'verify'
      ? 'Enter your 4-digit PIN to confirm.'
      : phase === 'setNew' || phase === 'setNewChange'
        ? 'Choose a 4-digit PIN.'
        : phase === 'confirmNew' || phase === 'confirmNewChange'
          ? 'Re-enter the PIN to confirm.'
          : phase === 'enterCurrent'
            ? 'Enter your current PIN.'
            : '');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xs rounded-3xl"
        data-testid="parent-pin-pad"
      >
        <DialogTitle className="text-center text-base font-bold flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" /> {heading}
        </DialogTitle>
        <DialogDescription className="text-center text-xs text-muted-foreground -mt-1">
          {sub}
        </DialogDescription>

        <motion.div
          key={shakeKey}
          animate={
            shakeKey > 0 ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }
          }
          transition={{ duration: 0.45 }}
          className="flex justify-center gap-3 mt-4"
        >
          {Array.from({ length: PIN_LEN }).map((_, i) => {
            const filled = pin.length > i;
            return (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full border-2 transition-colors',
                  filled ? 'border-transparent' : 'border-muted-foreground/40',
                )}
                style={filled ? { backgroundColor: accentColor } : undefined}
              />
            );
          })}
        </motion.div>

        <p
          className={cn(
            'text-xs text-center mt-2 min-h-[1rem]',
            error ? 'text-destructive font-semibold' : 'text-muted-foreground',
          )}
          data-testid="pin-pad-error"
        >
          {error ?? ''}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {keys.map((k) => {
            if (k === 'clear') {
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey('clear')}
                  className="h-14 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-muted active:scale-95 transition"
                  data-testid="pin-key-clear"
                >
                  Clear
                </button>
              );
            }
            if (k === 'back') {
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey('back')}
                  className="h-14 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-95 transition"
                  aria-label="Backspace"
                  data-testid="pin-key-back"
                >
                  <Delete className="h-5 w-5" />
                </button>
              );
            }
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className="h-14 rounded-2xl text-2xl font-bold bg-muted/50 hover:bg-muted active:scale-95 transition tabular-nums"
                data-testid={`pin-key-${k}`}
              >
                {k}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
