import type { Category, FlavorProfile, Ingredient, IngredientLink } from './types';

// ─────────────────────────────────────────────────────────────
// Категории (кластеры в 3D-пространстве)
// ─────────────────────────────────────────────────────────────

export interface CategoryInfo {
  id: Category;
  name: string;
  short: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'spirit', name: 'Крепкая основа', short: 'Основа', color: '#F59E0B' },
  { id: 'liqueur', name: 'Ликёры и вермуты', short: 'Ликёры', color: '#F43F5E' },
  { id: 'citrus', name: 'Кислоты и соки', short: 'Кислоты', color: '#A3E635' },
  { id: 'syrup', name: 'Сиропы и сладкое', short: 'Сиропы', color: '#E879F9' },
  { id: 'botanical', name: 'Биттеры, травы и специи', short: 'Травы', color: '#10B981' },
  { id: 'mixer', name: 'Миксеры', short: 'Миксеры', color: '#06B6D4' },
];

export const CATEGORY_MAP: Record<Category, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryInfo>;

/** Короткая запись профиля: сладость, кислотность, горечь, крепость, травянистость */
const p = (sweet: number, sour: number, bitter: number, boozy: number, herbal: number): FlavorProfile => ({
  sweet,
  sour,
  bitter,
  boozy,
  herbal,
});

type BaseIngredient = Omit<Ingredient, 'links'>;

// ─────────────────────────────────────────────────────────────
// Ингредиенты (46 классических + 6 безалкогольных)
// ─────────────────────────────────────────────────────────────

const BASE: BaseIngredient[] = [
  // ── Крепкая основа ──
  {
    id: 'gin', name: 'Джин', category: 'spirit', abv: 40, defaultUnit: 'ml', defaultAmount: 45,
    profile: p(1, 0, 2, 8, 8), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['травяной', 'можжевельник', 'свежий', 'сухой', 'классика'], color: '#FDE68A',
    descriptor: 'можжевеловая свежесть джина', fadeWord: 'можжевельник',
  },
  {
    id: 'bourbon', name: 'Бурбон', category: 'spirit', abv: 45, defaultUnit: 'ml', defaultAmount: 50,
    profile: p(3, 0, 2, 9, 1), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['крепкий', 'дубовый', 'ванильный', 'тёплый', 'классика'], color: '#D97706',
    descriptor: 'тепло и ваниль бурбона', fadeWord: 'бурбон',
  },
  {
    id: 'scotch', name: 'Скотч', category: 'spirit', abv: 40, defaultUnit: 'ml', defaultAmount: 50,
    profile: p(2, 0, 2, 9, 2), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['крепкий', 'дымный', 'солодовый', 'тёплый'], color: '#EA580C',
    descriptor: 'солодовое тепло скотча', fadeWord: 'солод',
  },
  {
    id: 'dark_rum', name: 'Тёмный ром', category: 'spirit', abv: 40, defaultUnit: 'ml', defaultAmount: 50,
    profile: p(5, 0, 1, 8, 1), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['тропический', 'карамельный', 'пряный', 'тёплый', 'крепкий'], color: '#C2410C',
    descriptor: 'карамель тёмного рома', fadeWord: 'ром',
  },
  {
    id: 'white_rum', name: 'Белый ром', category: 'spirit', abv: 40, defaultUnit: 'ml', defaultAmount: 50,
    profile: p(3, 0, 0, 8, 1), tastingPhase: 'body',
    vibeTags: ['тропический', 'лёгкий', 'освежающий', 'классика'], color: '#FEF3C7',
    descriptor: 'мягкий тростник белого рома', fadeWord: 'ром',
  },
  {
    id: 'vodka', name: 'Водка', category: 'spirit', abv: 40, defaultUnit: 'ml', defaultAmount: 45,
    profile: p(0, 0, 0, 9, 0), tastingPhase: 'body',
    vibeTags: ['чистый', 'нейтральный', 'лёгкий'], color: '#F5F5F4',
    descriptor: 'чистый спиртовой каркас водки', fadeWord: 'спирт',
  },
  {
    id: 'tequila', name: 'Текила бланко', category: 'spirit', abv: 40, defaultUnit: 'ml', defaultAmount: 50,
    profile: p(1, 1, 1, 8, 5), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['агава', 'землистый', 'цитрус', 'яркий'], color: '#FBBF24',
    descriptor: 'зелёная агава текилы', fadeWord: 'агава',
  },
  {
    id: 'mezcal', name: 'Мескаль', category: 'spirit', abv: 45, defaultUnit: 'ml', defaultAmount: 30,
    profile: p(1, 0, 2, 9, 5), tastingPhase: 'aroma', secondaryPhase: 'finish',
    vibeTags: ['дымный', 'крепкий', 'агава', 'землистый'], color: '#F59E0B',
    descriptor: 'дым мескаля', fadeWord: 'дым',
  },
  {
    id: 'absinthe', name: 'Абсент', category: 'spirit', abv: 65, defaultUnit: 'ml', defaultAmount: 10,
    potency: 1.6,
    profile: p(2, 0, 4, 10, 10), tastingPhase: 'aroma',
    vibeTags: ['анисовый', 'травяной', 'крепкий', 'дерзкий'], color: '#A3E635',
    descriptor: 'анисовый пар абсента', fadeWord: 'анис',
  },
  {
    id: 'jagermeister', name: 'Егермейстер', category: 'spirit', abv: 35, defaultUnit: 'ml', defaultAmount: 40,
    profile: p(6, 0, 6, 6, 9), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['травяной', 'пряный', 'горький', 'тёмный'], color: '#B45309',
    descriptor: 'травяная густота егермейстера', fadeWord: 'травы',
  },

  // ── Ликёры и вермуты ──
  {
    id: 'campari', name: 'Кампари', category: 'liqueur', abv: 25, defaultUnit: 'ml', defaultAmount: 30,
    profile: p(5, 0, 9, 4, 4), tastingPhase: 'finish', secondaryPhase: 'body',
    vibeTags: ['горький', 'аперитив', 'цитрус', 'яркий', 'классика'], color: '#E11D48',
    descriptor: 'бархатная горечь Кампари', fadeWord: 'горечь',
  },
  {
    id: 'aperol', name: 'Апероль', category: 'liqueur', abv: 11, defaultUnit: 'ml', defaultAmount: 40,
    profile: p(7, 1, 5, 2, 3), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['аперитив', 'апельсиновый', 'лёгкий', 'горький'], color: '#FB7185',
    descriptor: 'апельсиновая горчинка Апероля', fadeWord: 'апельсин',
  },
  {
    id: 'sweet_vermouth', name: 'Сладкий вермут', category: 'liqueur', abv: 16, defaultUnit: 'ml', defaultAmount: 30,
    profile: p(6, 1, 4, 3, 6), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['винный', 'пряный', 'травяной', 'классика'], color: '#BE123C',
    descriptor: 'пряное вино сладкого вермута', fadeWord: 'вермут',
  },
  {
    id: 'dry_vermouth', name: 'Сухой вермут', category: 'liqueur', abv: 18, defaultUnit: 'ml', defaultAmount: 20,
    profile: p(1, 2, 3, 3, 7), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['сухой', 'травяной', 'винный'], color: '#FDA4AF',
    descriptor: 'сухая полынь вермута', fadeWord: 'полынь',
  },
  {
    id: 'triple_sec', name: 'Трипл сек', category: 'liqueur', abv: 40, defaultUnit: 'ml', defaultAmount: 20,
    profile: p(8, 1, 1, 5, 1), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['апельсиновый', 'цитрус', 'сладкий'], color: '#FDBA74',
    descriptor: 'апельсиновая корочка трипл сек', fadeWord: 'апельсин',
  },
  {
    id: 'blue_curacao', name: 'Блю Кюрасао', category: 'liqueur', abv: 25, defaultUnit: 'ml', defaultAmount: 20,
    profile: p(9, 1, 1, 3, 0), tastingPhase: 'body',
    vibeTags: ['тропический', 'сладкий', 'яркий', 'апельсиновый'], color: '#3B82F6',
    descriptor: 'сладкий апельсин Блю Кюрасао', fadeWord: 'кюрасао',
  },
  {
    id: 'coffee_liqueur', name: 'Кофейный ликёр', category: 'liqueur', abv: 20, defaultUnit: 'ml', defaultAmount: 20,
    profile: p(9, 0, 4, 3, 0), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['кофейный', 'десертный', 'сладкий'], color: '#92400E',
    descriptor: 'кофейная сладость ликёра', fadeWord: 'кофейный ликёр',
  },
  {
    id: 'elderflower', name: 'Ликёр бузины', category: 'liqueur', abv: 20, defaultUnit: 'ml', defaultAmount: 20,
    profile: p(8, 1, 0, 3, 4), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['цветочный', 'лёгкий', 'освежающий'], color: '#FEF9C3',
    descriptor: 'цветочный шлейф бузины', fadeWord: 'цветы',
  },
  {
    id: 'maraschino', name: 'Мараскино', category: 'liqueur', abv: 32, defaultUnit: 'ml', defaultAmount: 10,
    profile: p(7, 0, 2, 5, 4), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['вишнёвый', 'цветочный', 'классика'], color: '#FECDD3',
    descriptor: 'вишнёвая косточка мараскино', fadeWord: 'вишня',
  },
  {
    id: 'amaro', name: 'Амаро Нонино', category: 'liqueur', abv: 35, defaultUnit: 'ml', defaultAmount: 22,
    profile: p(6, 0, 6, 5, 6), tastingPhase: 'finish', secondaryPhase: 'body',
    vibeTags: ['горький', 'апельсиновый', 'пряный', 'травяной'], color: '#F97316',
    descriptor: 'карамельная горечь амаро', fadeWord: 'амаро',
  },
  {
    id: 'chartreuse', name: 'Зелёный шартрез', category: 'liqueur', abv: 55, defaultUnit: 'ml', defaultAmount: 22,
    profile: p(6, 0, 3, 8, 10), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['травяной', 'крепкий', 'пряный'], color: '#84CC16',
    descriptor: 'альпийские травы шартреза', fadeWord: 'травы',
  },
  {
    id: 'violette', name: 'Фиалковый ликёр', category: 'liqueur', abv: 20, defaultUnit: 'ml', defaultAmount: 7,
    profile: p(8, 0, 0, 3, 5), tastingPhase: 'aroma',
    vibeTags: ['цветочный', 'фиалка', 'нежный'], color: '#C084FC',
    descriptor: 'фиалковая пудра', fadeWord: 'фиалка',
  },

  // ── Кислоты и соки ──
  {
    id: 'lime', name: 'Сок лайма', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 25,
    profile: p(1, 10, 1, 0, 2), tastingPhase: 'aroma',
    vibeTags: ['кислый', 'цитрус', 'освежающий'], color: '#A3E635',
    descriptor: 'хрустящая кислинка лайма', fadeWord: 'цитрус',
  },
  {
    id: 'lemon', name: 'Сок лимона', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 25,
    profile: p(1, 9, 1, 0, 1), tastingPhase: 'aroma',
    vibeTags: ['кислый', 'цитрус', 'освежающий'], color: '#FDE047',
    descriptor: 'яркий лимон', fadeWord: 'цитрус',
  },
  {
    id: 'grapefruit', name: 'Грейпфрут', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 30,
    profile: p(3, 6, 4, 0, 1), tastingPhase: 'aroma', secondaryPhase: 'finish',
    vibeTags: ['цитрус', 'горьковатый', 'освежающий', 'кислый'], color: '#FCA5A5',
    descriptor: 'розовая горчинка грейпфрута', fadeWord: 'грейпфрут',
  },
  {
    id: 'passion_fruit', name: 'Маракуйя', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 30,
    profile: p(6, 7, 0, 0, 1), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['тропический', 'фруктовый', 'кислый', 'яркий'], color: '#FACC15',
    descriptor: 'тропическая маракуйя', fadeWord: 'маракуйя',
  },
  {
    id: 'blackcurrant', name: 'Чёрная смородина', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 15,
    profile: p(6, 6, 1, 0, 2), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['ягодный', 'кислый', 'яркий'], color: '#A21CAF',
    descriptor: 'сочная чёрная смородина', fadeWord: 'ягода',
  },
  {
    id: 'cranberry', name: 'Клюквенный сок', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 30,
    profile: p(5, 6, 2, 0, 0), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['ягодный', 'кислый', 'освежающий'], color: '#DC2626',
    descriptor: 'терпкая клюква', fadeWord: 'клюква',
  },
  {
    id: 'pineapple', name: 'Ананас', category: 'citrus', abv: 0, defaultUnit: 'ml', defaultAmount: 40,
    profile: p(7, 5, 0, 0, 0), tastingPhase: 'body', secondaryPhase: 'aroma',
    vibeTags: ['тропический', 'фруктовый', 'сладкий'], color: '#FEF08A',
    descriptor: 'сочный ананас', fadeWord: 'ананас',
  },

  // ── Сиропы и сладкое ──
  {
    id: 'simple_syrup', name: 'Сахарный сироп', category: 'syrup', abv: 0, defaultUnit: 'ml', defaultAmount: 15,
    profile: p(10, 0, 0, 0, 0), tastingPhase: 'body',
    vibeTags: ['сладкий', 'классика'], color: '#F5D0FE',
    descriptor: 'мягкая сахарная округлость', fadeWord: 'сладость',
  },
  {
    id: 'honey_syrup', name: 'Медовый сироп', category: 'syrup', abv: 0, defaultUnit: 'ml', defaultAmount: 20,
    profile: p(9, 0, 0, 0, 2), tastingPhase: 'body',
    vibeTags: ['медовый', 'сладкий', 'тёплый'], color: '#FCD34D',
    descriptor: 'медовая бархатистость', fadeWord: 'мёд',
  },
  {
    id: 'vanilla_syrup', name: 'Ванильный сироп', category: 'syrup', abv: 0, defaultUnit: 'ml', defaultAmount: 15,
    profile: p(10, 0, 0, 0, 0), tastingPhase: 'body',
    vibeTags: ['ванильный', 'десертный', 'сладкий'], color: '#FAE8FF',
    descriptor: 'ванильный крем', fadeWord: 'ваниль',
  },
  {
    id: 'grenadine', name: 'Гренадин', category: 'syrup', abv: 0, defaultUnit: 'ml', defaultAmount: 10,
    profile: p(10, 1, 0, 0, 0), tastingPhase: 'body',
    vibeTags: ['гранатовый', 'ягодный', 'сладкий', 'яркий'], color: '#E11D48',
    descriptor: 'гранатовая сладость', fadeWord: 'гранат',
  },
  {
    id: 'orgeat', name: 'Сироп оршад', category: 'syrup', abv: 0, defaultUnit: 'ml', defaultAmount: 15,
    profile: p(9, 0, 0, 0, 1), tastingPhase: 'body', secondaryPhase: 'finish',
    vibeTags: ['миндальный', 'тропический', 'десертный', 'сладкий'], color: '#F0ABFC',
    descriptor: 'миндальный оршад', fadeWord: 'миндаль',
  },

  // ── Биттеры, травы и специи ──
  {
    id: 'angostura', name: 'Ангостура', category: 'botanical', abv: 44.7, defaultUnit: 'dash', defaultAmount: 2,
    dashVolume: 0.9, potency: 5, maxAmount: 8,
    profile: p(2, 0, 8, 2, 6), tastingPhase: 'finish',
    vibeTags: ['пряный', 'горький', 'классика'], color: '#10B981',
    descriptor: 'пряная гвоздика ангостуры', fadeWord: 'биттер',
  },
  {
    id: 'orange_bitters', name: 'Апельсиновый биттер', category: 'botanical', abv: 28, defaultUnit: 'dash', defaultAmount: 2,
    dashVolume: 0.9, potency: 5, maxAmount: 8,
    profile: p(1, 1, 7, 1, 5), tastingPhase: 'finish', secondaryPhase: 'aroma',
    vibeTags: ['цитрус', 'горький', 'апельсиновый'], color: '#34D399',
    descriptor: 'горькая апельсиновая цедра', fadeWord: 'цедра',
  },
  {
    id: 'mint', name: 'Мята', category: 'botanical', abv: 0, defaultUnit: 'dash', defaultAmount: 8,
    unitLabel: 'лист.', dashVolume: 0, potency: 0.9, maxAmount: 14,
    profile: p(0, 0, 0, 0, 10), tastingPhase: 'aroma',
    vibeTags: ['освежающий', 'травяной', 'мятный'], color: '#4ADE80',
    descriptor: 'холодок мяты', fadeWord: 'мята',
  },
  {
    id: 'rosemary', name: 'Розмарин', category: 'botanical', abv: 0, defaultUnit: 'dash', defaultAmount: 1,
    unitLabel: 'вет.', dashVolume: 0, potency: 6, maxAmount: 3,
    profile: p(0, 0, 1, 0, 9), tastingPhase: 'aroma',
    vibeTags: ['травяной', 'хвойный', 'ароматный'], color: '#6EE7B7',
    descriptor: 'хвойный розмарин', fadeWord: 'розмарин',
  },
  {
    id: 'basil', name: 'Базилик', category: 'botanical', abv: 0, defaultUnit: 'dash', defaultAmount: 6,
    unitLabel: 'лист.', dashVolume: 0, potency: 1, maxAmount: 12,
    profile: p(1, 0, 0, 0, 9), tastingPhase: 'aroma',
    vibeTags: ['травяной', 'садовый', 'освежающий'], color: '#22C55E',
    descriptor: 'зелёный базилик', fadeWord: 'базилик',
  },
  {
    id: 'ginger', name: 'Имбирь', category: 'botanical', abv: 0, defaultUnit: 'ml', defaultAmount: 7,
    potency: 2.2, maxAmount: 20,
    profile: p(2, 2, 1, 0, 7), tastingPhase: 'finish', secondaryPhase: 'aroma',
    vibeTags: ['пряный', 'острый', 'согревающий', 'имбирный'], color: '#FDE68A',
    descriptor: 'жгучий имбирь', fadeWord: 'имбирь',
  },
  {
    id: 'chili', name: 'Перец чили', category: 'botanical', abv: 0, defaultUnit: 'dash', defaultAmount: 2,
    unitLabel: 'лом.', dashVolume: 0, potency: 4, maxAmount: 6,
    profile: p(0, 0, 1, 0, 6), tastingPhase: 'finish',
    vibeTags: ['острый', 'пряный', 'дерзкий'], color: '#EF4444',
    descriptor: 'жар чили', fadeWord: 'жар',
  },
  {
    id: 'espresso', name: 'Эспрессо', category: 'botanical', abv: 0, defaultUnit: 'ml', defaultAmount: 30,
    potency: 1.2, maxAmount: 45,
    profile: p(0, 1, 8, 0, 4), tastingPhase: 'finish', secondaryPhase: 'aroma',
    vibeTags: ['кофейный', 'бодрящий', 'горький'], color: '#78350F',
    descriptor: 'обжаренный эспрессо', fadeWord: 'кофе',
  },

  // ── Миксеры ──
  {
    id: 'tonic', name: 'Тоник', category: 'mixer', abv: 0, defaultUnit: 'ml', defaultAmount: 120,
    maxAmount: 150, carbonated: true,
    profile: p(5, 1, 5, 0, 1), tastingPhase: 'aroma', secondaryPhase: 'finish',
    vibeTags: ['освежающий', 'пузырьки', 'горьковатый', 'лёгкий'], color: '#67E8F9',
    descriptor: 'хинная горчинка тоника', fadeWord: 'пузырьки',
  },
  {
    id: 'soda', name: 'Содовая', category: 'mixer', abv: 0, defaultUnit: 'ml', defaultAmount: 60,
    maxAmount: 150, carbonated: true,
    profile: p(0, 0, 0, 0, 0), tastingPhase: 'aroma',
    vibeTags: ['освежающий', 'пузырьки', 'лёгкий'], color: '#E0F2FE',
    descriptor: 'искрящаяся содовая', fadeWord: 'пузырьки',
  },
  {
    id: 'ginger_beer', name: 'Имбирное пиво', category: 'mixer', abv: 0, defaultUnit: 'ml', defaultAmount: 120,
    maxAmount: 150, carbonated: true,
    profile: p(7, 2, 1, 0, 4), tastingPhase: 'aroma', secondaryPhase: 'finish',
    vibeTags: ['пряный', 'освежающий', 'пузырьки', 'имбирный'], color: '#06B6D4',
    descriptor: 'имбирная искра', fadeWord: 'пузырьки',
  },
  {
    id: 'prosecco', name: 'Просекко', category: 'mixer', abv: 11, defaultUnit: 'ml', defaultAmount: 90,
    maxAmount: 150, carbonated: true,
    profile: p(4, 3, 1, 2, 1), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['игристый', 'праздничный', 'лёгкий', 'пузырьки'], color: '#A5F3FC',
    descriptor: 'игристое просекко', fadeWord: 'пузырьки',
  },

  // ── Безалкогольные альтернативы ──
  {
    id: 'na_gin', name: 'Безалкогольный джин', category: 'spirit', abv: 0, defaultUnit: 'ml', defaultAmount: 50, naAlternative: true,
    profile: p(1, 0, 2, 2, 8), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['травяной', 'можжевельник', 'свежий', 'безалкогольный'], color: '#FEF9C3',
    descriptor: 'можжевеловый настой без градуса', fadeWord: 'можжевельник',
  },
  {
    id: 'na_spirit', name: 'Безалкогольный дистиллят', category: 'spirit', abv: 0, defaultUnit: 'ml', defaultAmount: 50, naAlternative: true,
    profile: p(1, 0, 1, 2, 4), tastingPhase: 'body',
    vibeTags: ['нейтральный', 'лёгкий', 'безалкогольный'], color: '#E7E5E4',
    descriptor: 'лёгкая основа дистиллята', fadeWord: 'основа',
  },
  {
    id: 'smoky_tea', name: 'Копчёный чай лапсанг', category: 'spirit', abv: 0, defaultUnit: 'ml', defaultAmount: 50, naAlternative: true,
    profile: p(1, 0, 4, 1, 5), tastingPhase: 'finish', secondaryPhase: 'aroma',
    vibeTags: ['дымный', 'чайный', 'тёплый', 'безалкогольный'], color: '#A16207',
    descriptor: 'копчёный лапсанг', fadeWord: 'дым',
  },
  {
    id: 'na_aperitivo', name: 'Безалкогольный биттер-аперитив', category: 'liqueur', abv: 0, defaultUnit: 'ml', defaultAmount: 30, naAlternative: true,
    profile: p(6, 1, 7, 0, 4), tastingPhase: 'finish', secondaryPhase: 'body',
    vibeTags: ['горький', 'аперитив', 'апельсиновый', 'безалкогольный'], color: '#F87171',
    descriptor: 'горчинка безалкогольного аперитива', fadeWord: 'горечь',
  },
  {
    id: 'na_sparkling', name: 'Безалкогольное игристое', category: 'mixer', abv: 0, defaultUnit: 'ml', defaultAmount: 90, naAlternative: true,
    maxAmount: 150, carbonated: true,
    profile: p(5, 3, 0, 0, 1), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['игристый', 'праздничный', 'лёгкий', 'пузырьки', 'безалкогольный'], color: '#CFFAFE',
    descriptor: 'безалкогольное игристое', fadeWord: 'пузырьки',
  },
  {
    id: 'elderflower_syrup', name: 'Сироп бузины', category: 'syrup', abv: 0, defaultUnit: 'ml', defaultAmount: 15, naAlternative: true,
    profile: p(9, 1, 0, 0, 3), tastingPhase: 'aroma', secondaryPhase: 'body',
    vibeTags: ['цветочный', 'сладкий', 'лёгкий', 'безалкогольный'], color: '#FEFCE8',
    descriptor: 'цветочный сироп бузины', fadeWord: 'цветы',
  },
];

/**
 * Безалкогольные «двойники»: перенимают связи своих оригиналов
 * (синергия чуть ниже, линии — экспериментальные).
 */
const MIRRORS: Record<string, string[]> = {
  na_gin: ['gin'],
  na_spirit: ['vodka', 'white_rum', 'tequila'],
  smoky_tea: ['mezcal', 'scotch', 'bourbon', 'dark_rum'],
  na_aperitivo: ['campari', 'aperol', 'amaro', 'sweet_vermouth', 'jagermeister'],
  na_sparkling: ['prosecco'],
  elderflower_syrup: ['elderflower'],
};

// ─────────────────────────────────────────────────────────────
// Связи. Записываются один раз парой и становятся двусторонними.
// [ингредиент А, ингредиент Б, синергия 1–100, тип]
// c — классика (белые линии), e — эксперимент (янтарные линии)
// ─────────────────────────────────────────────────────────────

type PairType = 'c' | 'e';
const PAIRS: [string, string, number, PairType][] = [
  // Джин
  ['gin', 'campari', 95, 'c'], ['gin', 'sweet_vermouth', 90, 'c'], ['gin', 'dry_vermouth', 92, 'c'],
  ['gin', 'orange_bitters', 85, 'c'], ['gin', 'tonic', 94, 'c'], ['gin', 'lime', 82, 'c'],
  ['gin', 'lemon', 88, 'c'], ['gin', 'maraschino', 80, 'c'], ['gin', 'violette', 84, 'c'],
  ['gin', 'prosecco', 82, 'c'], ['gin', 'blackcurrant', 82, 'c'], ['gin', 'basil', 86, 'c'],
  ['gin', 'chartreuse', 85, 'c'], ['gin', 'elderflower', 84, 'e'], ['gin', 'rosemary', 80, 'e'],
  ['gin', 'grapefruit', 82, 'e'], ['gin', 'soda', 80, 'c'], ['gin', 'honey_syrup', 82, 'c'],
  ['gin', 'mint', 80, 'c'], ['gin', 'simple_syrup', 84, 'c'], ['gin', 'passion_fruit', 74, 'e'],
  ['gin', 'ginger', 76, 'e'], ['gin', 'espresso', 70, 'e'], ['gin', 'absinthe', 74, 'c'],
  // Бурбон и скотч
  ['bourbon', 'campari', 88, 'c'], ['bourbon', 'sweet_vermouth', 93, 'c'], ['bourbon', 'angostura', 96, 'c'],
  ['bourbon', 'simple_syrup', 90, 'c'], ['bourbon', 'orange_bitters', 90, 'c'], ['bourbon', 'lemon', 90, 'c'],
  ['bourbon', 'honey_syrup', 90, 'c'], ['bourbon', 'aperol', 86, 'c'], ['bourbon', 'amaro', 88, 'c'],
  ['bourbon', 'mint', 84, 'c'], ['bourbon', 'ginger_beer', 78, 'c'], ['bourbon', 'absinthe', 78, 'c'],
  ['bourbon', 'vanilla_syrup', 74, 'e'], ['bourbon', 'espresso', 74, 'e'], ['bourbon', 'coffee_liqueur', 78, 'e'],
  ['bourbon', 'rosemary', 76, 'e'], ['bourbon', 'blackcurrant', 70, 'e'], ['bourbon', 'orgeat', 76, 'e'],
  ['scotch', 'lemon', 88, 'c'], ['scotch', 'honey_syrup', 92, 'c'], ['scotch', 'ginger', 90, 'c'],
  ['scotch', 'sweet_vermouth', 86, 'c'], ['scotch', 'angostura', 84, 'c'], ['scotch', 'amaro', 78, 'e'],
  ['scotch', 'espresso', 70, 'e'], ['scotch', 'soda', 78, 'c'],
  // Ромы
  ['dark_rum', 'lime', 86, 'c'], ['dark_rum', 'ginger_beer', 94, 'c'], ['dark_rum', 'orgeat', 88, 'c'],
  ['dark_rum', 'triple_sec', 82, 'c'], ['dark_rum', 'pineapple', 86, 'c'], ['dark_rum', 'campari', 84, 'c'],
  ['dark_rum', 'angostura', 82, 'c'], ['dark_rum', 'white_rum', 80, 'c'], ['dark_rum', 'simple_syrup', 80, 'c'],
  ['dark_rum', 'espresso', 78, 'e'], ['dark_rum', 'coffee_liqueur', 82, 'e'], ['dark_rum', 'vanilla_syrup', 82, 'e'],
  ['dark_rum', 'chili', 72, 'e'], ['dark_rum', 'mint', 74, 'e'],
  ['white_rum', 'lime', 95, 'c'], ['white_rum', 'mint', 92, 'c'], ['white_rum', 'soda', 82, 'c'],
  ['white_rum', 'simple_syrup', 90, 'c'], ['white_rum', 'maraschino', 82, 'c'], ['white_rum', 'grapefruit', 82, 'c'],
  ['white_rum', 'pineapple', 86, 'c'], ['white_rum', 'passion_fruit', 82, 'e'], ['white_rum', 'triple_sec', 80, 'c'],
  ['white_rum', 'orgeat', 82, 'c'], ['white_rum', 'grenadine', 76, 'c'], ['white_rum', 'blue_curacao', 80, 'c'],
  ['white_rum', 'basil', 72, 'e'],
  // Водка
  ['vodka', 'coffee_liqueur', 94, 'c'], ['vodka', 'espresso', 90, 'c'], ['vodka', 'passion_fruit', 90, 'c'],
  ['vodka', 'vanilla_syrup', 86, 'c'], ['vodka', 'lime', 84, 'c'], ['vodka', 'ginger_beer', 93, 'c'],
  ['vodka', 'cranberry', 90, 'c'], ['vodka', 'triple_sec', 84, 'c'], ['vodka', 'blue_curacao', 82, 'c'],
  ['vodka', 'lemon', 80, 'c'], ['vodka', 'soda', 78, 'c'], ['vodka', 'tonic', 82, 'c'],
  ['vodka', 'prosecco', 78, 'c'], ['vodka', 'simple_syrup', 80, 'c'],
  ['vodka', 'basil', 76, 'e'], ['vodka', 'elderflower', 82, 'e'], ['vodka', 'blackcurrant', 80, 'e'],
  ['vodka', 'rosemary', 70, 'e'], ['vodka', 'ginger', 78, 'e'],
  // Текила и мескаль
  ['tequila', 'lime', 96, 'c'], ['tequila', 'triple_sec', 93, 'c'], ['tequila', 'grapefruit', 92, 'c'],
  ['tequila', 'chili', 86, 'c'], ['tequila', 'mezcal', 86, 'c'], ['tequila', 'angostura', 76, 'c'],
  ['tequila', 'grenadine', 82, 'c'], ['tequila', 'blackcurrant', 84, 'c'], ['tequila', 'simple_syrup', 82, 'c'],
  ['tequila', 'soda', 80, 'c'], ['tequila', 'orange_bitters', 76, 'c'],
  ['tequila', 'basil', 72, 'e'], ['tequila', 'passion_fruit', 80, 'e'], ['tequila', 'pineapple', 82, 'e'],
  ['tequila', 'ginger_beer', 84, 'c'],
  ['mezcal', 'chartreuse', 85, 'c'], ['mezcal', 'maraschino', 82, 'c'], ['mezcal', 'lime', 88, 'c'],
  ['mezcal', 'aperol', 86, 'c'], ['mezcal', 'simple_syrup', 76, 'c'], ['mezcal', 'angostura', 82, 'c'],
  ['mezcal', 'grapefruit', 84, 'c'], ['mezcal', 'campari', 84, 'e'], ['mezcal', 'sweet_vermouth', 80, 'e'],
  ['mezcal', 'lemon', 80, 'e'], ['mezcal', 'honey_syrup', 82, 'e'], ['mezcal', 'ginger', 80, 'e'],
  ['mezcal', 'pineapple', 80, 'e'], ['mezcal', 'espresso', 72, 'e'], ['mezcal', 'chili', 84, 'e'],
  ['mezcal', 'passion_fruit', 80, 'e'], ['mezcal', 'amaro', 80, 'e'], ['mezcal', 'orange_bitters', 80, 'e'],
  // Абсент и Егермейстер
  ['absinthe', 'prosecco', 82, 'c'], ['absinthe', 'simple_syrup', 75, 'c'], ['absinthe', 'angostura', 78, 'c'],
  ['absinthe', 'mint', 72, 'e'], ['absinthe', 'lime', 72, 'e'],
  ['jagermeister', 'ginger_beer', 82, 'e'], ['jagermeister', 'lime', 74, 'e'], ['jagermeister', 'espresso', 76, 'e'],
  ['jagermeister', 'pineapple', 74, 'e'], ['jagermeister', 'coffee_liqueur', 72, 'e'], ['jagermeister', 'angostura', 70, 'e'],
  ['jagermeister', 'tonic', 72, 'e'],
  // Ликёры и вермуты между собой и с миксерами
  ['campari', 'sweet_vermouth', 96, 'c'], ['campari', 'soda', 90, 'c'], ['campari', 'prosecco', 84, 'c'],
  ['campari', 'pineapple', 82, 'c'], ['campari', 'grapefruit', 82, 'c'], ['campari', 'orange_bitters', 74, 'c'],
  ['campari', 'passion_fruit', 76, 'e'], ['campari', 'espresso', 72, 'e'], ['campari', 'tonic', 80, 'e'],
  ['aperol', 'prosecco', 96, 'c'], ['aperol', 'soda', 90, 'c'], ['aperol', 'amaro', 88, 'c'],
  ['aperol', 'lemon', 82, 'c'], ['aperol', 'lime', 80, 'c'], ['aperol', 'chartreuse', 80, 'c'],
  ['aperol', 'grapefruit', 82, 'e'], ['aperol', 'passion_fruit', 78, 'e'], ['aperol', 'basil', 70, 'e'],
  ['aperol', 'tonic', 78, 'e'],
  ['sweet_vermouth', 'soda', 82, 'c'], ['sweet_vermouth', 'angostura', 82, 'c'], ['sweet_vermouth', 'orange_bitters', 80, 'c'],
  ['sweet_vermouth', 'prosecco', 82, 'c'], ['sweet_vermouth', 'espresso', 72, 'e'], ['sweet_vermouth', 'amaro', 74, 'e'],
  ['dry_vermouth', 'orange_bitters', 86, 'c'], ['dry_vermouth', 'tonic', 80, 'e'], ['dry_vermouth', 'elderflower', 76, 'e'],
  ['dry_vermouth', 'grapefruit', 72, 'e'],
  ['triple_sec', 'lime', 92, 'c'], ['triple_sec', 'cranberry', 86, 'c'], ['triple_sec', 'lemon', 84, 'c'],
  ['triple_sec', 'orgeat', 82, 'c'],
  ['blue_curacao', 'lemon', 80, 'c'], ['blue_curacao', 'soda', 78, 'c'], ['blue_curacao', 'pineapple', 84, 'c'],
  ['blue_curacao', 'tonic', 70, 'e'],
  ['coffee_liqueur', 'espresso', 96, 'c'], ['coffee_liqueur', 'vanilla_syrup', 84, 'e'], ['coffee_liqueur', 'orgeat', 74, 'e'],
  ['elderflower', 'prosecco', 92, 'c'], ['elderflower', 'mint', 88, 'c'], ['elderflower', 'soda', 85, 'c'],
  ['elderflower', 'lime', 82, 'c'], ['elderflower', 'grapefruit', 80, 'e'], ['elderflower', 'basil', 78, 'e'],
  ['elderflower', 'tonic', 86, 'e'],
  ['maraschino', 'violette', 82, 'c'], ['maraschino', 'lemon', 78, 'c'], ['maraschino', 'chartreuse', 88, 'c'],
  ['maraschino', 'lime', 82, 'c'], ['maraschino', 'grapefruit', 80, 'c'],
  ['amaro', 'lemon', 84, 'c'], ['amaro', 'orange_bitters', 76, 'c'], ['amaro', 'espresso', 80, 'e'],
  ['chartreuse', 'lime', 86, 'c'], ['chartreuse', 'pineapple', 80, 'e'], ['chartreuse', 'basil', 78, 'e'],
  ['violette', 'lemon', 80, 'c'], ['violette', 'prosecco', 78, 'e'],
  // Кислоты, соки, сиропы
  ['lemon', 'simple_syrup', 92, 'c'], ['lime', 'simple_syrup', 93, 'c'], ['lemon', 'honey_syrup', 90, 'c'],
  ['lemon', 'ginger', 86, 'c'], ['lemon', 'prosecco', 80, 'c'], ['lemon', 'soda', 84, 'c'],
  ['lemon', 'basil', 85, 'c'], ['lemon', 'blackcurrant', 80, 'c'], ['lemon', 'orgeat', 78, 'e'],
  ['lime', 'tonic', 85, 'c'], ['lime', 'mint', 92, 'c'], ['lime', 'ginger_beer', 92, 'c'],
  ['lime', 'orgeat', 88, 'c'], ['lime', 'passion_fruit', 84, 'c'], ['lime', 'cranberry', 86, 'c'],
  ['lime', 'grapefruit', 82, 'c'], ['lime', 'chili', 85, 'c'], ['lime', 'grenadine', 80, 'c'],
  ['lime', 'ginger', 84, 'c'], ['lime', 'soda', 82, 'c'], ['lime', 'angostura', 76, 'c'],
  ['grapefruit', 'soda', 84, 'c'], ['grapefruit', 'rosemary', 82, 'e'], ['grapefruit', 'tonic', 82, 'e'],
  ['grapefruit', 'chili', 78, 'e'], ['grapefruit', 'honey_syrup', 74, 'e'], ['grapefruit', 'prosecco', 76, 'e'],
  ['grapefruit', 'mint', 74, 'e'], ['grapefruit', 'simple_syrup', 78, 'c'],
  ['passion_fruit', 'vanilla_syrup', 93, 'c'], ['passion_fruit', 'prosecco', 86, 'c'], ['passion_fruit', 'chili', 82, 'e'],
  ['passion_fruit', 'mint', 80, 'e'], ['passion_fruit', 'basil', 74, 'e'],
  ['blackcurrant', 'ginger_beer', 82, 'c'], ['blackcurrant', 'prosecco', 84, 'c'], ['blackcurrant', 'rosemary', 72, 'e'],
  ['blackcurrant', 'simple_syrup', 76, 'c'],
  ['cranberry', 'rosemary', 74, 'e'], ['cranberry', 'prosecco', 76, 'e'], ['cranberry', 'orgeat', 70, 'e'],
  ['cranberry', 'soda', 78, 'c'],
  ['pineapple', 'orgeat', 80, 'c'], ['pineapple', 'mint', 76, 'e'], ['pineapple', 'chili', 82, 'e'],
  ['pineapple', 'vanilla_syrup', 74, 'e'], ['pineapple', 'ginger', 80, 'e'], ['pineapple', 'simple_syrup', 74, 'c'],
  ['honey_syrup', 'ginger', 92, 'c'], ['honey_syrup', 'rosemary', 76, 'e'], ['honey_syrup', 'chili', 76, 'e'],
  ['grenadine', 'soda', 74, 'c'], ['grenadine', 'prosecco', 72, 'e'],
  ['vanilla_syrup', 'espresso', 84, 'e'], ['simple_syrup', 'espresso', 82, 'c'], ['orgeat', 'espresso', 76, 'e'],
  ['simple_syrup', 'angostura', 86, 'c'], ['simple_syrup', 'orange_bitters', 80, 'c'], ['simple_syrup', 'mint', 84, 'c'],
  ['simple_syrup', 'basil', 80, 'c'], ['simple_syrup', 'soda', 80, 'c'], ['simple_syrup', 'prosecco', 72, 'c'],
  ['simple_syrup', 'chili', 74, 'e'],
  // Травы, специи, миксеры
  ['mint', 'soda', 86, 'c'], ['mint', 'prosecco', 78, 'e'], ['rosemary', 'tonic', 80, 'e'],
  ['ginger', 'chili', 76, 'e'], ['ginger', 'ginger_beer', 78, 'c'], ['espresso', 'tonic', 82, 'e'],
  ['espresso', 'angostura', 68, 'e'], ['angostura', 'ginger_beer', 74, 'c'], ['prosecco', 'soda', 86, 'c'],
  ['basil', 'soda', 72, 'e'], ['chili', 'ginger_beer', 74, 'e'],
];

function buildLinks(): Map<string, IngredientLink[]> {
  const ids = new Set(BASE.map((i) => i.id));
  const map = new Map<string, Map<string, IngredientLink>>();
  BASE.forEach((i) => map.set(i.id, new Map()));
  const add = (from: string, to: string, synergy: number, type: IngredientLink['type']) => {
    const existing = map.get(from)!.get(to);
    if (!existing || existing.synergy < synergy) map.get(from)!.set(to, { targetId: to, synergy, type });
  };
  for (const [a, b, synergy, t] of PAIRS) {
    if (!ids.has(a) || !ids.has(b) || a === b) {
      console.warn(`[ingredients] неверная связь: ${a} ↔ ${b}`);
      continue;
    }
    const type = t === 'c' ? 'classic' : 'experimental';
    add(a, b, synergy, type);
    add(b, a, synergy, type);
  }
  // Двойники: копируем связи оригиналов
  const mirrorOf = new Map<string, string[]>();
  for (const [na, originals] of Object.entries(MIRRORS)) for (const o of originals) mirrorOf.set(o, [...(mirrorOf.get(o) ?? []), na]);
  for (const [a, b, synergy] of PAIRS) {
    for (const na of mirrorOf.get(a) ?? []) if (na !== b && ids.has(na)) { add(na, b, Math.max(50, synergy - 6), 'experimental'); add(b, na, Math.max(50, synergy - 6), 'experimental'); }
    for (const na of mirrorOf.get(b) ?? []) if (na !== a && ids.has(na)) { add(na, a, Math.max(50, synergy - 6), 'experimental'); add(a, na, Math.max(50, synergy - 6), 'experimental'); }
    // Оба конца — двойники (безалкогольный джин ↔ безалкогольный аперитив)
    for (const na of mirrorOf.get(a) ?? [])
      for (const nb of mirrorOf.get(b) ?? []) if (na !== nb) { add(na, nb, Math.max(50, synergy - 10), 'experimental'); add(nb, na, Math.max(50, synergy - 10), 'experimental'); }
  }

  const result = new Map<string, IngredientLink[]>();
  map.forEach((links, id) => result.set(id, [...links.values()].sort((x, y) => y.synergy - x.synergy)));
  return result;
}

const LINKS = buildLinks();

export const INGREDIENTS: Ingredient[] = BASE.map((i) => ({ ...i, links: LINKS.get(i.id) ?? [] }));

export const INGREDIENT_MAP: Record<string, Ingredient> = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

export function getIngredient(id: string): Ingredient {
  const ing = INGREDIENT_MAP[id];
  if (!ing) throw new Error(`Неизвестный ингредиент: ${id}`);
  return ing;
}

/** Синергия между двумя ингредиентами (0, если связи нет) */
export function synergyBetween(a: string, b: string): number {
  return INGREDIENT_MAP[a]?.links.find((l) => l.targetId === b)?.synergy ?? 0;
}

export function unitLabel(ing: Ingredient): string {
  if (ing.unitLabel) return ing.unitLabel;
  return ing.defaultUnit === 'ml' ? 'мл' : 'дэш';
}

export function amountRange(ing: Ingredient): { min: number; max: number; step: number } {
  if (ing.defaultUnit === 'dash') return { min: 1, max: ing.maxAmount ?? 10, step: 1 };
  return { min: 5, max: ing.maxAmount ?? 60, step: 1 };
}
