"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const scenes = [
  {
    label: "01 · Dashboard",
    title: "O dia da oficina numa tela",
    body: "OS abertas, estoque baixo, ferramentas em uso e atalhos pro que importa agora.",
    accent: "signal" as const,
  },
  {
    label: "02 · OS + orçamento",
    title: "Orçamento que vende no WhatsApp",
    body: "Linhas de peça e serviço, status da OS e atalho pro WhatsApp — do rascunho ao faturado.",
    accent: "ok" as const,
  },
  {
    label: "03 · Estoque",
    title: "Peça na OS, estoque atualizado",
    body: "Catálogo, locais, movimentos e alerta de estoque baixo. Menos “achismo” na bancada.",
    accent: "signal" as const,
  },
  {
    label: "04 · Ferramentas + equipe",
    title: "Patrimônio e papéis claros",
    body: "Retirada e devolução de ferramentas. Admin, Gerente e Mecânico — cada um no seu escopo.",
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
              <Row label="OS abertas" value="12" hot />
              <Row label="Estoque baixo" value="3" />
              <Row label="Ferramentas fora" value="7" />
            </>
          )}
          {index === 1 && (
            <>
              <Row label="OS-1842" value="Em execução" hot />
              <Row label="Orçamento" value="Enviado · WhatsApp" />
              <Row label="Mão de obra" value="R$ 280" />
            </>
          )}
          {index === 2 && (
            <>
              <Row label="Filtro óleo" value="4 un · abaixo" hot />
              <Row label="Pastilha dianteira" value="18 un" />
              <Row label="Movimento" value="Consumo na OS" />
            </>
          )}
          {index === 3 && (
            <>
              <Row label="Torquímetro #03" value="Com João" hot />
              <Row label="Papel" value="Mecânico" />
              <Row label="Convite" value="Pendente" />
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
