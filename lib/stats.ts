// ============================================================
// 学習記録の集計（グラフ・ストリーク・ヒートマップ）
// ============================================================

import type { Settings, StudyLog, Subject } from '@/types';
import { WEEKDAYS, addDays, dateKey, startOfDay } from '@/lib/utils';

export const OTHER_KEY = '__other';

export const sumSeconds = (logs: StudyLog[]): number => logs.reduce((a, l) => a + l.seconds, 0);

export const sumMinutes = (logs: StudyLog[]): number => Math.round(sumSeconds(logs) / 60);

/** dateKey → 分 */
export function minutesByDay(logs: StudyLog[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of logs) out[l.dateKey] = (out[l.dateKey] ?? 0) + l.seconds / 60;
  return out;
}

export function minutesOnDay(logs: StudyLog[], key: string): number {
  return Math.round(sumSeconds(logs.filter((l) => l.dateKey === key)) / 60);
}

/** 今日を含む直近 days 日の合計（分） */
export function minutesInLastDays(logs: StudyLog[], days: number, now: Date): number {
  const from = dateKey(addDays(startOfDay(now), -(days - 1)));
  return Math.round(sumSeconds(logs.filter((l) => l.dateKey >= from)) / 60);
}

export type DailyPoint = { dateKey: string; label: string; weekday: string; total: number } & Record<
  string,
  number | string
>;

/** 日別・科目別の学習時間（単位: 時間）。積み上げ棒グラフ用 */
export function dailySeries(logs: StudyLog[], subjects: Subject[], days: number, now: Date): DailyPoint[] {
  const known = new Set(subjects.map((s) => s.id));
  const today = startOfDay(now);
  const points: DailyPoint[] = [];
  const index: Record<string, DailyPoint> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = dateKey(d);
    const p: DailyPoint = {
      dateKey: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: WEEKDAYS[d.getDay()],
      total: 0,
    };
    points.push(p);
    index[key] = p;
  }
  for (const l of logs) {
    const p = index[l.dateKey];
    if (!p) continue;
    const key = known.has(l.subjectId) ? l.subjectId : OTHER_KEY;
    const hours = l.seconds / 3600;
    p[key] = Number((Number(p[key] ?? 0) + hours).toFixed(3));
    p.total = Number((p.total + hours).toFixed(3));
  }
  return points;
}

export interface SubjectTotal {
  id: string;
  name: string;
  color: string;
  minutes: number;
}

/** 科目別の学習時間合計（分）。fromKey 以降のログのみ対象 */
export function subjectTotals(logs: StudyLog[], subjects: Subject[], fromKey?: string): SubjectTotal[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    if (fromKey && l.dateKey < fromKey) continue;
    map.set(l.subjectId, (map.get(l.subjectId) ?? 0) + l.seconds / 60);
  }
  const rows: SubjectTotal[] = [];
  let other = 0;
  map.forEach((minutes, id) => {
    const s = subjects.find((x) => x.id === id);
    if (s) rows.push({ id, name: s.name, color: s.color, minutes: Math.round(minutes) });
    else other += minutes;
  });
  if (other > 0) rows.push({ id: OTHER_KEY, name: 'その他', color: '#94a3b8', minutes: Math.round(other) });
  return rows.filter((r) => r.minutes > 0).sort((a, b) => b.minutes - a.minutes);
}

/** 連続学習日数。今日まだ学習していなくても、昨日までの連続は途切れない扱い */
export function calcStreak(logs: StudyLog[], now: Date): number {
  const days = new Set(logs.filter((l) => l.seconds >= 60).map((l) => l.dateKey));
  let cursor = startOfDay(now);
  if (!days.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (days.has(dateKey(cursor))) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function bestDay(logs: StudyLog[]): { dateKey: string; minutes: number } | null {
  const by = minutesByDay(logs);
  let best: { dateKey: string; minutes: number } | null = null;
  for (const k of Object.keys(by)) {
    if (!best || by[k] > best.minutes) best = { dateKey: k, minutes: Math.round(by[k]) };
  }
  return best;
}

export interface HeatCell {
  dateKey: string;
  minutes: number;
  future: boolean;
  label: string;
}

/** 週ごとの列（日曜始まり）。最後の列に今日が含まれる */
export function heatmap(logs: StudyLog[], weeks: number, now: Date): HeatCell[][] {
  const by = minutesByDay(logs);
  const today = startOfDay(now);
  const sunday = addDays(today, -today.getDay());
  const first = addDays(sunday, -(weeks - 1) * 7);
  const cols: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, w * 7 + d);
      const key = dateKey(date);
      col.push({
        dateKey: key,
        minutes: Math.round(by[key] ?? 0),
        future: date.getTime() > today.getTime(),
        label: `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]})`,
      });
    }
    cols.push(col);
  }
  return cols;
}

/** ヒートマップの濃さ 0..4 */
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 90) return 2;
  if (minutes < 180) return 3;
  return 4;
}

export function totalHours(logs: StudyLog[]): number {
  return Math.round((sumSeconds(logs) / 3600) * 10) / 10;
}

/** 設定の妥当性を丸める（入力途中の不正値対策） */
export function normalizeSettings(s: Settings): Settings {
  const max = Math.max(30, s.maxDailyMinutes);
  return {
    ...s,
    dailyTargetMinutes: Math.min(Math.max(10, s.dailyTargetMinutes), max),
    maxDailyMinutes: max,
    minutesPerPercent: Math.max(1, s.minutesPerPercent),
    blockMinutes: Math.max(10, s.blockMinutes),
    breakMinutes: Math.max(0, s.breakMinutes),
  };
}
