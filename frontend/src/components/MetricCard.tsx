import type { ReactNode } from "react";

import { useValueVisibility } from "../contexts/value-visibility-context";

interface MetricCardProps {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  tone?: "neutral" | "info" | "positive" | "warning" | "danger" | "patrimonial";
  className?: string;
}

const toneStyles = {
  neutral: {
    container: "border-white/10 bg-white/5",
    icon: "border-white/10 bg-white/5 text-slate-200"
  },
  info: {
    container: "border-sky-300/15 bg-sky-300/5",
    icon: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  },
  positive: {
    container: "border-sky-300/15 bg-sky-300/5",
    icon: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  },
  warning: {
    container: "border-sky-300/15 bg-sky-300/5",
    icon: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  },
  danger: {
    container: "border-sky-300/15 bg-sky-300/5",
    icon: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  },
  patrimonial: {
    container: "border-sky-300/15 bg-sky-300/5",
    icon: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  }
} as const;

export function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
  className = ""
}: MetricCardProps) {
  const { formatCurrencyValue } = useValueVisibility();
  const styles = toneStyles[tone];

  return (
    <article className={`rounded-[28px] border p-5 backdrop-blur ${styles.container} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-semibold text-white">{formatCurrencyValue(value)}</p>
          <p className="text-xs text-slate-500">{helper}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${styles.icon}`}>{icon}</div>
      </div>
    </article>
  );
}
