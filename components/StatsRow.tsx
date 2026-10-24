'use client';

import { useMemo } from 'react';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { calcStreak, minutesInLastDays, minutesOnDay, totalHours } from '@/lib/stats';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { cn, dateKey, formatMinutes } from '@/lib/utils';

/** 今日・連続日数・7日合計・累計をひと目で */
export function StatsRow() {
  const { logs } = useStore();
  const now = useNow(30_000);

  const tiles = useMemo<Array<{ icon: IconName; label: string; value: string; sub?: string; tint: string }>>(() => {
    const streak = calcStreak(logs, now);
    return [
      { icon: 'clock', label: '今日', value: formatMinutes(minutesOnDay(logs, dateKey(now))), tint: 'bg-brand/10 text-brand' },
      {
        icon: 'flame',
        label: '連続学習',
        value: `${streak}日`,
        sub: streak >= 7 ? '1週間突破！' : streak > 0 ? '継続中' : '今日から開始',
        tint: 'bg-accent/15 text-accent',
      },
      { icon: 'chart', label: '直近7日', value: formatMinutes(minutesInLastDays(logs, 7, now)), tint: 'bg-good/15 text-good' },
      { icon: 'flag', label: '累計', value: `${totalHours(logs)}時間`, tint: 'bg-bad/10 text-bad' },
    ];
  }, [logs, now]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-3xl border border-line bg-surface p-3.5 shadow-card">
          <div className="flex items-center gap-2">
            <span className={cn('grid h-8 w-8 place-items-center rounded-xl', t.tint)}>
              <Icon name={t.icon} className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-muted">{t.label}</span>
          </div>
          <p className="tabular mt-2.5 text-xl font-extrabold leading-none">{t.value}</p>
          {t.sub && <p className="mt-1 text-[11px] font-semibold text-muted">{t.sub}</p>}
        </div>
      ))}
    </div>
  );
}
