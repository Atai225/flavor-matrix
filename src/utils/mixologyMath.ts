import { INGREDIENTS, INGREDIENT_MAP, getIngredient, synergyBetween, unitLabel } from '../data/ingredients';
import { GLASS_LABEL, METHOD_LABEL } from '../data/cocktails';
import type { Category, FlavorKey, Glass, Ingredient, Method, RecipeItem, TastingPhase } from '../data/types';

// ─────────────────────────────────────────────────────────────
// Объём и крепость
// ─────────────────────────────────────────────────────────────

/** Сколько мл жидкости даёт позиция рецепта */
export function itemVolume(ing: Ingredient, amount: number): number {
  if (ing.defaultUnit === 'ml') return amount;
  return amount * (ing.dashVolume ?? 0.9);
}

/** «Вес» ингредиента во вкусе — газированные миксеры звучат тише своего объёма */
function flavorWeight(ing: Ingredient, amount: number): number {
  const base = amount * (ing.potency ?? 1);
  return ing.carbonated ? base * 0.4 : base;
}

/**
 * Обводнение льдом (формулы Дэйва Арнолда, «Liquid Intelligence»),
 * x — крепость смеси до охлаждения в долях (0.30 = 30%).
 *  stir:  D = −1.21·x² + 1.246·x + 0.145
 *  shake: D =  1.567·x² + 1.742·x + 0.203
 *  build: ~10% (лёд в бокале + миксер)
 */
export function dilutionFactor(method: Method, x: number): number {
  if (method === 'stir') return -1.21 * x * x + 1.246 * x + 0.145;
  if (method === 'shake') return 1.567 * x * x + 1.742 * x + 0.203;
  return 0.1;
}

export const DILUTION_FORMULA: Record<Method, string> = {
  stir: 'D = −1.21·x² + 1.246·x + 0.145',
  shake: 'D = 1.567·x² + 1.742·x + 0.203',
  build: 'D ≈ 0.10 (лёд в бокале)',
};

const has = (recipe: RecipeItem[], pred: (i: Ingredient) => boolean) =>
  recipe.some((r) => INGREDIENT_MAP[r.id] && pred(INGREDIENT_MAP[r.id]));

const MUDDLED = ['mint', 'basil', 'chili'];

/** Авто-метод приготовления */
export function detectMethod(recipe: RecipeItem[]): Method {
  if (recipe.length === 0) return 'stir';
  const total = recipe.reduce((s, r) => s + itemVolume(getIngredient(r.id), r.amount), 0) || 1;
  const fizz = recipe
    .filter((r) => getIngredient(r.id).carbonated)
    .reduce((s, r) => s + itemVolume(getIngredient(r.id), r.amount), 0);
  const share = fizz / total;
  const citrus = has(recipe, (i) => i.category === 'citrus');
  const sweetener = has(recipe, (i) => i.category === 'syrup' || (i.category === 'liqueur' && i.profile.sweet >= 7));
  const muddled = has(recipe, (i) => MUDDLED.includes(i.id));
  if (share >= 0.3) {
    // Сауэр, долитый игристым/содовой (French 75, Collins) — сначала шейк, потом долив
    return citrus && sweetener && share < 0.62 && !muddled ? 'shake' : 'build';
  }
  const needsShake = has(
    recipe,
    (i) => i.category === 'citrus' || i.id === 'espresso' || i.id === 'honey_syrup' || i.id === 'ginger' ||
      i.id === 'mint' || i.id === 'basil' || i.id === 'orgeat',
  );
  return needsShake ? 'shake' : 'stir';
}

/** Рекомендуемый бокал */
export function detectGlass(recipe: RecipeItem[], method: Method, finalVolume: number): Glass {
  const fizz = has(recipe, (i) => !!i.carbonated);
  const prosecco = has(recipe, (i) => i.id === 'prosecco');
  if (method === 'build') {
    if (prosecco) return has(recipe, (i) => i.category === 'liqueur') ? 'wine' : 'flute'; // шприц или игристый
    return 'highball';
  }
  if (method === 'stir') {
    const martiniStyle = has(recipe, (i) => i.id === 'dry_vermouth') && !has(recipe, (i) => i.id === 'campari' || i.id === 'angostura');
    return martiniStyle ? 'coupe' : 'rocks';
  }
  if (fizz) return prosecco ? 'flute' : 'highball';
  const onIce = has(recipe, (i) => MUDDLED.includes(i.id) || i.id === 'honey_syrup' || i.id === 'ginger');
  return finalVolume <= 190 && !onIce ? 'coupe' : 'rocks';
}

// ─────────────────────────────────────────────────────────────
// Баланс вкуса
// ─────────────────────────────────────────────────────────────

export type BalanceKey = 'strength' | 'sweet' | 'sour' | 'bitter' | 'fresh';

export const BALANCE_LABELS: { key: BalanceKey; label: string; color: string }[] = [
  { key: 'strength', label: 'Крепость', color: '#F59E0B' },
  { key: 'sweet', label: 'Сладость', color: '#E879F9' },
  { key: 'sour', label: 'Кислотность', color: '#A3E635' },
  { key: 'bitter', label: 'Горечь', color: '#F43F5E' },
  { key: 'fresh', label: 'Пряность / Свежесть', color: '#06B6D4' },
];

export type Balance = Record<BalanceKey, number>;

// Чувствительность: кислоту и горечь мы замечаем сильнее, чем сладость
const SENSITIVITY: Record<Exclude<FlavorKey, 'boozy'>, number> = { sweet: 1, sour: 1.6, bitter: 1.4, herbal: 1.3 };

const perceive = (v: number, f: number) => Math.min(10, 10 * (1 - Math.exp((-v * f) / 4)));

export interface RecipeStats {
  volume: number; // мл до охлаждения
  alcoholMl: number;
  abvBefore: number; // % до обводнения
  method: Method;
  glass: Glass;
  dilution: number; // доля (0.25 = +25% воды)
  finalVolume: number;
  abv: number; // итоговая крепость, %
  balance: Balance;
}

export function computeStats(recipe: RecipeItem[]): RecipeStats {
  const items = recipe.filter((r) => INGREDIENT_MAP[r.id]);
  let volume = 0;
  let alcoholMl = 0;
  let wSum = 0;
  const acc = { sweet: 0, sour: 0, bitter: 0, herbal: 0 };
  for (const r of items) {
    const ing = getIngredient(r.id);
    const v = itemVolume(ing, r.amount);
    volume += v;
    alcoholMl += (v * ing.abv) / 100;
    const w = flavorWeight(ing, r.amount);
    wSum += w;
    acc.sweet += w * ing.profile.sweet;
    acc.sour += w * ing.profile.sour;
    acc.bitter += w * ing.profile.bitter;
    acc.herbal += w * ing.profile.herbal;
  }
  const abvBefore = volume > 0 ? (alcoholMl / volume) * 100 : 0;
  const method = detectMethod(items);
  const dilution = volume > 0 ? Math.max(0, dilutionFactor(method, abvBefore / 100)) : 0;
  const finalVolume = volume * (1 + dilution);
  const abv = finalVolume > 0 ? (alcoholMl / finalVolume) * 100 : 0;
  const glass = detectGlass(items, method, finalVolume);
  const avg = (v: number) => (wSum > 0 ? v / wSum : 0);
  const balance: Balance = {
    strength: Math.min(10, abv / 3),
    sweet: perceive(avg(acc.sweet), SENSITIVITY.sweet),
    sour: perceive(avg(acc.sour), SENSITIVITY.sour),
    bitter: perceive(avg(acc.bitter), SENSITIVITY.bitter),
    fresh: perceive(avg(acc.herbal), SENSITIVITY.herbal),
  };
  return { volume, alcoholMl, abvBefore, method, glass, dilution, finalVolume, abv, balance };
}

// ─────────────────────────────────────────────────────────────
// «Сбалансировать рецепт» — поиск недостающих связующих
// ─────────────────────────────────────────────────────────────

export interface BalanceSuggestion {
  id: string;
  reason: string;
  amount: number;
  synergy: number;
}

export interface BalanceReport {
  verdict: string;
  ok: boolean;
  issues: string[];
  suggestions: BalanceSuggestion[];
}

/** Средняя синергия кандидата с рецептом */
export function recipeSynergy(candidateId: string, recipe: RecipeItem[]): number {
  if (recipe.length === 0) return 0;
  const vals = recipe.map((r) => synergyBetween(candidateId, r.id));
  const linked = vals.filter((v) => v > 0);
  // Средняя по связанным + бонус за количество связей
  const mean = linked.length ? linked.reduce((a, b) => a + b, 0) / linked.length : 0;
  return mean * (0.55 + 0.45 * (linked.length / recipe.length));
}

function pickCandidates(
  recipe: RecipeItem[],
  filter: (i: Ingredient) => boolean,
  fit: (i: Ingredient) => number,
  limit: number,
): { ing: Ingredient; score: number; syn: number }[] {
  const inRecipe = new Set(recipe.map((r) => r.id));
  return INGREDIENTS.filter((i) => !inRecipe.has(i.id) && filter(i))
    .map((ing) => {
      const syn = recipeSynergy(ing.id, recipe);
      return { ing, syn, score: syn + fit(ing) * 4 };
    })
    .filter((c) => c.syn > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function analyzeBalance(recipe: RecipeItem[]): BalanceReport {
  if (recipe.length === 0) {
    return { verdict: 'Шейкер пуст — добавьте основу.', ok: false, issues: ['Нет ингредиентов'], suggestions: [] };
  }
  const s = computeStats(recipe);
  const b = s.balance;
  const issues: string[] = [];
  const suggestions: BalanceSuggestion[] = [];
  const push = (list: ReturnType<typeof pickCandidates>, reason: string) => {
    for (const c of list) {
      if (suggestions.some((x) => x.id === c.ing.id)) continue;
      suggestions.push({ id: c.ing.id, reason, amount: c.ing.defaultAmount, synergy: Math.round(c.syn) });
    }
  };
  const cat = (...cats: Category[]) => (i: Ingredient) => cats.includes(i.category);

  if (!has(recipe, (i) => i.category === 'spirit') && s.abv < 6) {
    issues.push('Нет крепкой основы — напиток рассыпается.');
    push(pickCandidates(recipe, cat('spirit'), () => 0, 2), 'Крепкая основа');
  }
  if (b.sour - b.sweet > 2) {
    issues.push('Кислотность перекрывает сладость — нужен подсластитель.');
    push(pickCandidates(recipe, (i) => i.category === 'syrup' || (i.category === 'liqueur' && i.profile.sweet >= 7), (i) => i.profile.sweet / 10, 2), 'Смягчит кислоту');
  }
  if (b.sweet - b.sour > 2.5 && b.bitter < 5) {
    issues.push('Слишком сладко — добавьте кислоту или горечь.');
    push(pickCandidates(recipe, cat('citrus'), (i) => i.profile.sour / 10, 2), 'Освежит сладость');
  }
  if (b.bitter > 7.5 && b.sweet < 4) {
    issues.push('Резкая горечь без опоры — смягчите сладким модификатором.');
    push(pickCandidates(recipe, (i) => i.category === 'syrup' || i.category === 'liqueur', (i) => i.profile.sweet / 10 - i.profile.bitter / 20, 2), 'Обнимет горечь');
  }
  if (b.strength > 8.5 && b.sweet < 3.5 && b.bitter < 3.5 && b.sour < 2) {
    issues.push('Голый спирт — нужен модификатор (вермут, ликёр, биттер).');
    push(pickCandidates(recipe, (i) => i.category === 'liqueur' || (i.category === 'botanical' && i.defaultUnit === 'dash' && i.abv > 0), () => 0.5, 2), 'Модификатор');
  }
  if (b.fresh < 2.5) {
    issues.push('Мало аромата — не хватает трав, биттера или специй.');
    push(pickCandidates(recipe, cat('botanical'), (i) => i.profile.herbal / 10, 2), 'Ароматический акцент');
  }
  if (b.strength < 2 && has(recipe, (i) => i.category === 'spirit')) {
    issues.push('Очень разбавлено — уменьшите миксер или добавьте основу.');
  }

  const ok = issues.length === 0;
  if (ok) {
    // Даже у хорошего рецепта подсветим лучший «связующий» акцент
    push(pickCandidates(recipe, () => true, () => 0, 2), 'Лучшая синергия для твиста');
  }
  const verdict = ok
    ? 'Баланс в норме: сладость, кислота и крепость держат друг друга.'
    : `Найдено отклонений: ${issues.length}. Подсвечиваю связующие ингредиенты в 3D.`;
  return { verdict, ok, issues, suggestions: suggestions.slice(0, 4) };
}

// ─────────────────────────────────────────────────────────────
// Таймлайн раскрытия вкуса (0–45 сек)
// ─────────────────────────────────────────────────────────────

export const TIMELINE_MAX = 45;

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/** Насколько ярко звучит фаза в момент t (0..1) */
export function phaseCurve(phase: TastingPhase, t: number): number {
  switch (phase) {
    case 'aroma':
      // Вспышка 0–3 сек, затем плавно гаснет (к 20 сек почти ноль)
      return t <= 3 ? 1 : Math.exp(-(t - 3) / 5.5);
    case 'body':
      // Нарастает 2–7 сек, держится до ~18 сек, уходит на второй план к 32 сек
      return smooth(1.5, 7, t) * (1 - 0.72 * smooth(17, 32, t));
    case 'finish':
      // Выходит вперёд между 14 и 26 сек и держится до конца
      return smooth(12, 26, t) * (1 - 0.1 * smooth(38, 45, t));
  }
}

/** Яркость ингредиента в момент t */
export function ingredientIntensity(ing: Ingredient, t: number): number {
  const main = phaseCurve(ing.tastingPhase, t);
  const second = ing.secondaryPhase ? 0.6 * phaseCurve(ing.secondaryPhase, t) : 0;
  return Math.max(0.06, main, second);
}

export function phaseAt(t: number): { key: TastingPhase; label: string; range: string } {
  if (t < 5) return { key: 'aroma', label: 'Аромат / Нос', range: '0–5 сек' };
  if (t < 20) return { key: 'body', label: 'Тело вкуса', range: '5–20 сек' };
  return { key: 'finish', label: 'Послевкусие', range: '20–45 сек' };
}

const isPlural = (w: string) => /[иы]$/.test(w) || w.includes(' и ') || w.includes(', ');
const joinRu = (arr: string[]) => (arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} и ${arr[arr.length - 1]}`);

/** Динамическая строка «что чувствуется прямо сейчас» */
export function describeMoment(recipe: RecipeItem[], t: number): string {
  const items = recipe.filter((r) => INGREDIENT_MAP[r.id]);
  if (items.length === 0) return 'Добавьте ингредиенты в шейкер — и здесь появится описание каждого момента глотка.';
  const phase = phaseAt(t);
  const sec = Math.round(t);
  const scored = items
    .map((r) => {
      const ing = getIngredient(r.id);
      const importance = Math.log(2 + flavorWeight(ing, r.amount));
      return { ing, intensity: ingredientIntensity(ing, t), importance };
    })
    .sort((a, b) => b.intensity * b.importance - a.intensity * a.importance);

  const active = scored.filter((x) => x.intensity >= 0.55).slice(0, 3);
  const lead = (active.length ? active : scored.slice(0, 1)).map((x) => x.ing.descriptor);
  const leadText = joinRu(lead);
  const plural = lead.length > 1;

  // Что уже уходит: летучие ноты аромата после 7 секунд
  const fading = scored.filter((x) => t > 7 && x.ing.tastingPhase === 'aroma' && phaseCurve('aroma', t) < 0.5);
  const fadeWords = [...new Set(fading.map((x) => x.ing.fadeWord))].slice(0, 2);
  let fadeText = '';
  if (fadeWords.length) {
    const words = joinRu(fadeWords);
    const nearlyGone = phaseCurve('aroma', t) < 0.12;
    const pl = fadeWords.length > 1 || isPlural(words);
    fadeText = nearlyGone ? `${words} ${pl ? 'растворяются' : 'растворяется'}, ` : `${words} ${pl ? 'отступают' : 'отступает'}, `;
  }

  let verb: string;
  if (phase.key === 'aroma') verb = plural ? 'вспыхивают' : 'вспыхивает';
  else if (phase.key === 'body') verb = plural ? 'раскрываются' : 'раскрывается';
  else verb = plural ? 'остаются' : 'остаётся';

  return `${phase.label} (${sec} сек): ${fadeText}${verb} ${leadText}`;
}

// ─────────────────────────────────────────────────────────────
// Экспорт карточки рецепта
// ─────────────────────────────────────────────────────────────

export function formatAmount(ing: Ingredient, amount: number): string {
  return `${amount} ${unitLabel(ing)}`;
}

export function recipeToText(name: string, recipe: RecipeItem[]): string {
  const s = computeStats(recipe);
  const lines = [
    `🍸 ${name.toUpperCase()}`,
    '— FLAVOR MATRIX 3D —',
    '',
    'СОСТАВ:',
    ...recipe.map((r) => {
      const ing = getIngredient(r.id);
      return `  • ${ing.name.padEnd(22, ' ')} ${formatAmount(ing, r.amount)}`;
    }),
    '',
    `МЕТОД:  ${METHOD_LABEL[s.method]}`,
    `БОКАЛ:  ${GLASS_LABEL[s.glass]}`,
    `ОБЪЁМ:  ${s.volume.toFixed(0)} мл → ${s.finalVolume.toFixed(0)} мл после льда (+${(s.dilution * 100).toFixed(0)}%)`,
    `КРЕПОСТЬ: ${s.abv.toFixed(1)}% ABV (до льда ${s.abvBefore.toFixed(1)}%)`,
    '',
    'БАЛАНС (0–10):',
    ...BALANCE_LABELS.map((b) => `  ${b.label.padEnd(20, ' ')} ${'█'.repeat(Math.round(s.balance[b.key]))}${'░'.repeat(10 - Math.round(s.balance[b.key]))} ${s.balance[b.key].toFixed(1)}`),
  ];
  return lines.join('\n');
}
