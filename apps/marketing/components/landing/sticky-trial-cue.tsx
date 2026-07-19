"use client";

import { useEffect, useState } from "react";
import { signupUrl, siteConfig } from "@/lib/site";

export function StickyTrialCue() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.85;
      const nearFooter =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 320;
      setVisible(pastHero && !nearFooter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-md transition duration-300 md:hidden",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="font-[family-name:var(--font-mono)] text-[0.65rem] leading-snug text-ink-dim">
          Trial {siteConfig.trialDays} dias · R$ {siteConfig.priceMonthly}/mês
        </p>
        <a
          href={signupUrl()}
          className="shrink-0 bg-signal px-4 py-2.5 text-xs font-semibold text-bg"
          data-cursor="hot"
          tabIndex={visible ? 0 : -1}
        >
          Começar grátis
        </a>
      </div>
    </div>
  );
}
