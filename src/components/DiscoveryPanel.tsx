import { useMemo, useState, type ReactNode } from 'react';
import {
  Ban, Dna, Heart, Loader2, Search, Shuffle, Sparkles, Wand2, Wine, Bot, RotateCcw,
} from 'lucide-react';
import { COCKTAILS, COCKTAIL_MAP, GLASS_LABEL, METHOD_LABEL } from '../data/cocktails';
import { CATEGORIES, CATEGORY_MAP, INGREDIENTS, getIngredient, unitLabel } from '../data/ingredients';
import type { Category, Cocktail, RecipeItem } from '../data/types';
import { BALANCE_LABELS } from '../utils/mixologyMath';
import {
  MOOD_CHIPS, cocktailStats, composeSignature, isEmptyQuery, matchMood, mergeQueries, parseQuery, parseWithAI,
  rankByPreferences, similarCocktails, type AISettings, type ParsedQuery,
} from '../utils/recommendationEngine';
import { Bar, Button, MatchBadge, Panel, SectionTitle, Tag } from './ui';

interface Props {
  onLoadToLab: (name: string, items: RecipeItem[]) => void;
  aiSettings: AISettings | null;
  onOpenSettings: () => void;
}

type Tab = 'favorite' | 'ingredients' | 'mood';

export default function DiscoveryPanel({ onLoadToLab, aiSettings, onOpenSettings }: Props) {
  const [tab, setTab] = useState<Tab>('favorite');
  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'favorite', label: 'По любимому коктейлю', icon: <Wine size={15} /> },
    { id: 'ingredients', label: 'По ингредиентам', icon: <Heart size={15} /> },
    { id: 'mood', label: 'Хочу чего-то такого…', icon: <Wand2 size={15} /> },
  ];
  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Подбор коктейля</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Три способа найти свой напиток: от любимого коктейля, от ингредиентов или от настроения. Любой результат можно разобрать в 3D-лаборатории.
        </p>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
              tab === t.id
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.15)]'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'favorite' && <FavoriteTab onLoadToLab={onLoadToLab} />}
      {tab === 'ingredients' && <IngredientsTab onLoadToLab={onLoadToLab} />}
      {tab === 'mood' && <MoodTab onLoadToLab={onLoadToLab} aiSettings={aiSettings} onOpenSettings={onOpenSettings} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Общие кусочки
// ─────────────────────────────────────────────────────────────

function Composition({ items }: { items: RecipeItem[] }) {
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

function CocktailMini({
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

// ─────────────────────────────────────────────────────────────
// 1. По любимому коктейлю
// ─────────────────────────────────────────────────────────────

function FavoriteTab({ onLoadToLab }: { onLoadToLab: Props['onLoadToLab'] }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>('negroni');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, 'е');
    if (!q) return COCKTAILS;
    return COCKTAILS.filter((c) =>
      [c.name, c.nameEn, ...c.vibeTags, ...c.ingredients.map((i) => getIngredient(i.id).name)].some((s) =>
        s.toLowerCase().replace(/ё/g, 'е').includes(q),
      ),
    );
  }, [query]);
  const c = COCKTAIL_MAP[selected];
  const s = cocktailStats(c);
  const similar = useMemo(() => similarCocktails(selected, 4), [selected]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Panel className="flex max-h-[70vh] flex-col p-3 lg:max-h-[calc(100vh-230px)]">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Негрони, мескаль, кофейный…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pl-8 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/70"
          />
        </div>
        <div className="thin-scroll -mr-1 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {list.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setSelected(x.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                x.id === selected ? 'bg-amber-500/15 text-amber-100' : 'text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              <span className="truncate">{x.name}</span>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-zinc-500">{cocktailStats(x).abv.toFixed(0)}%</span>
            </button>
          ))}
          {list.length === 0 && <p className="p-3 text-xs text-zinc-500">Ничего не найдено.</p>}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                {c.era === 'classic' ? 'Классика' : 'Современная классика'}
              </div>
              <h2 className="text-2xl font-semibold text-white">{c.name}</h2>
              <div className="text-sm text-zinc-500">{c.nameEn}</div>
            </div>
            <Button variant="primary" className="px-4 py-2 text-sm" onClick={() => onLoadToLab(c.name, c.ingredients)}>
              <Dna size={15} /> Разобрать ДНК в 3D-графе
            </Button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {c.vibeTags.map((t) => <Tag key={t} color="#06B6D4">{t}</Tag>)}
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Состав</div>
              <Composition items={c.ingredients} />
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-zinc-400">
                <div>Метод: <span className="text-zinc-200">{METHOD_LABEL[c.method]}</span></div>
                <div>Бокал: <span className="text-zinc-200">{GLASS_LABEL[c.glass]}</span></div>
                <div>ABV: <span className="text-amber-300">{s.abv.toFixed(1)}%</span></div>
                <div>Объём: <span className="text-zinc-200">{s.finalVolume.toFixed(0)} мл</span></div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">Украшение: {c.garnish}</div>
            </div>
            <div className="space-y-2">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Вкусовой профиль</div>
              {BALANCE_LABELS.map((b) => (
                <Bar key={b.key} label={b.label} value={s.balance[b.key]} color={b.color} />
              ))}
            </div>
          </div>
        </Panel>

        <div>
          <SectionTitle icon={<Shuffle size={13} className="text-cyan-400" />}>Похожие и твисты</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {similar.map((r) => (
              <CocktailMini
                key={r.cocktail.id}
                c={r.cocktail}
                right={
                  <div className="text-right">
                    <MatchBadge value={r.score} />
                    <div className="text-[10px] text-zinc-500">{r.curated ? 'твист' : 'похож'}</div>
                  </div>
                }
                footer={r.note}
                onOpen={() => setSelected(r.cocktail.id)}
                onLab={() => onLoadToLab(r.cocktail.name, r.cocktail.ingredients)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. По ингредиентам — Люблю / Не переношу
// ─────────────────────────────────────────────────────────────

type Pref = 'like' | 'dislike';

function IngredientsTab({ onLoadToLab }: { onLoadToLab: Props['onLoadToLab'] }) {
  const [prefs, setPrefs] = useState<Record<string, Pref>>({ gin: 'like', lime: 'like' });
  const [blockedCats, setBlockedCats] = useState<Category[]>([]);
  const results = useMemo(() => {
    const likes = Object.keys(prefs).filter((k) => prefs[k] === 'like');
    const dislikes = Object.keys(prefs).filter((k) => prefs[k] === 'dislike');
    return rankByPreferences(likes, dislikes, blockedCats);
  }, [prefs, blockedCats]);
  const ok = results.filter((r) => r.match > 0);
  const blocked = results.filter((r) => r.match === 0);

  const cycle = (id: string) =>
    setPrefs((p) => {
      const next = { ...p };
      if (!p[id]) next[id] = 'like';
      else if (p[id] === 'like') next[id] = 'dislike';
      else delete next[id];
      return next;
    });
  const toggleCat = (c: Category) => setBlockedCats((b) => (b.includes(c) ? b.filter((x) => x !== c) : [...b, c]));

  const QUICK: { cat: Category; label: string }[] = [
    { cat: 'syrup', label: 'Без сладких сиропов' },
    { cat: 'mixer', label: 'Без газировки и игристого' },
    { cat: 'liqueur', label: 'Без ликёров' },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Panel className="p-4">
        <SectionTitle
          icon={<Heart size={13} className="text-emerald-400" />}
          right={
            <button type="button" onClick={() => { setPrefs({}); setBlockedCats([]); }} className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white">
              <RotateCcw size={11} /> сбросить
            </button>
          }
        >
          Отметьте ингредиенты
        </SectionTitle>
        <p className="mb-3 text-xs text-zinc-500">
          1 клик — <span className="text-emerald-400">люблю</span>, 2 клика — <span className="text-rose-400">не переношу</span>, 3 — сброс.
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q.cat}
              type="button"
              onClick={() => toggleCat(q.cat)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                blockedCats.includes(q.cat) ? 'border-rose-500/60 bg-rose-500/15 text-rose-200' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Ban size={11} /> {q.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: cat.color }}>
                {cat.name}
                {blockedCats.includes(cat.id) && <span className="ml-2 text-rose-400">· исключено</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INGREDIENTS.filter((i) => i.category === cat.id).map((i) => {
                  const p = prefs[i.id];
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => cycle(i.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        p === 'like'
                          ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                          : p === 'dislike'
                            ? 'border-rose-500/70 bg-rose-500/15 text-rose-200 line-through decoration-rose-400/60'
                            : blockedCats.includes(cat.id)
                              ? 'border-zinc-800 text-zinc-600'
                              : 'border-zinc-700/80 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {p === 'like' ? '♥ ' : p === 'dislike' ? '✕ ' : ''}
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div>
        <SectionTitle icon={<Sparkles size={13} className="text-amber-400" />}>
          Рейтинг коктейлей · {ok.length} подходит
        </SectionTitle>
        <div className="thin-scroll space-y-2 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1">
          {ok.slice(0, 14).map((r) => (
            <div key={r.cocktail.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="w-12 text-center"><MatchBadge value={r.match} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{r.cocktail.name}</div>
                <div className="truncate text-[11px] text-zinc-500">
                  {r.liked.length ? <span className="text-emerald-400">♥ {r.liked.join(', ')}</span> : 'родственный вкус'}
                  {' · '}
                  {r.cocktail.ingredients.map((i) => getIngredient(i.id).name).join(', ')}
                </div>
              </div>
              <Button variant="cyan" className="px-2" onClick={() => onLoadToLab(r.cocktail.name, r.cocktail.ingredients)} title="В 3D-лабораторию">
                <Dna size={13} />
              </Button>
            </div>
          ))}
          {blocked.length > 0 && (
            <details className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-500">
              <summary className="cursor-pointer select-none">Исключено: {blocked.length}</summary>
              <div className="mt-2 space-y-1">
                {blocked.map((r) => (
                  <div key={r.cocktail.id}>
                    <span className="text-zinc-400">{r.cocktail.name}</span> — <span className="text-rose-400">есть: {r.blockedBy.join(', ')}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. «Хочу чего-то такого…»
// ─────────────────────────────────────────────────────────────

function MoodTab({ onLoadToLab, aiSettings, onOpenSettings }: Props) {
  const [text, setText] = useState('кислое, освежающее и ягодное');
  const [query, setQuery] = useState<ParsedQuery>(() => parseQuery('кислое, освежающее и ягодное'));
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [usedAI, setUsedAI] = useState(false);

  const run = async (value: string, forceAI = false) => {
    setText(value);
    setAiError(null);
    const local = parseQuery(value);
    const needsAI = forceAI || (isEmptyQuery(local) && value.trim().length > 0);
    if (needsAI && aiSettings?.apiKey) {
      setLoading(true);
      try {
        const ai = await parseWithAI(value, aiSettings);
        setQuery(mergeQueries(local, ai));
        setUsedAI(true);
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'Ошибка запроса к ИИ');
        setQuery(local);
        setUsedAI(false);
      } finally {
        setLoading(false);
      }
    } else {
      setQuery(local);
      setUsedAI(false);
    }
  };

  const results = useMemo(() => matchMood(query, 3), [query]);
  const signature = useMemo(() => composeSignature(query), [query]);
  const empty = isEmptyQuery(query);

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(text);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Опишите вкус: «крепкое, дымное и не сладкое»…"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/70"
          />
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1 px-5 py-3 text-sm sm:flex-none">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Подобрать
            </Button>
            {aiSettings?.apiKey ? (
              <Button variant="cyan" className="px-3 py-3" onClick={() => void run(text, true)} title="Разобрать запрос через ИИ">
                <Bot size={15} /> ИИ
              </Button>
            ) : (
              <Button className="px-3 py-3" onClick={onOpenSettings} title="Подключить OpenAI / Gemini для нестандартных запросов">
                <Bot size={15} />
              </Button>
            )}
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {MOOD_CHIPS.map((m) => (
            <button
              key={m.text}
              type="button"
              onClick={() => void run(m.text)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                text === m.text ? 'border-amber-500/60 bg-amber-500/10 text-amber-200' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {m.emoji} {m.text}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500">Распознано:</span>
          {query.matched.map((m) => <Tag key={m} color="#10B981">{m}</Tag>)}
          {query.negated.map((m) => <Tag key={m} color="#F43F5E">без: {m}</Tag>)}
          {empty && <span className="text-zinc-500">ничего — попробуйте слова «кислое», «дымное», «кофейное», «без джина»{aiSettings?.apiKey ? '' : ' или подключите ИИ'}.</span>}
          {usedAI && <Tag color="#06B6D4">разобрано ИИ</Tag>}
          {aiError && <span className="text-rose-400">ИИ недоступен ({aiError}) — использован локальный движок.</span>}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div>
          <SectionTitle icon={<Wine size={13} className="text-amber-400" />}>а) 3 коктейля из базы</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {results.map((r) => (
              <CocktailMini
                key={r.cocktail.id}
                c={r.cocktail}
                right={<MatchBadge value={r.match} />}
                footer={
                  <>
                    <span>{r.cocktail.description}</span>
                    {r.hits.length > 0 && <span className="mt-1 block text-emerald-400/80">совпало: {r.hits.slice(0, 4).join(', ')}</span>}
                  </>
                }
                onLab={() => onLoadToLab(r.cocktail.name, r.cocktail.ingredients)}
              />
            ))}
          </div>
        </div>
        <div>
          <SectionTitle icon={<Sparkles size={13} className="text-emerald-400" />}>б) Авторская связка</SectionTitle>
          <div className="glass rounded-2xl border-emerald-500/30 p-4 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">Signature под ваш запрос</div>
            <h3 className="mt-1 text-xl font-semibold text-white">«{signature.name}»</h3>
            <div className="mt-1 font-mono text-[11px] text-zinc-500">
              средняя синергия пар: <span className="text-amber-300">{signature.synergy}%</span> · {METHOD_LABEL[signature.method as keyof typeof METHOD_LABEL]}
            </div>
            <ul className="mt-3 space-y-1.5">
              {signature.items.map((i) => {
                const ing = getIngredient(i.id);
                const role = signature.roles.find((r) => r.id === i.id)?.role;
                return (
                  <li key={i.id} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: ing.color, boxShadow: `0 0 6px ${ing.color}` }} />
                    <span className="flex-1 text-zinc-100">
                      {ing.name}
                      <span className="ml-1.5 text-[11px]" style={{ color: CATEGORY_MAP[ing.category].color }}>{role}</span>
                    </span>
                    <span className="font-mono text-xs text-amber-300">{i.amount} {unitLabel(ing)}</span>
                  </li>
                );
              })}
            </ul>
            <Button variant="primary" className="mt-4 w-full py-2.5 text-sm" onClick={() => onLoadToLab(signature.name, signature.items)}>
              <Dna size={15} /> Загрузить в 3D-шейкер и посмотреть раскрытие
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
