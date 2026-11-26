import { memo } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { INGREDIENT_MAP } from '../data/ingredients';
import type { RecipeItem } from '../data/types';
import { TIMELINE_MAX, describeMoment, ingredientIntensity, phaseAt, phaseCurve } from '../utils/mixologyMath';

interface Props {
  recipe: RecipeItem[];
  time: number;
  playing: boolean;
  speed: number;
  onTime: (t: number) => void;
  onTogglePlay: () => void;
  onSpeed: (s: number) => void;
}

const PHASES = [
  { key: 'aroma' as const, label: 'Аромат', color: '#06B6D4' },
  { key: 'body' as const, label: 'Тело', color: '#F59E0B' },
  { key: 'finish' as const, label: 'Финиш', color: '#F43F5E' },
];

const MARKS = [
  { t: 0, label: '0 сек', sub: 'Аромат / Нос' },
  { t: 10, label: '10 сек', sub: 'Тело вкуса' },
  { t: 45, label: '45 сек', sub: 'Послевкусие' },
];

function TastingTimeline({ recipe, time, playing, speed, onTime, onTogglePlay, onSpeed }: Props) {
  const phase = phaseAt(time);
  const status = describeMoment(recipe, time);
  const pct = (time / TIMELINE_MAX) * 100;
  const phaseColor = PHASES.find((p) => p.key === phase.key)!.color;
  const active = recipe
    .filter((r) => INGREDIENT_MAP[r.id])
    .map((r) => ({ ing: INGREDIENT_MAP[r.id], v: ingredientIntensity(INGREDIENT_MAP[r.id], time) }))
    .sort((a, b) => b.v - a.v);

  return (
    <div className="glass pointer-events-auto rounded-2xl px-4 pb-3 pt-3 shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={recipe.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.45)] transition hover:bg-amber-400 disabled:opacity-40"
            title={playing ? 'Пауза' : 'Запустить глоток'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => onTime(0)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition hover:text-white"
            title="В начало"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
          <div className="flex items-baseline gap-2">
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:inline">Sip Evolution</span>
            <span className="font-mono text-xs" style={{ color: PHASES.find((p) => p.key === phase.key)!.color }}>
              {phase.label} · {phase.range}
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-snug text-zinc-100" title={status}>
            {status}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-end gap-1.5 sm:flex" title="Яркость фаз прямо сейчас">
            {PHASES.map((p) => {
              const v = phaseCurve(p.key, time);
              return (
                <div key={p.key} className="flex flex-col items-center gap-1">
                  <div className="flex h-7 w-2.5 items-end overflow-hidden rounded-sm bg-zinc-800">
                    <div className="w-full rounded-sm" style={{ height: `${v * 100}%`, background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                  </div>
                  <span className="font-mono text-[9px] text-zinc-500">{p.label[0]}</span>
                </div>
              );
            })}
          </div>
          <span className="w-16 text-right font-mono text-lg tabular-nums text-white">{time.toFixed(1)}<span className="text-xs text-zinc-500"> с</span></span>
          <div className="flex overflow-hidden rounded-md border border-zinc-700 font-mono text-[10px]">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeed(s)}
                className={`px-1.5 py-1 transition ${speed === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ползунок с фазами */}
      <div className="relative mt-3">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-35"
          style={{ background: 'linear-gradient(90deg,#06B6D4 0%,#06B6D4 9%,#F59E0B 18%,#F59E0B 40%,#F43F5E 52%,#F43F5E 100%)' }}
        />
        <input
          type="range"
          min={0}
          max={TIMELINE_MAX}
          step={0.1}
          value={time}
          onChange={(e) => onTime(Number(e.target.value))}
          className="fm-range relative"
          style={{
            ['--fill' as string]: phaseColor,
            background: `linear-gradient(to right, ${phaseColor}d0 0%, ${phaseColor}d0 ${pct}%, transparent ${pct}%)`,
          }}
          aria-label="Время глотка"
        />
      </div>
      <div className="relative mt-1 h-4 font-mono sm:h-7 text-[10px] text-zinc-500">
        {MARKS.map((m) => (
          <button
            key={m.t}
            type="button"
            onClick={() => onTime(m.t)}
            className="absolute -translate-x-1/2 whitespace-nowrap text-center leading-tight transition hover:text-zinc-200 first:translate-x-0 last:-translate-x-full"
            style={{ left: `${(m.t / TIMELINE_MAX) * 100}%`, textAlign: m.t === 0 ? 'left' : m.t === 45 ? 'right' : 'center' }}
          >
            <div className="text-zinc-300">{m.label}</div>
            <div className="hidden font-sans sm:block">{m.sub}</div>
          </button>
        ))}
      </div>

      {active.length > 0 && (
        <div className="thin-scroll mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {active.map(({ ing, v }) => (
            <span
              key={ing.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-all"
              style={{ borderColor: `${ing.color}${v > 0.55 ? 'aa' : '33'}`, color: v > 0.55 ? '#fff' : '#71717a', background: v > 0.55 ? `${ing.color}22` : 'transparent' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ing.color, opacity: 0.3 + v * 0.7, boxShadow: v > 0.55 ? `0 0 6px ${ing.color}` : 'none' }} />
              {ing.name}
              <span className="font-mono text-[10px] opacity-70">{Math.round(v * 100)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TastingTimeline);
