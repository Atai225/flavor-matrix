import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Beaker, Compass, MousePointerClick, Settings2 } from 'lucide-react';
import Scene3D from './components/Scene3D';
import TastingTimeline from './components/TastingTimeline';
import NodeInspector from './components/NodeInspector';
import CocktailBuilder from './components/CocktailBuilder';
import DiscoveryPanel from './components/DiscoveryPanel';
import SettingsModal from './components/SettingsModal';
import { CATEGORIES, INGREDIENT_MAP, amountRange } from './data/ingredients';
import { COCKTAIL_MAP, DEFAULT_PRESET_ID } from './data/cocktails';
import type { RecipeItem } from './data/types';
import { TIMELINE_MAX, analyzeBalance } from './utils/mixologyMath';
import { checkServerAI, type AISettings } from './utils/recommendationEngine';
import { loadAISettings, storeAISettings } from './utils/storage';
import { getClaudeSample, type ClaudeSample } from './utils/claudeBridge';

type Mode = 'lab' | 'discovery';
const MAX_ITEMS = 10;

export default function App() {
  const preset = COCKTAIL_MAP[DEFAULT_PRESET_ID];
  const [mode, setMode] = useState<Mode>('lab');
  const [recipeName, setRecipeName] = useState(preset.name);
  const [recipe, setRecipe] = useState<RecipeItem[]>(preset.ingredients);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [balanceOn, setBalanceOn] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(() => loadAISettings());
  const [showSettings, setShowSettings] = useState(false);
  const [claudeSample, setClaudeSample] = useState<ClaudeSample | null>(null);
  const [serverAI, setServerAI] = useState(false);

  // На claude.ai страница может спрашивать Claude от имени зрителя — без ключа
  useEffect(() => {
    let alive = true;
    void getClaudeSample().then((s) => {
      if (alive) setClaudeSample(() => s);
    });
    // На своём хостинге (Vercel) — серверная функция /api/ai с ключом владельца
    if (window.location.protocol.startsWith('http')) {
      void checkServerAI().then((ok) => {
        if (alive) setServerAI(ok);
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Операции с рецептом ──
  const recipeRef = useRef(recipe);
  recipeRef.current = recipe;
  const timeRef = useRef(time);
  timeRef.current = time;

  const addIngredient = useCallback(
    (id: string, amount?: number) => {
      const ing = INGREDIENT_MAP[id];
      const current = recipeRef.current;
      if (!ing) return;
      if (current.some((x) => x.id === id)) {
        notify(`${ing.name} уже в шейкере`);
        return;
      }
      if (current.length >= MAX_ITEMS) {
        notify(`В шейкере максимум ${MAX_ITEMS} ингредиентов`);
        return;
      }
      setRecipe([...current, { id, amount: amount ?? ing.defaultAmount }]);
      notify(`+ ${ing.name} в шейкере`);
    },
    [notify],
  );
  const removeIngredient = useCallback((id: string) => setRecipe((r) => r.filter((x) => x.id !== id)), []);
  const setAmount = useCallback((id: string, amount: number) => {
    const ing = INGREDIENT_MAP[id];
    const { min, max } = amountRange(ing);
    setRecipe((r) => r.map((x) => (x.id === id ? { ...x, amount: Math.min(max, Math.max(min, amount)) } : x)));
  }, []);
  const clearRecipe = useCallback(() => {
    setRecipe([]);
    setPlaying(false);
    setTime(0);
  }, []);
  const loadRecipe = useCallback(
    (name: string, items: RecipeItem[], autoplay = false) => {
      setRecipeName(name);
      setRecipe(items.filter((i) => INGREDIENT_MAP[i.id]).map((i) => ({ ...i })));
      setSelectedId(null);
      setTime(0);
      setPlaying(autoplay);
      setMode('lab');
    },
    [],
  );
  const loadFromBuilder = useCallback((name: string, items: RecipeItem[]) => loadRecipe(name, items, false), [loadRecipe]);
  const loadFromDiscovery = useCallback(
    (name: string, items: RecipeItem[]) => {
      loadRecipe(name, items, true);
      notify(`«${name}» разобран в 3D — смотрите раскрытие вкуса`);
    },
    [loadRecipe, notify],
  );

  // ── Анимация таймлайна ──
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = timeRef.current + dt * speed;
      if (next >= TIMELINE_MAX) {
        setTime(TIMELINE_MAX);
        setPlaying(false);
        return;
      }
      timeRef.current = next;
      setTime(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const playingRef = useRef(playing);
  playingRef.current = playing;
  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      setPlaying(false);
      return;
    }
    if (timeRef.current >= TIMELINE_MAX - 0.05) {
      timeRef.current = 0;
      setTime(0);
    }
    setPlaying(true);
  }, []);
  const scrub = useCallback((t: number) => {
    setTime(t);
    setPlaying(false);
  }, []);

  // ── Баланс ──
  const balance = useMemo(() => (balanceOn ? analyzeBalance(recipe) : null), [balanceOn, recipe]);
  const suggestedIds = useMemo(() => balance?.suggestions.map((s) => s.id) ?? [], [balance]);
  const recipeIds = useMemo(() => recipe.map((r) => r.id), [recipe]);

  // Esc снимает выделение
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === ' ' && mode === 'lab' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, togglePlay]);

  const saveAI = (s: AISettings | null) => {
    setAiSettings(s);
    storeAISettings(s);
    notify(s ? 'Ключ ИИ сохранён в браузере' : 'Ключ ИИ удалён');
  };

  const selected = selectedId ? INGREDIENT_MAP[selectedId] : null;

  return (
    <div className="flex h-full flex-col bg-[#06070A]">
      {/* ── Шапка ── */}
      <header className="z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#27272A] bg-zinc-950/80 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10">
            <Beaker size={16} className="text-amber-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-sm font-semibold tracking-[0.2em] text-white">
              FLAVOR<span className="text-amber-400">·</span>MATRIX <span className="text-cyan-400">3D</span>
            </div>
            <div className="hidden text-[10px] text-zinc-500 sm:block">граф сочетаемости · симулятор глотка · подбор коктейлей</div>
          </div>
        </div>

        <nav className="order-3 flex w-full overflow-hidden rounded-lg border border-[#27272A] font-mono text-[11px] sm:order-none sm:w-auto">
          {([
            ['lab', '[ 3D БАР-ЛАБОРАТОРИЯ ]', <Beaker key="i" size={13} />],
            ['discovery', '[ ПОДБОР КОКТЕЙЛЯ ]', <Compass key="i" size={13} />],
          ] as const).map(([m, label, icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2 py-2 text-[10px] tracking-wider transition sm:flex-none sm:px-3 sm:text-[11px] ${
                mode === m ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#27272A] px-2.5 py-1.5 text-xs text-zinc-400 transition hover:text-white"
          title="Настройки ИИ (необязательно)"
        >
          <Settings2 size={14} />
          <span className="hidden md:inline">ИИ {claudeSample ? '· Claude' : serverAI ? '· сервер' : aiSettings?.apiKey ? '· вкл' : '· выкл'}</span>
        </button>
      </header>

      {/* ── 3D-лаборатория (остаётся смонтированной, чтобы не пересоздавать WebGL) ── */}
      <main className={`min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden ${mode === 'lab' ? 'flex' : 'hidden'}`}>
        <div className="flex shrink-0 flex-col lg:relative lg:min-h-0 lg:flex-1">
        <section className="relative h-[52vh] lg:absolute lg:inset-0 lg:h-auto">
          <Scene3D
            recipeIds={recipeIds}
            selectedId={selectedId}
            time={time}
            suggestedIds={suggestedIds}
            onSelect={setSelectedId}
            onAdd={addIngredient}
          />

          {/* Верх слева: инспектор узла или подсказка */}
          <div className="pointer-events-none absolute bottom-3 left-3 top-3 z-10 flex flex-col lg:bottom-[200px]">
            {selected ? (
              <NodeInspector
                ingredient={selected}
                inRecipe={recipeIds.includes(selected.id)}
                recipeIds={recipeIds}
                onAdd={addIngredient}
                onRemove={removeIngredient}
                onSelect={setSelectedId}
              />
            ) : (
              <div className="glass pointer-events-auto hidden max-w-[260px] rounded-xl px-3 py-2.5 text-xs text-zinc-400 sm:block">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-zinc-200">
                  <MousePointerClick size={13} className="text-cyan-400" /> Как пользоваться
                </div>
                Клик по сфере — связи и % синергии. Двойной клик — в шейкер. Тяните мышью, чтобы вращать, колесо — зум. <span className="font-mono text-zinc-500">Пробел</span> — глоток.
              </div>
            )}
          </div>

          {/* Верх справа: легенда */}
          <div className="glass pointer-events-auto absolute right-3 top-3 z-10 hidden rounded-xl px-3 py-2.5 text-[11px] sm:block">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-center gap-2 py-0.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                {c.name}
              </div>
            ))}
            <div className="mt-1.5 border-t border-zinc-800 pt-1.5 text-zinc-400">
              <div className="flex items-center gap-2"><span className="h-px w-4 bg-white" /> классика</div>
              <div className="flex items-center gap-2"><span className="h-px w-4 bg-amber-500" /> эксперимент</div>
            </div>
          </div>

        </section>

          {/* Низ: таймлайн глотка */}
          <div className="z-10 p-3 lg:pointer-events-none lg:absolute lg:inset-x-3 lg:bottom-3 lg:p-0">
            <TastingTimeline
              recipe={recipe}
              time={time}
              playing={playing}
              speed={speed}
              onTime={scrub}
              onTogglePlay={togglePlay}
              onSpeed={setSpeed}
            />
          </div>
        </div>

        <aside className="thin-scroll w-full shrink-0 border-t border-[#27272A] bg-zinc-950/40 lg:w-[400px] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <CocktailBuilder
            name={recipeName}
            recipe={recipe}
            selectedId={selectedId}
            balance={balance}
            onRename={setRecipeName}
            onAmount={setAmount}
            onRemove={removeIngredient}
            onClear={clearRecipe}
            onSelect={setSelectedId}
            onLoad={loadFromBuilder}
            onAdd={addIngredient}
            onBalance={setBalanceOn}
            notify={notify}
          />
        </aside>
      </main>

      {mode === 'discovery' && (
        <main className="thin-scroll min-h-0 flex-1 overflow-y-auto">
          <DiscoveryPanel onLoadToLab={loadFromDiscovery} aiSettings={aiSettings} claudeSample={claudeSample} serverAI={serverAI} onOpenSettings={() => setShowSettings(true)} />
        </main>
      )}

      {showSettings && <SettingsModal value={aiSettings} onSave={saveAI} onClose={() => setShowSettings(false)} />}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/40 bg-zinc-950/90 px-4 py-2 text-sm text-amber-100 shadow-xl backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
