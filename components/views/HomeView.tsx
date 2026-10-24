'use client';

import { CountdownCard } from '@/components/CountdownCard';
import { StatsRow } from '@/components/StatsRow';
import { StudyChartCard } from '@/components/StudyChartCard';
import { Stopwatch } from '@/components/Stopwatch';
import { TodayPlanCard } from '@/components/TodayPlanCard';
import { Button, Icon } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import { PRESETS } from '@/lib/presets';

const QUICK_START_IDS = ['kyotsu-sci', 'kyotsu-arts', 'nijishiken', 'takken', 'boki3', 'toeic'];

/** 目標が1つもないときの最初の画面 */
function Welcome() {
  const { createGoal, loadDemo, notify } = useStore();
  const { goTo } = useUI();
  const quick = QUICK_START_IDS.map((id) => PRESETS.find((p) => p.id === id)).filter(
    (p): p is (typeof PRESETS)[number] => Boolean(p),
  );

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-glow">
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <p className="relative text-xs font-bold tracking-widest text-white/80">GOALDECK</p>
        <h1 className="relative mt-2 text-2xl font-extrabold leading-snug">
          目標までの毎日を、
          <br />
          迷わず進める。
        </h1>
        <p className="relative mt-3 text-[13px] leading-relaxed text-white/85">
          試験日までのカウントダウン、勉強時間の記録、弱点の分析、そして「今日やること」の自動提案まで。ひとつのアプリで完結します。
        </p>
        <div className="relative mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            className="!border-transparent !bg-white !text-indigo-700"
            onClick={() => goTo('goal')}
          >
            <Icon name="target" />
            目標をつくる
          </Button>
          <Button size="lg" className="!bg-white/20 !shadow-none backdrop-blur hover:!bg-white/30" onClick={loadDemo}>
            <Icon name="sparkles" />
            デモデータで試す
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-4 shadow-card">
        <h2 className="text-[15px] font-extrabold">ワンタップで始める</h2>
        <p className="mt-1 text-xs text-muted">プリセットを選ぶと、試験日と科目が自動で入ります（あとから編集できます）。</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {quick.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface2 px-3 py-3 text-left transition hover:border-brand/50 active:scale-[0.97]"
              onClick={() => {
                createGoal({
                  name: p.name,
                  emoji: p.emoji,
                  dateISO: p.nextDate(new Date()).toISOString(),
                  presetId: p.id,
                  subjects: p.subjects,
                });
                notify('目標を作成しました。「分析」で現在の点数を入力しましょう');
                goTo('analysis');
              }}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-[13px] font-bold leading-tight">{p.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function HomeView() {
  const { goal, subjects, scores } = useStore();
  const { device, goTo } = useUI();

  if (!goal) return <Welcome />;

  const needsInput = subjects.some((s) => s.currentScore === 0 && !scores.some((x) => x.subjectId === s.id));
  const banner = needsInput ? (
    <button
      type="button"
      onClick={() => goTo('analysis')}
      className="flex w-full items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3.5 text-left transition active:scale-[0.98]"
    >
      <Icon name="alert" className="text-accent" />
      <span className="flex-1 text-[13px] font-bold leading-snug">
        現在の点数を入力すると、計画の精度が上がります
        <span className="mt-0.5 block text-[11px] font-semibold text-muted">「分析」タブで科目ごとに入力できます</span>
      </span>
      <Icon name="chevron" className="text-muted" />
    </button>
  ) : null;

  if (device === 'desktop') {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-6">
          <CountdownCard />
          {banner}
          <TodayPlanCard />
        </div>
        <div className="col-span-5 space-y-6">
          <StatsRow />
          <Stopwatch />
          <StudyChartCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CountdownCard />
      {banner}
      <StatsRow />
      <TodayPlanCard />
      <StudyChartCard />
    </div>
  );
}
