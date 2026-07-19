"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loginUrl, signupUrl } from "@/lib/site";

const nav = [
  { href: "/funcionalidades", label: "Produto" },
  { href: "/precos", label: "Preços" },
  { href: "/ajuda", label: "Ajuda" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-b border-line/80 bg-bg/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="container-wide flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[0.18em] uppercase text-ink"
          data-cursor="hot"
          onClick={() => setOpen(false)}
        >
          Oficina
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mono-label text-ink-mute transition-colors hover:text-ink"
              data-cursor="hot"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={loginUrl()}
            className="mono-label text-ink-dim transition-colors hover:text-ink"
            data-cursor="hot"
          >
            Entrar
          </a>
          <a
            href={signupUrl()}
            className="inline-flex items-center bg-signal px-4 py-2 text-xs font-semibold tracking-wide text-bg transition hover:bg-signal-bright"
            data-cursor="hot"
          >
            14 dias grátis
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="flex flex-col gap-1.5">
            <span
              className={[
                "block h-px w-5 bg-ink transition",
                open ? "translate-y-[3.5px] rotate-45" : "",
              ].join(" ")}
            />
            <span
              className={[
                "block h-px w-5 bg-ink transition",
                open ? "-translate-y-[3.5px] -rotate-45" : "",
              ].join(" ")}
            />
          </span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-line bg-bg px-5 pb-8 pt-4 md:hidden"
        >
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-[family-name:var(--font-display)] text-2xl text-ink"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-5">
              <a href={loginUrl()} className="text-ink-dim">
                Entrar
              </a>
              <a
                href={signupUrl()}
                className="inline-flex items-center justify-center bg-signal px-4 py-3 text-sm font-semibold text-bg"
              >
                Começar 14 dias grátis
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
