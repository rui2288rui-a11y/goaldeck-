// ============================================================
// GoalDeck 共通の型定義
// ============================================================

/** 目標（試験・締切など） */
export interface Goal {
  id: string;
  name: string;
  emoji: string;
  /** 本番日時（ISO 8601） */
  dateISO: string;
  /** 目標を作成した日時（ISO 8601）。カウントダウンの経過率に使用 */
  createdAtISO: string;
  presetId?: string;
}

/** 科目・分野。点数管理の単位 */
export interface Subject {
  id: string;
  /** 所属する目標 */
  goalId: string;
  name: string;
  color: string;
  /** 満点 */
  maxScore: number;
  /** 目標点 */
  targetScore: number;
  /** 現在の実力（直近の点数） */
  currentScore: number;
}

/** 学習記録（1セッション） */
export interface StudyLog {
  id: string;
  subjectId: string;
  task: string;
  seconds: number;
  /** ローカル日付 YYYY-MM-DD */
  dateKey: string;
  createdAt: number;
}

/** 点数の履歴（過去問・模試・小テストなど） */
export interface ScoreRecord {
  id: string;
  subjectId: string;
  label: string;
  score: number;
  dateKey: string;
  createdAt: number;
}

/** 計画ロジックの設定 */
export interface Settings {
  /** 最低でもやりたい 1日の学習時間（分）。遅れの判定にも使う */
  dailyTargetMinutes: number;
  /** 1日の学習時間の上限（分） */
  maxDailyMinutes: number;
  /** 満点の1%分 点数を上げるのに必要な学習時間（分）。逆算計画の係数 */
  minutesPerPercent: number;
  /** 今日の計画の開始時刻 HH:MM */
  startTime: string;
  /** 1ブロックの学習時間（分） */
  blockMinutes: number;
  /** ブロック間の休憩（分） */
  breakMinutes: number;
}

/** ストップウォッチ（リロードしても継続できるようタイムスタンプで保持） */
export interface StopwatchState {
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
  subjectId: string | null;
  task: string;
}

export interface AppData {
  version: 1;
  goals: Goal[];
  activeGoalId: string | null;
  subjects: Subject[];
  logs: StudyLog[];
  scores: ScoreRecord[];
  settings: Settings;
  stopwatch: StopwatchState;
  /** 日付ごとの「完了にした計画ブロックID」 */
  doneBlocks: Record<string, string[]>;
}

export type TabId = 'home' | 'record' | 'analysis' | 'goal';
export type DeviceMode = 'mobile' | 'desktop';
export type ThemeMode = 'light' | 'dark';

// ------------------------------------------------------------
// 自動計画
// ------------------------------------------------------------

export type Phase = 'foundation' | 'practice' | 'exam' | 'final' | 'maintenance';

export type PlanStatus = 'nodata' | 'expired' | 'achieved' | 'ok' | 'tight' | 'over';

export interface PlanAllocation {
  subjectId: string;
  name: string;
  color: string;
  minutes: number;
  gapPoints: number;
  gapPercent: number;
  reason: string;
}

export interface PlanBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  color: string;
  minutes: number;
  title: string;
  /** エポックミリ秒 */
  start: number;
  end: number;
}

export interface TodayPlan {
  status: PlanStatus;
  headline: string;
  detail: string;
  /** 本番までの残り日数（今日を含む学習可能日数、最小1） */
  daysLeft: number;
  phase: Phase;
  phaseLabel: string;
  totalGapPoints: number;
  totalGapPercent: number;
  /** 目標点までに必要な総学習時間（分） */
  requiredMinutes: number;
  /** 残り日数で割った 1日あたりの必要時間（分） */
  needPerDay: number;
  /** 直近の目標ペースに対する不足分（分） */
  lagMinutes: number;
  /** 遅れを取り戻すために今日上乗せする分（分） */
  catchUpMinutes: number;
  /** 今日の学習目標（分） */
  targetMinutes: number;
  studiedTodayMinutes: number;
  remainingMinutes: number;
  allocations: PlanAllocation[];
  /** 今日は時間が足りず見送った科目名 */
  skipped: string[];
  blocks: PlanBlock[];
}

// ------------------------------------------------------------
// 分析
// ------------------------------------------------------------

export type Priority = 'high' | 'mid' | 'low' | 'done';

export interface SubjectAnalysis {
  subject: Subject;
  gapPoints: number;
  gapPercent: number;
  priority: Priority;
  /** 不足率に応じて「本来配分すべき」学習時間の割合 0..1 */
  needShare: number;
  /** 直近14日の実際の学習時間の割合 0..1 */
  actualShare: number;
  underStudied: boolean;
  /** 週あたりの学習時間の目安（分） */
  recommendedWeeklyMinutes: number;
  /** 点数が未入力（現在0点で履歴もない）の可能性 */
  needsInput: boolean;
  advice: string;
}
