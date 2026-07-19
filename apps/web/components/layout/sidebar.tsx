"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Wrench,
  UserCog,
  Rocket,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Store,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const COLLAPSED_W = 72;
const EXPANDED_W = 232;

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  platformOnly?: boolean;
};

const links: NavLink[] = [
  {
    href: "/workshop",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "MECHANIC"],
  },
  {
    href: "/workshop/service-orders",
    label: "Ordens de Serviço",
    icon: ClipboardList,
    roles: ["ADMIN", "MANAGER", "MECHANIC"],
  },
  {
    href: "/manager/customers",
    label: "Clientes",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "MECHANIC"],
  },
  {
    href: "/manager/parts",
    label: "Estoque",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "MECHANIC"],
  },
  {
    href: "/workshop/tools",
    label: "Ferramentas",
    icon: Wrench,
    roles: ["ADMIN", "MANAGER", "MECHANIC"],
  },
  { href: "/admin/users", label: "Usuários", icon: UserCog, roles: ["ADMIN"] },
  { href: "/admin/oficina", label: "Oficina / Orçamento", icon: Store, roles: ["ADMIN"] },
  { href: "/admin/go-live", label: "Go-live", icon: Rocket, roles: ["ADMIN"] },
  {
    href: "/admin/growth",
    label: "Growth",
    icon: TrendingUp,
    roles: ["ADMIN"],
    platformOnly: true,
  },
  { href: "/billing", label: "Assinatura", icon: CreditCard, roles: ["ADMIN"] },
  {
    href: "/ajuda",
    label: "Ajuda",
    icon: HelpCircle,
    roles: ["ADMIN", "MANAGER", "MECHANIC"],
  },
];

export function Sidebar({
  role,
  isPlatformAdmin = false,
}: {
  role: string;
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);
  const brandTextRef = useRef<HTMLSpanElement>(null);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const expanded = useRef(false);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);

  const visible = links
    .filter((l) => l.roles.includes(role))
    .filter((l) => !l.platformOnly || isPlatformAdmin);

  useGSAP(
    () => {
      gsap.set(asideRef.current, { width: COLLAPSED_W });
      gsap.set(brandTextRef.current, { opacity: 0, x: -8 });
      gsap.set(labelsRef.current.filter(Boolean), { opacity: 0, x: -10 });
    },
    { scope: asideRef },
  );

  function openNav() {
    if (expanded.current || !asideRef.current) return;
    expanded.current = true;
    tweenRef.current?.kill();
    const labels = labelsRef.current.filter(Boolean);
    tweenRef.current = gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .to(asideRef.current, { width: EXPANDED_W, duration: 0.38 }, 0)
      .to(brandTextRef.current, { opacity: 1, x: 0, duration: 0.28 }, 0.08)
      .to(labels, { opacity: 1, x: 0, duration: 0.28, stagger: 0.025 }, 0.1);
  }

  function closeNav() {
    if (!expanded.current || !asideRef.current) return;
    expanded.current = false;
    tweenRef.current?.kill();
    const labels = labelsRef.current.filter(Boolean);
    tweenRef.current = gsap
      .timeline({ defaults: { ease: "power3.inOut" } })
      .to(labels, { opacity: 0, x: -10, duration: 0.18, stagger: 0.015 }, 0)
      .to(brandTextRef.current, { opacity: 0, x: -8, duration: 0.18 }, 0)
      .to(asideRef.current, { width: COLLAPSED_W, duration: 0.32 }, 0.05);
  }

  return (
    <>
      <div className="w-[72px] shrink-0" aria-hidden />
      <aside
        ref={asideRef}
        onMouseEnter={openNav}
        onMouseLeave={closeNav}
        onFocusCapture={openNav}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            closeNav();
          }
        }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-line bg-bg-elevated/95 py-4 backdrop-blur-md"
        style={{ width: COLLAPSED_W }}
      >
        <div className="mb-8 flex h-9 items-center gap-3 overflow-hidden px-4">
          <span className="flex size-9 shrink-0 items-center justify-center border border-signal/40 bg-signal/10 font-[family-name:var(--font-mono)] text-sm font-bold text-signal">
            O
          </span>
          <span
            ref={brandTextRef}
            className="whitespace-nowrap font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-ink"
          >
            Oficina
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2">
          {visible.map((link, i) => {
            const Icon = link.icon;
            const active =
              link.href === "/workshop"
                ? pathname === "/workshop"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={cn(
                  "group flex h-11 items-center gap-3 px-2.5 text-sm transition-colors",
                  active
                    ? "border border-signal/30 bg-signal/15 text-signal"
                    : "border border-transparent text-ink-mute hover:border-line hover:bg-bg-soft hover:text-ink",
                )}
              >
                <Icon
                  className="size-[20px] shrink-0"
                  strokeWidth={active ? 2.25 : 1.7}
                  aria-hidden
                />
                <span
                  ref={(el) => {
                    labelsRef.current[i] = el;
                  }}
                  className="whitespace-nowrap"
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
