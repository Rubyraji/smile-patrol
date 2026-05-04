import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useKidsContext as useKids } from '@/lib/kids-context';
import {
  SHOP_ITEMS,
  PET_SPECIES_LIST,
  getSpendablePoints,
  getTotalPointsEarned,
  type ShopCategory,
  type ShopItem,
} from '@/lib/store';
import { KidSwitcher } from '@/components/kid-switcher';
import { cn } from '@/lib/utils';

const TABS: { key: ShopCategory; label: string; emoji: string }[] = [
  { key: 'food',     label: 'Food',     emoji: '🍖' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
  { key: 'sleep',    label: 'Sleep',    emoji: '💤' },
];

const CATEGORY_MESSAGES: Record<ShopCategory, (petName: string, itemName: string) => string> = {
  food:     (petName, itemName) => `${petName} is munching on ${itemName}! 😋`,
  exercise: (petName, itemName) => `${petName} is enjoying ${itemName}! 🎉`,
  sleep:    (petName, itemName) => `${petName} is drifting off with ${itemName}… 😴`,
};

type CelebrationState = {
  item: ShopItem;
  petEmoji: string;
  petName: string;
};

function PetCelebrationOverlay({
  celebration,
  kidColor,
  onDone,
}: {
  celebration: CelebrationState;
  kidColor: string;
  onDone: () => void;
}) {
  const { item, petEmoji, petName } = celebration;
  const isSleep = item.category === 'sleep';

  useEffect(() => {
    const t = setTimeout(onDone, isSleep ? 3200 : 2400);
    return () => clearTimeout(t);
  }, [onDone, isSleep]);

  // ── item animation ──────────────────────────────────────────────────────
  const itemAnim =
    item.category === 'food'
      ? { scale: [1, 1.3, 0.8, 1.1, 0], x: [0, -20, -50, -70, -90], y: [0, -10, 0, 10, 20] }
      : item.category === 'exercise'
      ? { y: [0, -30, 0, -20, 0, -10, 0], rotate: [0, 20, -20, 20, -20, 0] }
      : { y: [0, -8, 0, -8, 0], scale: [1, 1.06, 1, 1.06, 1] }; // sleep: gentle float

  // ── pet animation ──────────────────────────────────────────────────────
  const petAnim =
    item.category === 'food'
      ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1, 1.1, 1] }
      : item.category === 'exercise'
      ? { y: [0, -20, 0, -20, 0], rotate: [0, 5, -5, 5, 0] }
      : { rotate: [0, -6, 6, -4, 4, 0], y: [0, 3, -3, 3, 0] }; // sleep: drowsy sway

  // ── card colour ────────────────────────────────────────────────────────
  const cardBg    = isSleep ? '#1e1b4b' : kidColor;
  const cardGlow  = isSleep ? '#6d28d9' : kidColor;

  // ── floating decorators ────────────────────────────────────────────────
  const sleepParticles = ['🌙', '⭐', '🌟', '💫', '🌙', '⭐'];
  const defaultParticles = ['✨', '⭐', '💫', '✨'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: isSleep ? 'rgba(10,10,30,0.75)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="rounded-4xl p-8 flex flex-col items-center gap-5 mx-6 max-w-xs w-full text-center relative overflow-hidden"
        style={{ backgroundColor: cardBg, boxShadow: `0 0 60px ${cardGlow}88` }}
      >
        {/* floating decorators */}
        {(isSleep ? sleepParticles : defaultParticles).map((s, i) => (
          <motion.span
            key={i}
            className="absolute text-xl pointer-events-none select-none"
            style={{ top: `${10 + i * 14}%`, left: i % 2 === 0 ? '7%' : '80%' }}
            animate={isSleep
              ? { y: [0, -18, -36], opacity: [0, 1, 0], scale: [0.7, 1.1, 0.5] }
              : { y: [0, -12, 0], opacity: [0.7, 1, 0.7] }
            }
            transition={{ duration: isSleep ? 2.2 : 1.2, delay: i * 0.25, repeat: Infinity }}
          >
            {s}
          </motion.span>
        ))}

        {/* floating Z's for sleep */}
        {isSleep && ['Z', 'z', 'Z'].map((z, i) => (
          <motion.span
            key={`z-${i}`}
            className="absolute font-black pointer-events-none select-none text-indigo-300"
            style={{
              fontSize: `${22 - i * 4}px`,
              left: `${52 + i * 10}%`,
              bottom: `${35 + i * 12}%`,
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -40 - i * 14, x: i * 6 }}
            transition={{ duration: 1.8, delay: 0.3 + i * 0.5, repeat: Infinity }}
          >
            {z}
          </motion.span>
        ))}

        {/* Pet + item scene */}
        <div className="flex items-end justify-center gap-3 mt-2">
          <motion.div
            animate={petAnim}
            transition={{ duration: isSleep ? 2.4 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl select-none"
          >
            {petEmoji}
          </motion.div>
          <motion.div
            animate={itemAnim}
            transition={{ duration: isSleep ? 2.2 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl select-none"
          >
            {item.emoji}
          </motion.div>
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-black leading-tight text-white">
            {CATEGORY_MESSAGES[item.category](petName, item.name)}
          </p>
          {isSleep && (
            <p className="text-indigo-200 text-base font-bold">Sweet dreams! 🌙</p>
          )}
          <p className="text-sm font-semibold opacity-60 text-white">Tap anywhere to close</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Shop() {
  const { kids, activeKid, activeId, setActiveId, buyShopItem } = useKids();
  const [tab, setTab] = useState<ShopCategory>('food');
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [notEnough, setNotEnough] = useState<string | null>(null);

  if (!activeKid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pb-24">
        <div className="text-center">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="text-muted-foreground font-semibold">No kid selected.</p>
          <Link href="/" className="text-primary font-bold text-sm mt-2 inline-block">← Go home</Link>
        </div>
      </div>
    );
  }

  const spendable = getSpendablePoints(activeKid);
  const earned    = getTotalPointsEarned(activeKid);
  const tabItems  = SHOP_ITEMS.filter((i) => i.category === tab);

  const petSpecies = activeKid.pet
    ? PET_SPECIES_LIST.find((s) => s.key === activeKid.pet!.species)
    : null;
  const petEmoji = petSpecies?.emoji ?? activeKid.emoji;
  const petName  = activeKid.pet?.name || petSpecies?.defaultName || activeKid.name;

  const recentPurchases = [...(activeKid.purchases ?? [])]
    .reverse()
    .slice(0, 6)
    .map((p) => ({ ...p, item: SHOP_ITEMS.find((i) => i.id === p.itemId) }))
    .filter((p) => p.item);

  const handleBuy = (item: ShopItem) => {
    if (spendable < item.cost) {
      setNotEnough(item.id);
      setTimeout(() => setNotEnough(null), 800);
      return;
    }
    const ok = buyShopItem(activeKid.id, item.id);
    if (ok) {
      setCelebration({ item, petEmoji, petName });
    }
  };

  return (
    <>
      <AnimatePresence>
        {celebration && (
          <PetCelebrationOverlay
            celebration={celebration}
            kidColor={activeKid.color}
            onDone={() => setCelebration(null)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-32">
        {/* Header */}
        <header className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-background/90 backdrop-blur-md">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/">
                <button className="w-9 h-9 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-black">Pet Shop</h1>
              </div>
            </div>
            <KidSwitcher kids={kids} activeId={activeId} onSelect={setActiveId} />
          </div>
        </header>

        <main className="px-5 max-w-md mx-auto space-y-5">
          {/* Balance card */}
          <motion.div
            key={activeKid.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 flex items-center gap-4"
            style={{
              background: `linear-gradient(135deg, ${activeKid.color}30, ${activeKid.color}10)`,
              border: `2px solid ${activeKid.color}50`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
              style={{ backgroundColor: activeKid.color }}
            >
              {petEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {activeKid.name}'s balance
              </p>
              <div className="flex items-baseline gap-1.5">
                <motion.span
                  key={spendable}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: activeKid.color }}
                >
                  {spendable}
                </motion.span>
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-muted-foreground">to spend</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Earned {earned} pts total
              </p>
            </div>
          </motion.div>

          {/* Category tabs */}
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-1.5',
                  tab === t.key
                    ? 'text-white shadow-md scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
                style={tab === t.key ? { backgroundColor: activeKid.color } : {}}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Shop items grid */}
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {tabItems.map((item) => {
                const canAfford = spendable >= item.cost;
                const shake = notEnough === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={
                      shake
                        ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }
                        : { opacity: 1, scale: 1, x: 0 }
                    }
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'rounded-3xl p-4 border-2 flex flex-col items-center gap-2 relative overflow-hidden transition-colors',
                      canAfford ? 'bg-card' : 'bg-muted/40',
                      canAfford ? '' : 'opacity-60',
                    )}
                    style={{ borderColor: canAfford ? `${activeKid.color}55` : 'var(--border)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm"
                      style={{ backgroundColor: canAfford ? `${activeKid.color}22` : 'hsl(var(--muted))' }}
                    >
                      {item.emoji}
                    </div>
                    <p className="text-sm font-black text-center leading-tight">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground text-center leading-snug">
                      {item.description}
                    </p>

                    <button
                      onClick={() => handleBuy(item)}
                      className={cn(
                        'w-full mt-1 py-2 rounded-xl text-sm font-black transition-all active:scale-95',
                        canAfford
                          ? 'text-white'
                          : 'bg-muted text-muted-foreground cursor-not-allowed',
                      )}
                      style={canAfford ? { backgroundColor: activeKid.color } : {}}
                    >
                      <Star className="inline h-3.5 w-3.5 fill-current mr-1 -mt-0.5" />
                      {item.cost} pts
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Recent purchases */}
          {recentPurchases.length > 0 && (
            <div className="rounded-3xl border bg-card p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Recently given to {petName} 🐾
              </p>
              <div className="space-y-2">
                {recentPurchases.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{p.item!.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight">{p.item!.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.purchasedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${activeKid.color}22`, color: activeKid.color }}
                    >
                      -{p.item!.cost} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spendable === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border-2 border-dashed p-6 text-center space-y-2"
            >
              <div className="text-4xl">🦷</div>
              <p className="font-black text-base">Keep brushing to earn more!</p>
              <p className="text-sm text-muted-foreground">
                Brush your teeth, floss, and complete tasks to earn points you can spend here.
              </p>
              <Link href="/brush">
                <button
                  className="mt-2 px-5 py-2 rounded-full text-sm font-black text-white"
                  style={{ backgroundColor: activeKid.color }}
                >
                  Go brush now →
                </button>
              </Link>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}
