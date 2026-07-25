"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { TrialCta, CtaLink } from "@/components/ui/cta";

gsap.registerPlugin(useGSAP);

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero='brand']", { y: 40, opacity: 0, duration: 0.9 })
        .from("[data-hero='headline']", { y: 48, opacity: 0, duration: 0.95 }, "-=0.55")
        .from("[data-hero='support']", { y: 28, opacity: 0, duration: 0.7 }, "-=0.55")
        .from("[data-hero='ctas']", { y: 24, opacity: 0, duration: 0.65 }, "-=0.45")
        .from("[data-hero='visual']", { scale: 1.06, opacity: 0, duration: 1.2 }, "-=1.05");
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative min-h-[100svh] overflow-hidden pt-[var(--header-h)]"
    >
      {/* Full-bleed visual plane */}
      <div
        data-hero="visual"
        className="absolute inset-0"
        aria-hidden
      >
        <Image
          src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] brightness-[0.38] contrast-[1.05] saturate-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-bg/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60" />
        <div className="grain" />
      </div>

      {/* Atmosphere signal wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-signal/15 blur-3xl"
      />

      <div className="container-wide relative z-10 flex min-h-[calc(100svh-var(--header-h))] flex-col justify-end pb-16 pt-20 md:justify-center md:pb-24 md:pt-10">
        <p
          data-hero="brand"
          className="font-[family-name:var(--font-display)] text-[clamp(3.5rem,14vw,9.5rem)] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-ink"
        >
          Sua Oficina
        </p>

        <h1
          data-hero="headline"
          className="mt-6 max-w-[18ch] text-[clamp(1.6rem,4.2vw,2.85rem)] font-medium leading-[1.15] tracking-[-0.02em] text-ink"
        >
          Pare de gerenciar a oficina no caderno.
        </h1>

        <p
          data-hero="support"
          className="mt-5 max-w-md text-base leading-relaxed text-ink-dim md:text-lg"
        >
          OS, estoque e orçamento no WhatsApp — sem planilha. Trial de 14 dias;
          cobrança só depois.
        </p>

        <div
          data-hero="ctas"
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <TrialCta />
          <CtaLink href="#como-funciona" variant="ghost" external={false}>
            Ver como funciona
          </CtaLink>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent"
      />
    </section>
  );
}
