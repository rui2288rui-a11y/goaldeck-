'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { dailySeries } from '@/lib/stats';
import { formatMinutes } from '@/lib/utils';
import { Empty } from '@/components/ui';

interface TipItem {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

function BarTip({
  active,
  payload,
  names,
}: {
  active?: boolean;
  payload?: TipItem[];
  names: Record<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload ?? {};
  const rows = payload
    .filter((p) => Number(p.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));
  const total = Number(point.total ?? 0);
  return (
    <div className="min-w-[150px] rounded-2xl border border-line bg-surface px-3 py-2.5 text-xs shadow-card">
      <p className="mb-1.5 font-extrabold">
        {String(point.label ?? '')}（{String(point.weekday ?? '')}）
      </p>
      {rows.length === 0 && <p className="text-muted">記録なし</p>}
      {rows.map((r) => (
        <p key={String(r.dataKey)} className="flex items-center justify-between gap-3 py-0.5">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            {names[String(r.dataKey)] ?? ''}
          </span>
          <span className="tabular font-bold">{formatMinutes(Number(r.value) * 60)}</span>
        </p>
      ))}
      {rows.length > 1 && (
        <p className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-extrabold">
          <span>合計</span>
          <span className="tabular">{formatMinutes(total * 60)}</span>
        </p>
      )}
    </div>
  );
}

export function StudyBarChart({ days, height = 220 }: { days: number; height?: number }) {
  const { subjects, logs, settings } = useStore();
  const now = useNow(60_000);
  const data = useMemo(() => dailySeries(logs, subjects, days, now), [logs, subjects, days, now]);
  const names = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects]);
  const targetHours = settings.dailyTargetMinutes / 60;
  const isEmpty = data.every((p) => p.total === 0);

  if (isEmpty) {
    return <Empty title="まだ学習記録がありません" desc="ストップウォッチで計測するか、手動で記録を追加すると、ここに毎日の学習時間が積み上がります。" />;
  }

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={days > 14 ? 4 : days > 7 ? 1 : 0}
              tickMargin={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              allowDecimals={false}
              tickFormatter={(v: number) => `${v}h`}
              domain={[0, (dataMax: number) => Math.max(1, Math.ceil(Math.max(dataMax, targetHours)))]}
            />
            <Tooltip cursor={{ fill: 'rgb(var(--brand) / 0.08)' }} content={<BarTip names={names} />} />
            <ReferenceLine y={targetHours} stroke="rgb(var(--accent))" strokeDasharray="5 4" strokeWidth={1.5} />
            {subjects.map((s) => (
              <Bar
                key={s.id}
                dataKey={s.id}
                stackId="study"
                fill={s.color}
                maxBarSize={days > 14 ? 10 : 30}
                animationDuration={500}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-muted">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: 'rgb(var(--accent))' }} />
          目標ペース {formatMinutes(settings.dailyTargetMinutes)}
        </span>
        {subjects.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
