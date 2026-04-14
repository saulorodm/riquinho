import type { LucideIcon } from "lucide-react";
import {
  Bitcoin,
  Building2,
  Landmark,
  Layers3,
  PiggyBank,
  WalletCards
} from "lucide-react";

import type { InvestmentType } from "../types/api";

export const investmentTypeMeta: Record<
  InvestmentType,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    quotaBased: boolean;
  }
> = {
  STOCKS_ETFS: {
    label: "Ações / ETFs",
    icon: Layers3,
    color: "#7dd3fc",
    quotaBased: true
  },
  REITS_FIIS: {
    label: "FIIs / REITs",
    icon: Building2,
    color: "#7dd3fc",
    quotaBased: true
  },
  FIXED_INCOME: {
    label: "Renda fixa",
    icon: Landmark,
    color: "#7dd3fc",
    quotaBased: false
  },
  CASH_RESERVE: {
    label: "Caixa e liquidez",
    icon: WalletCards,
    color: "#7dd3fc",
    quotaBased: false
  },
  CRYPTO: {
    label: "Cripto",
    icon: Bitcoin,
    color: "#7dd3fc",
    quotaBased: true
  },
  OTHER: {
    label: "Outros",
    icon: PiggyBank,
    color: "#7dd3fc",
    quotaBased: true
  }
};
