'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { Button, Card, CardTitle, Field, Icon, NumberInput, inputCls } from '@/components/ui';
import { dateKey, formatSeconds } from '@/lib/utils';

/** ストップウォッチを使わなかった勉強も、あとから追加できます */
export function ManualLog() {
  const { subjects, addLog, notify } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [task, setTask] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [date, setDate] = useState(() => dateKey(new Date()));

  const effectiveId = subjects.some((s) => s.id === subjectId) ? subjectId : (subjects[0]?.id ?? '');
  const today = dateKey(new Date());

  if (subjects.length === 0) return null;

  const submit = () => {
    if (!effectiveId || minutes < 1) return;
    addLog({ subjectId: effectiveId, task, seconds: minutes * 60, dateKey: date > today ? today : date });
    const name = subjects.find((s) => s.id === effectiveId)?.name ?? '';
    notify(`${name} ${formatSeconds(minutes * 60)} を追加しました`);
    setTask('');
  };

  return (
    <Card>
      <CardTitle icon="plus" title="手動で記録を追加" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="科目">
          <select className={inputCls} value={effectiveId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="日付">
          <input type="date" className={inputCls} value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <Field label="内容（任意）" className="col-span-2">
          <input className={inputCls} value={task} onChange={(e) => setTask(e.target.value)} placeholder="例: 単語帳 Part2" maxLength={60} />
        </Field>
        <Field label="学習時間">
          <NumberInput value={minutes} onChange={setMinutes} min={1} max={1440} suffix="分" ariaLabel="学習時間（分）" />
        </Field>
        <div className="flex items-end gap-1.5">
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              className="h-11 flex-1 rounded-xl bg-surface2 text-xs font-bold text-muted transition hover:text-ink active:scale-95"
            >
              {m}分
            </button>
          ))}
        </div>
      </div>
      <Button className="mt-4 w-full" onClick={submit} disabled={minutes < 1}>
        <Icon name="plus" />
        記録に追加
      </Button>
    </Card>
  );
}
