import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface NavLinkItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export function NavLinkItem({ to, icon: Icon, label, collapsed = false }: NavLinkItemProps) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-sky-400/15 text-sky-200 shadow-glow"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center" : "gap-3"}`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
        }`}
      >
        {label}
      </span>
    </NavLink>
  );
}
