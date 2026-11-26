import type { ReactNode } from 'react';

/** Маленькие переиспользуемые кусочки интерфейса */

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

export function SectionTitle({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {icon}
        {children}
      </h3>
      {right}
    </div>
  );
}

export function Bar({ label, value, color, max = 10 }: { label: string; value: number; color: string; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-[11px] text-zinc-300">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}88` }}
        />
      </div>
    </div>
  );
}

export function Tag({ children, color = '#a1a1aa' }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-4"
      style={{ borderColor: `${color}55`, color, background: `${color}12` }}
    >
      {children}
    </span>
  );
}

export function MatchBadge({ value }: { value: number }) {
  const color = value >= 75 ? '#10B981' : value >= 50 ? '#F59E0B' : value > 0 ? '#a1a1aa' : '#F43F5E';
  return (
    <span className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>
      {value}%
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  className = '',
  title,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'cyan' | 'emerald' | 'danger';
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
    cyan: 'border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10',
    emerald: 'border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10',
    danger: 'border border-rose-500/40 text-rose-300 hover:bg-rose-500/10',
    ghost: 'border border-zinc-700/80 text-zinc-300 hover:bg-zinc-800/70 hover:text-white',
  };
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
