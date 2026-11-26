import { COCKTAILS } from '../data/cocktails';
import { INGREDIENT_MAP, amountRange, getIngredient } from '../data/ingredients';
import type { Cocktail, Ingredient, RecipeItem } from '../data/types';

// ─────────────────────────────────────────────────────────────
// Безалкогольный режим: чем заменить каждый алкогольный ингредиент
// ─────────────────────────────────────────────────────────────

interface Replacement {
  id: string;
  /** Доля от исходного объёма (для мл) */
  ratio?: number;
  /** Или фиксированное количество (для листьев/дэшей) */
  amount?: number;
}

interface Substitution {
  to: Replacement[];
  note: string;
}

export const NA_SUBSTITUTIONS: Record<string, Substitution> = {
  gin: { to: [{ id: 'na_gin', ratio: 1 }], note: 'безалкогольный джин' },
  vodka: { to: [{ id: 'na_spirit', ratio: 1 }], note: 'безалкогольный дистиллят' },
  white_rum: { to: [{ id: 'na_spirit', ratio: 1 }], note: 'безалкогольный дистиллят' },
  tequila: { to: [{ id: 'na_spirit', ratio: 1 }], note: 'безалкогольный дистиллят' },
  mezcal: { to: [{ id: 'smoky_tea', ratio: 1 }], note: 'копчёный чай даёт тот же дым' },
  scotch: { to: [{ id: 'smoky_tea', ratio: 1 }], note: 'копчёный чай вместо солода и дыма' },
  bourbon: { to: [{ id: 'smoky_tea', ratio: 1 }], note: 'чай даёт танины и «дубовую» сухость' },
  dark_rum: { to: [{ id: 'smoky_tea', ratio: 0.8 }, { id: 'vanilla_syrup', ratio: 0.2 }], note: 'чай + ваниль вместо карамели рома' },
  absinthe: { to: [], note: 'у абсента нет безалкогольной замены — убран' },
  jagermeister: { to: [{ id: 'na_aperitivo', ratio: 1 }], note: 'безалкогольный горький аперитив' },
  campari: { to: [{ id: 'na_aperitivo', ratio: 1 }], note: 'безалкогольный биттер-аперитив' },
  aperol: { to: [{ id: 'na_aperitivo', ratio: 1 }], note: 'безалкогольный биттер-аперитив' },
  amaro: { to: [{ id: 'na_aperitivo', ratio: 1 }], note: 'безалкогольный биттер-аперитив' },
  sweet_vermouth: { to: [{ id: 'na_aperitivo', ratio: 0.6 }, { id: 'honey_syrup', ratio: 0.2 }], note: 'аперитив + немного мёда вместо вермута' },
  dry_vermouth: { to: [{ id: 'na_aperitivo', ratio: 0.4 }], note: 'немного аперитива вместо сухого вермута' },
  triple_sec: { to: [{ id: 'simple_syrup', ratio: 0.7 }], note: 'сахарный сироп + апельсиновая цедра' },
  blue_curacao: { to: [{ id: 'simple_syrup', ratio: 0.7 }], note: 'сахарный сироп (синего цвета не будет)' },
  coffee_liqueur: { to: [{ id: 'espresso', ratio: 0.6 }, { id: 'vanilla_syrup', ratio: 0.6 }], note: 'эспрессо + ванильный сироп' },
  elderflower: { to: [{ id: 'elderflower_syrup', ratio: 1 }], note: 'сироп бузины' },
  maraschino: { to: [{ id: 'grenadine', ratio: 0.6 }], note: 'гренадин вместо вишнёвого ликёра' },
  chartreuse: { to: [{ id: 'honey_syrup', ratio: 0.6 }, { id: 'basil', amount: 4 }], note: 'мёд + базилик вместо 130 трав' },
  violette: { to: [{ id: 'simple_syrup', ratio: 0.8 }], note: 'сахарный сироп (фиалку заменить нечем)' },
  prosecco: { to: [{ id: 'na_sparkling', ratio: 1 }], note: 'безалкогольное игристое' },
  angostura: { to: [], note: 'в биттере 45% алкоголя — убран, добавьте апельсиновую цедру' },
  orange_bitters: { to: [], note: 'в биттере есть алкоголь — убран, добавьте цедру' },
};

export const isAlcoholic = (ing: Ingredient) => ing.abv > 0;

export const hasAlcohol = (items: RecipeItem[]) => items.some((i) => INGREDIENT_MAP[i.id] && isAlcoholic(INGREDIENT_MAP[i.id]));

export interface SwapInfo {
  from: string;
  to: string[];
  note: string;
}

/** Переводит рецепт в безалкогольный: заменяет, объединяет повторы, ограничивает объёмы */
export function toNonAlcoholic(items: RecipeItem[]): { items: RecipeItem[]; swaps: SwapInfo[] } {
  const out = new Map<string, number>();
  const order: string[] = [];
  const swaps: SwapInfo[] = [];
  const push = (id: string, amount: number) => {
    if (!out.has(id)) order.push(id);
    out.set(id, (out.get(id) ?? 0) + amount);
  };
  for (const item of items) {
    const ing = INGREDIENT_MAP[item.id];
    if (!ing) continue;
    const sub = NA_SUBSTITUTIONS[item.id];
    if (!isAlcoholic(ing) || !sub) {
      if (isAlcoholic(ing)) continue; // алкоголь без известной замены — просто убираем
      push(item.id, item.amount);
      continue;
    }
    for (const r of sub.to) {
      const target = getIngredient(r.id);
      const amount = r.amount ?? (target.defaultUnit === 'ml' ? Math.round(item.amount * (r.ratio ?? 1)) : target.defaultAmount);
      push(r.id, amount);
    }
    swaps.push({ from: item.id, to: sub.to.map((r) => r.id), note: sub.note });
  }
  const result = order.map((id) => {
    const { min, max } = amountRange(getIngredient(id));
    return { id, amount: Math.min(max, Math.max(min, out.get(id)!)) };
  });
  return { items: result, swaps };
}

/** Чем заменить один ингредиент при добавлении в шейкер (null — заменить нечем) */
export function naReplacementFor(id: string): { id: string; note: string } | null | undefined {
  const ing = INGREDIENT_MAP[id];
  if (!ing || !isAlcoholic(ing)) return undefined; // замена не нужна
  const sub = NA_SUBSTITUTIONS[id];
  if (!sub || sub.to.length === 0) return null;
  return { id: sub.to[0].id, note: sub.note };
}

export const naName = (name: string) => (/\b0%$/.test(name) || name.endsWith(' 0%') ? name : `${name} 0%`);

// ─────────────────────────────────────────────────────────────
// Безалкогольные версии всех коктейлей из базы
// ─────────────────────────────────────────────────────────────

export type NACocktail = Cocktail & { swaps: SwapInfo[]; originalId: string };

const naId = (id: string) => `${id}__na`;

let naCache: NACocktail[] | null = null;

export function naCocktails(): NACocktail[] {
  if (naCache) return naCache;
  // Если после замен остаётся меньше двух ингредиентов (например, абсент + игристое), такой версии не будет
  naCache = COCKTAILS.map((c) => {
    const { items, swaps } = toNonAlcoholic(c.ingredients);
    return {
      ...c,
      id: naId(c.id),
      originalId: c.id,
      name: naName(c.name),
      nameEn: `${c.nameEn} (NA)`,
      ingredients: items,
      swaps,
      vibeTags: [...c.vibeTags.filter((t) => t !== 'крепкий'), 'безалкогольный'],
      twists: c.twists.map((t) => ({ ...t, id: naId(t.id) })),
    };
  }).filter((c) => c.ingredients.length >= 2);
  return naCache;
}

/** Набор коктейлей для текущего режима */
export function cocktailPool(nonAlcoholic: boolean): Cocktail[] {
  return nonAlcoholic ? naCocktails() : COCKTAILS;
}

export const swapsOf = (c: Cocktail): SwapInfo[] => (c as Partial<NACocktail>).swaps ?? [];

/** id оригинального коктейля (для NA-версии — исходный) */
export const originalIdOf = (c: Cocktail): string => (c as Partial<NACocktail>).originalId ?? c.id;
