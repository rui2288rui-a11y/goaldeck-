// ============================================================
// 自動計画エンジン
//   残り日数・点数のギャップ・直近の遅れ・科目ごとの学習バランスから
//   「今日何を、何分、どの順番でやるか」を逆算します。
// ============================================================

import type {
  Goal,
  Phase,
  PlanAllocation,
  PlanBlock,
  PlanStatus,
  Settings,
  StudyLog,
  Subject,
  TodayPlan,
} from '@/types';
import { addDays, calendarDaysBetween, clamp, dateKey, formatMinutes, roundTo, startOfDay } from '@/lib/utils';

export const PHASE_LABEL: Record<Phase, string> = {
  foundation: '基礎固め期',
  practice: '演習期',
  exam: '過去問・実戦期',
  final: '総仕上げ期',
  maintenance: '維持・仕上げ',
};

const TASK_IDEAS: Record<Phase, string[]> = {
  foundation: [
    '教科書・参考書で基礎を総復習',
    '基本問題を解いて理解を固める',
    '用語・公式・単語を暗記して確認テスト',
    '苦手な単元を1つ選んで集中的につぶす',
    '解説を読み、自分の言葉で要点をまとめる',
  ],
  practice: [
    '標準レベルの問題集を時間を計って解く',
    '間違えた問題を解き直してノートにまとめる',
    '頻出分野を演習して弱点を特定する',
    '暗記項目を高速チェック（見て即答）',
    '分野別の演習セットを1つ仕上げる',
  ],
  exam: [
    '過去問を本番形式で1回分解く',
    '過去問の復習：間違いの原因を言葉にする',
    '制限時間で解き切る時間配分の練習',
    'ミスノートを見直して頻出ミスを潰す',
    '模試形式の問題で得点力を上げる',
  ],
  final: [
    '弱点ノートを総復習',
    '過去問で間違えた問題だけを再演習',
    '暗記事項の最終確認',
    '本番想定で通し演習（時間厳守）',
    '軽めの復習で本番モードに整える',
  ],
  maintenance: [
    '得点をキープするための軽い演習',
    'ミスしやすい問題を見直す',
    '応用問題・先取りに挑戦',
  ],
};

export interface PlanInput {
  goal: Goal | null;
  subjects: Subject[];
  logs: StudyLog[];
  settings: Settings;
  now: Date;
}

function emptyPlan(studiedTodayMinutes: number): TodayPlan {
  return {
    status: 'nodata',
    headline: '',
    detail: '',
    daysLeft: 0,
    phase: 'foundation',
    phaseLabel: PHASE_LABEL.foundation,
    totalGapPoints: 0,
    totalGapPercent: 0,
    requiredMinutes: 0,
    needPerDay: 0,
    lagMinutes: 0,
    catchUpMinutes: 0,
    targetMinutes: 0,
    studiedTodayMinutes,
    remainingMinutes: 0,
    allocations: [],
    skipped: [],
    blocks: [],
  };
}

function pickPhase(daysLeft: number, totalGapPercent: number, spanDays: number): Phase {
  if (totalGapPercent <= 0) return 'maintenance';
  if (daysLeft <= 7) return 'final';
  if (daysLeft <= 30) return 'exam';
  const span = Math.max(spanDays, daysLeft);
  return daysLeft > 60 && daysLeft / span > 0.6 ? 'foundation' : 'practice';
}

/** total 分を、約 block 分ずつのブロックに5分刻みで均等分割 */
export function splitMinutes(total: number, block: number): number[] {
  const n = Math.max(1, Math.round(total / Math.max(5, block)));
  const base = Math.max(5, Math.floor(total / n / 5) * 5);
  const arr: number[] = new Array(n).fill(base);
  let rest = total - base * n;
  let i = 0;
  while (rest >= 5 && i < n * 12) {
    arr[i % n] += 5;
    rest -= 5;
    i += 1;
  }
  return arr;
}

function dayOfYear(d: Date): number {
  return Math.floor((startOfDay(d).getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function buildTodayPlan(input: PlanInput): TodayPlan {
  const { goal, subjects, logs, settings, now } = input;
  const todayKey = dateKey(now);
  const studiedTodayMinutes = Math.round(
    logs.filter((l) => l.dateKey === todayKey).reduce((a, l) => a + l.seconds, 0) / 60,
  );
  const empty = emptyPlan(studiedTodayMinutes);

  if (!goal) {
    return { ...empty, headline: '目標を設定しましょう', detail: '試験日と科目を登録すると、今日やるべきことを自動で計画します。' };
  }
  if (subjects.length === 0) {
    return { ...empty, headline: '科目を登録しましょう', detail: '科目ごとの目標点と現在の点数を入れると、足りない分を逆算します。' };
  }

  const goalDate = new Date(goal.dateISO);
  if (goalDate.getTime() <= now.getTime()) {
    return {
      ...empty,
      status: 'expired',
      headline: '目標日を過ぎました',
      detail: 'お疲れさまでした。結果を振り返って、次の目標を設定しましょう。',
    };
  }

  // ---- 1. 残り日数（今日を含む学習可能日数。本番当日は除く） ----
  const daysLeft = Math.max(1, calendarDaysBetween(now, goalDate));
  const spanDays = Math.max(1, calendarDaysBetween(new Date(goal.createdAtISO), goalDate));

  // ---- 2. ギャップ（不足点・不足率） ----
  const rows = subjects.map((s) => {
    const gapPoints = Math.max(0, s.targetScore - s.currentScore);
    const gapPercent = s.maxScore > 0 ? (gapPoints / s.maxScore) * 100 : 0;
    return { s, gapPoints, gapPercent };
  });
  const totalGapPercent = rows.reduce((a, r) => a + r.gapPercent, 0);
  const totalGapPoints = rows.reduce((a, r) => a + r.gapPoints, 0);

  // ---- 3. 必要な総学習時間と 1日あたりのペース ----
  const requiredMinutes = Math.round(totalGapPercent * settings.minutesPerPercent);
  const needPerDay = Math.ceil(requiredMinutes / daysLeft);
  const phase = pickPhase(daysLeft, totalGapPercent, spanDays);

  // ---- 4. 遅れ（直近の目標ペースに対する不足） ----
  const sinceCreated = Math.max(0, calendarDaysBetween(new Date(goal.createdAtISO), now));
  const windowDays = Math.min(7, sinceCreated);
  let lagMinutes = 0;
  if (windowDays > 0) {
    const fromKey = dateKey(addDays(now, -windowDays));
    const actual =
      logs.filter((l) => l.dateKey >= fromKey && l.dateKey < todayKey).reduce((a, l) => a + l.seconds, 0) / 60;
    lagMinutes = Math.max(0, Math.round(settings.dailyTargetMinutes * windowDays - actual));
  }
  const catchUpMinutes = totalGapPercent > 0 ? roundTo(Math.min(lagMinutes / 3, 90), 5) : 0;

  // ---- 5. 今日の目標時間 ----
  let target: number;
  if (totalGapPercent <= 0) target = Math.max(30, roundTo(settings.dailyTargetMinutes * 0.5, 5));
  else target = Math.max(needPerDay, settings.dailyTargetMinutes) + catchUpMinutes;
  target = Math.max(15, Math.min(roundTo(target, 5), roundTo(settings.maxDailyMinutes, 5)));

  // ---- 6. 実現可能性の判定とメッセージ ----
  let status: PlanStatus;
  let headline: string;
  let detail: string;
  if (totalGapPercent <= 0) {
    status = 'achieved';
    headline = '全科目が目標点に到達！';
    detail = '今日は維持が目的。軽めの演習とミスの見直しで、得点を安定させましょう。';
  } else if (needPerDay > settings.maxDailyMinutes) {
    status = 'over';
    headline = 'このペースでは目標に届かない見込みです';
    detail = `必要なのは1日 ${formatMinutes(needPerDay)}。設定の上限 ${formatMinutes(settings.maxDailyMinutes)} を超えています。目標点の優先順位づけや、設定の見直しを検討しましょう。`;
  } else if (needPerDay > settings.maxDailyMinutes * 0.75) {
    status = 'tight';
    headline = '上限に近いペースが必要です';
    detail = `目標点までは1日 ${formatMinutes(needPerDay)} が必要。毎日の積み重ねが勝負です。遅れを出さない運用を意識しましょう。`;
  } else {
    status = 'ok';
    headline = '今のペースなら間に合います';
    detail = `目標点まで、1日 ${formatMinutes(needPerDay)} のペースで到達できる見込みです。`;
  }
  if (lagMinutes > 0 && totalGapPercent > 0) {
    detail += ` 直近${windowDays}日で目標ペースより ${formatMinutes(lagMinutes)} 少ないため、今日は ${formatMinutes(catchUpMinutes)} 上乗せしています。`;
  }

  // ---- 7. 科目への配分 ----
  const recentFrom = dateKey(addDays(now, -7));
  const recentLogs = logs.filter((l) => l.dateKey >= recentFrom && l.dateKey < todayKey);
  const recentBySubject = new Map<string, number>();
  let recentTotal = 0;
  for (const l of recentLogs) {
    recentBySubject.set(l.subjectId, (recentBySubject.get(l.subjectId) ?? 0) + l.seconds);
    recentTotal += l.seconds;
  }
  const lastStudied = new Map<string, number>();
  for (const l of logs) {
    if (l.dateKey >= todayKey) continue;
    const ago = calendarDaysBetween(new Date(l.dateKey.replace(/-/g, '/')), now);
    const prev = lastStudied.get(l.subjectId);
    if (prev === undefined || ago < prev) lastStudied.set(l.subjectId, ago);
  }

  const active = rows.filter((r) => r.gapPercent > 0);
  const pool = active.length > 0 ? active : rows;
  const totalPoolGap = pool.reduce((a, r) => a + (active.length > 0 ? r.gapPercent : 1), 0);

  const weighted = pool.map((r) => {
    const baseWeight = active.length > 0 ? r.gapPercent : 1;
    const needShare = baseWeight / totalPoolGap;
    const actualShare = recentTotal > 0 ? (recentBySubject.get(r.s.id) ?? 0) / recentTotal : needShare;
    const shortfall = clamp((needShare - actualShare) * 1.5, 0, 0.6);
    const idleDays = lastStudied.get(r.s.id) ?? 14;
    // 長く触れていない科目ほど優先度を上げ、小さな不足の科目が置き去りにならないようにする
    const idleBoost = Math.min(idleDays, 14) * 0.08;
    return { ...r, weight: baseWeight * (1 + shortfall + idleBoost), shortfall, idleDays };
  });
  weighted.sort((a, b) => b.weight - a.weight);

  // 1日に扱う科目は最大4つ（40分あたり1科目）。細切れより、集中して取り組める量を優先し、
  // 外れた科目は「長く触れていない」ほど重みが増すので、翌日以降に自然とローテーションされる。
  const maxSubjects = clamp(Math.floor(target / 40), 1, 4);
  const chosen = weighted.slice(0, maxSubjects);
  const skipped = weighted.slice(maxSubjects).map((r) => r.s.name);
  const weightSum = chosen.reduce((a, r) => a + r.weight, 0);

  const minutesList = chosen.map((r) => Math.max(15, roundTo((target * r.weight) / weightSum, 5)));
  const drift = target - minutesList.reduce((a, b) => a + b, 0);
  minutesList[0] = Math.max(15, minutesList[0] + drift);
  const finalTarget = minutesList.reduce((a, b) => a + b, 0);

  const allocations: PlanAllocation[] = chosen.map((r, i) => {
    let reason: string;
    if (active.length === 0) reason = '維持のための復習';
    else if (r.idleDays >= 3 && r.idleDays < 14) reason = `${r.idleDays}日ぶりの科目`;
    else if (r.shortfall >= 0.2) reason = '配分に対して学習時間が不足';
    else reason = `不足 ${Math.round(r.gapPoints * 10) / 10}点（${Math.round(r.gapPercent)}%）`;
    return {
      subjectId: r.s.id,
      name: r.s.name,
      color: r.s.color,
      minutes: minutesList[i],
      gapPoints: Math.round(r.gapPoints * 10) / 10,
      gapPercent: Math.round(r.gapPercent * 10) / 10,
      reason,
    };
  });

  // ---- 8. ブロック化（科目を交互に並べて集中を保つ）と時刻割り当て ----
  const doy = dayOfYear(now);
  const perSubject = allocations.map((a, si) => {
    const chunks = splitMinutes(a.minutes, settings.blockMinutes);
    const ideas = TASK_IDEAS[phase];
    return chunks.map((m, ci) => ({
      id: `${a.subjectId}:${ci}`,
      subjectId: a.subjectId,
      subjectName: a.name,
      color: a.color,
      minutes: m,
      title: ideas[(doy + si * 3 + ci * 2) % ideas.length],
    }));
  });
  const ordered: Array<(typeof perSubject)[number][number]> = [];
  const longest = perSubject.reduce((a, l) => Math.max(a, l.length), 0);
  for (let i = 0; i < longest; i++) for (const list of perSubject) if (list[i]) ordered.push(list[i]);

  const [sh, sm] = settings.startTime.split(':').map((x) => Number(x));
  const startDate = new Date(now);
  startDate.setHours(Number.isFinite(sh) ? sh : 19, Number.isFinite(sm) ? sm : 0, 0, 0);
  let cursor = startDate.getTime();
  const blocks: PlanBlock[] = ordered.map((b) => {
    const start = cursor;
    const end = start + b.minutes * 60000;
    cursor = end + settings.breakMinutes * 60000;
    return { ...b, start, end };
  });

  return {
    status,
    headline,
    detail,
    daysLeft,
    phase,
    phaseLabel: PHASE_LABEL[phase],
    totalGapPoints: Math.round(totalGapPoints * 10) / 10,
    totalGapPercent: Math.round(totalGapPercent * 10) / 10,
    requiredMinutes,
    needPerDay,
    lagMinutes,
    catchUpMinutes,
    targetMinutes: finalTarget,
    studiedTodayMinutes,
    remainingMinutes: Math.max(0, finalTarget - studiedTodayMinutes),
    allocations,
    skipped,
    blocks,
  };
}
