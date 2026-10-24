'use client';

import { useRef, useState } from 'react';
import { Badge, Button, Card, CardTitle, Field, Icon, NumberInput, Segmented, inputCls } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import { CATEGORY_LABELS, PRESETS } from '@/lib/presets';
import type { PresetCategory } from '@/lib/presets';
import { exportJSON } from '@/lib/storage';
import {
  addDays,
  calendarDaysBetween,
  cn,
  dateKey,
  formatJaDate,
  toInputDateTime,
  uid,
} from '@/lib/utils';

const EMOJIS = ['🎓', '📚', '🎯', '✍️', '🏥', '⚖️', '💻', '🗣️', '🧮', '🏫', '🏠', '🚀'];

// ------------------------------------------------------------
// 目標の一覧
// ------------------------------------------------------------
function GoalList() {
  const { data, goal, setActiveGoal, deleteGoal, notify } = useStore();
  if (data.goals.length === 0) return null;
  const now = new Date();
  return (
    <Card>
      <CardTitle icon="flag" title="目標の一覧" />
      <ul className="space-y-2">
        {data.goals.map((g) => {
          const active = g.id === goal?.id;
          const left = calendarDaysBetween(now, new Date(g.dateISO));
          return (
            <li
              key={g.id}
              className={cn('flex items-center gap-3 rounded-2xl border p-3 transition', active ? 'border-brand/60 bg-brand/5' : 'border-line')}
            >
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setActiveGoal(g.id)}>
                <span className="text-2xl">{g.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold">{g.name}</span>
                  <span className="tabular block text-xs text-muted">
                    {formatJaDate(new Date(g.dateISO))} ・ {left >= 0 ? `あと${left}日` : '終了'}
                  </span>
                </span>
                {active && <Badge tone="brand">表示中</Badge>}
              </button>
              <button
                type="button"
                aria-label={`${g.name}を削除`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-bad/10 hover:text-bad active:scale-90"
                onClick={() => {
                  if (window.confirm(`「${g.name}」を削除しますか？\nこの目標の科目・学習記録・点数もすべて消えます。`)) {
                    deleteGoal(g.id);
                    notify('目標を削除しました');
                  }
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

// ------------------------------------------------------------
// 選択中の目標の編集
// ------------------------------------------------------------
function ActiveGoalEditor() {
  const { goal, subjects, updateGoal, updateSubject, addSubject, deleteSubject } = useStore();
  if (!goal) return null;

  return (
    <Card>
      <CardTitle icon="edit" title="選択中の目標を編集" />
      <div className="space-y-3">
        <Field label="目標の名前">
          <input className={inputCls} value={goal.name} maxLength={40} onChange={(e) => updateGoal(goal.id, { name: e.target.value })} />
        </Field>
        <Field label="本番の日時" hint="試験の開始時刻まで正確にカウントダウンします">
          <input
            type="datetime-local"
            className={inputCls}
            value={toInputDateTime(new Date(goal.dateISO))}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!Number.isNaN(d.getTime())) updateGoal(goal.id, { dateISO: d.toISOString() });
            }}
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-bold text-muted">アイコン</span>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={goal.emoji === e}
                onClick={() => updateGoal(goal.id, { emoji: e })}
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl border text-xl transition active:scale-90',
                  goal.emoji === e ? 'border-brand bg-brand/10' : 'border-line bg-surface2',
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h3 className="mb-2 mt-6 text-xs font-extrabold text-muted">科目と配点</h3>
      <ul className="space-y-2.5">
        {subjects.map((s) => (
          <li key={s.id} className="rounded-2xl border border-line p-3">
            <div className="flex items-center gap-2">
              <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
              <input
                className={cn(inputCls, 'h-10')}
                value={s.name}
                maxLength={30}
                aria-label="科目名"
                onChange={(e) => updateSubject(s.id, { name: e.target.value })}
              />
              <button
                type="button"
                aria-label={`${s.name}を削除`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-bad/10 hover:text-bad active:scale-90"
                onClick={() => {
                  if (window.confirm(`「${s.name}」を削除しますか？\nこの科目の学習記録・点数も消えます。`)) deleteSubject(s.id);
                }}
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <Field label="満点">
                <NumberInput
                  value={s.maxScore}
                  min={1}
                  max={9999}
                  suffix="点"
                  ariaLabel={`${s.name}の満点`}
                  onChange={(n) =>
                    updateSubject(s.id, {
                      maxScore: n,
                      targetScore: Math.min(s.targetScore, n),
                      currentScore: Math.min(s.currentScore, n),
                    })
                  }
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
          </li>
        ))}
      </ul>
      <Button
        variant="soft"
        className="mt-3 w-full"
        onClick={() => addSubject(goal.id, { name: `科目${subjects.length + 1}`, maxScore: 100, targetScore: 80 })}
      >
        <Icon name="plus" />
        科目を追加
      </Button>
    </Card>
  );
}

// ------------------------------------------------------------
// 新しい目標をつくる（プリセット対応）
// ------------------------------------------------------------
interface DraftSubject {
  key: string;
  name: string;
  maxScore: number;
  targetScore: number;
}

const newDraftSubject = (): DraftSubject => ({ key: uid('d'), name: '', maxScore: 100, targetScore: 80 });

function defaultDate(): string {
  const d = addDays(new Date(), 60);
  d.setHours(9, 0, 0, 0);
  return toInputDateTime(d);
}

function NewGoalForm() {
  const { createGoal, notify, goal } = useStore();
  const { goTo } = useUI();
  const [category, setCategory] = useState<PresetCategory>('university');
  const [presetId, setPresetId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [date, setDate] = useState<string>(defaultDate);
  const [subs, setSubs] = useState<DraftSubject[]>(() => [newDraftSubject()]);

  const preset = PRESETS.find((p) => p.id === presetId);
  const list = PRESETS.filter((p) => p.category === category);

  const pick = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(p.id);
    setName(p.name);
    setEmoji(p.emoji);
    setDate(toInputDateTime(p.nextDate(new Date())));
    setSubs(p.subjects.map((s) => ({ key: uid('d'), ...s })));
  };

  const patchSub = (key: string, patch: Partial<DraftSubject>) =>
    setSubs((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const submit = () => {
    const when = new Date(date);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      notify('本番の日時は、今より未来の日付にしてください');
      return;
    }
    if (subs.length === 0) {
      notify('科目を1つ以上追加してください');
      return;
    }
    createGoal({
      name: name || '新しい目標',
      emoji,
      dateISO: when.toISOString(),
      presetId,
      subjects: subs.map((s) => ({ name: s.name, maxScore: s.maxScore, targetScore: Math.min(s.targetScore, s.maxScore) })),
    });
    notify('目標を作成しました。「分析」で現在の点数を入力しましょう');
    setPresetId(undefined);
    setName('');
    setSubs([newDraftSubject()]);
    goTo(goal ? 'home' : 'analysis');
  };

  return (
    <Card>
      <CardTitle icon="plus" title="新しい目標をつくる" />

      <Segmented<PresetCategory>
        className="w-full"
        value={category}
        onChange={setCategory}
        options={(Object.keys(CATEGORY_LABELS) as PresetCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
      />
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={presetId === p.id}
            onClick={() => pick(p.id)}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98]',
              presetId === p.id ? 'border-brand bg-brand/5' : 'border-line bg-surface hover:border-brand/40',
            )}
          >
            <span className="text-2xl leading-none">{p.emoji}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-extrabold leading-snug">{p.name}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted">{p.summary}</span>
            </span>
          </button>
        ))}
      </div>
      {preset?.note && (
        <p className="mt-3 flex gap-2 rounded-xl bg-accent/10 p-3 text-[11px] font-semibold leading-relaxed text-accent">
          <Icon name="alert" className="mt-0.5 h-3.5 w-3.5" />
          {preset.note}
        </p>
      )}

      <div className="mt-5 space-y-3">
        <div className="grid grid-cols-[auto_1fr] items-end gap-3">
          <Field label="アイコン">
            <select className={cn(inputCls, 'w-[72px] text-center text-xl')} value={emoji} onChange={(e) => setEmoji(e.target.value)}>
              {EMOJIS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>
          <Field label="目標の名前">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 共通テスト" maxLength={40} />
          </Field>
        </div>
        <Field label="本番の日時">
          <input type="datetime-local" className={inputCls} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
      </div>

      <h3 className="mb-2 mt-5 text-xs font-extrabold text-muted">科目と配点</h3>
      <ul className="space-y-2.5">
        {subs.map((s) => (
          <li key={s.key} className="rounded-2xl border border-line p-3">
            <div className="flex items-center gap-2">
              <input
                className={cn(inputCls, 'h-10')}
                value={s.name}
                maxLength={30}
                placeholder="科目名（例: 数学）"
                aria-label="科目名"
                onChange={(e) => patchSub(s.key, { name: e.target.value })}
              />
              <button
                type="button"
                aria-label="この科目を外す"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-bad/10 hover:text-bad active:scale-90"
                onClick={() => setSubs((cur) => cur.filter((x) => x.key !== s.key))}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <Field label="満点">
                <NumberInput value={s.maxScore} min={1} max={9999} suffix="点" onChange={(n) => patchSub(s.key, { maxScore: n })} />
              </Field>
              <Field label="目標点">
                <NumberInput value={s.targetScore} min={0} max={s.maxScore} suffix="点" onChange={(n) => patchSub(s.key, { targetScore: n })} />
              </Field>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="soft" className="mt-3 w-full" onClick={() => setSubs((cur) => [...cur, newDraftSubject()])}>
        <Icon name="plus" />
        科目を追加
      </Button>

      <Button size="lg" className="mt-5 w-full" onClick={submit}>
        <Icon name="sparkles" />
        この内容で目標を作成
      </Button>
    </Card>
  );
}

// ------------------------------------------------------------
// 計画の設定
// ------------------------------------------------------------
function SettingsCard() {
  const { data, updateSettings } = useStore();
  const s = data.settings;
  return (
    <Card>
      <CardTitle icon="timer" title="計画の設定" />
      <p className="-mt-1 mb-4 text-xs leading-relaxed text-muted">
        「今日やること」は、ここでの設定をもとに逆算されます。自分のペースに合わせて調整してください。
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="毎日の目標時間" hint="これを下回る日が続くと、遅れとして上乗せ">
          <NumberInput value={s.dailyTargetMinutes} min={10} max={1440} suffix="分" onChange={(n) => updateSettings({ dailyTargetMinutes: n })} />
        </Field>
        <Field label="1日の上限" hint="これ以上は計画に入れません">
          <NumberInput value={s.maxDailyMinutes} min={30} max={1440} suffix="分" onChange={(n) => updateSettings({ maxDailyMinutes: n })} />
        </Field>
        <Field label="1%伸ばす所要時間" hint="満点の1%を上げるのに必要な時間の目安">
          <NumberInput value={s.minutesPerPercent} min={1} max={600} suffix="分" onChange={(n) => updateSettings({ minutesPerPercent: n })} />
        </Field>
        <Field label="学習の開始時刻" hint="今日のスケジュールの先頭">
          <input
            type="time"
            className={inputCls}
            value={s.startTime}
            onChange={(e) => e.target.value && updateSettings({ startTime: e.target.value })}
          />
        </Field>
        <Field label="1ブロックの長さ">
          <NumberInput value={s.blockMinutes} min={10} max={180} suffix="分" onChange={(n) => updateSettings({ blockMinutes: n })} />
        </Field>
        <Field label="休憩">
          <NumberInput value={s.breakMinutes} min={0} max={60} suffix="分" onChange={(n) => updateSettings({ breakMinutes: n })} />
        </Field>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// データの管理
// ------------------------------------------------------------
function DataCard() {
  const { data, loadDemo, importJSON, resetAll, notify } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const hasData = data.goals.length > 0;

  const download = () => {
    const blob = new Blob([exportJSON(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goaldeck-backup-${dateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('バックアップを書き出しました');
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (hasData && !window.confirm('現在のデータを、読み込むファイルの内容で置き換えます。よろしいですか？')) return;
      const res = importJSON(String(reader.result ?? ''));
      if (!res.ok) notify(res.error ?? '読み込みに失敗しました');
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Card>
      <CardTitle icon="download" title="データの管理" />
      <p className="-mt-1 mb-4 text-xs leading-relaxed text-muted">
        データはこの端末のブラウザにだけ保存されます（サーバーには送信されません）。機種変更の前や定期的に、バックアップを書き出しておくと安心です。
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={download} disabled={!hasData}>
          <Icon name="download" />
          書き出す
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" />
          読み込む
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button
        variant="soft"
        className="mt-2 w-full"
        onClick={() => {
          if (!hasData || window.confirm('現在のデータをデモデータで置き換えます。よろしいですか？')) loadDemo();
        }}
      >
        <Icon name="sparkles" />
        デモデータを読み込む
      </Button>
      <Button
        variant="danger"
        className="mt-2 w-full"
        disabled={!hasData}
        onClick={() => {
          if (window.confirm('すべてのデータを削除します。この操作は元に戻せません。よろしいですか？')) resetAll();
        }}
      >
        <Icon name="trash" />
        すべてのデータを削除
      </Button>
    </Card>
  );
}

export function GoalView() {
  const { device } = useUI();

  if (device === 'desktop') {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6 space-y-6">
          <GoalList />
          <ActiveGoalEditor />
          <SettingsCard />
          <DataCard />
        </div>
        <div className="col-span-6">
          <NewGoalForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoalList />
      <ActiveGoalEditor />
      <NewGoalForm />
      <SettingsCard />
      <DataCard />
    </div>
  );
}
