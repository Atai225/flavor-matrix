import { memo } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { CATEGORY_MAP, INGREDIENT_MAP, unitLabel } from '../data/ingredients';
import type { Ingredient, TastingPhase } from '../data/types';
import { Bar, Button, Tag } from './ui';
import { naReplacementFor } from '../utils/nonAlcoholic';

interface Props {
  naMode?: boolean;
  ingredient: Ingredient;
  inRecipe: boolean;
  recipeIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string | null) => void;
}

const PHASE_LABEL: Record<TastingPhase, string> = { aroma: 'Аромат (0–5 с)', body: 'Тело (5–20 с)', finish: 'Финиш (20–45 с)' };

function NodeInspector({ naMode = false, ingredient: ing, inRecipe, recipeIds, onAdd, onRemove, onSelect }: Props) {
  const cat = CATEGORY_MAP[ing.category];
  const recipeSet = new Set(recipeIds);
  const rep = naMode ? naReplacementFor(ing.id) : undefined;
  return (
    <div className="glass thin-scroll pointer-events-auto max-h-full w-[300px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl p-4 shadow-2xl shadow-black/50">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: cat.color }}>
            {cat.name}
          </div>
          <h2 className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-3 w-3 rounded-full" style={{ background: ing.color, boxShadow: `0 0 12px ${ing.color}` }} />
            {ing.name}
          </h2>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" title="Закрыть">
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <div className="rounded-lg border border-zinc-800 px-2 py-1.5">
          <div className="text-zinc-500">ABV</div>
          <div className="text-zinc-100">{ing.abv}%</div>
        </div>
        <div className="rounded-lg border border-zinc-800 px-2 py-1.5">
          <div className="text-zinc-500">Порция</div>
          <div className="text-zinc-100">{ing.defaultAmount} {unitLabel(ing)}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 px-2 py-1.5">
          <div className="text-zinc-500">Связей</div>
          <div className="text-zinc-100">{ing.links.length}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Bar label="Сладость" value={ing.profile.sweet} color="#E879F9" />
        <Bar label="Кислотность" value={ing.profile.sour} color="#A3E635" />
        <Bar label="Горечь" value={ing.profile.bitter} color="#F43F5E" />
        <Bar label="Крепость" value={ing.profile.boozy} color="#F59E0B" />
        <Bar label="Травы / пряность" value={ing.profile.herbal} color="#06B6D4" />
      </div>

      <div className="mt-3 text-xs text-zinc-400">
        Звучит в фазе: <span className="text-zinc-200">{PHASE_LABEL[ing.tastingPhase]}</span>
        {ing.secondaryPhase && <span className="text-zinc-500"> + {PHASE_LABEL[ing.secondaryPhase].split(' ')[0].toLowerCase()}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {ing.vibeTags.map((t) => (
          <Tag key={t} color={cat.color}>{t}</Tag>
        ))}
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Лучшие пары</div>
        <div className="thin-scroll max-h-36 space-y-0.5 overflow-y-auto pr-1">
          {ing.links.slice(0, 10).map((l) => {
            const t = INGREDIENT_MAP[l.targetId];
            return (
              <button
                key={l.targetId}
                type="button"
                onClick={() => onSelect(l.targetId)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-zinc-800/70"
              >
                <span className={`h-[2px] w-3 rounded ${l.type === 'classic' ? 'bg-white' : 'bg-amber-500'}`} />
                <span className="flex-1 truncate text-zinc-200">
                  {t.name}
                  {recipeSet.has(t.id) && <span className="ml-1 text-amber-400">●</span>}
                </span>
                <span className="font-mono text-[11px] text-amber-400">{l.synergy}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {inRecipe ? (
          <Button variant="danger" className="flex-1" onClick={() => onRemove(ing.id)}>
            <Minus size={14} /> Убрать из шейкера
          </Button>
        ) : (
          <Button variant="primary" className="flex-1" onClick={() => onAdd(ing.id)} disabled={rep === null}>
            <Plus size={14} /> {rep ? `В шейкер → ${INGREDIENT_MAP[rep.id].name}` : rep === null ? 'В режиме 0% нет замены' : 'В шейкер'}
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-zinc-500">Двойной клик по узлу тоже добавляет его в шейкер</p>
    </div>
  );
}

export default memo(NodeInspector);
