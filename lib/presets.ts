// ============================================================
// 目標プリセット（大学受験・資格試験など）
// 試験日は「目安」です。必ず公式の日程で確認し、画面上で編集してください。
// ============================================================

import { addDays, nthWeekday } from '@/lib/utils';

export type PresetCategory = 'university' | 'school' | 'certificate' | 'language';

export interface PresetSubject {
  name: string;
  maxScore: number;
  targetScore: number;
}

export interface GoalPreset {
  id: string;
  category: PresetCategory;
  emoji: string;
  name: string;
  summary: string;
  note?: string;
  /** 現在時刻から見て次に来る試験日（目安） */
  nextDate: (now: Date) => Date;
  subjects: PresetSubject[];
}

export const CATEGORY_LABELS: Record<PresetCategory, string> = {
  university: '大学受験',
  school: '学校・高校受験',
  certificate: '資格試験',
  language: '語学',
};

export const SUBJECT_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#8b5cf6',
  '#84cc16',
  '#ef4444',
  '#14b8a6',
];

/** 候補日のうち、now より後で一番近い日を返す（今年・来年・再来年を探索） */
function nextOf(now: Date, gen: (year: number) => Date[]): Date {
  for (let y = now.getFullYear(); y <= now.getFullYear() + 2; y++) {
    const future = gen(y)
      .filter((d) => d.getTime() > now.getTime())
      .sort((a, b) => a.getTime() - b.getTime());
    if (future.length > 0) return future[0];
  }
  return addDays(now, 60);
}

const inDays = (n: number, hour = 9, minute = 30) => (now: Date) => {
  const d = addDays(now, n);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const s = (name: string, maxScore: number, targetScore: number): PresetSubject => ({
  name,
  maxScore,
  targetScore,
});

const DATE_NOTE = '日程は目安です。必ず公式サイトで確認してください。';

export const PRESETS: GoalPreset[] = [
  // ---------------- 大学受験 ----------------
  {
    id: 'kyotsu-sci',
    category: 'university',
    emoji: '🎓',
    name: '共通テスト（理系・例）',
    summary: '1月第3土曜の本試験。主要9科目の例',
    note: `科目と配点は志望校の利用方法に合わせて編集してください。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [nthWeekday(y, 0, 6, 3, 9, 30)]),
    subjects: [
      s('国語', 200, 150),
      s('英語リーディング', 100, 80),
      s('英語リスニング', 100, 80),
      s('数学ⅠA', 100, 85),
      s('数学ⅡBC', 100, 85),
      s('物理', 100, 80),
      s('化学', 100, 80),
      s('地理歴史・公民', 100, 80),
      s('情報Ⅰ', 100, 85),
    ],
  },
  {
    id: 'kyotsu-arts',
    category: 'university',
    emoji: '📚',
    name: '共通テスト（文系・例）',
    summary: '1月第3土曜の本試験。主要9科目の例',
    note: `科目と配点は志望校の利用方法に合わせて編集してください。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [nthWeekday(y, 0, 6, 3, 9, 30)]),
    subjects: [
      s('国語', 200, 160),
      s('英語リーディング', 100, 85),
      s('英語リスニング', 100, 85),
      s('数学ⅠA', 100, 75),
      s('数学ⅡBC', 100, 75),
      s('地歴公民①', 100, 85),
      s('地歴公民②', 100, 85),
      s('理科基礎', 100, 70),
      s('情報Ⅰ', 100, 85),
    ],
  },
  {
    id: 'nijishiken',
    category: 'university',
    emoji: '🏛️',
    name: '国公立大 二次試験（前期）',
    summary: '2月25日ごろ。主要4科目の例',
    note: `配点は大学・学部ごとに異なります。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [new Date(y, 1, 25, 9, 30)]),
    subjects: [s('英語', 100, 75), s('数学', 100, 70), s('国語', 100, 70), s('理科・社会', 100, 70)],
  },
  {
    id: 'shidai',
    category: 'university',
    emoji: '🏫',
    name: '私立大 一般選抜',
    summary: '2月上旬。3教科型の例',
    note: `配点・科目は大学ごとに異なります。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [new Date(y, 1, 1, 9, 0)]),
    subjects: [s('英語', 100, 80), s('国語', 100, 75), s('選択科目', 100, 75)],
  },

  // ---------------- 学校・高校受験 ----------------
  {
    id: 'koukou',
    category: 'school',
    emoji: '🏫',
    name: '高校入試（公立・目安）',
    summary: '3月上旬〜中旬。5教科の例',
    note: `実施日・配点は都道府県によって異なります。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [new Date(y, 2, 10, 9, 0)]),
    subjects: [s('国語', 100, 80), s('数学', 100, 80), s('英語', 100, 80), s('理科', 100, 80), s('社会', 100, 80)],
  },
  {
    id: 'teiki',
    category: 'school',
    emoji: '📝',
    name: '定期テスト',
    summary: '日程は自分で設定（初期値は30日後）',
    nextDate: inDays(30, 8, 50),
    subjects: [s('国語', 100, 80), s('数学', 100, 80), s('英語', 100, 80), s('理科', 100, 80), s('社会', 100, 80)],
  },

  // ---------------- 資格試験 ----------------
  {
    id: 'takken',
    category: 'certificate',
    emoji: '🏠',
    name: '宅地建物取引士（宅建）',
    summary: '10月第3日曜 13:00。50問・4分野',
    note: `合格点は年により変動します（近年は概ね33〜38点）。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [nthWeekday(y, 9, 0, 3, 13, 0)]),
    subjects: [s('権利関係', 14, 10), s('法令上の制限', 8, 6), s('宅建業法', 20, 18), s('税・その他', 8, 6)],
  },
  {
    id: 'gyosei',
    category: 'certificate',
    emoji: '⚖️',
    name: '行政書士',
    summary: '11月第2日曜 13:00。300点満点',
    note: `合格基準: 法令等122点以上・一般知識等24点以上・総合180点以上。${DATE_NOTE}`,
    nextDate: (now) => nextOf(now, (y) => [nthWeekday(y, 10, 0, 2, 13, 0)]),
    subjects: [s('法令等（択一）', 160, 112), s('法令等（多肢選択）', 24, 16), s('法令等（記述）', 60, 36), s('一般知識等', 56, 28)],
  },
  {
    id: 'boki3',
    category: 'certificate',
    emoji: '🧮',
    name: '日商簿記 3級',
    summary: '6月・11月・2月の統一試験。100点満点',
    note: `合格ラインは70点。${DATE_NOTE}`,
    nextDate: (now) =>
      nextOf(now, (y) => [nthWeekday(y, 5, 0, 2, 11, 0), nthWeekday(y, 10, 0, 3, 11, 0), nthWeekday(y, 1, 0, 4, 11, 0)]),
    subjects: [s('第1問（仕訳）', 45, 34), s('第2問', 20, 15), s('第3問（決算）', 35, 26)],
  },
  {
    id: 'boki2',
    category: 'certificate',
    emoji: '🧮',
    name: '日商簿記 2級',
    summary: '6月・11月・2月の統一試験。商業+工業',
    note: `合格ラインは70点。${DATE_NOTE}`,
    nextDate: (now) =>
      nextOf(now, (y) => [nthWeekday(y, 5, 0, 2, 13, 30), nthWeekday(y, 10, 0, 3, 13, 30), nthWeekday(y, 1, 0, 4, 13, 30)]),
    subjects: [s('商業簿記', 60, 44), s('工業簿記', 40, 30)],
  },
  {
    id: 'fp2',
    category: 'certificate',
    emoji: '💴',
    name: 'FP技能検定 2級',
    summary: '1月・5月・9月。学科と実技',
    note: `合格基準は学科36/60点・実技30/50点（目安）。${DATE_NOTE}`,
    nextDate: (now) =>
      nextOf(now, (y) => [nthWeekday(y, 0, 0, 4, 10, 0), nthWeekday(y, 4, 0, 4, 10, 0), nthWeekday(y, 8, 0, 2, 10, 0)]),
    subjects: [s('学科', 60, 42), s('実技', 50, 36)],
  },
  {
    id: 'kihon',
    category: 'certificate',
    emoji: '💻',
    name: '基本情報技術者試験',
    summary: '通年CBT。科目A・科目B（各1000点）',
    note: `合格基準は科目A・科目Bともに600点以上。受験日は自分で予約した日に設定してください（初期値は60日後）。`,
    nextDate: inDays(60, 10, 0),
    subjects: [s('科目A', 1000, 700), s('科目B', 1000, 700)],
  },
  {
    id: 'itpass',
    category: 'certificate',
    emoji: '🖥️',
    name: 'ITパスポート',
    summary: '通年CBT。各分野の正答率(%)で管理',
    note: `合格基準は総合60%以上かつ各分野30%以上。受験日は予約した日に設定してください（初期値は45日後）。`,
    nextDate: inDays(45, 10, 0),
    subjects: [s('ストラテジ系', 100, 70), s('マネジメント系', 100, 70), s('テクノロジ系', 100, 70)],
  },

  // ---------------- 語学 ----------------
  {
    id: 'toeic',
    category: 'language',
    emoji: '🎧',
    name: 'TOEIC L&R',
    summary: 'Listening / Reading 各495点',
    note: `公開テストの日程は公式サイトで確認し、日付を設定してください（初期値は45日後）。`,
    nextDate: inDays(45, 10, 30),
    subjects: [s('Listening', 495, 400), s('Reading', 495, 400)],
  },
  {
    id: 'eiken',
    category: 'language',
    emoji: '🗣️',
    name: '英検（得点率で管理）',
    summary: '1月・6月・10月ごろ。各技能の得点率(%)',
    note: `級により合格ラインが異なるため、得点率で管理します。${DATE_NOTE}`,
    nextDate: (now) =>
      nextOf(now, (y) => [nthWeekday(y, 0, 0, 4, 10, 0), nthWeekday(y, 5, 0, 1, 10, 0), nthWeekday(y, 9, 0, 2, 10, 0)]),
    subjects: [s('語彙・読解', 100, 70), s('リスニング', 100, 70), s('ライティング', 100, 70)],
  },
];

export function findPreset(id: string | undefined): GoalPreset | undefined {
  return id ? PRESETS.find((p) => p.id === id) : undefined;
}
