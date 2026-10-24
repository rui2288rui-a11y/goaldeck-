// ============================================================
// モチベーション文言（状況に応じて出し分け）
// ============================================================

const DAILY_LINES = [
  '昨日の自分より1ページ先へ。',
  '小さな積み重ねが、本番の余裕になる。',
  '始めてしまえば、半分は終わっている。',
  '今日の15分が、本番の1点になる。',
  '完璧じゃなくていい。止まらないことが大事。',
  '苦手を潰した分だけ、得点は確実に伸びる。',
  '休むのも作戦のうち。メリハリで伸ばそう。',
];

/** カウントダウンカードに出す一言 */
export function countdownLine(daysLeft: number, seed: number): string {
  if (daysLeft <= 0) return '本番当日。ここまでやってきた自分を信じよう。';
  if (daysLeft <= 3) return '最終コーナー。新しいことより、取れる問題を確実に取る。';
  if (daysLeft <= 7) return 'あと1週間。睡眠と体調管理も得点力のうちです。';
  if (daysLeft <= 30) return '残り1か月。過去問と復習ノートが最大の武器になる。';
  if (daysLeft <= 100) return 'ここからの伸びが一番大きい時期。毎日コツコツいこう。';
  return DAILY_LINES[Math.abs(seed) % DAILY_LINES.length];
}

/** 今日の達成度に応じた励まし */
export function progressLine(studiedMinutes: number, targetMinutes: number): string {
  if (targetMinutes <= 0) return '目標を設定して、今日の第一歩を踏み出そう。';
  const r = studiedMinutes / targetMinutes;
  if (studiedMinutes === 0) return 'まずは5分だけ。始めることが一番むずかしい。';
  if (r < 0.34) return 'いいスタート！この調子で積み上げよう。';
  if (r < 0.67) return '折り返し地点。集中が切れる前に休憩をはさもう。';
  if (r < 1) return 'あと少し！ゴールが見えてきた。';
  return '今日の目標達成！おつかれさま。余力があれば復習を。';
}
