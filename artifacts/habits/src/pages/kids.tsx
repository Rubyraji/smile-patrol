import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Trash2, Plus, X } from 'lucide-react';
import { useKids, KID_EMOJIS, KID_COLORS, type Kid } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function Kids() {
  const { kids, addKid, removeKid, updateKid } = useKids();
  const [editing, setEditing] = useState<Kid | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Kid | null>(null);

  return (
    <div className="min-h-screen pb-32 px-5 pt-4">
      <header className="flex items-center gap-3 mb-6 max-w-md mx-auto">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-muted active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Kids</h1>
      </header>

      <main className="max-w-md mx-auto space-y-3">
        {kids.map((k) => (
          <button
            key={k.id}
            onClick={() => setEditing(k)}
            data-testid={`kid-row-${k.id}`}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border hover:bg-muted/40 transition text-left"
          >
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: k.color }}
            >
              {k.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{k.name}</p>
              <p className="text-xs text-muted-foreground">
                {Object.keys(k.brushings).length} day{Object.keys(k.brushings).length === 1 ? '' : 's'} tracked
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Edit</span>
          </button>
        ))}

        <button
          onClick={() => setAdding(true)}
          data-testid="add-kid-cta"
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add a kid</span>
        </button>
      </main>

      {(editing || adding) && (
        <KidEditor
          kid={editing}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSave={(name, emoji, color) => {
            if (editing) {
              updateKid(editing.id, { name, emoji, color });
            } else {
              addKid(name, emoji, color);
            }
            setEditing(null);
            setAdding(false);
          }}
          onDelete={
            editing
              ? () => {
                  setPendingDelete(editing);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will erase all their brushing history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removeKid(pendingDelete.id);
                setPendingDelete(null);
              }}
              data-testid="confirm-delete-kid"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KidEditor({
  kid,
  onClose,
  onSave,
  onDelete,
}: {
  kid: Kid | null;
  onClose: () => void;
  onSave: (name: string, emoji: string, color: string) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(kid?.name ?? '');
  const [emoji, setEmoji] = useState(kid?.emoji ?? KID_EMOJIS[0]);
  const [color, setColor] = useState(kid?.color ?? KID_COLORS[0]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">{kid ? 'Edit kid' : 'New kid'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md"
              style={{ backgroundColor: color }}
            >
              {emoji}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kid's name"
              data-testid="kid-name-input"
              className="rounded-xl h-11"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {KID_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'aspect-square rounded-xl text-2xl flex items-center justify-center transition',
                    emoji === e
                      ? 'bg-primary/15 ring-2 ring-primary'
                      : 'bg-muted hover:bg-muted/70'
                  )}
                  type="button"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {KID_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  type="button"
                  aria-label={`Color ${c}`}
                  className={cn(
                    'w-10 h-10 rounded-full transition transform',
                    color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex items-center gap-3 bg-card">
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              data-testid="delete-kid-button"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => onSave(name.trim() || 'Kiddo', emoji, color)}
            data-testid="save-kid-button"
            className="flex-1 rounded-xl h-11 font-bold"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
