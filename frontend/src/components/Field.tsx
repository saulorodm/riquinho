import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  as?: "input";
  rightSlot?: ReactNode;
}

export function Field({ label, hint, rightSlot, ...props }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="flex items-center rounded-2xl border border-white/10 bg-ink/80 px-4">
        <input
          {...props}
          className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        {rightSlot}
      </div>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
