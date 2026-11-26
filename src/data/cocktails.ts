import type { Cocktail, Glass, Method } from './types';

export const METHOD_LABEL: Record<Method, string> = {
  shake: 'Shake · шейк',
  stir: 'Stir · стир',
  build: 'Build · билд',
};

export const GLASS_LABEL: Record<Glass, string> = {
  coupe: 'Coupe · купе',
  rocks: 'Rocks · рокс',
  highball: 'Highball · хайбол',
  flute: 'Flute · флюте',
  wine: 'Wine · винный бокал',
  mug: 'Mug · медная кружка',
};

// Составы — в мл; ангостура/биттеры — в дэшах, мята/базилик — в листьях,
// розмарин — в веточках, чили — в ломтиках.

export const COCKTAILS: Cocktail[] = [
  // ───────── Основные 18 ─────────
  {
    id: 'negroni', name: 'Негрони', nameEn: 'Negroni', era: 'classic',
    ingredients: [{ id: 'gin', amount: 30 }, { id: 'campari', amount: 30 }, { id: 'sweet_vermouth', amount: 30 }],
    method: 'stir', glass: 'rocks', garnish: 'Апельсиновая цедра',
    description: 'Горько-сладкий итальянский аперитив: можжевельник, апельсиновая горечь Кампари и пряный вермут в равных долях.',
    vibeTags: ['горький', 'крепкий', 'аперитив', 'классика', 'травяной', 'не сладкий'],
    twists: [
      { id: 'boulevardier', note: 'Бурбон вместо джина — теплее, круглее, с ванилью и дубом.' },
      { id: 'mezcal_negroni', note: 'Мескаль вместо джина — та же горечь, но с дымным шлейфом.' },
      { id: 'americano', note: 'Содовая вместо джина — легче, ниже градус, освежает.' },
      { id: 'negroni_sbagliato', note: 'Просекко вместо джина — игристая и праздничная версия.' },
    ],
  },
  {
    id: 'old_fashioned', name: 'Олд Фэшн', nameEn: 'Old Fashioned', era: 'classic',
    ingredients: [{ id: 'bourbon', amount: 60 }, { id: 'simple_syrup', amount: 8 }, { id: 'angostura', amount: 3 }, { id: 'orange_bitters', amount: 1 }],
    method: 'stir', glass: 'rocks', garnish: 'Апельсиновая цедра, большой кубик льда',
    description: 'Эталон спиритового коктейля: бурбон, немного сахара и пряные биттеры. Тёплый, плотный, медленный.',
    vibeTags: ['крепкий', 'дубовый', 'классика', 'тёплый', 'не сладкий'],
    twists: [
      { id: 'oaxaca_old_fashioned', note: 'Текила и мескаль вместо бурбона — агава и дымок.' },
      { id: 'sazerac', note: 'Ополаскивание абсентом — анисовый аромат над бурбоном.' },
      { id: 'boulevardier', note: 'Добавлены Кампари и вермут — горче и сложнее.' },
    ],
  },
  {
    id: 'whiskey_sour', name: 'Виски Сауэр', nameEn: 'Whiskey Sour', era: 'classic',
    ingredients: [{ id: 'bourbon', amount: 50 }, { id: 'lemon', amount: 25 }, { id: 'simple_syrup', amount: 20 }, { id: 'angostura', amount: 2 }],
    method: 'shake', glass: 'rocks', garnish: 'Капли ангостуры, коктейльная вишня',
    description: 'Баланс тёплого бурбона, яркого лимона и сахара. Кисло-сладкий, бархатный и очень понятный.',
    vibeTags: ['кислый', 'цитрус', 'классика', 'тёплый', 'сбалансированный'],
    twists: [
      { id: 'gold_rush', note: 'Мёд вместо сахара — гуще и теплее, без биттера.' },
      { id: 'penicillin', note: 'Скотч, мёд и имбирь — пряный и с дымком.' },
      { id: 'paper_plane', note: 'Апероль и амаро — горько-апельсиновый поворот.' },
    ],
  },
  {
    id: 'espresso_martini', name: 'Эспрессо Мартини', nameEn: 'Espresso Martini', era: 'modern',
    ingredients: [{ id: 'vodka', amount: 50 }, { id: 'coffee_liqueur', amount: 20 }, { id: 'espresso', amount: 30 }, { id: 'simple_syrup', amount: 10 }],
    method: 'shake', glass: 'coupe', garnish: 'Три кофейных зерна',
    description: 'Бодрящий кофейный коктейль с плотной пенкой: свежий эспрессо, сладость ликёра и чистая водка.',
    vibeTags: ['кофейный', 'десертный', 'бодрящий', 'сладкий', 'вечеринка'],
    twists: [
      { id: 'dark_espresso', note: 'Тёмный ром и ваниль вместо водки — карамельнее и десертнее.' },
      { id: 'espresso_tonic', note: 'Тоник и джин — лёгкий, горьковатый хайбол с кофе.' },
    ],
  },
  {
    id: 'pornstar_martini', name: 'Порнстар Мартини', nameEn: 'Pornstar Martini', era: 'modern',
    ingredients: [{ id: 'vodka', amount: 45 }, { id: 'passion_fruit', amount: 30 }, { id: 'vanilla_syrup', amount: 15 }, { id: 'lime', amount: 15 }, { id: 'prosecco', amount: 50 }],
    method: 'shake', glass: 'coupe', garnish: 'Половинка маракуйи, шот просекко рядом',
    description: 'Тропическая маракуйя и ванильный крем с кислинкой лайма, игристое подают отдельным шотом.',
    vibeTags: ['тропический', 'фруктовый', 'сладкий', 'игристый', 'вечеринка'],
    twists: [
      { id: 'french_75', note: 'Игристое внутри коктейля — суше, цитрусовее, без тропиков.' },
      { id: 'cosmopolitan', note: 'Клюква и трипл сек — ягодная кислинка вместо маракуйи.' },
      { id: 'jungle_bird', note: 'Ананас, тёмный ром и Кампари — тропики с горечью.' },
    ],
  },
  {
    id: 'penicillin', name: 'Пенициллин', nameEn: 'Penicillin', era: 'modern',
    ingredients: [{ id: 'scotch', amount: 55 }, { id: 'lemon', amount: 22 }, { id: 'honey_syrup', amount: 20 }, { id: 'ginger', amount: 7 }],
    method: 'shake', glass: 'rocks', garnish: 'Засахаренный имбирь, флоат дымного виски',
    description: 'Современная классика: солодовый скотч, мёд, лимон и жгучий имбирь. Согревает и лечит настроение.',
    vibeTags: ['пряный', 'медовый', 'цитрус', 'дымный', 'согревающий', 'кислый'],
    twists: [
      { id: 'gold_rush', note: 'Бурбон и без имбиря — мягче и ваниль вместо дымка.' },
      { id: 'mezcal_penicillin', note: 'Мескаль вместо скотча — дым ярче, агава в финише.' },
      { id: 'whiskey_sour', note: 'Сахар вместо мёда и имбиря — проще и цитрусовее.' },
    ],
  },
  {
    id: 'paper_plane', name: 'Бумажный самолётик', nameEn: 'Paper Plane', era: 'modern',
    ingredients: [{ id: 'bourbon', amount: 22 }, { id: 'aperol', amount: 22 }, { id: 'amaro', amount: 22 }, { id: 'lemon', amount: 22 }],
    method: 'shake', glass: 'coupe', garnish: 'Без украшения (или бумажный самолётик)',
    description: 'Четыре ингредиента в равных долях: бурбон, апельсиновый Апероль, карамельная горечь амаро и лимон.',
    vibeTags: ['горький', 'цитрус', 'апельсиновый', 'сбалансированный', 'кислый'],
    twists: [
      { id: 'naked_famous', note: 'Мескаль и шартрез — та же схема равных долей, но дымно-травяная.' },
      { id: 'mezcal_last_word', note: 'Мескаль, шартрез и мараскино — травянистее и крепче.' },
      { id: 'whiskey_sour', note: 'Без горьких ликёров — классический кисло-сладкий бурбон.' },
    ],
  },
  {
    id: 'mojito', name: 'Мохито', nameEn: 'Mojito', era: 'classic',
    ingredients: [{ id: 'white_rum', amount: 50 }, { id: 'lime', amount: 25 }, { id: 'simple_syrup', amount: 15 }, { id: 'mint', amount: 10 }, { id: 'soda', amount: 60 }],
    method: 'build', glass: 'highball', garnish: 'Букет мяты, долька лайма',
    description: 'Кубинский хайбол: белый ром, лайм, мята и содовая на дроблёном льду. Максимально освежает.',
    vibeTags: ['освежающий', 'мятный', 'цитрус', 'лёгкий', 'пузырьки', 'кислый', 'летний'],
    twists: [
      { id: 'southside', note: 'Джин вместо рома, без содовой — строже и травянистее.' },
      { id: 'daiquiri', note: 'Без мяты и содовой — чистый ромовый сауэр.' },
      { id: 'hugo_spritz', note: 'Бузина и просекко вместо рома — цветочнее и легче.' },
    ],
  },
  {
    id: 'daiquiri', name: 'Дайкири', nameEn: 'Daiquiri', era: 'classic',
    ingredients: [{ id: 'white_rum', amount: 60 }, { id: 'lime', amount: 25 }, { id: 'simple_syrup', amount: 15 }],
    method: 'shake', glass: 'coupe', garnish: 'Колесо лайма',
    description: 'Три ингредиента, идеальный баланс: ром, лайм и сахар. Холодный, хрустящий, кисло-сладкий.',
    vibeTags: ['кислый', 'цитрус', 'освежающий', 'классика', 'тропический'],
    twists: [
      { id: 'hemingway_daiquiri', note: 'Грейпфрут и мараскино, меньше сахара — суше и горчее.' },
      { id: 'mai_tai', note: 'Тёмный ром, оршад и трипл сек — миндально-тропический.' },
      { id: 'margarita', note: 'Текила и трипл сек вместо рома и сахара.' },
    ],
  },
  {
    id: 'margarita', name: 'Маргарита', nameEn: 'Margarita', era: 'classic',
    ingredients: [{ id: 'tequila', amount: 50 }, { id: 'triple_sec', amount: 20 }, { id: 'lime', amount: 25 }],
    method: 'shake', glass: 'rocks', garnish: 'Соляной ободок, долька лайма',
    description: 'Яркая агава, апельсиновый ликёр и много лайма. Кислая, солёная по краю, бодрящая.',
    vibeTags: ['кислый', 'цитрус', 'агава', 'освежающий', 'вечеринка'],
    twists: [
      { id: 'spicy_margarita', note: 'Ломтики чили — жгучий финиш.' },
      { id: 'paloma', note: 'Грейпфрут и содовая — длинная и горьковатая.' },
      { id: 'oaxaca_old_fashioned', note: 'Без кислоты, с мескалем — крепко и дымно.' },
    ],
  },
  {
    id: 'mezcal_last_word', name: 'Мескаль Ласт Ворд', nameEn: 'Mezcal Last Word', era: 'modern',
    ingredients: [{ id: 'mezcal', amount: 22 }, { id: 'chartreuse', amount: 22 }, { id: 'maraschino', amount: 22 }, { id: 'lime', amount: 22 }],
    method: 'shake', glass: 'coupe', garnish: 'Коктейльная вишня',
    description: 'Дымный мескаль встречает альпийские травы шартреза, вишню мараскино и лайм. Сложно и ярко.',
    vibeTags: ['дымный', 'травяной', 'кислый', 'крепкий', 'сложный'],
    twists: [
      { id: 'last_word', note: 'Оригинал на джине — свежее, без дыма.' },
      { id: 'naked_famous', note: 'Апероль вместо мараскино — горько-апельсиново.' },
      { id: 'aviation', note: 'Джин, мараскино и фиалка — цветочная родственница.' },
    ],
  },
  {
    id: 'aperol_spritz', name: 'Апероль Шприц', nameEn: 'Aperol Spritz', era: 'classic',
    ingredients: [{ id: 'aperol', amount: 60 }, { id: 'prosecco', amount: 90 }, { id: 'soda', amount: 30 }],
    method: 'build', glass: 'wine', garnish: 'Долька апельсина',
    description: 'Венецианский аперитив: апельсиновая горчинка Апероля, просекко и содовая. Лёгкий и солнечный.',
    vibeTags: ['лёгкий', 'игристый', 'аперитив', 'освежающий', 'горьковатый', 'пузырьки', 'летний'],
    twists: [
      { id: 'hugo_spritz', note: 'Бузина и мята вместо Апероля — цветочный и без горечи.' },
      { id: 'negroni_sbagliato', note: 'Кампари и вермут — горче и плотнее.' },
      { id: 'americano', note: 'Без игристого — Кампари, вермут и содовая.' },
    ],
  },
  {
    id: 'moscow_mule', name: 'Московский мул', nameEn: 'Moscow Mule', era: 'classic',
    ingredients: [{ id: 'vodka', amount: 50 }, { id: 'lime', amount: 15 }, { id: 'ginger_beer', amount: 120 }],
    method: 'build', glass: 'mug', garnish: 'Долька лайма, мята',
    description: 'Водка, лайм и острое имбирное пиво в медной кружке. Пряный, газированный и простой.',
    vibeTags: ['освежающий', 'пряный', 'имбирный', 'пузырьки', 'лёгкий'],
    twists: [
      { id: 'dark_n_stormy', note: 'Тёмный ром вместо водки — карамельнее и глубже.' },
      { id: 'el_diablo', note: 'Текила и смородина — ягодно и с агавой.' },
      { id: 'jager_mule', note: 'Егермейстер — травяной и тёмный мул.' },
    ],
  },
  {
    id: 'boulevardier', name: 'Бульвардье', nameEn: 'Boulevardier', era: 'classic',
    ingredients: [{ id: 'bourbon', amount: 40 }, { id: 'campari', amount: 30 }, { id: 'sweet_vermouth', amount: 30 }],
    method: 'stir', glass: 'rocks', garnish: 'Апельсиновая цедра',
    description: 'Негрони на бурбоне: теплее, слаще и плотнее, с ванилью и дубом под горечью Кампари.',
    vibeTags: ['горький', 'крепкий', 'тёплый', 'классика', 'дубовый'],
    twists: [
      { id: 'negroni', note: 'Джин вместо бурбона — суше и травянистее.' },
      { id: 'old_fashioned', note: 'Без Кампари и вермута — чистый бурбон и биттеры.' },
      { id: 'paper_plane', note: 'Апероль, амаро и лимон — свежее и кислее.' },
    ],
  },
  {
    id: 'bramble', name: 'Брамбл', nameEn: 'Bramble', era: 'modern',
    ingredients: [{ id: 'gin', amount: 50 }, { id: 'lemon', amount: 25 }, { id: 'simple_syrup', amount: 12 }, { id: 'blackcurrant', amount: 15 }],
    method: 'shake', glass: 'rocks', garnish: 'Ягоды, долька лимона',
    description: 'Джиновый сауэр на дроблёном льду с ягодным сиропом сверху (в оригинале — ежевичный ликёр, здесь смородина).',
    vibeTags: ['ягодный', 'кислый', 'освежающий', 'цитрус', 'яркий'],
    twists: [
      { id: 'basil_smash', note: 'Базилик вместо ягод — зелёный и садовый.' },
      { id: 'el_diablo', note: 'Текила, смородина и имбирное пиво — длинный и пряный.' },
      { id: 'aviation', note: 'Мараскино и фиалка — цветочный вместо ягодного.' },
    ],
  },
  {
    id: 'aviation', name: 'Авиация', nameEn: 'Aviation', era: 'classic',
    ingredients: [{ id: 'gin', amount: 50 }, { id: 'maraschino', amount: 10 }, { id: 'violette', amount: 7 }, { id: 'lemon', amount: 20 }],
    method: 'shake', glass: 'coupe', garnish: 'Коктейльная вишня',
    description: 'Небесно-сиреневый сауэр: джин, вишнёвый мараскино, фиалковый ликёр и лимон.',
    vibeTags: ['цветочный', 'кислый', 'нежный', 'классика', 'цитрус'],
    twists: [
      { id: 'last_word', note: 'Шартрез вместо фиалки — травянистее и крепче.' },
      { id: 'french_75', note: 'Игристое вместо ликёров — проще и праздничнее.' },
      { id: 'bramble', note: 'Ягоды вместо цветов.' },
    ],
  },
  {
    id: 'gin_tonic', name: 'Джин-тоник', nameEn: 'Gin & Tonic', era: 'classic',
    ingredients: [{ id: 'gin', amount: 50 }, { id: 'tonic', amount: 120 }, { id: 'lime', amount: 10 }],
    method: 'build', glass: 'highball', garnish: 'Долька лайма',
    description: 'Можжевельник, хинная горчинка тоника и капля лайма. Самый простой и самый освежающий хайбол.',
    vibeTags: ['освежающий', 'горьковатый', 'пузырьки', 'лёгкий', 'травяной', 'не сладкий'],
    twists: [
      { id: 'spanish_gt', note: 'Грейпфрут и розмарин в бокале-копе — ароматнее.' },
      { id: 'espresso_tonic', note: 'Шот эспрессо — кофейно-горький хайбол.' },
      { id: 'tom_collins', note: 'Лимон, сахар и содовая — кислее и слаще.' },
    ],
  },
  {
    id: 'french_75', name: 'Френч 75', nameEn: 'French 75', era: 'classic',
    ingredients: [{ id: 'gin', amount: 30 }, { id: 'lemon', amount: 15 }, { id: 'simple_syrup', amount: 10 }, { id: 'prosecco', amount: 80 }],
    method: 'shake', glass: 'flute', garnish: 'Лимонная спираль',
    description: 'Джиновый сауэр, долитый игристым. Праздничный, сухой, с лимонными пузырьками.',
    vibeTags: ['игристый', 'праздничный', 'цитрус', 'лёгкий', 'пузырьки'],
    twists: [
      { id: 'tom_collins', note: 'Содовая вместо игристого — длиннее и проще.' },
      { id: 'death_afternoon', note: 'Абсент и игристое — анисово и дерзко.' },
      { id: 'aperol_spritz', note: 'Апероль вместо джина и лимона — горько-апельсиновый.' },
    ],
  },

  // ───────── Твисты и дополнительная классика ─────────
  {
    id: 'americano', name: 'Американо', nameEn: 'Americano', era: 'classic',
    ingredients: [{ id: 'campari', amount: 30 }, { id: 'sweet_vermouth', amount: 30 }, { id: 'soda', amount: 90 }],
    method: 'build', glass: 'highball', garnish: 'Долька апельсина',
    description: 'Предок Негрони: Кампари и вермут, вытянутые содовой. Горький, лёгкий, низкоградусный.',
    vibeTags: ['горький', 'лёгкий', 'аперитив', 'пузырьки', 'освежающий'],
    twists: [
      { id: 'negroni', note: 'Джин вместо содовой — крепче и плотнее.' },
      { id: 'aperol_spritz', note: 'Апероль и просекко — слаще и игристее.' },
    ],
  },
  {
    id: 'mezcal_negroni', name: 'Мескаль Негрони', nameEn: 'Mezcal Negroni', era: 'modern',
    ingredients: [{ id: 'mezcal', amount: 30 }, { id: 'campari', amount: 30 }, { id: 'sweet_vermouth', amount: 30 }],
    method: 'stir', glass: 'rocks', garnish: 'Апельсиновая цедра',
    description: 'Негрони с дымом: мескаль добавляет землистую агаву и копчёный шлейф.',
    vibeTags: ['дымный', 'горький', 'крепкий', 'не сладкий', 'сложный'],
    twists: [
      { id: 'negroni', note: 'Классика на джине — без дыма.' },
      { id: 'oaxaca_old_fashioned', note: 'Без горьких ликёров — агава и биттеры.' },
    ],
  },
  {
    id: 'negroni_sbagliato', name: 'Негрони Сбальято', nameEn: 'Negroni Sbagliato', era: 'modern',
    ingredients: [{ id: 'campari', amount: 30 }, { id: 'sweet_vermouth', amount: 30 }, { id: 'prosecco', amount: 60 }],
    method: 'build', glass: 'wine', garnish: 'Долька апельсина',
    description: '«Ошибочный» Негрони: игристое вместо джина. Горько, празднично, легко.',
    vibeTags: ['игристый', 'горький', 'праздничный', 'лёгкий', 'пузырьки', 'аперитив'],
    twists: [
      { id: 'aperol_spritz', note: 'Апероль вместо Кампари — мягче и слаще.' },
      { id: 'negroni', note: 'Джин вместо игристого — крепко и без пузырьков.' },
    ],
  },
  {
    id: 'oaxaca_old_fashioned', name: 'Оахака Олд Фэшн', nameEn: 'Oaxaca Old Fashioned', era: 'modern',
    ingredients: [{ id: 'tequila', amount: 45 }, { id: 'mezcal', amount: 15 }, { id: 'simple_syrup', amount: 8 }, { id: 'angostura', amount: 2 }],
    method: 'stir', glass: 'rocks', garnish: 'Обожжённая апельсиновая цедра',
    description: 'Олд Фэшн на агаве: текила даёт свежесть, мескаль — дым, ангостура — пряный финиш.',
    vibeTags: ['дымный', 'крепкий', 'агава', 'не сладкий', 'пряный'],
    twists: [
      { id: 'old_fashioned', note: 'Классика на бурбоне — ваниль и дуб вместо агавы.' },
      { id: 'mezcal_negroni', note: 'С Кампари и вермутом — горький и дымный.' },
    ],
  },
  {
    id: 'sazerac', name: 'Сазерак', nameEn: 'Sazerac', era: 'classic',
    ingredients: [{ id: 'bourbon', amount: 60 }, { id: 'simple_syrup', amount: 8 }, { id: 'angostura', amount: 3 }, { id: 'absinthe', amount: 5 }],
    method: 'stir', glass: 'rocks', garnish: 'Лимонная цедра (не в бокал)',
    description: 'Новоорлеанская классика (в оригинале — ржаной виски и биттер Пейшо): крепко, пряно, с анисовым облаком абсента.',
    vibeTags: ['крепкий', 'анисовый', 'пряный', 'классика', 'не сладкий'],
    twists: [
      { id: 'old_fashioned', note: 'Без абсента — проще и мягче.' },
      { id: 'death_afternoon', note: 'Абсент с игристым — лёгкий, но дерзкий.' },
    ],
  },
  {
    id: 'gold_rush', name: 'Голд Раш', nameEn: 'Gold Rush', era: 'modern',
    ingredients: [{ id: 'bourbon', amount: 60 }, { id: 'honey_syrup', amount: 22 }, { id: 'lemon', amount: 22 }],
    method: 'shake', glass: 'rocks', garnish: 'Лимонная цедра',
    description: 'Бурбон, мёд и лимон. Медовый сауэр — тёплый, золотистый и обволакивающий.',
    vibeTags: ['медовый', 'тёплый', 'кислый', 'цитрус', 'сбалансированный'],
    twists: [
      { id: 'penicillin', note: 'Скотч и имбирь — пряный и дымный.' },
      { id: 'whiskey_sour', note: 'Сахар вместо мёда и ангостура — классичнее.' },
    ],
  },
  {
    id: 'mezcal_penicillin', name: 'Дымный Пенициллин', nameEn: 'Mezcal Penicillin', era: 'modern',
    ingredients: [{ id: 'mezcal', amount: 50 }, { id: 'lemon', amount: 22 }, { id: 'honey_syrup', amount: 20 }, { id: 'ginger', amount: 7 }],
    method: 'shake', glass: 'rocks', garnish: 'Засахаренный имбирь',
    description: 'Пенициллин на мескале: мёд и имбирь согревают, агава и дым звучат громче, чем у скотча.',
    vibeTags: ['дымный', 'пряный', 'медовый', 'цитрус', 'острый'],
    twists: [
      { id: 'penicillin', note: 'Оригинал на скотче — мягче дым, больше солода.' },
      { id: 'spicy_margarita', note: 'Текила, лайм и чили — острее и свежее.' },
    ],
  },
  {
    id: 'naked_famous', name: 'Голый и знаменитый', nameEn: 'Naked & Famous', era: 'modern',
    ingredients: [{ id: 'mezcal', amount: 22 }, { id: 'aperol', amount: 22 }, { id: 'chartreuse', amount: 22 }, { id: 'lime', amount: 22 }],
    method: 'shake', glass: 'coupe', garnish: 'Без украшения',
    description: 'Дымно-горький потомок Paper Plane и Last Word (в оригинале — жёлтый шартрез, здесь зелёный — крепче и травянистее).',
    vibeTags: ['дымный', 'горький', 'травяной', 'кислый', 'сложный'],
    twists: [
      { id: 'paper_plane', note: 'Бурбон и амаро — теплее и без дыма.' },
      { id: 'mezcal_last_word', note: 'Мараскино вместо Апероля — вишнёво-травяной.' },
    ],
  },
  {
    id: 'southside', name: 'Саутсайд', nameEn: 'Southside', era: 'classic',
    ingredients: [{ id: 'gin', amount: 60 }, { id: 'lime', amount: 25 }, { id: 'simple_syrup', amount: 15 }, { id: 'mint', amount: 8 }],
    method: 'shake', glass: 'coupe', garnish: 'Листик мяты',
    description: '«Мохито на джине» в коктейльной рюмке: мята, лайм и можжевельник, без содовой.',
    vibeTags: ['мятный', 'освежающий', 'кислый', 'травяной', 'цитрус'],
    twists: [
      { id: 'mojito', note: 'Ром и содовая — длиннее и мягче.' },
      { id: 'basil_smash', note: 'Базилик вместо мяты — садовый и пряный.' },
    ],
  },
  {
    id: 'hemingway_daiquiri', name: 'Хемингуэй Дайкири', nameEn: 'Hemingway Daiquiri', era: 'classic',
    ingredients: [{ id: 'white_rum', amount: 60 }, { id: 'maraschino', amount: 8 }, { id: 'grapefruit', amount: 20 }, { id: 'lime', amount: 20 }],
    method: 'shake', glass: 'coupe', garnish: 'Долька грейпфрута',
    description: 'Сухой дайкири без сахара: грейпфрут и вишнёвый мараскино. Терпко, свежо, по-писательски строго.',
    vibeTags: ['кислый', 'цитрус', 'освежающий', 'не сладкий', 'горьковатый'],
    twists: [
      { id: 'daiquiri', note: 'Классический — слаще, проще.' },
      { id: 'paloma', note: 'Текила и содовая — длиннее, с агавой.' },
    ],
  },
  {
    id: 'mai_tai', name: 'Май Тай', nameEn: 'Mai Tai', era: 'classic',
    ingredients: [{ id: 'dark_rum', amount: 30 }, { id: 'white_rum', amount: 30 }, { id: 'triple_sec', amount: 15 }, { id: 'orgeat', amount: 15 }, { id: 'lime', amount: 25 }],
    method: 'shake', glass: 'rocks', garnish: 'Мята, долька лайма',
    description: 'Тики-икона: два рома, миндальный оршад, апельсиновый ликёр и лайм. Пряно-тропический.',
    vibeTags: ['тропический', 'миндальный', 'крепкий', 'кислый', 'летний'],
    twists: [
      { id: 'jungle_bird', note: 'Ананас и Кампари — тропики с горечью.' },
      { id: 'daiquiri', note: 'Только белый ром, лайм и сахар — чище.' },
    ],
  },
  {
    id: 'spicy_margarita', name: 'Острая Маргарита', nameEn: 'Spicy Margarita', era: 'modern',
    ingredients: [{ id: 'tequila', amount: 50 }, { id: 'triple_sec', amount: 15 }, { id: 'lime', amount: 25 }, { id: 'simple_syrup', amount: 10 }, { id: 'chili', amount: 2 }],
    method: 'shake', glass: 'rocks', garnish: 'Соль с чили, ломтик перца',
    description: 'Маргарита с жаром: ломтики чили дают острый финиш поверх цитрусовой агавы.',
    vibeTags: ['острый', 'цитрус', 'кислый', 'агава', 'дерзкий', 'пряный'],
    twists: [
      { id: 'margarita', note: 'Классическая, без перца.' },
      { id: 'mezcal_penicillin', note: 'Мескаль, мёд и имбирь — согревающая острота.' },
    ],
  },
  {
    id: 'paloma', name: 'Палома', nameEn: 'Paloma', era: 'classic',
    ingredients: [{ id: 'tequila', amount: 50 }, { id: 'grapefruit', amount: 60 }, { id: 'lime', amount: 15 }, { id: 'simple_syrup', amount: 10 }, { id: 'soda', amount: 60 }],
    method: 'build', glass: 'highball', garnish: 'Долька грейпфрута, соляной ободок',
    description: 'Любимый хайбол Мексики: текила, грейпфрут и содовая. Горьковато-освежающий.',
    vibeTags: ['освежающий', 'цитрус', 'горьковатый', 'пузырьки', 'агава', 'летний'],
    twists: [
      { id: 'margarita', note: 'Короче и крепче, с трипл сек.' },
      { id: 'spanish_gt', note: 'Джин и тоник с грейпфрутом — травянистее.' },
    ],
  },
  {
    id: 'last_word', name: 'Последнее слово', nameEn: 'Last Word', era: 'classic',
    ingredients: [{ id: 'gin', amount: 22 }, { id: 'chartreuse', amount: 22 }, { id: 'maraschino', amount: 22 }, { id: 'lime', amount: 22 }],
    method: 'shake', glass: 'coupe', garnish: 'Коктейльная вишня',
    description: 'Классика времён сухого закона: джин, шартрез, мараскино и лайм в равных долях.',
    vibeTags: ['травяной', 'кислый', 'крепкий', 'классика', 'сложный'],
    twists: [
      { id: 'mezcal_last_word', note: 'Мескаль вместо джина — с дымом.' },
      { id: 'aviation', note: 'Фиалка вместо шартреза — цветочнее и мягче.' },
    ],
  },
  {
    id: 'hugo_spritz', name: 'Хьюго Шприц', nameEn: 'Hugo Spritz', era: 'modern',
    ingredients: [{ id: 'elderflower', amount: 30 }, { id: 'prosecco', amount: 100 }, { id: 'soda', amount: 40 }, { id: 'mint', amount: 6 }, { id: 'lime', amount: 5 }],
    method: 'build', glass: 'wine', garnish: 'Мята, долька лайма',
    description: 'Альпийский шприц: цветы бузины, мята и игристое. Очень лёгкий и ароматный.',
    vibeTags: ['цветочный', 'лёгкий', 'игристый', 'освежающий', 'мятный', 'пузырьки', 'летний'],
    twists: [
      { id: 'aperol_spritz', note: 'Апероль вместо бузины — горько-апельсиновый.' },
      { id: 'mojito', note: 'Ром, сахар и лайм — крепче и кислее.' },
    ],
  },
  {
    id: 'dark_n_stormy', name: 'Дарк-н-Сторми', nameEn: "Dark 'n' Stormy", era: 'classic',
    ingredients: [{ id: 'dark_rum', amount: 60 }, { id: 'lime', amount: 10 }, { id: 'ginger_beer', amount: 120 }],
    method: 'build', glass: 'highball', garnish: 'Долька лайма',
    description: 'Бермудский хайбол: тёмный ром «грозовой тучей» поверх острого имбирного пива.',
    vibeTags: ['пряный', 'имбирный', 'карамельный', 'пузырьки', 'тёплый'],
    twists: [
      { id: 'moscow_mule', note: 'Водка вместо рома — чище и легче.' },
      { id: 'jager_mule', note: 'Егермейстер — травяная версия.' },
    ],
  },
  {
    id: 'jager_mule', name: 'Егерь Мул', nameEn: 'Jäger Mule', era: 'modern',
    ingredients: [{ id: 'jagermeister', amount: 45 }, { id: 'lime', amount: 15 }, { id: 'ginger_beer', amount: 120 }],
    method: 'build', glass: 'mug', garnish: 'Долька лайма',
    description: 'Травяной егермейстер с имбирным пивом и лаймом. Тёмный, пряный, барный.',
    vibeTags: ['травяной', 'пряный', 'имбирный', 'пузырьки', 'вечеринка'],
    twists: [
      { id: 'moscow_mule', note: 'Классика на водке.' },
      { id: 'dark_n_stormy', note: 'Тёмный ром — карамельнее.' },
    ],
  },
  {
    id: 'el_diablo', name: 'Эль Дьябло', nameEn: 'El Diablo', era: 'classic',
    ingredients: [{ id: 'tequila', amount: 45 }, { id: 'blackcurrant', amount: 15 }, { id: 'lime', amount: 15 }, { id: 'ginger_beer', amount: 100 }],
    method: 'build', glass: 'highball', garnish: 'Долька лайма',
    description: 'Текила, чёрная смородина и имбирное пиво. Ягодный, пряный и с агавой.',
    vibeTags: ['ягодный', 'пряный', 'пузырьки', 'агава', 'освежающий'],
    twists: [
      { id: 'moscow_mule', note: 'Водка и без ягод — проще.' },
      { id: 'bramble', note: 'Джин и лимон — короче и кислее.' },
    ],
  },
  {
    id: 'cosmopolitan', name: 'Космополитен', nameEn: 'Cosmopolitan', era: 'modern',
    ingredients: [{ id: 'vodka', amount: 40 }, { id: 'triple_sec', amount: 15 }, { id: 'cranberry', amount: 30 }, { id: 'lime', amount: 15 }],
    method: 'shake', glass: 'coupe', garnish: 'Апельсиновая цедра',
    description: 'Розовая классика 90-х: водка, клюква, апельсиновый ликёр и лайм. Терпко-ягодный.',
    vibeTags: ['ягодный', 'кислый', 'цитрус', 'вечеринка', 'яркий'],
    twists: [
      { id: 'margarita', note: 'Текила вместо водки и без клюквы.' },
      { id: 'pornstar_martini', note: 'Маракуйя и ваниль — тропичнее и слаще.' },
    ],
  },
  {
    id: 'tom_collins', name: 'Том Коллинз', nameEn: 'Tom Collins', era: 'classic',
    ingredients: [{ id: 'gin', amount: 50 }, { id: 'lemon', amount: 25 }, { id: 'simple_syrup', amount: 20 }, { id: 'soda', amount: 90 }],
    method: 'build', glass: 'highball', garnish: 'Долька лимона, вишня',
    description: 'Джиновый лимонад для взрослых: лимон, сахар и содовая.',
    vibeTags: ['освежающий', 'цитрус', 'лёгкий', 'пузырьки', 'кислый'],
    twists: [
      { id: 'french_75', note: 'Игристое вместо содовой — праздничнее.' },
      { id: 'gin_tonic', note: 'Тоник вместо лимона и сахара — суше и горчее.' },
    ],
  },
  {
    id: 'basil_smash', name: 'Базил Смэш', nameEn: 'Gin Basil Smash', era: 'modern',
    ingredients: [{ id: 'gin', amount: 60 }, { id: 'lemon', amount: 25 }, { id: 'simple_syrup', amount: 20 }, { id: 'basil', amount: 8 }],
    method: 'shake', glass: 'rocks', garnish: 'Веточка базилика',
    description: 'Гамбургский хит: базилик раздавлен с лимоном — ярко-зелёный, травяной и кислый.',
    vibeTags: ['травяной', 'освежающий', 'кислый', 'садовый', 'цитрус'],
    twists: [
      { id: 'southside', note: 'Мята и лайм вместо базилика и лимона.' },
      { id: 'bramble', note: 'Ягоды вместо зелени.' },
    ],
  },
  {
    id: 'jungle_bird', name: 'Джангл Бёрд', nameEn: 'Jungle Bird', era: 'modern',
    ingredients: [{ id: 'dark_rum', amount: 45 }, { id: 'campari', amount: 20 }, { id: 'pineapple', amount: 45 }, { id: 'lime', amount: 15 }, { id: 'simple_syrup', amount: 10 }],
    method: 'shake', glass: 'rocks', garnish: 'Лист ананаса',
    description: 'Тики с горечью: тёмный ром и сочный ананас встречают Кампари.',
    vibeTags: ['тропический', 'горький', 'фруктовый', 'кислый', 'сложный'],
    twists: [
      { id: 'mai_tai', note: 'Оршад вместо Кампари — миндальнее, без горечи.' },
      { id: 'negroni', note: 'Без тропиков — чистая горечь.' },
    ],
  },
  {
    id: 'dark_espresso', name: 'Ромовый Эспрессо', nameEn: 'Rum Espresso Martini', era: 'modern',
    ingredients: [{ id: 'dark_rum', amount: 45 }, { id: 'coffee_liqueur', amount: 20 }, { id: 'espresso', amount: 30 }, { id: 'vanilla_syrup', amount: 10 }],
    method: 'shake', glass: 'coupe', garnish: 'Кофейные зёрна',
    description: 'Эспрессо Мартини на тёмном роме с ванилью: карамель, кофе и десертный финиш.',
    vibeTags: ['кофейный', 'десертный', 'карамельный', 'сладкий', 'ванильный'],
    twists: [
      { id: 'espresso_martini', note: 'Водка — чище и бодрее.' },
      { id: 'espresso_tonic', note: 'Тоник и джин — лёгкий и горький.' },
    ],
  },
  {
    id: 'espresso_tonic', name: 'Эспрессо-тоник с джином', nameEn: 'Espresso Gin Tonic', era: 'modern',
    ingredients: [{ id: 'gin', amount: 40 }, { id: 'tonic', amount: 100 }, { id: 'espresso', amount: 30 }],
    method: 'build', glass: 'highball', garnish: 'Апельсиновая цедра',
    description: 'Слоистый хайбол: тоник со льдом, джин и шот эспрессо сверху. Горький, бодрый, не сладкий.',
    vibeTags: ['кофейный', 'горький', 'бодрящий', 'пузырьки', 'не сладкий'],
    twists: [
      { id: 'gin_tonic', note: 'Без кофе — классический.' },
      { id: 'espresso_martini', note: 'Водка и кофейный ликёр — десертнее.' },
    ],
  },
  {
    id: 'spanish_gt', name: 'Испанский джин-тоник', nameEn: 'Spanish G&T', era: 'modern',
    ingredients: [{ id: 'gin', amount: 50 }, { id: 'tonic', amount: 140 }, { id: 'grapefruit', amount: 15 }, { id: 'rosemary', amount: 1 }],
    method: 'build', glass: 'wine', garnish: 'Веточка розмарина, грейпфрут',
    description: 'Джин-тоник в бокале-копе с розмарином и грейпфрутом — ароматный и горьковатый.',
    vibeTags: ['травяной', 'освежающий', 'горьковатый', 'пузырьки', 'хвойный', 'не сладкий'],
    twists: [
      { id: 'gin_tonic', note: 'Классика с лаймом.' },
      { id: 'paloma', note: 'Текила и содовая вместо джина и тоника.' },
    ],
  },
  {
    id: 'blue_lagoon', name: 'Голубая лагуна', nameEn: 'Blue Lagoon', era: 'modern',
    ingredients: [{ id: 'vodka', amount: 40 }, { id: 'blue_curacao', amount: 20 }, { id: 'lemon', amount: 20 }, { id: 'soda', amount: 90 }],
    method: 'build', glass: 'highball', garnish: 'Долька лимона',
    description: 'Ярко-синий лимонад с апельсиновым ликёром. Сладкий, простой и фотогеничный.',
    vibeTags: ['сладкий', 'яркий', 'тропический', 'пузырьки', 'вечеринка', 'лёгкий'],
    twists: [
      { id: 'tom_collins', note: 'Джин и сахар вместо водки и кюрасао — менее сладкий.' },
      { id: 'cosmopolitan', note: 'Клюква вместо кюрасао — ягодный.' },
    ],
  },
  {
    id: 'death_afternoon', name: 'Смерть после полудня', nameEn: 'Death in the Afternoon', era: 'classic',
    ingredients: [{ id: 'absinthe', amount: 15 }, { id: 'prosecco', amount: 120 }],
    method: 'build', glass: 'flute', garnish: 'Без украшения',
    description: 'Коктейль Хемингуэя: абсент, долитый игристым. Анисовый, мутно-опаловый и дерзкий.',
    vibeTags: ['анисовый', 'игристый', 'дерзкий', 'пузырьки', 'праздничный'],
    twists: [
      { id: 'french_75', note: 'Джин и лимон вместо абсента — мягче.' },
      { id: 'sazerac', note: 'Абсент как аромат к крепкому бурбону.' },
    ],
  },
];

export const COCKTAIL_MAP: Record<string, Cocktail> = Object.fromEntries(COCKTAILS.map((c) => [c.id, c]));

export const DEFAULT_PRESET_ID = 'negroni';
