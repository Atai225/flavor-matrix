import { COCKTAILS } from '../data/cocktails';
import { INGREDIENTS, INGREDIENT_MAP, getIngredient, synergyBetween } from '../data/ingredients';
import type { Category, Cocktail, Ingredient, RecipeItem } from '../data/types';
import { computeStats, type Balance, type BalanceKey, type RecipeStats } from './mixologyMath';

// Кэш статистики коктейлей из базы
const statsCache = new Map<string, RecipeStats>();
export function cocktailStats(c: Cocktail): RecipeStats {
  let s = statsCache.get(c.id);
  if (!s) {
    s = computeStats(c.ingredients);
    statsCache.set(c.id, s);
  }
  return s;
}

const KEYS: BalanceKey[] = ['strength', 'sweet', 'sour', 'bitter', 'fresh'];

function profileSimilarity(a: Balance, b: Balance): number {
  // 1 — одинаковые, 0 — максимально разные
  const d = Math.sqrt(KEYS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0));
  return Math.max(0, 1 - d / 14);
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

// ─────────────────────────────────────────────────────────────
// 1. «По любимому коктейлю» — похожие и твисты
// ─────────────────────────────────────────────────────────────

const FLAVOR_WORDS: Record<BalanceKey, [string, string]> = {
  strength: ['крепче', 'легче по градусу'],
  sweet: ['слаще', 'суше'],
  sour: ['кислее', 'мягче по кислоте'],
  bitter: ['горче', 'менее горький'],
  fresh: ['ароматнее и свежее', 'проще по аромату'],
};

export function explainDifference(from: Cocktail, to: Cocktail, flavorOnly = false): string {
  const a = new Set(from.ingredients.map((i) => i.id));
  const b = new Set(to.ingredients.map((i) => i.id));
  const removed = [...a].filter((x) => !b.has(x)).map(getIngredient);
  const added = [...b].filter((x) => !a.has(x)).map(getIngredient);
  const parts: string[] = [];
  // Замены внутри одной категории: «Бурбон вместо Джина»
  const usedAdded = new Set<string>();
  const usedRemoved = new Set<string>();
  for (const r of removed) {
    const swap = added.find((x) => x.category === r.category && !usedAdded.has(x.id));
    if (swap) {
      parts.push(`${r.name} → ${swap.name}`);
      usedAdded.add(swap.id);
      usedRemoved.add(r.id);
    }
  }
  const restAdded = added.filter((x) => !usedAdded.has(x.id));
  const restRemoved = removed.filter((x) => !usedRemoved.has(x.id));
  if (restAdded.length) parts.push(`+ ${restAdded.map((x) => x.name.toLowerCase()).join(', ')}`);
  if (restRemoved.length) parts.push(`без: ${restRemoved.map((x) => x.name.toLowerCase()).join(', ')}`);

  const sa = cocktailStats(from).balance;
  const sb = cocktailStats(to).balance;
  const diffs = KEYS.map((k) => ({ k, d: sb[k] - sa[k] }))
    .filter((x) => Math.abs(x.d) > 1.2)
    .sort((x, y) => Math.abs(y.d) - Math.abs(x.d))
    .slice(0, 2)
    .map((x) => (x.d > 0 ? FLAVOR_WORDS[x.k][0] : FLAVOR_WORDS[x.k][1]));
  const taste = diffs.length ? `На вкус — ${diffs.join(' и ')}.` : '';
  if (flavorOnly) return taste;
  const change = parts.join('; ') || 'тот же состав, другие пропорции';
  return taste ? `${change}. ${taste}` : `${change}.`;
}

export interface SimilarResult {
  cocktail: Cocktail;
  score: number; // 0–100
  note: string;
  curated: boolean;
}

export function similarCocktails(id: string, limit = 4, pool: Cocktail[] = COCKTAILS): SimilarResult[] {
  const COCKTAIL_MAP: Record<string, Cocktail> = Object.fromEntries(pool.map((c) => [c.id, c]));
  const base = COCKTAIL_MAP[id];
  if (!base) return [];
  const baseIds = new Set(base.ingredients.map((i) => i.id));
  const baseTags = new Set(base.vibeTags);
  const scoreOf = (c: Cocktail) => {
    const ids = new Set(c.ingredients.map((i) => i.id));
    const s =
      0.45 * jaccard(baseIds, ids) +
      0.35 * profileSimilarity(cocktailStats(base).balance, cocktailStats(c).balance) +
      0.2 * jaccard(baseTags, new Set(c.vibeTags));
    return Math.round(Math.min(99, 30 + s * 90));
  };
  const curated: SimilarResult[] = base.twists
    .map((t) => COCKTAIL_MAP[t.id])
    .filter(Boolean)
    .slice(0, 3)
    .map((c) => ({
      cocktail: c,
      score: scoreOf(c),
      note: `${base.twists.find((t) => t.id === c.id)!.note} ${explainDifference(base, c, true)}`.trim(),
      curated: true,
    }));
  const taken = new Set([base.id, ...curated.map((c) => c.cocktail.id)]);
  const computed = pool.filter((c) => !taken.has(c.id))
    .map((c) => ({ cocktail: c, score: scoreOf(c), note: explainDifference(base, c), curated: false }))
    .sort((a, b) => b.score - a.score);
  return [...curated, ...computed].slice(0, limit);
}

// ─────────────────────────────────────────────────────────────
// 2. «Люблю / Не переношу»
// ─────────────────────────────────────────────────────────────

export interface PreferenceResult {
  cocktail: Cocktail;
  match: number; // 0–100
  liked: string[];
  blockedBy: string[];
}

export function rankByPreferences(
  likes: string[],
  dislikes: string[],
  blockedCategories: Category[] = [],
  pool: Cocktail[] = COCKTAILS,
): PreferenceResult[] {
  const likeSet = new Set(likes);
  const dislikeSet = new Set(dislikes);
  return pool.map((c) => {
    const ids = c.ingredients.map((i) => i.id);
    const blockedBy = ids
      .filter((id) => dislikeSet.has(id) || blockedCategories.includes(getIngredient(id).category))
      .map((id) => getIngredient(id).name);
    const liked = ids.filter((id) => likeSet.has(id)).map((id) => getIngredient(id).name);
    let match: number;
    if (blockedBy.length) {
      match = 0;
    } else if (likes.length === 0) {
      match = 70;
    } else {
      const coverage = liked.length / likes.length;
      // «Родство»: насколько любимые ингредиенты дружат с составом, даже если их нет в рецепте
      const affinity =
        likes.reduce((s, l) => s + Math.max(likeSet.has(l) && ids.includes(l) ? 100 : 0, ...ids.map((id) => synergyBetween(l, id))), 0) /
        (likes.length * 100);
      match = liked.length
        ? Math.round(42 + 56 * (0.7 * coverage + 0.3 * affinity))
        : Math.round(12 + 38 * affinity);
    }
    return { cocktail: c, match: Math.min(99, match), liked, blockedBy };
  }).sort((a, b) => b.match - a.match || a.cocktail.name.localeCompare(b.cocktail.name, 'ru'));
}

// ─────────────────────────────────────────────────────────────
// 3. «Хочу чего-то такого…» — разбор свободного текста
// ─────────────────────────────────────────────────────────────

interface Concept {
  stems: string[];
  tags?: string[];
  flavor?: Partial<Record<BalanceKey, 'high' | 'low'>>;
  ids?: string[];
  label: string;
}

const CONCEPTS: Concept[] = [
  { label: 'кислое', stems: ['кисл', 'кисел', 'sour'], tags: ['кислый'], flavor: { sour: 'high' } },
  { label: 'сладкое', stems: ['сладк', 'слащ', 'сладен', 'sweet'], tags: ['сладкий'], flavor: { sweet: 'high' } },
  { label: 'десертное', stems: ['десерт', 'сливоч', 'пирож', 'торт'], tags: ['десертный', 'сладкий', 'ванильный'], flavor: { sweet: 'high' } },
  { label: 'горькое', stems: ['горьк', 'горч', 'горек', 'bitter'], tags: ['горький', 'горьковатый'], flavor: { bitter: 'high' } },
  { label: 'крепкое', stems: ['крепк', 'мощн', 'сильн', 'градус', 'забор', 'strong'], tags: ['крепкий'], flavor: { strength: 'high' } },
  { label: 'лёгкое', stems: ['легк', 'слаб', 'некрепк', 'легон', 'light'], tags: ['лёгкий'], flavor: { strength: 'low' } },
  { label: 'освежающее', stems: ['освеж', 'свеж', 'прохлад', 'летн', 'лето', 'жарк', 'жара', 'fresh'], tags: ['освежающий', 'летний'], flavor: { fresh: 'high' } },
  { label: 'дымное', stems: ['дым', 'копч', 'костр', 'smok'], tags: ['дымный'], ids: ['mezcal', 'scotch'] },
  { label: 'ягодное', stems: ['ягод', 'малин', 'клубни', 'вишн', 'смород', 'клюкв', 'ежевик', 'berry'], tags: ['ягодный'], ids: ['blackcurrant', 'cranberry'] },
  { label: 'цитрус', stems: ['цитрус', 'лимон', 'лайм', 'апельс', 'грейпф', 'citrus'], tags: ['цитрус'] },
  { label: 'тропическое', stems: ['тропи', 'маракуй', 'ананас', 'кокос', 'пляж', 'отпуск', 'море', 'тики', 'tropic'], tags: ['тропический', 'фруктовый'] },
  { label: 'фруктовое', stems: ['фрукт', 'сочн'], tags: ['фруктовый'] },
  { label: 'кофейное', stems: ['коф', 'эспрес', 'капуч', 'coffee'], tags: ['кофейный'], ids: ['espresso', 'coffee_liqueur'] },
  { label: 'острое', stems: ['остр', 'перч', 'перец', 'чили', 'жгуч', 'пикант', 'spicy', 'огон'], tags: ['острый'], ids: ['chili'] },
  { label: 'пряное', stems: ['прян', 'специ', 'имбир', 'гвозд', 'кориц'], tags: ['пряный', 'имбирный'], ids: ['ginger'] },
  { label: 'травяное', stems: ['трав', 'зелен', 'herb', 'садов'], tags: ['травяной', 'садовый'], flavor: { fresh: 'high' } },
  { label: 'мятное', stems: ['мят', 'mint'], tags: ['мятный'], ids: ['mint'] },
  { label: 'цветочное', stems: ['цвет', 'бузин', 'фиалк', 'лаванд', 'flower'], tags: ['цветочный'], ids: ['elderflower', 'violette'] },
  { label: 'с пузырьками', stems: ['пузыр', 'игрист', 'газир', 'шипуч', 'шампан', 'bubbl'], tags: ['пузырьки', 'игристый'] },
  { label: 'праздничное', stems: ['праздн', 'вечерин', 'тусов', 'party', 'клуб'], tags: ['вечеринка', 'праздничный'] },
  { label: 'тёплое', stems: ['тепл', 'согрев', 'зим', 'уют', 'осен', 'камин'], tags: ['тёплый', 'согревающий'] },
  { label: 'медовое', stems: ['мед', 'honey'], tags: ['медовый'], ids: ['honey_syrup'] },
  { label: 'ванильное', stems: ['ванил'], tags: ['ванильный'], ids: ['vanilla_syrup'] },
  { label: 'сухое', stems: ['сух', 'dry'], tags: ['сухой', 'не сладкий'], flavor: { sweet: 'low' } },
  { label: 'аперитив', stems: ['аперит', 'ужин'], tags: ['аперитив'] },
  { label: 'бодрящее', stems: ['бодр', 'взбод', 'энерг'], tags: ['бодрящий'] },
  { label: 'сложное', stems: ['сложн', 'необычн', 'интересн', 'странн', 'удив'], tags: ['сложный'] },
  { label: 'анисовое', stems: ['анис', 'лакриц'], tags: ['анисовый'], ids: ['absinthe'] },
  { label: 'миндальное', stems: ['миндал', 'орех'], tags: ['миндальный'], ids: ['orgeat'] },
  { label: 'карамельное', stems: ['карамел', 'ирис'], tags: ['карамельный'] },
  // Конкретные ингредиенты
  { label: 'джин', stems: ['джин', 'gin'], ids: ['gin'] },
  { label: 'бурбон', stems: ['бурбон', 'bourbon'], ids: ['bourbon'] },
  { label: 'виски', stems: ['виск', 'скотч', 'whisk'], ids: ['scotch', 'bourbon'] },
  { label: 'ром', stems: ['ром', 'rum'], ids: ['white_rum', 'dark_rum'] },
  { label: 'водка', stems: ['водк', 'vodka'], ids: ['vodka'] },
  { label: 'текила', stems: ['текил', 'tequila'], ids: ['tequila'] },
  { label: 'мескаль', stems: ['мескал', 'mezcal'], ids: ['mezcal'] },
  { label: 'абсент', stems: ['абсент'], ids: ['absinthe'] },
  { label: 'егермейстер', stems: ['егер', 'ягер', 'jager'], ids: ['jagermeister'] },
  { label: 'кампари', stems: ['кампар', 'campari'], ids: ['campari'] },
  { label: 'апероль', stems: ['аперол', 'aperol'], ids: ['aperol'] },
  { label: 'вермут', stems: ['вермут', 'мартини'], ids: ['sweet_vermouth', 'dry_vermouth'] },
  { label: 'просекко', stems: ['просекк', 'prosecco'], ids: ['prosecco'] },
  { label: 'тоник', stems: ['тоник', 'tonic'], ids: ['tonic'] },
  { label: 'имбирное пиво', stems: ['имбирн'], ids: ['ginger_beer', 'ginger'] },
  { label: 'шартрез', stems: ['шартрез'], ids: ['chartreuse'] },
];

const NEGATORS = new Set(['не', 'без', 'нет', 'никаких', 'никакого', 'никакой', 'кроме', 'not', 'no', 'without', 'ни']);

export interface ParsedQuery {
  wantTags: string[];
  avoidTags: string[];
  flavor: Partial<Record<BalanceKey, 'high' | 'low'>>;
  includeIds: string[];
  excludeIds: string[];
  matched: string[]; // распознанные понятия, для UI
  negated: string[];
}

export const emptyQuery = (): ParsedQuery => ({
  wantTags: [],
  avoidTags: [],
  flavor: {},
  includeIds: [],
  excludeIds: [],
  matched: [],
  negated: [],
});

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

export function parseQuery(text: string): ParsedQuery {
  const q = emptyQuery();
  const tokens = normalize(text).split(/[^a-zа-я0-9]+/i).filter(Boolean);
  let negateLeft = 0; // сколько следующих слов попадают под отрицание
  for (const tok of tokens) {
    if (NEGATORS.has(tok)) {
      negateLeft = 2;
      continue;
    }
    if (tok === 'и' || tok === 'а' || tok === 'с' || tok === 'со') {
      // «не сладкое и не горькое» — «и» не снимает отрицание, но «с» — снимает
      if (tok !== 'и') negateLeft = 0;
      continue;
    }
    const concept = CONCEPTS.find((c) => c.stems.some((s) => tok.startsWith(normalize(s))));
    const negated = negateLeft > 0;
    negateLeft = Math.max(0, negateLeft - 1);
    if (!concept) continue;
    if (negated) {
      q.negated.push(concept.label);
      q.avoidTags.push(...(concept.tags ?? []));
      q.excludeIds.push(...(concept.ids ?? []));
      for (const [k, v] of Object.entries(concept.flavor ?? {})) q.flavor[k as BalanceKey] = v === 'high' ? 'low' : 'high';
      negateLeft = 0;
    } else {
      q.matched.push(concept.label);
      q.wantTags.push(...(concept.tags ?? []));
      q.includeIds.push(...(concept.ids ?? []));
      Object.assign(q.flavor, concept.flavor ?? {});
    }
  }
  q.wantTags = [...new Set(q.wantTags)];
  q.avoidTags = [...new Set(q.avoidTags)];
  q.includeIds = [...new Set(q.includeIds)].filter((id) => !q.excludeIds.includes(id));
  q.excludeIds = [...new Set(q.excludeIds)];
  q.matched = [...new Set(q.matched)];
  q.negated = [...new Set(q.negated)];
  return q;
}

export function mergeQueries(a: ParsedQuery, b: Partial<ParsedQuery>): ParsedQuery {
  const uniq = (x: string[]) => [...new Set(x)];
  return {
    wantTags: uniq([...a.wantTags, ...(b.wantTags ?? [])]),
    avoidTags: uniq([...a.avoidTags, ...(b.avoidTags ?? [])]),
    flavor: { ...a.flavor, ...(b.flavor ?? {}) },
    includeIds: uniq([...a.includeIds, ...(b.includeIds ?? [])].filter((id) => INGREDIENT_MAP[id])),
    excludeIds: uniq([...a.excludeIds, ...(b.excludeIds ?? [])].filter((id) => INGREDIENT_MAP[id])),
    matched: uniq([...a.matched, ...(b.matched ?? [])]),
    negated: uniq([...a.negated, ...(b.negated ?? [])]),
  };
}

export const isEmptyQuery = (q: ParsedQuery) =>
  !q.wantTags.length && !q.avoidTags.length && !Object.keys(q.flavor).length && !q.includeIds.length && !q.excludeIds.length;

function cocktailTags(c: Cocktail): Set<string> {
  const s = new Set(c.vibeTags);
  for (const i of c.ingredients) for (const t of getIngredient(i.id).vibeTags) s.add(t);
  return s;
}

export interface MoodResult {
  cocktail: Cocktail;
  match: number;
  hits: string[];
}

export function matchMood(q: ParsedQuery, limit = 3, pool: Cocktail[] = COCKTAILS): MoodResult[] {
  return pool.map((c) => {
    const own = new Set(c.vibeTags);
    const all = cocktailTags(c);
    const ids = new Set(c.ingredients.map((i) => i.id));
    const bal = cocktailStats(c).balance;
    const hits: string[] = [];
    const parts: { w: number; v: number }[] = [];

    if (q.wantTags.length) {
      let v = 0;
      for (const t of q.wantTags) {
        if (own.has(t)) { v += 1; hits.push(t); }
        else if (all.has(t)) { v += 0.5; hits.push(t); }
      }
      // Нормируем по «группам» понятий, а не по каждому тегу-синониму
      parts.push({ w: 0.45, v: Math.min(1, v / Math.max(1, q.wantTags.length * 0.6)) });
    }
    const fKeys = Object.keys(q.flavor) as BalanceKey[];
    if (fKeys.length) {
      const v = fKeys.reduce((s, k) => s + (q.flavor[k] === 'high' ? bal[k] / 10 : 1 - bal[k] / 10), 0) / fKeys.length;
      parts.push({ w: 0.35, v });
    }
    if (q.includeIds.length) {
      const v = q.includeIds.filter((id) => ids.has(id)).length / Math.min(q.includeIds.length, 2);
      parts.push({ w: 0.3, v: Math.min(1, v) });
    }
    const wSum = parts.reduce((s, p) => s + p.w, 0);
    let score = wSum ? parts.reduce((s, p) => s + p.w * p.v, 0) / wSum : 0.5;
    if (q.excludeIds.some((id) => ids.has(id))) score *= 0.1;
    const avoidHits = q.avoidTags.filter((t) => own.has(t)).length;
    score -= 0.22 * avoidHits;
    return { cocktail: c, match: Math.round(Math.max(3, Math.min(99, 30 + 69 * score))), hits: [...new Set(hits)] };
  })
    .sort((a, b) => b.match - a.match)
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────
// Авторская связка под запрос
// ─────────────────────────────────────────────────────────────

export interface SignatureRecipe {
  name: string;
  items: RecipeItem[];
  roles: { id: string; role: string }[];
  synergy: number;
  method: string;
}

function ingredientFit(ing: Ingredient, q: ParsedQuery): number {
  let s = 0;
  for (const t of q.wantTags) if (ing.vibeTags.includes(t)) s += 1;
  for (const t of q.avoidTags) if (ing.vibeTags.includes(t)) s -= 1.5;
  if (q.includeIds.includes(ing.id)) s += 4;
  const fk = Object.keys(q.flavor) as BalanceKey[];
  for (const k of fk) {
    const v =
      k === 'strength' ? ing.abv / 5 : k === 'fresh' ? ing.profile.herbal : k === 'sweet' ? ing.profile.sweet : k === 'sour' ? ing.profile.sour : ing.profile.bitter;
    s += q.flavor[k] === 'high' ? v / 10 : -v / 20;
  }
  return s;
}

const ADJ: Record<string, string> = {
  дымный: 'Дымный', кислый: 'Кислый', ягодный: 'Ягодный', цитрус: 'Цитрусовый', тропический: 'Тропический',
  кофейный: 'Кофейный', острый: 'Огненный', пряный: 'Пряный', травяной: 'Травяной', мятный: 'Мятный',
  цветочный: 'Цветочный', пузырьки: 'Искрящийся', игристый: 'Игристый', освежающий: 'Ледяной', горький: 'Горький',
  крепкий: 'Крепкий', лёгкий: 'Лёгкий', тёплый: 'Тёплый', медовый: 'Медовый', десертный: 'Десертный',
  ванильный: 'Ванильный', сладкий: 'Бархатный', сухой: 'Сухой', аперитив: 'Аперитивный', анисовый: 'Анисовый',
  миндальный: 'Миндальный', бодрящий: 'Бодрящий', вечеринка: 'Клубный', праздничный: 'Праздничный', фруктовый: 'Сочный',
  карамельный: 'Карамельный', сложный: 'Сложный', летний: 'Летний', согревающий: 'Согревающий', садовый: 'Садовый',
};

const BASE_SHORT: Record<string, string> = {
  gin: 'джин', bourbon: 'бурбон', scotch: 'скотч', dark_rum: 'ром', white_rum: 'ром', vodka: 'водка',
  tequila: 'текила', mezcal: 'мескаль', absinthe: 'абсент', jagermeister: 'егерь',
  na_gin: 'джин', na_spirit: 'дистиллят', smoky_tea: 'чай',
};

export function composeSignature(q: ParsedQuery, opts: { nonAlcoholic?: boolean } = {}): SignatureRecipe {
  const excluded = new Set(q.excludeIds);
  const blockedTag = (i: Ingredient) => i.vibeTags.some((t) => q.avoidTags.includes(t) && t !== 'классика');
  const chosen: { id: string; amount: number; role: string }[] = [];
  const chosenIds = () => chosen.map((c) => c.id);
  const synergyWithChosen = (id: string) => {
    const ids = chosenIds();
    if (!ids.length) return 0;
    return ids.reduce((s, x) => s + synergyBetween(id, x), 0) / ids.length;
  };
  const pick = (filter: (i: Ingredient) => boolean, role: string, amountOf: (i: Ingredient) => number, minSyn = 0) => {
    const cands = INGREDIENTS.filter(
      (i) => filter(i) && !excluded.has(i.id) && !chosenIds().includes(i.id) && !blockedTag(i) && !(opts.nonAlcoholic && i.abv > 0),
    )
      .map((i) => ({ i, syn: synergyWithChosen(i.id), fit: ingredientFit(i, q) }))
      .filter((c) => chosen.length === 0 || c.syn >= minSyn)
      .sort((a, b) => b.fit * 18 + b.syn - (a.fit * 18 + a.syn));
    const best = cands[0];
    if (best) chosen.push({ id: best.i.id, amount: amountOf(best.i), role });
    return best?.i;
  };

  const wants = (...tags: string[]) => tags.some((t) => q.wantTags.includes(t));
  const light = q.flavor.strength === 'low' || wants('лёгкий', 'пузырьки', 'игристый');
  const wantsMixer = light || wants('освежающий', 'летний', 'пузырьки', 'игристый');
  const dessert = wants('десертный', 'кофейный', 'ванильный');
  const dry = q.flavor.sweet === 'low';
  const aperitif = wants('горький', 'горьковатый', 'аперитив');
  const wantsAcid =
    q.flavor.sour === 'high' ||
    wants('кислый', 'цитрус', 'ягодный', 'тропический', 'освежающий') ||
    (!dessert && !dry && !aperitif && !wants('крепкий'));

  // 1) Основа
  const base = pick((i) => i.category === 'spirit', 'Основа', () => (wantsMixer ? 45 : wantsAcid ? 50 : 60));
  // 2) Кислота / сок
  if (wantsAcid) pick((i) => i.category === 'citrus', 'Кислота', (i) => (i.id === 'lime' || i.id === 'lemon' ? 22 : 30), 1);
  // 3) Сладкий баланс
  if (!dry || wantsAcid) {
    pick(
      (i) => i.category === 'syrup' || (i.category === 'liqueur' && i.profile.sweet >= 6),
      dessert ? 'Десертная сладость' : 'Баланс сладости',
      (i) => (i.category === 'syrup' ? (dry ? 8 : 15) : 20),
      1,
    );
  }
  if (wantsAcid) {
    // 4) Акцент — то, что делает характер сауэра/хайбола
    pick(
      (i) => (i.category === 'botanical' || i.category === 'liqueur') && !(dry && i.profile.sweet > 6),
      'Акцент',
      (i) => (i.category === 'liqueur' ? Math.min(20, i.defaultAmount) : i.defaultAmount),
      1,
    );
  } else {
    // 4) Спиритовый стир: модификатор + ароматический биттер
    pick(
      (i) => i.category === 'liqueur' && !(dry && i.profile.sweet > 7),
      'Модификатор',
      (i) => (i.profile.bitter >= 5 || i.id.includes('vermouth') ? 25 : 15),
      1,
    );
    if (opts.nonAlcoholic) pick((i) => i.category === 'botanical' && i.defaultUnit === 'dash', 'Аромат', (i) => i.defaultAmount, 1);
    else pick((i) => i.category === 'botanical' && i.defaultUnit === 'dash' && i.abv > 0, 'Биттер', () => 2, 1);
  }
  // 5) Миксер для длинных напитков
  if (wantsMixer) pick((i) => i.category === 'mixer', 'Долив', () => 100, 1);

  const items: RecipeItem[] = chosen.map((c) => ({ id: c.id, amount: c.amount }));
  const stats = computeStats(items);
  const ids = items.map((i) => i.id);
  let pairs = 0;
  let synSum = 0;
  for (let a = 0; a < ids.length; a++)
    for (let b = a + 1; b < ids.length; b++) {
      pairs++;
      synSum += synergyBetween(ids[a], ids[b]);
    }
  const synergy = pairs ? Math.round(synSum / pairs) : 0;
  const tagForName = q.wantTags.find((t) => ADJ[t]) ?? q.matched.map((m) => m).find((m) => ADJ[m]) ?? '';
  const adj = ADJ[tagForName] ?? 'Авторский';
  const style = stats.method === 'build' ? 'хайбол' : stats.method === 'shake' ? 'сауэр' : 'стир';
  const baseName = base ? BASE_SHORT[base.id] ?? base.name.toLowerCase() : 'микс';
  return {
    name: `${adj} ${baseName}-${style}${opts.nonAlcoholic ? ' 0%' : ''}`,
    items,
    roles: chosen.map((c) => ({ id: c.id, role: c.role })),
    synergy,
    method: stats.method,
  };
}

// ─────────────────────────────────────────────────────────────
// Готовые чипсы-настроения
// ─────────────────────────────────────────────────────────────

export const MOOD_CHIPS: { emoji: string; text: string }[] = [
  { emoji: '🍋', text: 'кислое, освежающее и ягодное' },
  { emoji: '🔥', text: 'крепкое, дымное и не сладкое' },
  { emoji: '☕', text: 'кофейное и десертное' },
  { emoji: '🌶️', text: 'с остринкой и цитрусом' },
  { emoji: '🏝️', text: 'тропическое, как в отпуске' },
  { emoji: '🌿', text: 'горько-травяной аперитив' },
  { emoji: '🫧', text: 'лёгкое с пузырьками' },
  { emoji: '🍯', text: 'тёплое, медовое и пряное' },
];

// ─────────────────────────────────────────────────────────────
// Опционально: разбор нестандартного запроса через LLM
// ─────────────────────────────────────────────────────────────

export interface AISettings {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model: string;
}

export const DEFAULT_MODELS: Record<AISettings['provider'], string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
};

const ALL_TAGS = [...new Set([...INGREDIENTS.flatMap((i) => i.vibeTags), ...COCKTAILS.flatMap((c) => c.vibeTags)])];

export function buildPrompt(text: string): string {
  return [
    'Ты — бармен-миксолог. Переведи пожелание гостя в структуру для подбора коктейля.',
    `Пожелание: «${text}»`,
    `Доступные теги: ${ALL_TAGS.join(', ')}.`,
    `Доступные id ингредиентов: ${INGREDIENTS.map((i) => `${i.id} (${i.name})`).join(', ')}.`,
    'Ответь ТОЛЬКО JSON без пояснений вида:',
    '{"wantTags":[],"avoidTags":[],"flavor":{"strength":"high|low","sweet":"high|low","sour":"high|low","bitter":"high|low","fresh":"high|low"},"includeIds":[],"excludeIds":[]}',
    'В flavor указывай только те ключи, о которых явно или косвенно говорит гость.',
  ].join('\n');
}

/** Приводит ответ модели к ParsedQuery, отбрасывая всё неизвестное */
export function normalizeAI(data: unknown): Partial<ParsedQuery> {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const arr = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []);
  const flavor: ParsedQuery['flavor'] = {};
  if (d.flavor && typeof d.flavor === 'object') {
    for (const [k, v] of Object.entries(d.flavor as Record<string, unknown>)) {
      if (['strength', 'sweet', 'sour', 'bitter', 'fresh'].includes(k) && (v === 'high' || v === 'low')) flavor[k as BalanceKey] = v;
    }
  }
  return {
    wantTags: arr(d.wantTags).filter((t) => ALL_TAGS.includes(t)),
    avoidTags: arr(d.avoidTags).filter((t) => ALL_TAGS.includes(t)),
    includeIds: arr(d.includeIds).filter((id) => INGREDIENT_MAP[id]),
    excludeIds: arr(d.excludeIds).filter((id) => INGREDIENT_MAP[id]),
    flavor,
    matched: ['ИИ-разбор'],
  };
}

function extractJson(raw: string): Partial<ParsedQuery> {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Модель не вернула JSON');
  return normalizeAI(JSON.parse(m[0]));
}

/**
 * Разбор через свой сервер (/api/ai на Vercel): ключ лежит на сервере, пользователям он не нужен.
 * Возвращает null, если сервера нет (обычный `npm run dev` или статический хостинг).
 */
/** Есть ли рядом наш сервер /api/ai с настроенным ключом */
export async function checkServerAI(): Promise<boolean> {
  try {
    const res = await fetch('/api/ai', { method: 'GET' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return false;
    const data = (await res.json()) as { configured?: boolean };
    return data.configured === true;
  } catch {
    return false;
  }
}

export async function parseWithServer(text: string): Promise<Partial<ParsedQuery> | null> {
  let res: Response;
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    return null;
  }
  // Нет функции — на статическом хостинге вернётся 404/405 или index.html
  if (res.status === 404 || res.status === 405 || !(res.headers.get('content-type') ?? '').includes('application/json')) return null;
  const data = (await res.json()) as { query?: unknown; error?: string };
  if (!res.ok) throw new Error(data.error ?? `сервер ИИ: ошибка ${res.status}`);
  return { ...normalizeAI(data.query), matched: ['разбор ИИ'] };
}

/** Разбор запроса встроенным Claude (только в артефакте на claude.ai, ключ не нужен) */
export async function parseWithClaude(
  text: string,
  sample: { json: <T = unknown>(input: string, options?: Record<string, unknown>) => Promise<T> },
): Promise<Partial<ParsedQuery>> {
  const data = await sample.json(buildPrompt(text), { modelTier: 'quick' });
  return { ...normalizeAI(data), matched: ['разбор Claude'] };
}

/** Убирает пробелы, переносы и невидимые символы, которые часто прилипают при копировании ключа */
export function cleanApiKey(raw: string): string {
  return raw.replace(/[\s\u00A0\u200B-\u200D\u2060\uFEFF]/g, '');
}

/** Ключи OpenAI и Gemini состоят только из латиницы, цифр и знаков вроде «-» и «_» */
export function apiKeyProblem(raw: string): string | null {
  const key = cleanApiKey(raw);
  if (!key) return 'Ключ пустой.';
  const bad = [...key].find((ch) => !/[\x21-\x7E]/.test(ch));
  if (bad) return `В ключе есть недопустимый символ «${bad}» — скорее всего, кириллица или «…». Скопируйте ключ заново с сайта провайдера.`;
  return null;
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error('нет соединения с сервером ИИ. Если вы открыли демо-страницу на claude.ai — там внешние запросы запрещены, запустите проект локально (npm run dev)');
  }
}

export async function parseWithAI(text: string, settings: AISettings): Promise<Partial<ParsedQuery>> {
  const problem = apiKeyProblem(settings.apiKey);
  if (problem) throw new Error(problem);
  const s = { ...settings, apiKey: cleanApiKey(settings.apiKey) };
  const prompt = buildPrompt(text);
  if (s.provider === 'openai') {
    const res = await safeFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.apiKey}` },
      body: JSON.stringify({
        model: s.model || DEFAULT_MODELS.openai,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(res.status === 401 ? 'OpenAI отклонил ключ (401) — проверьте его' : `OpenAI: ошибка ${res.status}`);
    const json = await res.json();
    return extractJson(json.choices?.[0]?.message?.content ?? '');
  }
  const model = s.model || DEFAULT_MODELS.gemini;
  const res = await safeFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) throw new Error(res.status === 400 || res.status === 403 ? `Gemini отклонил ключ или модель (${res.status})` : `Gemini: ошибка ${res.status}`);
  const json = await res.json();
  return extractJson(json.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
}
