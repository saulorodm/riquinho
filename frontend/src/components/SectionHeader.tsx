import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title?: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, description, meta, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/70">{eyebrow}</p>
        {title ? <h1 className="text-3xl font-semibold text-white">{title}</h1> : null}
        <p className="max-w-2xl text-sm text-slate-400">{description}</p>
        {meta ? <div>{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
