"use client";

interface Props {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
}

export function ProgressRing({
  percent,
  size = 88,
  stroke = 8,
  label,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#222222"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#8fa8b8"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums leading-none">
          {Math.round(clamped)}%
        </span>
        {label && (
          <span className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-dim">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
