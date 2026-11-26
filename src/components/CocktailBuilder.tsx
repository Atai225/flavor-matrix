import { memo, useState } from 'react';
import {
  BookmarkPlus, Check, ClipboardCopy, Download, FlaskConical, GlassWater, Scale, Sparkles, Trash2, X, FolderOpen, Plus,
} from 'lucide-react';
import { COCKTAILS, GLASS_LABEL, METHOD_LABEL } from '../data/cocktails';
import { CATEGORY_MAP, amountRange, getIngredient, unitLabel } from '../data/ingredients';
import type { RecipeItem } from '../data/types';
import {
  BALANCE_LABELS, DILUTION_FORMULA, computeStats, recipeToText, type BalanceReport,
} from '../utils/mixologyMath';
import { getClaudeDownloads } from '../utils/claudeBridge';
import { loadSavedRecipes, storeSavedRecipes, type SavedRecipe } from '../utils/storage';
import { Bar, Button, Panel, SectionTitle } from './ui';

interface Props {
  name: string;
  recipe: RecipeItem[];
  selectedId: string | null;
  balance: BalanceReport | null;
  onRename: (name: string) => void;
  onAmount: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSelect: (id: string | null) => void;
  onLoad: (name: string, items: RecipeItem[]) => void;
  onAdd: (id: string, amount?: number) => void;
  onBalance: (on: boolean) => void;
  notify: (msg: string) => void;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Запасной путь для песочниц без доступа к буферу
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function CocktailBuilder(props: Props) {
  const { name, recipe, selectedId, balance, onRename, onAmount, onRemove, onClear, onSelect, onLoad, onAdd, onBalance, notify } = props;
  const stats = computeStats(recipe);
  const [saved, setSaved] = useState<SavedRecipe[]>(() => loadSavedRecipes());
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const save = () => {
    if (!recipe.length) return;
    const entry: SavedRecipe = { id: `${Date.now()}`, name: name.trim() || 'Без названия', items: recipe, savedAt: Date.now() };
    const next = [entry, ...saved.filter((s) => s.name !== entry.name)].slice(0, 30);
    setSaved(next);
    notify(storeSavedRecipes(next) ? `«${entry.name}» сохранён в браузере` : 'Сохранено только до перезагрузки — localStorage недоступен');
  };
  const removeSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    storeSavedRecipes(next);
  };
  const exportCopy = async () => {
    const ok = await copyText(recipeToText(name || 'Мой коктейль', recipe));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
    notify(ok ? 'Карточка рецепта скопирована' : 'Не удалось скопировать — используйте «.txt»');
  };
  const exportFile = async () => {
    const safe = (name || 'recipe').replace(/[^\p{L}\p{N}_-]+/gu, '_');
    const text = recipeToText(name || 'Мой коктейль', recipe);
    // На claude.ai обычное скачивание запрещено — сохраняем через платформу
    const downloads = await getClaudeDownloads();
    if (downloads) {
      try {
        await downloads.save({ filename: `${safe}.txt`, data: text });
      } catch (e) {
        if ((e as { code?: string })?.code !== 'declined') notify('Не удалось сохранить файл — используйте «Копировать текст»');
      }
      return;
    }
    downloadText(`${safe}.txt`, text);
  };

  return (
    <div className="space-y-3 p-3">
      {/* Заголовок + пресеты */}
      <Panel className="p-4">
        <SectionTitle
          icon={<FlaskConical size={13} className="text-amber-400" />}
          right={
            <select
              className="max-w-[150px] rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-[11px] text-zinc-300 outline-none focus:border-amber-500"
              value=""
              onChange={(e) => {
                const c = COCKTAILS.find((x) => x.id === e.target.value);
                if (c) onLoad(c.name, c.ingredients);
              }}
              title="Загрузить пресет из базы"
            >
              <option value="">Пресет из базы…</option>
              {COCKTAILS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          }
        >
          Конструктор коктейля
        </SectionTitle>
        <input
          value={name}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Название коктейля"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-base font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/70"
        />

        {/* Ингредиенты */}
        <div className="mt-3 space-y-2">
          {recipe.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-700 p-5 text-center text-xs text-zinc-500">
              Шейкер пуст. Кликните по узлу в 3D-графе и нажмите «В шейкер» — или дважды кликните по узлу.
            </div>
          )}
          {recipe.map((r) => {
            const ing = getIngredient(r.id);
            const range = amountRange(ing);
            const pct = ((r.amount - range.min) / (range.max - range.min)) * 100;
            const active = selectedId === r.id;
            return (
              <div
                key={r.id}
                className={`rounded-xl border px-3 py-2 transition ${active ? 'border-cyan-500/60 bg-cyan-500/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}
              >
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onSelect(active ? null : r.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ing.color, boxShadow: `0 0 8px ${ing.color}` }} />
                    <span className="truncate text-sm text-zinc-100">{ing.name}</span>
                    <span className="hidden text-[10px] text-zinc-500 sm:inline" style={{ color: `${CATEGORY_MAP[ing.category].color}aa` }}>
                      {CATEGORY_MAP[ing.category].short}
                    </span>
                  </button>
                  <span className="w-[68px] text-right font-mono text-sm tabular-nums text-amber-300">
                    {r.amount}
                    <span className="ml-0.5 text-[10px] text-zinc-500">{unitLabel(ing)}</span>
                  </span>
                  <button type="button" onClick={() => onRemove(r.id)} className="rounded p-1 text-zinc-600 transition hover:bg-rose-500/10 hover:text-rose-400" title="Удалить">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={r.amount}
                  onChange={(e) => onAmount(r.id, Number(e.target.value))}
                  className="fm-range mt-2"
                  style={{ ['--pct' as string]: `${pct}%`, ['--fill' as string]: ing.color }}
                  aria-label={`Объём: ${ing.name}`}
                />
              </div>
            );
          })}
        </div>
        {recipe.length > 0 && (
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={onClear} className="text-[11px] text-zinc-500 transition hover:text-rose-400">
              Очистить шейкер
            </button>
          </div>
        )}
      </Panel>

      {/* Техническая карточка */}
      <Panel className="p-4">
        <SectionTitle icon={<GlassWater size={13} className="text-cyan-400" />}>Техническая карточка</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Объём" value={`${stats.volume.toFixed(0)} мл`} sub={`→ ${stats.finalVolume.toFixed(0)} мл со льдом`} />
          <Stat label="Крепость" value={`${stats.abv.toFixed(1)}%`} sub={`до льда ${stats.abvBefore.toFixed(1)}%`} accent />
          <Stat label="Метод (авто)" value={METHOD_LABEL[stats.method].split(' · ')[0]} sub={METHOD_LABEL[stats.method].split(' · ')[1]} />
          <Stat label="Бокал" value={GLASS_LABEL[stats.glass].split(' · ')[0]} sub={GLASS_LABEL[stats.glass].split(' · ')[1]} />
        </div>
        <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-zinc-400">
          <div>
            обводнение: <span className="text-zinc-200">{DILUTION_FORMULA[stats.method]}</span>
          </div>
          <div>
            x = {(stats.abvBefore / 100).toFixed(3)} → D = <span className="text-cyan-300">+{(stats.dilution * 100).toFixed(1)}%</span> ·
            ABV = {stats.alcoholMl.toFixed(1)} мл спирта / {stats.finalVolume.toFixed(0)} мл
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {BALANCE_LABELS.map((b) => (
            <Bar key={b.key} label={b.label} value={stats.balance[b.key]} color={b.color} />
          ))}
        </div>
      </Panel>

      {/* Баланс */}
      <Panel className="p-4">
        <SectionTitle
          icon={<Scale size={13} className="text-emerald-400" />}
          right={balance && (
            <button type="button" onClick={() => onBalance(false)} className="rounded p-0.5 text-zinc-500 hover:text-white" title="Скрыть подсказки">
              <X size={14} />
            </button>
          )}
        >
          Баланс
        </SectionTitle>
        {!balance ? (
          <Button variant="emerald" className="w-full py-2" onClick={() => onBalance(true)} disabled={!recipe.length}>
            <Sparkles size={14} /> Сбалансировать рецепт
          </Button>
        ) : (
          <div>
            <p className={`text-sm ${balance.ok ? 'text-emerald-300' : 'text-amber-200'}`}>{balance.verdict}</p>
            {balance.issues.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {balance.issues.map((i) => (
                  <li key={i} className="flex gap-1.5"><span className="text-amber-500">▸</span>{i}</li>
                ))}
              </ul>
            )}
            {balance.suggestions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Связующие ингредиенты (подсвечены в 3D)</div>
                {balance.suggestions.map((s) => {
                  const ing = getIngredient(s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                      <button type="button" onClick={() => onSelect(s.id)} className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm text-zinc-100">{ing.name}</div>
                        <div className="text-[11px] text-zinc-500">{s.reason} · <span className="font-mono text-amber-400">{s.synergy}%</span> синергии</div>
                      </button>
                      <Button variant="emerald" className="px-2" onClick={() => onAdd(s.id, s.amount)} title="Добавить">
                        <Plus size={13} /> <span className="font-mono">{s.amount}{unitLabel(ing) === 'мл' ? '' : ' ' + unitLabel(ing)}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Сохранение и экспорт */}
      <Panel className="p-4">
        <SectionTitle icon={<BookmarkPlus size={13} className="text-amber-400" />}>Сохранение и экспорт</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={save} disabled={!recipe.length}><BookmarkPlus size={14} /> Сохранить</Button>
          <Button onClick={() => setShowSaved((v) => !v)}><FolderOpen size={14} /> Мои ({saved.length})</Button>
          <Button onClick={exportCopy} disabled={!recipe.length}>
            {copied ? <Check size={14} className="text-emerald-400" /> : <ClipboardCopy size={14} />} Копировать текст
          </Button>
          <Button onClick={() => void exportFile()} disabled={!recipe.length}><Download size={14} /> Файл .txt</Button>
        </div>
        {showSaved && (
          <div className="mt-3 space-y-1">
            {saved.length === 0 && <p className="text-xs text-zinc-500">Пока ничего не сохранено.</p>}
            {saved.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-1.5">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onLoad(s.name, s.items)}>
                  <div className="truncate text-sm text-zinc-200">{s.name}</div>
                  <div className="font-mono text-[10px] text-zinc-500">
                    {s.items.length} ингр. · {new Date(s.savedAt).toLocaleDateString('ru-RU')}
                  </div>
                </button>
                <button type="button" onClick={() => removeSaved(s.id)} className="rounded p-1 text-zinc-600 hover:text-rose-400" title="Удалить">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className={`font-mono text-lg tabular-nums ${accent ? 'text-amber-300' : 'text-zinc-100'}`}>{value}</div>
      <div className="font-mono text-[10px] text-zinc-500">{sub}</div>
    </div>
  );
}

export default memo(CocktailBuilder);
