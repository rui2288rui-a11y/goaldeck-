'use client';

import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { subjectTotals } from '@/lib/stats';
import { addDays, dateKey, formatMinutes, startOfDay } from '@/lib/utils';
import { Empty } from '@/components/ui';

/** 直近 days 日の科目別学習時間の内訳 */
export function SubjectDonut({ days = 30 }: { days?: number }) {
  const { subjects, logs } = useStore();
  const now = useNow(60_000);
  const rows = useMemo(
    () => subjectTotals(logs, subjects, dateKey(addDays(startOfDay(now), -(days - 1)))),
    [logs, subjects, now, days],
  );
  const total = rows.reduce((a, r) => a + r.minutes, 0);

  if (total === 0) {
    return <Empty title="内訳を表示できません" desc={`直近${days}日の学習記録が増えると、科目ごとの割合が見えます。`} />;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="minutes" nameKey="name" innerRadius="64%" outerRadius="96%" paddingAngle={2} stroke="none">
              {rows.map((r) => (
                <Cell key={r.id} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-lg font-extrabold leading-none">{formatMinutes(total)}</span>
          <span className="mt-1 text-[10px] font-bold text-muted">直近{days}日</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {rows.slice(0, 6).map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-xs">
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
            <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
            <span className="tabular shrink-0 font-bold text-muted">{Math.round((r.minutes / total) * 100)}%</span>
          </li>
        ))}
        {rows.length > 6 && <li className="text-[11px] font-semibold text-muted">ほか {rows.length - 6} 科目</li>}
      </ul>
    </div>
  );
}
