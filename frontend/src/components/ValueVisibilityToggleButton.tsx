import { Eye, EyeOff } from "lucide-react";

import { useValueVisibility } from "../contexts/value-visibility-context";

export function ValueVisibilityToggleButton() {
  const { isValueVisible, toggleValueVisibility } = useValueVisibility();

  return (
    <button
      type="button"
      onClick={toggleValueVisibility}
      title={isValueVisible ? "Ocultar valores" : "Exibir valores"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
      aria-label={isValueVisible ? "Ocultar valores" : "Exibir valores"}
    >
      {isValueVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}
