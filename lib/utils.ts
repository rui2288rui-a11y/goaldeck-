// ============================================================
// 汎用ユーティリティ（日付・フォーマット・ID）
// ============================================================

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

export const roundTo = (n: number, step: number): number => Math.round(n / step) * step;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** ローカル日付キー YYYY-MM-DD */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** from の日付から to の日付までの暦日数（to が未来なら正） */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

export function formatJaDate(d: Date, withWeekday = true): string {
  const base = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return withWeekday ? `${base}(${WEEKDAYS[d.getDay()]})` : base;
}

export function formatShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

export function formatTime(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
}

/** 分 → 「1時間30分」「45分」 */
export function formatMinutes(min: number): string {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}時間${m}分`;
  if (h > 0) return `${h}時間`;
  return `${m}分`;
}

/** 秒 → 「1時間30分」「45分」「20秒」 */
export function formatSeconds(sec: number): string {
  if (sec < 60) return `${Math.max(0, Math.round(sec))}秒`;
  return formatMinutes(Math.round(sec / 60));
}

/** ミリ秒 → 「01:23:45」 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/** Date → <input type="datetime-local"> の値 */
export function toInputDateTime(d: Date): string {
  return `${dateKey(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Date → <input type="date"> の値 */
export function toInputDate(d: Date): string {
  return dateKey(d);
}

/** 第 n 週の weekday（0=日 … 6=土）。month は 0 始まり */
export function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number,
  hour = 9,
  minute = 30,
): Date {
  const first = new Date(year, month, 1, hour, minute);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7, hour, minute);
}

/** 小さな決定論的乱数（デモデータ用） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
