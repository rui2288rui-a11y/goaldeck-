'use client';

import { useEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clamp, cn } from '@/lib/utils';

// ------------------------------------------------------------
// アイコン（依存なしのインラインSVG）
// ------------------------------------------------------------
const ICONS = {
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2" />
      <path d="M9 2h6" />
    </>
  ),
  chart: (
    <>
      <path d="M5 20V11" />
      <path d="M12 20V4" />
      <path d="M19 20v-6" />
      <path d="M3 20h18" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  upload: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  sparkles: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7L19 17Z" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h12l-2 4 2 4H5" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Z" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  alert: (
    <>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4M12 17.5v.01" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 0 0-14-4M4 5v3h3M4 13a8 8 0 0 0 14 4M20 19v-3h-3" />,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5 shrink-0', className)}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

// ------------------------------------------------------------
// カード・見出し
// ------------------------------------------------------------
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-3xl border border-line bg-surface p-4 shadow-card sm:p-5', className)}>{children}</section>;
}

export function CardTitle({
  icon,
  title,
  right,
  className,
}: {
  icon?: IconName;
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
        {icon && (
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
        {title}
      </h2>
      {right}
    </div>
  );
}

// ------------------------------------------------------------
// ボタン
// ------------------------------------------------------------
type Variant = 'primary' | 'soft' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-glow hover:brightness-110',
  soft: 'bg-brand/10 text-brand hover:bg-brand/15',
  ghost: 'text-muted hover:bg-surface2 hover:text-ink',
  danger: 'bg-bad/10 text-bad hover:bg-bad/15',
  outline: 'border border-line bg-surface text-ink hover:bg-surface2',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode }>;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-2xl bg-surface2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-9 rounded-xl px-3 text-xs font-bold transition',
            o.value === value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// バッジ・進捗
// ------------------------------------------------------------
export type Tone = 'brand' | 'good' | 'bad' | 'accent' | 'muted';
const TONES: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  good: 'bg-good/15 text-good',
  bad: 'bg-bad/15 text-bad',
  accent: 'bg-accent/15 text-accent',
  muted: 'bg-surface2 text-muted',
};

export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, color, className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface2', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-700"
        style={{ width: `${clamp(value, 0, 1) * 100}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 96,
  stroke = 10,
  color = 'rgb(var(--brand))',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = clamp(value, 0, 1);
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'rgb(var(--line))' }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ stroke: color, transition: 'stroke-dashoffset .7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Empty({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-8 text-center">
      <p className="text-sm font-bold">{title}</p>
      {desc && <p className="max-w-xs text-xs leading-relaxed text-muted">{desc}</p>}
      {action}
    </div>
  );
}

// ------------------------------------------------------------
// フォーム部品
// ------------------------------------------------------------
export const inputCls =
  'h-11 w-full rounded-xl border border-line bg-surface2 px-3 text-sm font-medium text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/25';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-snug text-muted/80">{hint}</span>}
    </label>
  );
}

/** 入力途中の空欄や範囲外の値でも壊れない数値入力。フォーカスを外したときに範囲へ丸めます。 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 99999,
  suffix,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const commit = () => {
    const n = Number(text);
    const next = text.trim() === '' || !Number.isFinite(n) ? clamp(value, min, max) : clamp(Math.round(n), min, max);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(Math.min(max, Math.round(n)));
        }}
        onBlur={() => {
          focused.current = false;
          commit();
        }}
        className={cn(inputCls, 'tabular', suffix ? 'pr-10' : '', className)}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">{suffix}</span>
      )}
    </div>
  );
}
