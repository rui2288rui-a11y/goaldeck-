'use client';

import { useId, useMemo } from 'react';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { Button, Card, CardTitle, Icon, inputCls } from '@/components/ui';
import { cn, formatClock } from '@/lib/utils';

/** 科目とタスクを選んで計測。リロードしても、別タブを開いても続きから計測できます。 */
export function Stopwatch() {
  const { subjects, logs, data, swSelect, swStart, swPause, swReset, swFinish } = useStore();
  const sw = data.stopwatch;
  const now = useNow(sw.running ? 200 : 60_000);
  const listId = useId();

  const selectedId = subjects.some((s) => s.id === sw.subjectId) ? sw.subjectId : (subjects[0]?.id ?? null);
  const selected = subjects.find((s) => s.id === selectedId);

  const elapsed = sw.accumulatedMs + (sw.running && sw.startedAt !== null ? Math.max(0, now.getTime() - sw.startedAt) : 0);
  const started = elapsed > 0 || sw.running;

  // 同じ科目で最近やったタスク名を候補に出す
  const suggestions = useMemo(() => {
    if (!selectedId) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    const sorted = logs.filter((l) => l.subjectId === selectedId && l.task).sort((a, b) => b.createdAt - a.createdAt);
    for (const l of sorted) {
      if (!seen.has(l.task)) {
        seen.add(l.task);
        out.push(l.task);
      }
      if (out.length >= 8) break;
    }
    return out;
  }, [logs, selectedId]);

  if (subjects.length === 0) {
    return (
      <Card>
        <CardTitle icon="timer" title="ストップウォッチ" />
        <p className="text-sm text-muted">先に「目標」タブで科目を登録すると、勉強時間を計測できます。</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle
        icon="timer"
        title="ストップウォッチ"
        right={
          sw.running ? (
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-good">
              <i className="h-2 w-2 animate-breathe rounded-full bg-good" />
              計測中
            </span>
          ) : started ? (
            <span className="text-xs font-extrabold text-accent">一時停止中</span>
          ) : null
        }
      />

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="科目">
        {subjects.map((s) => {
          const on = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => swSelect(s.id, sw.task)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition active:scale-95',
                on ? 'border-transparent text-white shadow' : 'border-line bg-surface2 text-muted hover:text-ink',
              )}
              style={on ? { background: s.color } : undefined}
            >
              {!on && <i className="h-2 w-2 rounded-full" style={{ background: s.color }} />}
              {s.name}
            </button>
          );
        })}
      </div>

      <input
        className={cn(inputCls, 'mt-3')}
        list={listId}
        value={sw.task}
        onChange={(e) => swSelect(selectedId, e.target.value)}
        placeholder="何をやる？（例: 過去問2023 大問3）"
        maxLength={60}
        aria-label="タスク名"
      />
      <datalist id={listId}>
        {suggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div
        className="tabular my-5 select-none text-center text-[3.4rem] font-extrabold leading-none tracking-tight"
        style={{ color: sw.running ? undefined : started ? 'rgb(var(--accent))' : undefined }}
        role="timer"
        aria-live="off"
      >
        {formatClock(elapsed)}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button size="lg" onClick={() => (sw.running ? swPause() : swStart())} aria-label={sw.running ? '一時停止' : '開始'}>
          <Icon name={sw.running ? 'pause' : 'play'} />
          {sw.running ? '一時停止' : started ? '再開' : 'スタート'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={!started}
          aria-label="リセット"
          onClick={() => {
            if (elapsed < 60_000 || window.confirm('計測中の時間を破棄してリセットしますか？')) swReset();
          }}
        >
          <Icon name="refresh" />
        </Button>
      </div>

      <Button variant="soft" className="mt-2 w-full" disabled={!started} onClick={swFinish}>
        <Icon name="check" />
        {selected ? `${selected.name} として記録して終了` : '記録して終了'}
      </Button>
    </Card>
  );
}
