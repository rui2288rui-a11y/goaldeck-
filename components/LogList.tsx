'use client';

import { useMemo } from 'react';
import { useStore } from '@/hooks/useStore';
import { Card, CardTitle, Empty, Icon } from '@/components/ui';
import { formatSeconds, formatShortDate, formatTime, parseDateKey } from '@/lib/utils';

/** 日ごとにまとめた学習履歴（新しい順）。誤記録はここから削除できます */
export function LogList() {
  const { logs, subjects, deleteLog, notify } = useStore();

  const groups = useMemo(() => {
    const map = new Map<string, typeof logs>();
    for (const l of logs) map.set(l.dateKey, [...(map.get(l.dateKey) ?? []), l]);
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
      .map(([key, items]) => ({
        key,
        items: items.sort((a, b) => b.createdAt - a.createdAt),
        total: items.reduce((a, l) => a + l.seconds, 0),
      }));
  }, [logs]);

  return (
    <Card>
      <CardTitle icon="clock" title="学習履歴" />
      {groups.length === 0 ? (
        <Empty title="まだ記録がありません" desc="最初の1回は5分だけでもOK。始めたことが一番の前進です。" />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
                <span>{formatShortDate(parseDateKey(g.key))}</span>
                <span className="tabular text-muted">合計 {formatSeconds(g.total)}</span>
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {g.items.map((l) => {
                  const s = subjects.find((x) => x.id === l.subjectId);
                  return (
                    <li key={l.id} className="flex items-center gap-3 bg-surface px-3 py-2.5">
                      <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s?.color ?? '#94a3b8' }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{s?.name ?? '（削除された科目）'}</p>
                        <p className="truncate text-xs text-muted">
                          {l.task || '内容なし'} ・ {formatTime(l.createdAt)}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-sm font-extrabold">{formatSeconds(l.seconds)}</span>
                      <button
                        type="button"
                        aria-label="この記録を削除"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-bad/10 hover:text-bad active:scale-90"
                        onClick={() => {
                          if (window.confirm(`${s?.name ?? ''} ${formatSeconds(l.seconds)} の記録を削除しますか？`)) {
                            deleteLog(l.id);
                            notify('記録を削除しました');
                          }
                        }}
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
