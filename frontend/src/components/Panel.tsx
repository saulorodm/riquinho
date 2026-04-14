import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  tone?: "neutral" | "info" | "positive" | "warning" | "danger" | "patrimonial";
  className?: string;
}

const panelToneStyles = {
  neutral: "border-white/10 bg-panel/80",
  info: "border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.07),rgba(15,23,42,0.18))]",
  positive: "border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.07),rgba(15,23,42,0.18))]",
  warning: "border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.07),rgba(15,23,42,0.18))]",
  danger: "border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.07),rgba(15,23,42,0.18))]",
  patrimonial: "border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.07),rgba(15,23,42,0.18))]"
} as const;

export function Panel({
  title,
  subtitle,
  children,
  icon: Icon,
  iconColor = "#7dd3fc",
  tone = "neutral",
  className = ""
}: PanelProps) {
  return (
    <section
      className={`rounded-[28px] border p-6 shadow-2xl shadow-black/20 ${panelToneStyles[tone]} ${className}`}
    >
      <div className="mb-5 flex items-start gap-3">
        {Icon ? (
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${iconColor}22`, color: iconColor }}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
