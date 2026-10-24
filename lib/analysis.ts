// ============================================================
// 点数・課題分析：目標点とのギャップ、弱点ランキング、学習時間の配分チェック
// ============================================================

import type { Priority, ScoreRecord, Settings, StudyLog, Subject, SubjectAnalysis } from '@/types';
import { addDays, dateKey, startOfDay } from '@/lib/utils';

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: '最優先',
  mid: '要強化',
  low: 'あと少し',
  done: '達成',
};

export function priorityOf(gapPercent: number): Priority {
  if (gapPercent <= 0) return 'done';
  if (gapPercent >= 25) return 'high';
  if (gapPercent >= 10) return 'mid';
  return 'low';
}

export function analyzeSubjects(
  subjects: Subject[],
  logs: StudyLog[],
  scores: ScoreRecord[],
  settings: Settings,
  now: Date,
): SubjectAnalysis[] {
  const rows = subjects.map((s) => {
    const gapPoints = Math.max(0, s.targetScore - s.currentScore);
    const gapPercent = s.maxScore > 0 ? (gapPoints / s.maxScore) * 100 : 0;
    return { s, gapPoints, gapPercent };
  });
  const totalGapPercent = rows.reduce((a, r) => a + r.gapPercent, 0);

  const from = dateKey(addDays(startOfDay(now), -13));
  const recent = logs.filter((l) => l.dateKey >= from);
  const recentTotal = recent.reduce((a, l) => a + l.seconds, 0);
  const weeklyBudget = settings.dailyTargetMinutes * 7;

  const out: SubjectAnalysis[] = rows.map((r) => {
    const needShare = totalGapPercent > 0 ? r.gapPercent / totalGapPercent : 0;
    const subjectSeconds = recent.filter((l) => l.subjectId === r.s.id).reduce((a, l) => a + l.seconds, 0);
    const actualShare = recentTotal > 0 ? subjectSeconds / recentTotal : 0;
    const priority = priorityOf(r.gapPercent);
    const underStudied = priority !== 'done' && recentTotal > 0 && actualShare < needShare * 0.7;
    const needsInput = r.s.currentScore === 0 && !scores.some((x) => x.subjectId === r.s.id);
    const weekly = Math.round((needShare * weeklyBudget) / 5) * 5;

    let advice: string;
    if (needsInput) advice = '現在の点数が未入力です。直近の点数を入れると、分析と計画が正確になります。';
    else if (priority === 'done') advice = '目標達成。維持のための軽い演習で十分です。';
    else if (priority === 'high' && underStudied) advice = '最優先なのに学習時間が不足気味。今日から配分を増やしましょう。';
    else if (priority === 'high') advice = '不足が最も大きい科目。基礎〜標準問題で確実に得点源へ。';
    else if (underStudied) advice = `配分に対して学習が足りていません。週 ${weekly}分 を目安に。`;
    else if (priority === 'mid') advice = '着実に伸ばせる位置。演習量を保ちましょう。';
    else advice = 'あと少し。ケアレスミスの見直しで届く範囲です。';

    return {
      subject: r.s,
      gapPoints: Math.round(r.gapPoints * 10) / 10,
      gapPercent: Math.round(r.gapPercent * 10) / 10,
      priority,
      needShare,
      actualShare,
      underStudied,
      recommendedWeeklyMinutes: weekly,
      needsInput,
      advice,
    };
  });

  return out.sort((a, b) => b.gapPercent - a.gapPercent || b.gapPoints - a.gapPoints);
}

export interface Overall {
  current: number;
  target: number;
  max: number;
  gap: number;
  /** 目標に対する達成率 0..1（科目ごとに上限1で合算） */
  achievement: number;
}

export function overallScores(subjects: Subject[]): Overall {
  const current = subjects.reduce((a, s) => a + s.currentScore, 0);
  const target = subjects.reduce((a, s) => a + s.targetScore, 0);
  const max = subjects.reduce((a, s) => a + s.maxScore, 0);
  const gap = subjects.reduce((a, s) => a + Math.max(0, s.targetScore - s.currentScore), 0);
  const capped = subjects.reduce((a, s) => a + Math.min(s.currentScore, s.targetScore), 0);
  return { current, target, max, gap, achievement: target > 0 ? capped / target : 0 };
}
