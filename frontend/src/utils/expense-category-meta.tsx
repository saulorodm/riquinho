import type { LucideIcon } from "lucide-react";
import {
  Car,
  HeartPulse,
  Home,
  ShoppingBag,
  Sparkles,
  Tv2
} from "lucide-react";

export const expenseCategoryMeta: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
  }
> = {
  Lazer: {
    icon: Sparkles,
    color: "#7dd3fc"
  },
  Assinaturas: {
    icon: Tv2,
    color: "#7dd3fc"
  },
  Carro: {
    icon: Car,
    color: "#7dd3fc"
  },
  "Saúde": {
    icon: HeartPulse,
    color: "#7dd3fc"
  },
  Compras: {
    icon: ShoppingBag,
    color: "#7dd3fc"
  },
  Casa: {
    icon: Home,
    color: "#7dd3fc"
  }
};
