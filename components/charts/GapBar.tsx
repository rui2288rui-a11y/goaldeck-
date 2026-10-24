import { clamp } from '@/lib/utils';

/**
 * 点数バー：塗り＝現在点、斜線＝目標までの不足、黒線＝目標点
 */
export function GapBar({ current, target, max, color }: { current: number; target: number; max: number; color: string }) {
  const safeMax = Math.max(1, max);
  const pct = (n: number) => clamp((n / safeMax) * 100, 0, 100);
  const cur = pct(current);
  const tgt = pct(target);
  const gap = Math.max(0, tgt - cur);

  return (
    <div
      className="relative h-3.5 w-full rounded-full bg-surface2"
      role="img"
      aria-label={`現在${current}点、目標${target}点、満点${max}点`}
    >
      {gap > 0 && (
        <div
          className="absolute inset-y-0 rounded-r-full opacity-40"
          style={{
            left: `${cur}%`,
            width: `${gap}%`,
            background: `repeating-linear-gradient(45deg, ${color}, ${color} 3px, transparent 3px, transparent 7px)`,
          }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
        style={{ width: `${cur}%`, background: color }}
      />
      <div
        className="absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-ink"
        style={{ left: `${clamp(tgt, 1, 99)}%` }}
      />
    </div>
  );
}
