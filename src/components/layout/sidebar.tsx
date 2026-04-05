"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  Package,
  LogOut,
  User,
  X,
  Settings,
  ShieldCheck,
  DoorOpen,
  CalendarCheck,
  Sofa,
  UserCheck,
  AlertCircle,
  Wallet,
  BarChart2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const sindicoNav: NavItem[] = [
  { href: "/sindico/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/sindico/blocos", label: "Blocos / Torres", icon: Layers },
  { href: "/sindico/unidades", label: "Unidades", icon: Building2 },
  { href: "/sindico/moradores", label: "Moradores", icon: Users },
  { href: "/sindico/porteiros", label: "Porteiros", icon: DoorOpen },
  { href: "/sindico/comunicados", label: "Comunicados", icon: MessageSquare },
  { href: "/sindico/encomendas", label: "Encomendas", icon: Package },
  { href: "/sindico/areas-comuns", label: "Áreas Comuns", icon: Sofa },
  { href: "/sindico/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/sindico/ocorrencias", label: "Ocorrências", icon: AlertCircle },
  { href: "/sindico/metricas", label: "Métricas", icon: BarChart2 },
  { href: "/sindico/settings", label: "Configurações", icon: Settings },
];

const portariaNav: NavItem[] = [
  { href: "/portaria/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/portaria/encomendas", label: "Encomendas", icon: Package },
  { href: "/portaria/visitantes", label: "Visitantes", icon: UserCheck },
  { href: "/portaria/moradores", label: "Moradores", icon: Users },
];

const moradorNav: NavItem[] = [
  { href: "/morador/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/morador/comunicados", label: "Comunicados", icon: MessageSquare },
  { href: "/morador/encomendas", label: "Encomendas", icon: Package },
  { href: "/morador/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/morador/visitantes", label: "Visitantes", icon: UserCheck },
  { href: "/morador/ocorrencias", label: "Ocorrências", icon: AlertCircle },
];

const adminNav: NavItem[] = [
  { href: "/admin/condominios", label: "Condomínios", icon: Building2 },
  { href: "/admin/sindicos", label: "Síndicos", icon: ShieldCheck },
];

interface SidebarProps {
  role: string;
  userName: string;
  onClose?: () => void;
}

export function Sidebar({ role, userName, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "SUPER_ADMIN"
      ? adminNav
      : role === "SINDICO"
      ? sindicoNav
      : role === "PORTEIRO"
      ? portariaNav
      : moradorNav;

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="16" height="16" rx="4" fill="#1F6FEB" opacity="0.9" />
            <rect x="22" y="2" width="16" height="16" rx="4" fill="#1F6FEB" opacity="0.5" />
            <rect x="2" y="22" width="16" height="16" rx="4" fill="#1F6FEB" opacity="0.5" />
            <rect x="22" y="22" width="16" height="16" rx="4" fill="#1F6FEB" opacity="0.25" />
            <path d="M18 10L22 10" stroke="#1F6FEB" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M10 18L10 22" stroke="#1F6FEB" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M30 18L30 22" stroke="#1F6FEB" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M18 30L22 30" stroke="#1F6FEB" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </svg>
          <span className="text-[18px] font-extrabold tracking-tight text-slate-900 leading-none">
            Condo<span className="text-[#1F6FEB]">Flow</span>
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-[#EFF6FF] text-[#1F6FEB] font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />
      <div className="p-4 space-y-1">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <User className="h-4 w-4" />
          Meu Perfil
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      <div className="p-4 border-t">
        <p className="text-xs text-slate-500 truncate">{userName}</p>
      </div>
    </div>
  );
}
