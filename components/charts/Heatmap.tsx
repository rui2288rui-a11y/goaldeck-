'use client';

import { useMemo } from 'react';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import { heatLevel, heatmap } from '@/lib/stats';
import { cn, formatMinutes } from '@/lib/utils';

const LEVEL_CLS = ['bg-surface2', 'bg-brand/25', 'bg-brand/50', 'bg-brand/75', 'bg-brand'] as const;

/** GitHub風の学習カレンダー。濃いほどたくさん勉強した日 */
export function Heatmap() {
  const { logs } = useStore();
  const { device } = useUI();
  const now = useNow(60_000);
  const weeks = device === 'desktop' ? 26 : 15;
  const cols = useMemo(() => heatmap(logs, weeks, now), [logs, weeks, now]);

  return (
    <div>
      <div className="flex gap-[3px]">
        <div className="mr-1 grid shrink-0 grid-rows-[repeat(7,minmax(0,1fr))] gap-[3px] text-[9px] font-bold text-muted">
          {['日', '月', '火', '水', '木', '金', '土'].map((w, i) => (
            <span key={w} className="flex items-center leading-none">
              {i % 2 === 1 ? w : ''}
            </span>
          ))}
        </div>
        {cols.map((col, ci) => (
          <div key={ci} className="grid min-w-0 flex-1 grid-rows-[repeat(7,minmax(0,1fr))] gap-[3px]">
            {col.map((c) => (
              <div
                key={c.dateKey}
                title={c.future ? '' : `${c.label} ${c.minutes > 0 ? formatMinutes(c.minutes) : '記録なし'}`}
                className={cn('aspect-square w-full rounded-[4px]', c.future ? 'opacity-0' : LEVEL_CLS[heatLevel(c.minutes)])}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] font-bold text-muted">
        少
        {LEVEL_CLS.map((cls) => (
          <i key={cls} className={cn('h-3 w-3 rounded-[3px]', cls)} />
        ))}
        多
      </div>
    </div>
  );
}
