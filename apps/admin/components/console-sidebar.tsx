"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Activity,
  LifeBuoy,
  ScrollText,
  LogOut,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { PlatformRole } from "@oficina/database";
import { PLATFORM_ROLE_LABEL } from "@/lib/roles";

gsap.registerPlugin(useGSAP);

const COLLAPSED_W = 72;
const EXPANDED_W = 232;

const links: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/oficinas", label: "Oficinas", icon: Building2 },
  { href: "/pilotos", label: "Pilotos", icon: Rocket },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/saude", label: "Saúde", icon: Activity },
  { href: "/suporte", label: "Suporte", icon: LifeBuoy },
  { href: "/audit", label: "Audit", icon: ScrollText },
  { href: "/equipe", label: "Equipe", icon: Users },
];

export function ConsoleSidebar({
  email,
  role,
}: {
  email: string;
  role: PlatformRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const asideRef = useRef<HTMLElement>(null);
  const brandTextRef = useRef<HTMLSpanElement>(null);
  const footerTextRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const logoutLabelRef = useRef<HTMLSpanElement>(null);
  const expanded = useRef(false);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      gsap.set(asideRef.current, { width: COLLAPSED_W });
      gsap.set(brandTextRef.current, { opacity: 0, x: -8 });
      gsap.set(footerTextRef.current, { opacity: 0, x: -8 });
      gsap.set(logoutLabelRef.current, { opacity: 0, x: -10 });
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
      .to(footerTextRef.current, { opacity: 1, x: 0, duration: 0.28 }, 0.08)
      .to(labels, { opacity: 1, x: 0, duration: 0.28, stagger: 0.025 }, 0.1)
      .to(logoutLabelRef.current, { opacity: 1, x: 0, duration: 0.28 }, 0.12);
  }

  function closeNav() {
    if (!expanded.current || !asideRef.current) return;
    expanded.current = false;
    tweenRef.current?.kill();
    const labels = labelsRef.current.filter(Boolean);
    tweenRef.current = gsap
      .timeline({ defaults: { ease: "power3.inOut" } })
      .to(labels, { opacity: 0, x: -10, duration: 0.18, stagger: 0.015 }, 0)
      .to(logoutLabelRef.current, { opacity: 0, x: -10, duration: 0.18 }, 0)
      .to(brandTextRef.current, { opacity: 0, x: -8, duration: 0.18 }, 0)
      .to(footerTextRef.current, { opacity: 0, x: -8, duration: 0.18 }, 0)
      .to(asideRef.current, { width: COLLAPSED_W, duration: 0.32 }, 0.05);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Reserva só o rail recolhido — o aside expandido flutua por cima */}
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
        className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-border bg-card/95 py-4 shadow-[4px_0_24px_rgba(0,0,0,0.25)] backdrop-blur-md"
        style={{ width: COLLAPSED_W }}
      >
        <div className="mb-8 flex h-9 items-center gap-3 overflow-hidden px-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-[family-name:var(--font-ibm-plex)] text-sm font-bold text-accent">
            O
          </span>
          <span
            ref={brandTextRef}
            className="whitespace-nowrap font-[family-name:var(--font-ibm-plex)] text-lg font-semibold tracking-tight text-accent"
          >
            Console
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-2">
          {links.map((link, i) => {
            const Icon = link.icon;
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className="size-[22px] shrink-0"
                  strokeWidth={active ? 2.25 : 1.85}
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

        <div className="mt-auto space-y-2 overflow-hidden border-t border-border px-2 pt-3">
          <div ref={footerTextRef} className="px-2.5">
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <p className="text-[11px] uppercase tracking-wide text-accent">
              {PLATFORM_ROLE_LABEL[role]}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair"
            className="flex h-11 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[22px] shrink-0" strokeWidth={1.85} aria-hidden />
            <span ref={logoutLabelRef} className="whitespace-nowrap">
              Sair
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
