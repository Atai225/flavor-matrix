import type { Cocktail } from '../data/types';

// ─────────────────────────────────────────────────────────────
// «Мой бар»: что приготовить из того, что есть дома, и что докупить
// ─────────────────────────────────────────────────────────────

/** Базовый набор, который почти всегда есть на кухне */
export const STAPLES = ['lime', 'lemon', 'simple_syrup', 'soda', 'mint'];

export interface MissingResult {
  cocktail: Cocktail;
  missing: string[];
}

export interface ShoppingPlan {
  /** Что купить, по порядку пользы */
  buy: string[];
  /** Какие коктейли станут доступны после покупки */
  unlocks: Cocktail[];
}

export interface BarAnalysis {
  ready: Cocktail[];
  /** Не хватает одного ингредиента */
  oneAway: MissingResult[];
  /** Не хватает двух */
  twoAway: MissingResult[];
  /** Минимальный набор покупок, чтобы открыть ещё ~5 коктейлей */
  plan: ShoppingPlan;
  /** Какая одна покупка откроет больше всего */
  bestSingle: { id: string; unlocks: Cocktail[] }[];
}

const missingOf = (c: Cocktail, owned: Set<string>) => [...new Set(c.ingredients.map((i) => i.id))].filter((id) => !owned.has(id));

export function analyzeBar(ownedIds: Iterable<string>, pool: Cocktail[], target = 5): BarAnalysis {
  const owned = new Set(ownedIds);
  const ready: Cocktail[] = [];
  const oneAway: MissingResult[] = [];
  const twoAway: MissingResult[] = [];
  for (const c of pool) {
    const missing = missingOf(c, owned);
    if (missing.length === 0) ready.push(c);
    else if (missing.length === 1) oneAway.push({ cocktail: c, missing });
    else if (missing.length === 2) twoAway.push({ cocktail: c, missing });
  }

  // Какая одна покупка откроет больше всего коктейлей прямо сейчас
  const single = new Map<string, Cocktail[]>();
  for (const r of oneAway) single.set(r.missing[0], [...(single.get(r.missing[0]) ?? []), r.cocktail]);
  const bestSingle = [...single.entries()]
    .map(([id, unlocks]) => ({ id, unlocks }))
    .sort((a, b) => b.unlocks.length - a.unlocks.length)
    .slice(0, 6);

  // Жадный план: на каждом шаге берём покупку, которая открывает больше всего
  // новых коктейлей (при равенстве — ту, что сильнее приближает остальные)
  const have = new Set(owned);
  const buy: string[] = [];
  const unlocked = new Set<string>();
  const readyIds = new Set(ready.map((c) => c.id));
  while (unlocked.size < target && buy.length < 6) {
    const scores = new Map<string, number>();
    for (const c of pool) {
      if (readyIds.has(c.id) || unlocked.has(c.id)) continue;
      const missing = missingOf(c, have);
      for (const id of missing) {
        const gain = missing.length === 1 ? 10 : 1 / missing.length;
        scores.set(id, (scores.get(id) ?? 0) + gain);
      }
    }
    const best = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!best) break;
    buy.push(best[0]);
    have.add(best[0]);
    for (const c of pool) if (!readyIds.has(c.id) && missingOf(c, have).length === 0) unlocked.add(c.id);
  }
  const unlocks = pool.filter((c) => unlocked.has(c.id));
  // Убираем из плана покупки, которые в итоге ничего не открыли
  const useful = buy.filter((id) => unlocks.some((c) => c.ingredients.some((i) => i.id === id)));

  return { ready, oneAway, twoAway, plan: { buy: useful, unlocks }, bestSingle };
}
