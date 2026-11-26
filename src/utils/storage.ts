import type { RecipeItem } from '../data/types';
import type { AISettings } from './recommendationEngine';

// localStorage может быть недоступен (приватный режим, песочница) — всё в try/catch

const KEY_SAVED = 'flavor-matrix:saved-recipes';
const KEY_AI = 'flavor-matrix:ai-settings';

export interface SavedRecipe {
  id: string;
  name: string;
  items: RecipeItem[];
  savedAt: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadSavedRecipes = () => read<SavedRecipe[]>(KEY_SAVED, []);
export const storeSavedRecipes = (list: SavedRecipe[]) => write(KEY_SAVED, list);

export const loadAISettings = () => read<AISettings | null>(KEY_AI, null);
export const storeAISettings = (s: AISettings | null) => {
  if (s === null) {
    try {
      window.localStorage.removeItem(KEY_AI);
    } catch {
      /* ignore */
    }
    return true;
  }
  return write(KEY_AI, s);
};
