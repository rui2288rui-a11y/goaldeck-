'use client';

import { useState } from 'react';
import { StudyBarChart } from '@/components/charts/StudyBarChart';
import { Card, CardTitle, Segmented } from '@/components/ui';

type Range = '7' | '14' | '30';

/** 毎日の学習時間グラフ（科目別の積み上げ）。7/14/30日を切り替え */
export function StudyChartCard({ defaultRange = '7' }: { defaultRange?: Range }) {
  const [range, setRange] = useState<Range>(defaultRange);
  return (
    <Card>
      <CardTitle
        icon="chart"
        title="毎日の学習時間"
        right={
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '7', label: '7日' },
              { value: '14', label: '14日' },
              { value: '30', label: '30日' },
            ]}
          />
        }
      />
      <StudyBarChart days={Number(range)} />
    </Card>
  );
}
