'use client';

import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import { countdownLine } from '@/lib/motivation';
import { clamp, cn, formatJaDate, formatTime, pad2 } from '@/lib/utils';

/** 本番までを 日・時間・分・秒 でリアルタイムに表示するヒーローカード */
export function CountdownCard() {
  const { goal } = useStore();
  const { device, goTo } = useUI();
  const now = useNow(1000);
  if (!goal) return null;

  const wide = device === 'desktop';
  const target = new Date(goal.dateISO);
  const diff = target.getTime() - now.getTime();
  const over = diff <= 0;
  const abs = Math.abs(diff);

  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);

  const start = new Date(goal.createdAtISO).getTime();
  const span = Math.max(1, target.getTime() - start);
  const elapsed = clamp((now.getTime() - start) / span, 0, 1);

  const units: Array<{ label: string; value: string }> = [
    { label: '日', value: String(days) },
    { label: '時間', value: pad2(hours) },
    { label: '分', value: pad2(mins) },
    { label: '秒', value: pad2(secs) },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-glow sm:p-6"
      aria-label="目標までのカウントダウン"
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-white/85">
            <span className="text-lg leading-none">{goal.emoji}</span>
            <span className="truncate">{goal.name}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-white/70">
            {formatJaDate(target)} {formatTime(target)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => goTo('goal')}
          className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur transition hover:bg-white/25 active:scale-95"
        >
          編集
        </button>
      </div>

      <p className="relative mt-4 text-xs font-bold tracking-widest text-white/80">
        {over ? '目標日から' : '本番まで あと'}
      </p>

      <div className="relative mt-2 grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {units.map((u) => (
          <div key={u.label} className="rounded-2xl bg-white/15 px-1 py-3 text-center backdrop-blur-sm">
            <div className={cn('tabular font-extrabold leading-none', wide ? 'text-5xl' : 'text-[1.9rem]')}>{u.value}</div>
            <div className="mt-1.5 text-[11px] font-bold text-white/75">{u.label}</div>
          </div>
        ))}
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex justify-between text-[11px] font-bold text-white/80">
          <span>スタートから {Math.round(elapsed * 100)}% 経過</span>
          <span>{over ? '終了' : `残り ${days}日`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${elapsed * 100}%` }} />
        </div>
      </div>

      <p className="relative mt-4 text-[13px] font-semibold leading-relaxed text-white/90">
        {countdownLine(over ? 0 : Math.ceil(diff / 86400000), now.getDate())}
      </p>
    </section>
  );
}
