import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Copyright,
  HandCoins,
  LaptopMinimal,
  PiggyBank,
  Umbrella
} from "lucide-react";

export const incomeCategoryMeta: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
  }
> = {
  "Salario CLT": {
    icon: BriefcaseBusiness,
    color: "#7dd3fc"
  },
  "Propriedade Intelectual": {
    icon: Copyright,
    color: "#7dd3fc"
  },
  "13%": {
    icon: PiggyBank,
    color: "#7dd3fc"
  },
  "Férias Adiantadas": {
    icon: Umbrella,
    color: "#7dd3fc"
  },
  Freelance: {
    icon: LaptopMinimal,
    color: "#7dd3fc"
  },
  Dividendos: {
    icon: HandCoins,
    color: "#7dd3fc"
  }
};
