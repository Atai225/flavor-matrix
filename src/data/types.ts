// Общие типы для базы данных FLAVOR MATRIX 3D

export type Category = 'spirit' | 'liqueur' | 'citrus' | 'syrup' | 'botanical' | 'mixer';

export type TastingPhase = 'aroma' | 'body' | 'finish';

export type Unit = 'ml' | 'dash';

/** Вкусовой профиль, каждая шкала от 0 до 10 */
export interface FlavorProfile {
  sweet: number;
  sour: number;
  bitter: number;
  boozy: number;
  herbal: number;
}

export type FlavorKey = keyof FlavorProfile;

export interface IngredientLink {
  targetId: string;
  /** Синергия 1–100 */
  synergy: number;
  type: 'classic' | 'experimental';
}

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  /** Крепость, % */
  abv: number;
  defaultUnit: Unit;
  /** Порция по умолчанию (мл или дэши) */
  defaultAmount: number;
  /** Подпись для штучных единиц (например «лист.» у мяты). По умолчанию — «мл» / «дэш» */
  unitLabel?: string;
  /** Максимум для слайдера в конструкторе */
  maxAmount?: number;
  /** Сколько мл жидкости даёт 1 дэш (биттеры ≈ 0.9, листья мяты — 0) */
  dashVolume?: number;
  /** Насколько ярко ингредиент влияет на вкус на 1 единицу (1 = обычный мл) */
  potency?: number;
  profile: FlavorProfile;
  tastingPhase: TastingPhase;
  /** Дополнительная фаза, где ингредиент тоже заметен (например, дубовые ноты бурбона в финише) */
  secondaryPhase?: TastingPhase;
  /** Газированный миксер */
  carbonated?: boolean;
  vibeTags: string[];
  /** Цвет узла в 3D */
  color: string;
  /** Как звучит этот ингредиент в описании глотка: «бархатная горечь Кампари» */
  descriptor: string;
  /** Короткое слово, когда нота уходит: «цитрус», «мята» */
  fadeWord: string;
  links: IngredientLink[];
}

export type Method = 'shake' | 'stir' | 'build';

export type Glass = 'coupe' | 'rocks' | 'highball' | 'flute' | 'wine' | 'mug';

export interface RecipeItem {
  id: string;
  amount: number;
}

export interface CocktailTwist {
  id: string;
  note: string;
}

export interface Cocktail {
  id: string;
  name: string;
  nameEn: string;
  ingredients: RecipeItem[];
  method: Method;
  glass: Glass;
  garnish: string;
  description: string;
  vibeTags: string[];
  twists: CocktailTwist[];
  era: 'classic' | 'modern';
}
