// ============================================================
// データの初期値・読み込み時の補正・エクスポート
// ============================================================

import type { AppData, Goal, ScoreRecord, Settings, StopwatchState, StudyLog, Subject } from '@/types';

export const STORAGE_KEY = 'goaldeck:data:v1';

export const DEFAULT_SETTINGS: Settings = {
  dailyTargetMinutes: 120,
  maxDailyMinutes: 480,
  minutesPerPercent: 60,
  startTime: '19:00',
  blockMinutes: 45,
  breakMinutes: 10,
};

export const DEFAULT_STOPWATCH: StopwatchState = {
  running: false,
  startedAt: null,
  accumulatedMs: 0,
  subjectId: null,
  task: '',
};

export function emptyData(): AppData {
  return {
    version: 1,
    goals: [],
    activeGoalId: null,
    subjects: [],
    logs: [],
    scores: [],
    settings: { ...DEFAULT_SETTINGS },
    stopwatch: { ...DEFAULT_STOPWATCH },
    doneBlocks: {},
  };
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** localStorage やインポートしたJSONを安全な形に整える */
export function sanitize(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppData>;
  return {
    version: 1,
    goals: arr<Goal>(r.goals).filter((g) => g && typeof g.id === 'string' && typeof g.dateISO === 'string'),
    activeGoalId: typeof r.activeGoalId === 'string' ? r.activeGoalId : null,
    subjects: arr<Subject>(r.subjects).filter((s) => s && typeof s.id === 'string'),
    logs: arr<StudyLog>(r.logs).filter((l) => l && typeof l.id === 'string' && typeof l.seconds === 'number'),
    scores: arr<ScoreRecord>(r.scores).filter((x) => x && typeof x.id === 'string'),
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
    stopwatch: { ...DEFAULT_STOPWATCH, ...(r.stopwatch ?? {}) },
    doneBlocks: r.doneBlocks && typeof r.doneBlocks === 'object' ? (r.doneBlocks as Record<string, string[]>) : {},
  };
}

export function exportJSON(data: AppData): string {
  return JSON.stringify({ app: 'goaldeck', exportedAt: new Date().toISOString(), ...data }, null, 2);
}
