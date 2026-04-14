import {
  ArrowDownCircle,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  House,
  HandCoins,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  ShieldEllipsis,
  Settings2,
  WalletCards
} from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { NavLinkItem } from "../components/NavLinkItem";

const navigationItems = [
  { to: "/dashboard", label: "Visão Geral", icon: BarChart3 },
  { to: "/controle-mensal", label: "Controle mensal", icon: CalendarDays },
  { to: "/despesas", label: "Despesas", icon: ArrowDownCircle },
  { to: "/receitas", label: "Receitas", icon: CircleDollarSign },
  { to: "/caixa", label: "Caixa", icon: WalletCards },
  { to: "/investimentos", label: "Investimentos", icon: PiggyBank },
  { to: "/patrimonio", label: "Patrimônio", icon: House },
  { to: "/fgts", label: "FGTS", icon: ShieldEllipsis },
  { to: "/valores-a-receber", label: "Valores a receber", icon: HandCoins },
  { to: "/configuracoes", label: "Configurações", icon: Settings2 }
];

const SIDEBAR_STORAGE_KEY = "riquinho.sidebar-collapsed";

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setIsSidebarCollapsed(storedValue === "true");
  }, []);

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      return nextValue;
    });
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside
          className={`relative w-full rounded-[32px] border border-white/10 bg-slate-950/75 p-5 transition-all duration-300 ease-out lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] ${
            isSidebarCollapsed ? "lg:w-24" : "lg:w-72"
          }`}
        >
          <div className={`mb-8 ${isSidebarCollapsed ? "space-y-4" : "space-y-3"}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} ${!isSidebarCollapsed ? "min-h-[72px]" : ""}`}>
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/5">
                <span className="font-brand text-3xl font-semibold text-white">R</span>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
                }`}
              >
                <p className="font-brand text-xl leading-none font-semibold tracking-[0.04em] text-white">
                  Riquinho
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavLinkItem key={item.to} {...item} collapsed={isSidebarCollapsed} />
            ))}
          </nav>

          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/90 text-slate-200 shadow-xl shadow-black/30 transition hover:bg-slate-900 lg:inline-flex"
            aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Ocultar menu lateral"}
            title={isSidebarCollapsed ? "Expandir menu lateral" : "Ocultar menu lateral"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </aside>

        <main className="flex-1 rounded-[32px] border border-white/10 bg-slate-950/45 p-4 backdrop-blur lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
