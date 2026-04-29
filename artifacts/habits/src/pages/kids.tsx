import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Trash2, Plus, X, Check } from 'lucide-react';
import {
  useKids,
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
  const { kids, addKid, removeKid, updateKid, addTask, updateTask, removeTask } = useKids();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Kid | null>(null);

  const editing = editingId ? kids.find((k) => k.id === editingId) ?? null : null;

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
      </main>

      {(editing || adding) && (
        <KidEditor
          kid={editing}
          onClose={() => {
            setEditingId(null);
            setAdding(false);
          }}
          onSaveProfile={(name, emoji, color) => {
            if (editing) {
              updateKid(editing.id, { name, emoji, color });
            } else {
              addKid(name, emoji, color);
              setAdding(false);
            }
          }}
          onAddTask={(name, emoji, time) => editing && addTask(editing.id, name, emoji, time)}
          onUpdateTask={(taskId, updates) => editing && updateTask(editing.id, taskId, updates)}
          onRemoveTask={(taskId) => editing && removeTask(editing.id, taskId)}
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
    </div>
  );
}

function KidEditor({
  kid,
  onClose,
  onSaveProfile,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onDelete,
}: {
  kid: Kid | null;
  onClose: () => void;
  onSaveProfile: (name: string, emoji: string, color: string) => void;
  onAddTask: (name: string, emoji: string, time?: TaskTime) => void;
  onUpdateTask: (taskId: string, updates: Partial<Pick<Task, 'name' | 'emoji'>>) => void;
  onRemoveTask: (taskId: string) => void;
  onDelete?: () => void;
}) {
  const initialEmoji = kid?.emoji ?? KID_EMOJIS[0];
  const initialCategory =
    CHARACTER_CATEGORIES.find((c) => c.characters.includes(initialEmoji))?.key ??
    CHARACTER_CATEGORIES[0].key;

  const [name, setName] = useState(kid?.name ?? '');
  const [emoji, setEmoji] = useState(initialEmoji);
  const [color, setColor] = useState(kid?.color ?? KID_COLORS[0]);
  const [characterCategory, setCharacterCategory] = useState<string>(initialCategory);
  const [taskDraftName, setTaskDraftName] = useState('');
  const [taskDraftEmoji, setTaskDraftEmoji] = useState(TASK_EMOJIS[0]);
  const [showTaskComposer, setShowTaskComposer] = useState(false);

  const activeCategory =
    CHARACTER_CATEGORIES.find((c) => c.key === characterCategory) ?? CHARACTER_CATEGORIES[0];

  const tasks = kid?.tasks ?? [];

  const presetExists = (name: string) =>
    tasks.some((t) => t.name.toLowerCase() === name.toLowerCase());

  const handleSaveProfile = () => {
    onSaveProfile(name.trim() || 'Kiddo', emoji, color);
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
              <div className="space-y-2 mb-4">
                {QUICK_TOGGLE_PRESETS.map((preset) => {
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
