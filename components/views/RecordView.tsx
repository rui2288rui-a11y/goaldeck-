'use client';

import { Heatmap } from '@/components/charts/Heatmap';
import { SubjectDonut } from '@/components/charts/SubjectDonut';
import { LogList } from '@/components/LogList';
import { ManualLog } from '@/components/ManualLog';
import { Stopwatch } from '@/components/Stopwatch';
import { StudyChartCard } from '@/components/StudyChartCard';
import { Button, Card, CardTitle, Empty, Icon } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';

export function RecordView() {
  const { goal, subjects } = useStore();
  const { device, goTo } = useUI();

  if (!goal || subjects.length === 0) {
    return (
      <Card>
        <Empty
          title="科目を登録すると記録できます"
          desc="目標と科目を設定すると、ストップウォッチや学習グラフが使えるようになります。"
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

  const breakdown = (
    <Card>
      <CardTitle icon="flag" title="科目ごとの内訳" />
      <SubjectDonut days={30} />
    </Card>
  );
  const calendar = (
    <Card>
      <CardTitle icon="flame" title="学習カレンダー" />
      <Heatmap />
    </Card>
  );

  if (device === 'desktop') {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-6">
          <Stopwatch />
          <ManualLog />
        </div>
        <div className="col-span-7 space-y-6">
          <StudyChartCard defaultRange="14" />
          <div className="grid grid-cols-2 gap-6">
            {breakdown}
            {calendar}
          </div>
          <LogList />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Stopwatch />
      <StudyChartCard />
      {breakdown}
      {calendar}
      <ManualLog />
      <LogList />
    </div>
  );
}
