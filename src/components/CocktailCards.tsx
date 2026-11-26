import type { ReactNode } from 'react';
import { Dna } from 'lucide-react';
import { GLASS_LABEL, METHOD_LABEL } from '../data/cocktails';
import { getIngredient, unitLabel } from '../data/ingredients';
import type { Cocktail, RecipeItem } from '../data/types';
import { cocktailStats } from '../utils/recommendationEngine';
import { Button, Tag } from './ui';

export function Composition({ items }: { items: RecipeItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((i) => {
        const ing = getIngredient(i.id);
        return (
          <li key={i.id} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ background: ing.color }} />
            <span className="flex-1 text-zinc-200">{ing.name}</span>
            <span className="font-mono text-xs text-amber-300">
              {i.amount} {unitLabel(ing)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function CocktailMini({
  c, right, footer, onOpen, onLab,
}: { c: Cocktail; right?: ReactNode; footer?: ReactNode; onOpen?: () => void; onLab: () => void }) {
  const s = cocktailStats(c);
  return (
    <div className="glass flex flex-col rounded-2xl p-4 transition hover:border-zinc-600">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className={`min-w-0 text-left ${onOpen ? 'hover:text-amber-200' : 'cursor-default'}`}>
          <div className="truncate font-semibold text-white">{c.name}</div>
          <div className="truncate text-xs text-zinc-500">{c.nameEn}</div>
        </button>
        {right}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {c.ingredients.map((i) => {
          const ing = getIngredient(i.id);
          return <Tag key={i.id} color={ing.color}>{ing.name}</Tag>;
        })}
      </div>
      <div className="mt-2 font-mono text-[11px] text-zinc-500">
        {s.abv.toFixed(1)}% ABV · {METHOD_LABEL[c.method].split(' · ')[0]} · {GLASS_LABEL[c.glass].split(' · ')[0]}
      </div>
      {footer && <div className="mt-2 text-xs leading-relaxed text-zinc-400">{footer}</div>}
      <div className="mt-auto flex gap-2 pt-3">
        {onOpen && (
          <Button className="flex-1" onClick={onOpen}>
            Подробнее
          </Button>
        )}
        <Button variant="cyan" className="flex-1" onClick={onLab}>
          <Dna size={13} /> В 3D
        </Button>
      </div>
    </div>
  );
}

