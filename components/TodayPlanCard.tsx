'use client';

import { useMemo } from 'react';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import { buildTodayPlan } from '@/lib/planner';
import { progressLine } from '@/lib/motivation';
import { Badge, Button, Card, CardTitle, Icon, Ring } from '@/components/ui';
import type { Tone } from '@/components/ui';
import type { PlanBlock, PlanStatus } from '@/types';
import { cn, dateKey, formatMinutes, formatTime } from '@/lib/utils';

const STATUS: Record<PlanStatus, { tone: Tone; label: string }> = {
  nodata: { tone: 'muted', label: '準備中' },
  expired: { tone: 'muted', label: '終了' },
  achieved: { tone: 'good', label: '目標達成' },
  ok: { tone: 'good', label: 'ペース良好' },
  tight: { tone: 'accent', label: '要注意' },
  over: { tone: 'bad', label: '要見直し' },
};

/** 残り日数と点数のギャップから逆算した「今日やること」 */
export function TodayPlanCard() {
  const { goal, subjects, logs, settings, data, toggleBlock, swSelect, swStart, notify } = useStore();
  const { goTo } = useUI();
  const now = useNow(30_000);

  const plan = useMemo(
    () => buildTodayPlan({ goal, subjects, logs, settings, now }),
    [goal, subjects, logs, settings, now],
  );

  const todayKey = dateKey(now);
  const done = new Set(data.doneBlocks[todayKey] ?? []);
  const status = STATUS[plan.status];
  const ready = plan.status !== 'nodata' && plan.status !== 'expired';
  const ratio = plan.targetMinutes > 0 ? plan.studiedTodayMinutes / plan.targetMinutes : 0;

  const startBlock = (b: PlanBlock) => {
    const sw = data.stopwatch;
    if (sw.running || sw.accumulatedMs > 0) {
      notify('ストップウォッチが動いています。記録タブで確認してください');
      goTo('record');
      return;
    }
    swSelect(b.subjectId, b.title);
    swStart();
    goTo('record');
  };

  return (
    <Card>
      <CardTitle icon="sparkles" title="今日やること" right={<Badge tone={status.tone}>{status.label}</Badge>} />

      <p className="text-base font-extrabold leading-snug">{plan.headline}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{plan.detail}</p>

      {!ready && (
        <Button variant="soft" className="mt-4 w-full" onClick={() => goTo('goal')}>
          <Icon name="target" />
          目標と科目を設定する
        </Button>
      )}

      {ready && (
        <>
          <div className="mt-5 flex items-center gap-4">
            <Ring value={ratio} size={104} stroke={11} color={ratio >= 1 ? 'rgb(var(--good))' : 'rgb(var(--brand))'}>
              <span className="tabular text-2xl font-extrabold leading-none">{plan.studiedTodayMinutes}</span>
              <span className="mt-1 text-[10px] font-bold text-muted">/ {plan.targetMinutes}分</span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                {plan.remainingMinutes > 0 ? `あと ${formatMinutes(plan.remainingMinutes)}` : '今日の目標を達成！'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{progressLine(plan.studiedTodayMinutes, plan.targetMinutes)}</p>
              <Badge tone="brand" className="mt-2">
                {plan.phaseLabel}
              </Badge>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { k: '必要ペース', v: `${formatMinutes(plan.needPerDay)}/日` },
              { k: '不足', v: `${plan.totalGapPoints}点` },
              { k: '学習できる日', v: `${plan.daysLeft}日` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-surface2 px-2 py-2.5">
                <dt className="text-[10px] font-bold text-muted">{x.k}</dt>
                <dd className="tabular mt-0.5 text-[13px] font-extrabold">{x.v}</dd>
              </div>
            ))}
          </dl>

          {plan.allocations.length > 0 && (
            <div className="mt-5">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface2" aria-hidden="true">
                {plan.allocations.map((a) => (
                  <div key={a.subjectId} style={{ width: `${(a.minutes / plan.targetMinutes) * 100}%`, background: a.color }} />
                ))}
              </div>
              <h3 className="mb-2 mt-4 text-xs font-extrabold text-muted">今日のスケジュール</h3>
              <ul className="space-y-2">
                {plan.blocks.map((b) => {
                  const isDone = done.has(b.id);
                  return (
                    <li
                      key={b.id}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition',
                        isDone && 'opacity-55',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleBlock(todayKey, b.id)}
                        aria-pressed={isDone}
                        aria-label={isDone ? '完了を取り消す' : '完了にする'}
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition active:scale-90',
                          isDone ? 'border-transparent bg-good text-white' : 'border-line text-transparent hover:border-good',
                        )}
                      >
                        <Icon name="check" className="h-5 w-5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-extrabold">
                          <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
                          <span className={cn('truncate', isDone && 'line-through')}>{b.subjectName}</span>
                          <span className="tabular shrink-0 text-xs font-bold text-muted">{b.minutes}分</span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">{b.title}</p>
                        <p className="tabular mt-0.5 text-[11px] font-semibold text-muted/80">
                          {formatTime(b.start)} – {formatTime(b.end)}
                        </p>
                      </div>
                      <Button size="sm" variant="soft" onClick={() => startBlock(b)} aria-label={`${b.subjectName}を開始`}>
                        <Icon name="play" className="h-3.5 w-3.5" />
                        開始
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {plan.skipped.length > 0 && (
                <p className="mt-3 text-[11px] leading-relaxed text-muted">
                  今日は見送り：{plan.skipped.join('、')}（学習していない日数が増えるほど、翌日以降に優先されます）
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
