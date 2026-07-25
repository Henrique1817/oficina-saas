"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const scenes = [
  {
    label: "01 · Agenda do dia",
    title: "Prazos, atrasos e quem está com cada OS",
    body: "Dashboard operacional: o que vence hoje, o que atrasou e o quadro por mecânico — abre a oficina pelo sistema, não pelo caderno.",
    accent: "signal" as const,
  },
  {
    label: "02 · OS + orçamento",
    title: "Orçamento no WhatsApp e autorização do serviço",
    body: "Peças, mão de obra e desconto. Envia PDF/WhatsApp, registra aceite digital ou imprime o termo — do rascunho ao faturado.",
    accent: "ok" as const,
  },
  {
    label: "03 · Estoque no chão",
    title: "Busca rápida, alerta de mínimo, consumo na OS",
    body: "SKU ou nome, entrada/saída em segundos. Reserva e baixa na ordem. Banner quando bater o estoque baixo.",
    accent: "signal" as const,
  },
  {
    label: "04 · Cliente + ferramentas",
    title: "Histórico do cliente e ferramenta na OS",
    body: "Ficha com veículos, OS anteriores e peças usadas. Ferramentas vinculadas à OS aprovada — menos “sumiu na bancada”.",
    accent: "ok" as const,
  },
];

export function ProductScenes() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.utils.toArray<HTMLElement>("[data-scene]").forEach((el) => {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="section-pad border-b border-line"
      aria-labelledby="scenes-heading"
    >
      <div className="container-wide">
        <p className="eyebrow">Produto em cenas</p>
        <h2
          id="scenes-heading"
          className="display-lg mt-4 max-w-[15ch] text-[clamp(2rem,5vw,3.2rem)] text-ink"
        >
          O chão da oficina, no sistema.
        </h2>

        <div className="mt-14 space-y-6">
          {scenes.map((scene, i) => (
            <article
              key={scene.label}
              data-scene
              className={[
                "grid overflow-hidden border border-line md:grid-cols-2",
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : "",
              ].join(" ")}
            >
              <div className="flex flex-col justify-center bg-bg-panel p-8 md:p-12">
                <p
                  className={[
                    "mono-label",
                    scene.accent === "ok" ? "text-ok" : "text-signal",
                  ].join(" ")}
                >
                  {scene.label}
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  {scene.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-ink-dim">
                  {scene.body}
                </p>
              </div>
              <SceneVisual index={i} accent={scene.accent} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SceneVisual({
  index,
  accent,
}: {
  index: number;
  accent: "signal" | "ok";
}) {
  const glow = accent === "ok" ? "bg-ok/10" : "bg-signal/10";
  const line = accent === "ok" ? "via-ok/40" : "via-signal/40";

  return (
    <div
      className="relative min-h-[220px] bg-bg-soft md:min-h-[280px]"
      aria-hidden
    >
      <div className={`absolute inset-0 ${glow}`} />
      <div className="grain opacity-[0.12]" />
      <div
        className={`absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent ${line} to-transparent`}
      />
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-3 font-[family-name:var(--font-mono)] text-[0.65rem] text-ink-mute">
          {index === 0 && (
            <>
              <Row label="Prazo hoje" value="5" hot />
              <Row label="Atrasadas" value="2" hot />
              <Row label="Quadro · João" value="3 OS" />
            </>
          )}
          {index === 1 && (
            <>
              <Row label="OS-1842" value="Em execução" hot />
              <Row label="Orçamento" value="WhatsApp · PDF" />
              <Row label="Autorização" value="Aceite digital" />
            </>
          )}
          {index === 2 && (
            <>
              <Row label="Busca" value="FIL-001 · pastilha" />
              <Row label="Filtro óleo" value="4 un · baixo" hot />
              <Row label="Movimento" value="Entrada · 12 un" />
            </>
          )}
          {index === 3 && (
            <>
              <Row label="Cliente Silva" value="8 OS · R$ 12k" />
              <Row label="Torquímetro #03" value="Na OS-1842" hot />
              <Row label="Equipe" value="Admin · Mecânico" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hot,
}: {
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border border-line bg-bg/70 px-4 py-3">
      <span>{label}</span>
      <span className={hot ? "text-signal" : "text-ink-dim"}>{value}</span>
    </div>
  );
}
