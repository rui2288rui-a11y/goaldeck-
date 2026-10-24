'use client';

import { useMemo, useState } from 'react';
import { GapBar } from '@/components/charts/GapBar';
import { ScoreTrend } from '@/components/charts/ScoreTrend';
import { Badge, Button, Card, CardTitle, Empty, Field, Icon, NumberInput, Ring, inputCls } from '@/components/ui';
import type { Tone } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import { PRIORITY_LABEL, analyzeSubjects, overallScores } from '@/lib/analysis';
import type { Priority, SubjectAnalysis } from '@/types';
import { cn, formatMinutes, formatShortDate, parseDateKey } from '@/lib/utils';

const PRIORITY_TONE: Record<Priority, Tone> = { high: 'bad', mid: 'accent', low: 'brand', done: 'good' };

function SummaryCard() {
  const { subjects } = useStore();
  const o = overallScores(subjects);
  const done = o.gap === 0;
  return (
    <Card>
      <CardTitle icon="target" title="目標までのギャップ" />
      <div className="flex items-center gap-4">
        <Ring value={o.achievement} size={108} stroke={12} color={done ? 'rgb(var(--good))' : 'rgb(var(--brand))'}>
          <span className="tabular text-2xl font-extrabold leading-none">{Math.round(o.achievement * 100)}%</span>
          <span className="mt-1 text-[10px] font-bold text-muted">達成率</span>
        </Ring>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-extrabold">
            {done ? '全科目で目標点に到達！' : (
              <>
                合計あと <span className="tabular text-xl text-bad">{o.gap}</span> 点
              </>
            )}
          </p>
          <p className="tabular text-xs text-muted">
            現在 {o.current} ／ 目標 {o.target} ／ 満点 {o.max}
          </p>
          <p className="text-[11px] leading-relaxed text-muted">達成率は、各科目の「現在点 ÷ 目標点」（上限100%）の合計で計算しています。</p>
        </div>
      </div>
    </Card>
  );
}

function WeakList({ rows }: { rows: SubjectAnalysis[] }) {
  const top = rows.filter((r) => r.priority !== 'done').slice(0, 3);
  return (
    <Card>
      <CardTitle icon="alert" title="優先して伸ばす科目" />
      {top.length === 0 ? (
        <Empty title="弱点はありません" desc="すべての科目が目標点に届いています。維持のための演習を続けましょう。" />
      ) : (
        <ol className="space-y-2.5">
          {top.map((r, i) => (
            <li key={r.subject.id} className="flex items-start gap-3 rounded-2xl bg-surface2 p-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                style={{ background: r.subject.color }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-extrabold">
                  {r.subject.name}
                  <span className="tabular text-xs font-bold text-bad">あと {r.gapPoints}点（{Math.round(r.gapPercent)}%）</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{r.advice}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function SubjectCards({ rows }: { rows: SubjectAnalysis[] }) {
  const { updateSubject } = useStore();
  return (
    <Card>
      <CardTitle icon="chart" title="科目別の点数" />
      <ul className="space-y-3">
        {rows.map((r) => {
          const s = r.subject;
          return (
            <li key={s.id} className="rounded-2xl border border-line p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2 text-sm font-extrabold">
                  <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="truncate">{s.name}</span>
                </p>
                <Badge tone={PRIORITY_TONE[r.priority]}>{PRIORITY_LABEL[r.priority]}</Badge>
              </div>
              <div className="mt-3">
                <GapBar current={s.currentScore} target={s.targetScore} max={s.maxScore} color={s.color} />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-muted">
                <span className="tabular">0</span>
                <span className="tabular">
                  {r.gapPoints > 0 ? `不足 ${r.gapPoints}点` : '目標達成'}
                </span>
                <span className="tabular">{s.maxScore}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="現在の点数">
                  <NumberInput
                    value={s.currentScore}
                    min={0}
                    max={s.maxScore}
                    suffix="点"
                    ariaLabel={`${s.name}の現在の点数`}
                    onChange={(n) => updateSubject(s.id, { currentScore: n })}
                  />
                </Field>
                <Field label="目標点">
                  <NumberInput
                    value={s.targetScore}
                    min={0}
                    max={s.maxScore}
                    suffix="点"
                    ariaLabel={`${s.name}の目標点`}
                    onChange={(n) => updateSubject(s.id, { targetScore: n })}
                  />
                </Field>
              </div>
              <p className={cn('mt-3 flex items-start gap-1.5 text-xs leading-relaxed', r.underStudied ? 'font-bold text-accent' : 'text-muted')}>
                {r.underStudied && <Icon name="alert" className="mt-0.5 h-3.5 w-3.5" />}
                {r.advice}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function BalanceCard({ rows }: { rows: SubjectAnalysis[] }) {
  const active = rows.filter((r) => r.priority !== 'done');
  return (
    <Card>
      <CardTitle icon="timer" title="学習時間の配分チェック" />
      {active.length === 0 ? (
        <Empty title="配分を比べる対象がありません" desc="不足のある科目が出てくると、必要な配分と実際の学習時間を比較できます。" />
      ) : (
        <>
          <p className="mb-3 text-xs leading-relaxed text-muted">
            直近14日の学習時間の割合（濃い色）を、点数の不足から割り出した理想の配分（うすい色）と比べています。
          </p>
          <ul className="space-y-3.5">
            {active.map((r) => (
              <li key={r.subject.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <i className="h-2 w-2 rounded-full" style={{ background: r.subject.color }} />
                    {r.subject.name}
                  </span>
                  <span className="tabular text-muted">
                    理想 {Math.round(r.needShare * 100)}% ／ 実際 {Math.round(r.actualShare * 100)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full opacity-35" style={{ width: `${r.needShare * 100}%`, background: r.subject.color }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full" style={{ width: `${r.actualShare * 100}%`, background: r.subject.color }} />
                  </div>
                </div>
                {r.underStudied && (
                  <p className="mt-1 text-[11px] font-bold text-accent">不足気味 → 週 {formatMinutes(r.recommendedWeeklyMinutes)} を目安に</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function ScoreForm() {
  const { subjects, addScore, notify } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [label, setLabel] = useState('過去問');
  const [score, setScore] = useState<number | null>(null);

  const effectiveId = subjects.some((s) => s.id === subjectId) ? subjectId : (subjects[0]?.id ?? '');
  const subject = subjects.find((s) => s.id === effectiveId);
  const value = score ?? subject?.currentScore ?? 0;

  if (!subject) return null;

  return (
    <Card>
      <CardTitle icon="plus" title="点数を記録" />
      <p className="-mt-1 mb-3 text-xs leading-relaxed text-muted">
        過去問・模試・小テストの結果を残すと、推移がグラフになり、「現在の点数」も自動で更新されます。
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="科目">
          <select
            className={inputCls}
            value={effectiveId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setScore(null);
            }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`点数（満点 ${subject.maxScore}）`}>
          <NumberInput value={value} onChange={setScore} min={0} max={subject.maxScore} suffix="点" ariaLabel="点数" />
        </Field>
        <Field label="種類" className="col-span-2">
          <input className={inputCls} list="score-labels" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} />
          <datalist id="score-labels">
            {['過去問', '模試', '小テスト', '定期テスト', '演習'].map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
      </div>
      <Button
        className="mt-4 w-full"
        onClick={() => {
          addScore({ subjectId: effectiveId, label, score: value });
          notify(`${subject.name} ${Math.min(value, subject.maxScore)}点 を記録しました`);
          setScore(null);
        }}
      >
        <Icon name="check" />
        点数を記録する
      </Button>
    </Card>
  );
}

function ScoreHistory() {
  const { scores, subjects, deleteScore } = useStore();
  const rows = useMemo(
    () => [...scores].sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.createdAt - a.createdAt).slice(0, 10),
    [scores],
  );
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardTitle icon="clock" title="点数の履歴" />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {rows.map((x) => {
          const s = subjects.find((y) => y.id === x.subjectId);
          return (
            <li key={x.id} className="flex items-center gap-3 bg-surface px-3 py-2.5">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s?.color ?? '#94a3b8' }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s?.name ?? ''}</p>
                <p className="truncate text-xs text-muted">
                  {x.label} ・ {formatShortDate(parseDateKey(x.dateKey))}
                </p>
              </div>
              <span className="tabular shrink-0 text-sm font-extrabold">
                {x.score}
                <span className="text-xs text-muted"> / {s?.maxScore ?? ''}</span>
              </span>
              <button
                type="button"
                aria-label="この履歴を削除"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-bad/10 hover:text-bad active:scale-90"
                onClick={() => {
                  if (window.confirm('この点数の履歴を削除しますか？（現在の点数は変わりません）')) deleteScore(x.id);
                }}
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function AnalysisView() {
  const { goal, subjects, logs, scores, settings } = useStore();
  const { device, goTo } = useUI();
  const now = useNow(60_000);
  const rows = useMemo(() => analyzeSubjects(subjects, logs, scores, settings, now), [subjects, logs, scores, settings, now]);

  if (!goal || subjects.length === 0) {
    return (
      <Card>
        <Empty
          title="分析する科目がありません"
          desc="目標と科目を登録すると、目標点との差や弱点が自動で分析されます。"
          action={
            <Button variant="soft" onClick={() => goTo('goal')}>
              <Icon name="target" />
              目標を設定する
            </Button>
          }
        />
      </Card>
    );
  }

  const trend = (
    <Card>
      <CardTitle icon="chart" title="点数の推移" />
      <ScoreTrend />
    </Card>
  );

  if (device === 'desktop') {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-6">
          <SummaryCard />
          <SubjectCards rows={rows} />
        </div>
        <div className="col-span-5 space-y-6">
          <WeakList rows={rows} />
          <BalanceCard rows={rows} />
          <ScoreForm />
          {trend}
          <ScoreHistory />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryCard />
      <WeakList rows={rows} />
      <SubjectCards rows={rows} />
      <BalanceCard rows={rows} />
      <ScoreForm />
      {trend}
      <ScoreHistory />
    </div>
  );
}
