'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '@/hooks/useStore';
import { cn, parseDateKey } from '@/lib/utils';
import { Empty } from '@/components/ui';

interface TipItem {
  value?: number | string;
  payload?: Record<string, unknown>;
}

function ScoreTip({ active, payload }: { active?: boolean; payload?: TipItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload ?? {};
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-xs shadow-card">
      <p className="font-extrabold">{String(p.full ?? '')}</p>
      <p className="mt-0.5 text-muted">{String(p.label2 ?? '')}</p>
      <p className="tabular mt-1 text-sm font-extrabold">{String(payload[0].value)} 点</p>
    </div>
  );
}

/** 科目ごとの点数推移。目標点を破線で表示 */
export function ScoreTrend() {
  const { subjects, scores } = useStore();
  const withData = subjects.filter((s) => scores.some((x) => x.subjectId === s.id));
  const [pick, setPick] = useState<string | null>(null);
  const subject = withData.find((s) => s.id === pick) ?? withData[0];

  const points = useMemo(() => {
    if (!subject) return [];
    return scores
      .filter((x) => x.subjectId === subject.id)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.createdAt - b.createdAt)
      .map((x) => {
        const d = parseDateKey(x.dateKey);
        return { label: `${d.getMonth() + 1}/${d.getDate()}`, full: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`, label2: x.label, score: x.score };
      });
  }, [scores, subject]);

  if (!subject) {
    return <Empty title="点数の履歴がまだありません" desc="「点数を記録」から過去問や模試の結果を追加すると、伸びがグラフで見えます。" />;
  }

  return (
    <div>
      <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {withData.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setPick(s.id)}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition',
              s.id === subject.id ? 'border-transparent text-white' : 'border-line text-muted hover:text-ink',
            )}
            style={s.id === subject.id ? { background: s.color } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={6} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              domain={[0, subject.maxScore]}
              allowDecimals={false}
            />
            <Tooltip content={<ScoreTip />} />
            <ReferenceLine y={subject.targetScore} stroke="rgb(var(--accent))" strokeDasharray="5 4" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={subject.color}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: 'rgb(var(--surface))' }}
              activeDot={{ r: 6 }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        <i className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: 'rgb(var(--accent))' }} />
        目標 {subject.targetScore} 点 ／ 満点 {subject.maxScore} 点
      </p>
    </div>
  );
}
