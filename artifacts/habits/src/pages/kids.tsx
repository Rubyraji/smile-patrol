import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Trash2, Plus, X, Check, RotateCcw, Lock } from 'lucide-react';
import { ParentPinPad, type PinPadMode } from '@/components/parent-pin-pad';
import { useKidsContext as useKids } from '@/lib/kids-context';
import {
  KID_EMOJIS,
  KID_COLORS,
  CHARACTER_CATEGORIES,
  TASK_PRESETS,
  TASK_EMOJIS,
  QUICK_TOGGLE_PRESETS,
  type Kid,
  type Task,
  type TaskTime,
} from '@/lib/store';
import {
  getTeethForAge,
  DEFAULT_AGE,
  MIN_AGE,
  MAX_AGE,
  type ToothId,
} from '@/lib/teeth';
import { DentalArches } from '@/components/dental-arches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  const {
    kids,
    addKid,
    removeKid,
    updateKid,
    toggleMissingTooth,
    resetMissingTeeth,
    addTask,
    updateTask,
    removeTask,
    parentPin,
    setParentPin,
  } = useKids();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Kid | null>(null);
  const [pinPad, setPinPad] = useState<{
    mode: PinPadMode;
    title?: string;
    subtitle?: string;
    onSuccess: (pin: string) => void;
    onForgotPin?: () => void;
  } | null>(null);
  const [pendingPinRemoval, setPendingPinRemoval] = useState(false);
  const [forgotPinOpen, setForgotPinOpen] = useState(false);

  const editing = editingId ? kids.find((k) => k.id === editingId) ?? null : null;

  const openSetPin = () => {
    setPinPad({
      mode: 'set',
      title: 'Set parent PIN',
      subtitle: "Pick a 4-digit PIN. Enable sign-off per child in their edit panel.",
      onSuccess: (pin) => {
        setParentPin(pin);
      },
    });
  };

  const openChangePin = () => {
    setPinPad({
      mode: 'change',
      title: 'Change parent PIN',
      onSuccess: (pin) => setParentPin(pin),
    });
  };

  const confirmRemovePin = () => {
    setPendingPinRemoval(false);
    if (!parentPin) return;
    setPinPad({
      mode: 'verify',
      title: 'Confirm to remove PIN',
      subtitle: 'Enter your current PIN to remove it.',
      onSuccess: () => setParentPin(null),
      onForgotPin: () => setForgotPinOpen(true),
    });
  };

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
            onClick={() => setEditingId(k.id)}
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
                {k.tasks.length > 0 && ` · ${k.tasks.length} extra${k.tasks.length === 1 ? '' : 's'}`}
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

        {/* Parent PIN — global (sign-off is toggled per kid) */}
        <section
          className="rounded-2xl bg-card border p-4 mt-6"
          data-testid="parent-signoff-card"
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Parent PIN</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                {parentPin
                  ? 'PIN is set. Turn on sign-off per child inside their edit panel.'
                  : 'Set a 4-digit PIN, then enable sign-off inside each child\'s settings.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {parentPin ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl h-9"
                  onClick={openChangePin}
                  data-testid="change-pin-button"
                >
                  Change PIN
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setPendingPinRemoval(true)}
                  data-testid="remove-pin-button"
                >
                  Remove
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl h-9"
                onClick={() => openSetPin()}
                data-testid="set-pin-button"
              >
                Set PIN
              </Button>
            )}
          </div>
        </section>
      </main>

      {(editing || adding) && (
        <KidEditor
          kid={editing}
          parentPin={parentPin}
          onClose={() => {
            setEditingId(null);
            setAdding(false);
          }}
          onSaveProfile={(name, emoji, color, age) => {
            if (editing) {
              updateKid(editing.id, { name, emoji, color, age });
            } else {
              addKid(name, emoji, color, age);
              setAdding(false);
            }
          }}
          onAddTask={(name, emoji, time) => editing && addTask(editing.id, name, emoji, time)}
          onUpdateTask={(taskId, updates) => editing && updateTask(editing.id, taskId, updates)}
          onRemoveTask={(taskId) => editing && removeTask(editing.id, taskId)}
          onToggleTooth={(toothId) => editing && toggleMissingTooth(editing.id, toothId)}
          onResetTeeth={() => editing && resetMissingTeeth(editing.id)}
          onToggleSignoff={(val) => editing && updateKid(editing.id, { requireSignoff: val })}
          onDelete={
            editing
              ? () => {
                  setPendingDelete(editing);
                  setEditingId(null);
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

      <AlertDialog
        open={pendingPinRemoval}
        onOpenChange={(o) => !o && setPendingPinRemoval(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove parent PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to enter your current PIN to remove it. Sign-off will
              also turn off until you set a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemovePin}
              data-testid="confirm-remove-pin"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={forgotPinOpen} onOpenChange={setForgotPinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset parent PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              Your PIN will be cleared and sign-off will be turned off. You
              can set a new PIN here any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setParentPin(null);
                setPinPad(null);
              }}
              data-testid="confirm-forgot-pin-kids"
            >
              Reset PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ParentPinPad
        open={!!pinPad}
        onOpenChange={(o) => !o && setPinPad(null)}
        mode={pinPad?.mode ?? 'verify'}
        expectedPin={parentPin}
        onSuccess={(pin) => pinPad?.onSuccess(pin)}
        onForgotPin={pinPad?.onForgotPin}
        title={pinPad?.title}
        subtitle={pinPad?.subtitle}
      />
    </div>
  );
}

function KidEditor({
  kid,
  parentPin,
  onClose,
  onSaveProfile,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onToggleTooth,
  onResetTeeth,
  onToggleSignoff,
  onDelete,
}: {
  kid: Kid | null;
  parentPin: string | null;
  onClose: () => void;
  onSaveProfile: (name: string, emoji: string, color: string, age: number) => void;
  onAddTask: (name: string, emoji: string, time?: TaskTime) => void;
  onUpdateTask: (taskId: string, updates: Partial<Pick<Task, 'name' | 'emoji'>>) => void;
  onRemoveTask: (taskId: string) => void;
  onToggleTooth: (toothId: ToothId) => void;
  onResetTeeth: () => void;
  onToggleSignoff: (val: boolean) => void;
  onDelete?: () => void;
}) {
  const initialEmoji = kid?.emoji ?? KID_EMOJIS[0];
  const initialCategory =
    CHARACTER_CATEGORIES.find((c) => c.characters.includes(initialEmoji))?.key ??
    CHARACTER_CATEGORIES[0].key;

  const [name, setName] = useState(kid?.name ?? '');
  const [emoji, setEmoji] = useState(initialEmoji);
  const [color, setColor] = useState(kid?.color ?? KID_COLORS[0]);
  const [age, setAge] = useState<number>(kid?.age ?? DEFAULT_AGE);
  const [characterCategory, setCharacterCategory] = useState<string>(initialCategory);
  const [taskDraftName, setTaskDraftName] = useState('');
  const [taskDraftEmoji, setTaskDraftEmoji] = useState(TASK_EMOJIS[0]);
  const [showTaskComposer, setShowTaskComposer] = useState(false);

  const activeCategory =
    CHARACTER_CATEGORIES.find((c) => c.key === characterCategory) ?? CHARACTER_CATEGORIES[0];

  const tasks = kid?.tasks ?? [];

  // Live preview teeth — uses the kid's saved overrides combined with the
  // age the user is currently editing. For new kids there are no overrides yet.
  const previewTeeth = useMemo(
    () => getTeethForAge(age, kid?.missingTeeth ?? []),
    [age, kid?.missingTeeth],
  );
  const missingOverrideCount = (kid?.missingTeeth ?? []).length;

  const presetExists = (name: string) =>
    tasks.some((t) => t.name.toLowerCase() === name.toLowerCase());

  const handleSaveProfile = () => {
    const safeAge = Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(age)));
    onSaveProfile(name.trim() || 'Kiddo', emoji, color, safeAge);
    if (!kid) onClose(); // for new kid we close after save
  };

  const handleAddTaskFromComposer = () => {
    if (!taskDraftName.trim()) return;
    onAddTask(taskDraftName.trim(), taskDraftEmoji);
    setTaskDraftName('');
    setTaskDraftEmoji(TASK_EMOJIS[0]);
    setShowTaskComposer(false);
  };

  const findTaskByName = (name: string) =>
    tasks.find((t) => t.name.toLowerCase() === name.toLowerCase());

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h2 className="text-lg font-bold">{kid ? 'Edit kid' : 'New kid'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md"
              style={{ backgroundColor: color }}
            >
              {emoji}
            </div>
          </div>

          {/* Name */}
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
              autoFocus={!kid}
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Character
            </label>

            {/* Category tabs */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
              {CHARACTER_CATEGORIES.map((cat) => {
                const isActive = cat.key === characterCategory;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCharacterCategory(cat.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    )}
                    data-testid={`character-category-${cat.key}`}
                  >
                    <span className="text-sm leading-none">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Character grid */}
            <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 -m-1">
              {activeCategory.characters.map((e) => (
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
                  data-testid={`character-${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
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

          {/* Age */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Age
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAge((a) => Math.max(MIN_AGE, a - 1))}
                disabled={age <= MIN_AGE}
                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/70 active:scale-95 transition flex items-center justify-center text-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Decrease age"
                data-testid="age-decrement"
              >
                −
              </button>
              <Input
                type="number"
                inputMode="numeric"
                min={MIN_AGE}
                max={MAX_AGE}
                value={age}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) return;
                  setAge(Math.min(MAX_AGE, Math.max(MIN_AGE, v)));
                }}
                className="rounded-xl h-11 text-center text-lg font-bold w-20 tabular-nums"
                data-testid="age-input"
              />
              <button
                type="button"
                onClick={() => setAge((a) => Math.min(MAX_AGE, a + 1))}
                disabled={age >= MAX_AGE}
                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/70 active:scale-95 transition flex items-center justify-center text-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase age"
                data-testid="age-increment"
              >
                +
              </button>
              <span className="text-sm text-muted-foreground ml-1">
                year{age === 1 ? '' : 's'} old
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-snug">
              We'll show the teeth that usually fit this age — baby teeth, big teeth, or a mix.
            </p>
          </div>

          {/* Teeth — interactive only when editing an existing kid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {kid ? "Tap teeth that aren't there" : 'Teeth preview'}
              </label>
              {kid && missingOverrideCount > 0 && (
                <button
                  type="button"
                  onClick={onResetTeeth}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  data-testid="reset-teeth-button"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
            <div
              className="rounded-2xl border-2 border-dashed p-2 flex items-center justify-center"
              style={{ borderColor: 'var(--border)' }}
            >
              <DentalArches
                teeth={previewTeeth}
                size={240}
                brushColor={color}
                interactive={!!kid}
                onToothClick={(id) => kid && onToggleTooth(id)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-snug">
              {kid
                ? 'Tap a tooth to mark it as missing (loose, just lost, or not in yet). Tap again to bring it back.'
                : 'Save the kid first, then tap any tooth to mark it as missing.'}
            </p>
          </div>

          {/* Parent sign-off toggle — per kid, shown with main settings */}
          {kid && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border-2 border-border bg-card">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">Require parent sign-off</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {!parentPin
                      ? 'Set a parent PIN first (on the Kids page).'
                      : kid.requireSignoff
                        ? 'On — a PIN is needed after each brush.'
                        : 'Off — brushes log without a PIN.'}
                  </p>
                </div>
              </div>
              <Switch
                checked={!!kid.requireSignoff}
                onCheckedChange={onToggleSignoff}
                disabled={!parentPin}
                aria-label={`Require parent sign-off for ${kid.name}`}
                data-testid="per-kid-signoff-switch"
              />
            </div>
          )}

          {/* Daily extras section - only for existing kids */}
          {kid && (
            <div className="pt-2 border-t -mx-5 px-5">
              <div className="flex items-center justify-between mb-1 mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Daily extras
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Counts toward weekly reward
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Add habits like flossing or tooth cream that {kid.name} should do once a day.
              </p>

              {/* Quick on/off toggles for the most common extras */}
              <div className="space-y-4 mb-4">
                {['Dental extras', 'Pet care'].map((section) => {
                  const sectionPresets = QUICK_TOGGLE_PRESETS.filter((p) => p.section === section);
                  return (
                    <div key={section}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                        {section === 'Pet care' ? '🐾 ' : '🦷 '}{section}
                      </p>
                      <div className="space-y-2">
                        {sectionPresets.map((preset) => {
                  const existing = findTaskByName(preset.name);
                  const enabled = !!existing;
                  return (
                    <div
                      key={preset.key}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors',
                        enabled
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border bg-card',
                      )}
                      data-testid={`quick-toggle-${preset.key}`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                        {preset.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight">{preset.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {preset.subtitle}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => {
                          if (checked && !existing) {
                            onAddTask(preset.name, preset.emoji, preset.time);
                          } else if (!checked && existing) {
                            onRemoveTask(existing.id);
                          }
                        }}
                        aria-label={preset.title}
                        data-testid={`quick-toggle-switch-${preset.key}`}
                      />
                    </div>
                  );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Existing tasks */}
              {tasks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {tasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onRename={(name) => onUpdateTask(t.id, { name })}
                      onChangeEmoji={(emoji) => onUpdateTask(t.id, { emoji })}
                      onRemove={() => onRemoveTask(t.id)}
                    />
                  ))}
                </div>
              )}

              {/* Quick presets */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick add
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TASK_PRESETS.filter(
                    (p) => !QUICK_TOGGLE_PRESETS.some((q) => q.name === p.name),
                  ).map((preset) => {
                    const exists = presetExists(preset.name);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        disabled={exists}
                        onClick={() => onAddTask(preset.name, preset.emoji, preset.time)}
                        data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition',
                          exists
                            ? 'opacity-40 cursor-not-allowed bg-muted border-border text-muted-foreground'
                            : 'bg-card border-border hover:border-primary hover:text-primary active:scale-95'
                        )}
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.name}</span>
                        {exists ? (
                          <Check className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom task composer */}
                {showTaskComposer ? (
                  <div className="rounded-2xl border bg-muted/40 p-3 space-y-3 mt-2">
                    <Input
                      value={taskDraftName}
                      onChange={(e) => setTaskDraftName(e.target.value)}
                      placeholder="Custom task name"
                      data-testid="custom-task-name"
                      className="rounded-lg h-10"
                      autoFocus
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {TASK_EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setTaskDraftEmoji(e)}
                          className={cn(
                            'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition',
                            taskDraftEmoji === e
                              ? 'bg-primary/15 ring-2 ring-primary'
                              : 'bg-card hover:bg-muted'
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowTaskComposer(false);
                          setTaskDraftName('');
                        }}
                        className="flex-1 rounded-lg h-10"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddTaskFromComposer}
                        disabled={!taskDraftName.trim()}
                        data-testid="add-custom-task"
                        className="flex-1 rounded-lg h-10"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTaskComposer(true)}
                    data-testid="show-custom-task"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-2 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Custom task
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        <div className="p-5 border-t flex items-center gap-3 bg-card shrink-0">
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
            onClick={() => {
              if (kid) {
                handleSaveProfile();
                onClose();
              } else {
                handleSaveProfile();
              }
            }}
            data-testid="save-kid-button"
            className="flex-1 rounded-xl h-11 font-bold"
          >
            {kid ? 'Done' : 'Add kid'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onRename,
  onChangeEmoji,
  onRemove,
}: {
  task: Task;
  onRename: (name: string) => void;
  onChangeEmoji: (emoji: string) => void;
  onRemove: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(task.name);
  const [pickingEmoji, setPickingEmoji] = useState(false);

  const commit = () => {
    if (draft.trim() && draft !== task.name) onRename(draft.trim());
    setEditingName(false);
  };

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl bg-card border"
      data-testid={`task-row-${task.id}`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickingEmoji((v) => !v)}
          className="w-10 h-10 rounded-lg bg-muted text-2xl flex items-center justify-center hover:bg-muted/70 transition"
          aria-label="Change emoji"
        >
          {task.emoji}
        </button>
        {pickingEmoji && (
          <div className="absolute z-10 left-0 top-12 bg-card border rounded-xl shadow-lg p-2 grid grid-cols-6 gap-1 w-56">
            {TASK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onChangeEmoji(e);
                  setPickingEmoji(false);
                }}
                className={cn(
                  'aspect-square rounded-md text-lg flex items-center justify-center hover:bg-muted',
                  task.emoji === e && 'bg-primary/15 ring-2 ring-primary'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {editingName ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(task.name);
              setEditingName(false);
            }
          }}
          autoFocus
          className="h-9 rounded-lg flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(task.name);
            setEditingName(true);
          }}
          className="flex-1 text-left font-semibold text-sm truncate"
        >
          {task.name}
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        data-testid={`remove-task-${task.id}`}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
        aria-label="Remove task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
