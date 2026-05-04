import { useState } from 'react';
import { ShoppingBag, Star, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useKidsContext as useKids } from '@/lib/kids-context';
import {
  SHOP_ITEMS,
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

export default function Shop() {
  const { kids, activeKid, activeId, setActiveId, buyShopItem } = useKids();
  const [tab, setTab] = useState<ShopCategory>('food');
  const [justBought, setJustBought] = useState<string | null>(null);
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
      setJustBought(item.id);
      setTimeout(() => setJustBought(null), 1200);
    }
  };

  return (
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
            {activeKid.pet ? '🐾' : activeKid.emoji}
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
              const bought = justBought === item.id;
              const shake  = notEnough === item.id;
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
                  {/* Bought flash overlay */}
                  <AnimatePresence>
                    {bought && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 flex items-center justify-center z-10 rounded-3xl"
                        style={{ backgroundColor: `${activeKid.color}dd` }}
                      >
                        <span className="text-4xl">✅</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
              Recently given to pet 🐾
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
  );
}
