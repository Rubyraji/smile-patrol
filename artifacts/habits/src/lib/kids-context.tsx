import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useKids, type Kid } from './store';
import { useFamilySync, mergeKids } from './family-sync';

type KidsCtx = ReturnType<typeof useKids>;

const KidsContext = createContext<KidsCtx | null>(null);

export function KidsProvider({ children }: { children: React.ReactNode }) {
  const store = useKids();
  const { familyCode, isLinked, pushNow } = useFamilySync();
  const didPullRef  = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Pull on mount (once per family session) ────────────────────────────
  useEffect(() => {
    if (!isLinked || !familyCode || didPullRef.current) return;
    didPullRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/family/${familyCode}/data`);
        if (!res.ok) return;
        const json = (await res.json()) as { payload: { kids: Kid[] } | null };
        const remote = json.payload?.kids;
        if (!Array.isArray(remote) || remote.length === 0) return;
        // Use the functional updater so we always have the latest local state.
        store.setKidsFromRemote((local: Kid[]) => mergeKids(local, remote));
      } catch {
        // Network not available — continue offline
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinked, familyCode]);

  // Reset pull flag when the family code changes (join / leave).
  useEffect(() => {
    didPullRef.current = false;
  }, [familyCode]);

  // ── Debounced push on every kids change ───────────────────────────────
  useEffect(() => {
    if (!isLinked) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void pushNow(store.kids);
    }, 2000);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.kids, isLinked, pushNow]);

  return <KidsContext.Provider value={store}>{children}</KidsContext.Provider>;
}

export function useKidsContext(): KidsCtx {
  const ctx = useContext(KidsContext);
  if (!ctx) throw new Error('useKidsContext must be used inside KidsProvider');
  return ctx;
}

// Re-export for pages that do a named import from here
export type { Kid };
