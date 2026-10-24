// ============================================================
// デモデータ：初めて触る人が「使っている状態」をすぐ体験できるように
// ============================================================

import type { AppData, ScoreRecord, StudyLog, Subject } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_STOPWATCH } from '@/lib/storage';
import { PRESETS, SUBJECT_COLORS } from '@/lib/presets';
import { addDays, dateKey, mulberry32 } from '@/lib/utils';

const TASKS = ['過去問演習', '単語帳', '問題集 標準', '復習ノート', '基礎問題', '計算ドリル', '音読', '解き直し'];

export function buildDemoData(now: Date = new Date()): AppData {
  const preset = PRESETS.find((p) => p.id === 'kyotsu-sci');
  if (!preset) throw new Error('demo preset not found');
  const rand = mulberry32(20261018);

  // 科目と「最終的な現在点」
  const finalScores: number[] = [];
  const subjects: Subject[] = preset.subjects.map((s, i) => {
    const ratio = 0.5 + rand() * 0.3;
    const current = Math.round(s.maxScore * ratio);
    finalScores.push(current);
    return {
      id: `demo_sub_${i}`,
      goalId: 'demo_goal',
      name: s.name,
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      maxScore: s.maxScore,
      targetScore: s.targetScore,
      currentScore: current,
    };
  });

  // 学習ログ：42日分。直近6日は必ず学習してストリークを見せる
  const logs: StudyLog[] = [];
  let n = 0;
  for (let ago = 42; ago >= 1; ago--) {
    if (ago > 6 && rand() < 0.16) continue;
    const date = addDays(now, -ago);
    const sessions = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < sessions; k++) {
      // 前半の科目ほど学習が多め（バランスの偏りを作る）
      const pick = Math.min(subjects.length - 1, Math.floor(Math.pow(rand(), 1.6) * subjects.length));
      const minutes = 20 + Math.floor(rand() * 11) * 6;
      logs.push({
        id: `demo_log_${n++}`,
        subjectId: subjects[pick].id,
        task: TASKS[Math.floor(rand() * TASKS.length)],
        seconds: minutes * 60,
        dateKey: dateKey(date),
        createdAt: date.getTime() + k * 3600000,
      });
    }
  }
  // 今日の分（少しだけ）
  logs.push({
    id: `demo_log_${n++}`,
    subjectId: subjects[1].id,
    task: '単語帳',
    seconds: 35 * 60,
    dateKey: dateKey(now),
    createdAt: now.getTime() - 3600000,
  });

  // 点数履歴：6科目に3回ずつ（右肩上がり）
  const scores: ScoreRecord[] = [];
  [0, 1, 3, 4, 5, 6].forEach((si, idx) => {
    const s = subjects[si];
    [35, 18, 5].forEach((ago, step) => {
      const delta = (2 - step) * Math.max(2, Math.round(s.maxScore * 0.04));
      scores.push({
        id: `demo_score_${idx}_${step}`,
        subjectId: s.id,
        label: step === 2 ? '直近の過去問' : step === 1 ? '模試' : '初回テスト',
        score: Math.max(0, finalScores[si] - delta),
        dateKey: dateKey(addDays(now, -ago)),
        createdAt: addDays(now, -ago).getTime(),
      });
    });
  });

  return {
    version: 1,
    goals: [
      {
        id: 'demo_goal',
        name: '共通テスト',
        emoji: '🎓',
        dateISO: preset.nextDate(now).toISOString(),
        createdAtISO: addDays(now, -42).toISOString(),
        presetId: preset.id,
      },
    ],
    activeGoalId: 'demo_goal',
    subjects,
    logs,
    scores,
    settings: { ...DEFAULT_SETTINGS, dailyTargetMinutes: 150 },
    stopwatch: { ...DEFAULT_STOPWATCH },
    doneBlocks: {},
  };
}
