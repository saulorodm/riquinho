import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CarFront,
  Landmark,
  Map,
  BriefcaseBusiness,
  ShieldEllipsis,
  Layers3
} from "lucide-react";

import type { AssetCategory } from "../types/api";

export const assetCategoryMeta: Record<
  AssetCategory,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    profile: "FIXED_INCOME" | "VARIABLE_INCOME";
  }
> = {
  VEHICLE: {
    label: "Veículo",
    icon: CarFront,
    color: "#7dd3fc",
    profile: "VARIABLE_INCOME"
  },
  RESIDENCE: {
    label: "Residência",
    icon: Building2,
    color: "#7dd3fc",
    profile: "FIXED_INCOME"
  },
  INCOME_PROPERTY: {
    label: "Imóvel para renda",
    icon: Landmark,
    color: "#7dd3fc",
    profile: "FIXED_INCOME"
  },
  LAND: {
    label: "Terreno",
    icon: Map,
    color: "#7dd3fc",
    profile: "FIXED_INCOME"
  },
  BUSINESS_EQUITY: {
    label: "Participação",
    icon: BriefcaseBusiness,
    color: "#7dd3fc",
    profile: "VARIABLE_INCOME"
  },
  FGTS: {
    label: "FGTS",
    icon: ShieldEllipsis,
    color: "#7dd3fc",
    profile: "FIXED_INCOME"
  },
  OTHER: {
    label: "Outros",
    icon: Layers3,
    color: "#7dd3fc",
    profile: "VARIABLE_INCOME"
  }
};
