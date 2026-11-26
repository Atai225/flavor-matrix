import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Dna, Plus, ShoppingCart, Sparkles, Warehouse } from 'lucide-react';
import { CATEGORIES, INGREDIENTS, getIngredient } from '../data/ingredients';
import type { Cocktail, RecipeItem } from '../data/types';
import { STAPLES, analyzeBar } from '../utils/myBar';
import { loadMyBar, storeMyBar } from '../utils/storage';
import { CocktailMini } from './CocktailCards';
import { Button, Panel, SectionTitle } from './ui';

interface Props {
  onLoadToLab: (name: string, items: RecipeItem[]) => void;
  pool: Cocktail[];
  naMode: boolean;
}

export default function MyBarPanel({ onLoadToLab, pool, naMode }: Props) {
  const [owned, setOwned] = useState<string[]>(() => loadMyBar());
  useEffect(() => {
    storeMyBar(owned);
  }, [owned]);

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const bar = useMemo(() => analyzeBar(owned, pool), [owned, pool]);
  const toggle = (id: string) => setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const addMany = (ids: string[]) => setOwned((o) => [...new Set([...o, ...ids])]);
  const name = (id: string) => getIngredient(id).name;
  const lab = (c: Cocktail) => onLoadToLab(c.name, c.ingredients);

  // Ингредиенты, которые вообще встречаются в рецептах текущего режима
  const usedIds = useMemo(() => new Set(pool.flatMap((c) => c.ingredients.map((i) => i.id))), [pool]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Что есть дома */}
      <Panel className="p-4">
        <SectionTitle
          icon={<Warehouse size={13} className="text-amber-400" />}
          right={<span className="font-mono text-[11px] text-zinc-500">{owned.length} отмечено</span>}
        >
          Что есть у меня дома
        </SectionTitle>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button onClick={() => addMany(STAPLES)}>
            <Plus size={13} /> Базовый набор: лайм, лимон, сахар, содовая, мята
          </Button>
          {owned.length > 0 && (
            <Button variant="danger" onClick={() => setOwned([])}>
              Снять всё
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const items = INGREDIENTS.filter((i) => i.category === cat.id && usedIds.has(i.id));
            if (!items.length) return null;
            return (
              <div key={cat.id}>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: cat.color }}>
                  {cat.name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((i) => {
                    const on = ownedSet.has(i.id);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => toggle(i.id)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                          on
                            ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'border-zinc-700/80 text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        {on && <Check size={11} />}
                        {i.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {naMode && (
          <p className="mt-3 text-[11px] text-zinc-500">В режиме 0% показаны только ингредиенты из безалкогольных версий рецептов.</p>
        )}
      </Panel>

      <div className="space-y-4">
        {/* Можно приготовить сейчас */}
        <div>
          <SectionTitle icon={<Sparkles size={13} className="text-emerald-400" />}>
            Можно приготовить прямо сейчас · {bar.ready.length}
          </SectionTitle>
          {bar.ready.length === 0 ? (
            <Panel className="p-4 text-sm text-zinc-400">
              {owned.length === 0
                ? 'Отметьте бутылки и продукты, которые есть дома, — здесь появятся коктейли, которые из них получатся.'
                : 'Пока ни один рецепт не собирается полностью. Посмотрите ниже, что докупить.'}
            </Panel>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bar.ready.map((c) => (
                <CocktailMini key={c.id} c={c} onLab={() => lab(c)} />
              ))}
            </div>
          )}
        </div>

        {/* План покупок */}
        {bar.plan.buy.length > 0 && (
          <Panel className="border-amber-500/30 p-4">
            <SectionTitle icon={<ShoppingCart size={13} className="text-amber-400" />}>
              Чего не хватает до ещё {bar.plan.unlocks.length} {plural(bar.plan.unlocks.length, 'коктейля', 'коктейлей', 'коктейлей')}
            </SectionTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-zinc-400">Купите:</span>
              {bar.plan.buy.map((id) => (
                <span key={id} className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                  {name(id)}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
              <ArrowRight size={14} className="text-zinc-500" />
              <span className="text-zinc-400">откроются:</span>
              {bar.plan.unlocks.map((c) => (
                <button key={c.id} type="button" onClick={() => lab(c)} className="rounded-md px-1.5 py-0.5 text-zinc-100 underline decoration-zinc-600 underline-offset-2 hover:text-amber-200">
                  {c.name}
                </button>
              ))}
            </div>
            <Button variant="primary" className="mt-3" onClick={() => addMany(bar.plan.buy)}>
              <Check size={13} /> Купил — отметить в баре
            </Button>
          </Panel>
        )}

        {/* Не хватает одного */}
        {bar.oneAway.length > 0 && (
          <div>
            <SectionTitle icon={<Plus size={13} className="text-cyan-400" />}>
              Не хватает одного ингредиента · {bar.oneAway.length}
            </SectionTitle>
            <div className="space-y-1.5">
              {bar.oneAway.slice(0, 10).map((r) => (
                <div key={r.cocktail.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{r.cocktail.name}</div>
                    <div className="truncate text-[11px] text-zinc-500">
                      нужен: <span className="text-amber-300">{name(r.missing[0])}</span>
                    </div>
                  </div>
                  <Button variant="emerald" className="px-2" onClick={() => addMany(r.missing)} title="Отметить, что купил">
                    <Plus size={13} /> в бар
                  </Button>
                  <Button variant="cyan" className="px-2" onClick={() => lab(r.cocktail)} title="В 3D-лабораторию">
                    <Dna size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Самые полезные покупки */}
        {bar.bestSingle.length > 0 && (
          <Panel className="p-4">
            <SectionTitle icon={<ShoppingCart size={13} className="text-cyan-400" />}>Одна покупка — сколько откроет</SectionTitle>
            <div className="space-y-1">
              {bar.bestSingle.map((b) => (
                <div key={b.id} className="flex items-center gap-2 text-sm">
                  <span className="w-40 shrink-0 truncate text-zinc-200 sm:w-52">{name(b.id)}</span>
                  <span className="font-mono text-xs text-emerald-400">+{b.unlocks.length}</span>
                  <span className="truncate text-xs text-zinc-500">{b.unlocks.map((c) => c.name).join(', ')}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
