import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Car,
  Copyright,
  HandCoins,
  HeartPulse,
  Home,
  LaptopMinimal,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  Tv2,
  Umbrella
} from "lucide-react";

export const categoryIconOptions: Array<{
  value: string;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "sparkles", label: "Brilho", icon: Sparkles },
  { value: "tv", label: "TV", icon: Tv2 },
  { value: "car", label: "Carro", icon: Car },
  { value: "heart", label: "Saúde", icon: HeartPulse },
  { value: "shopping-bag", label: "Compras", icon: ShoppingBag },
  { value: "home", label: "Casa", icon: Home },
  { value: "briefcase", label: "Trabalho", icon: BriefcaseBusiness },
  { value: "copyright", label: "Copyright", icon: Copyright },
  { value: "coins", label: "Moedas", icon: HandCoins },
  { value: "laptop", label: "Laptop", icon: LaptopMinimal },
  { value: "umbrella", label: "Guarda-sol", icon: Umbrella },
  { value: "piggy-bank", label: "Cofre", icon: PiggyBank }
];

export const categoryIconMap = Object.fromEntries(
  categoryIconOptions.map((item) => [item.value, item.icon])
) as Record<string, LucideIcon>;
