import Link from "next/link";
import { loginUrl, signupUrl, siteConfig, whatsappUrl } from "@/lib/site";

const productLinks = [
  { href: "/funcionalidades", label: "Funcionalidades" },
  { href: "/precos", label: "Preços" },
  { href: "/ajuda", label: "Ajuda / FAQ" },
  { href: "/contato", label: "Contato" },
];

const legalLinks = [
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
];

export function Footer() {
  const wa = whatsappUrl();

  return (
    <footer className="border-t border-line bg-bg-elevated">
      <div className="container-wide section-pad grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[0.12em] uppercase text-ink">
            Oficina
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-dim">
            {siteConfig.tagline}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={signupUrl()}
              className="inline-flex bg-signal px-4 py-2.5 text-xs font-semibold text-bg transition hover:bg-signal-bright"
              data-cursor="hot"
            >
              Trial 14 dias
            </a>
            <a
              href={loginUrl()}
              className="inline-flex border border-line px-4 py-2.5 text-xs text-ink-dim transition hover:border-line-strong hover:text-ink"
              data-cursor="hot"
            >
              Entrar no app
            </a>
          </div>
        </div>

        <div>
          <p className="mono-label text-ink-mute">Produto</p>
          <ul className="mt-4 space-y-2.5">
            {productLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-ink-dim transition hover:text-ink"
                  data-cursor="hot"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {wa ? (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink-dim transition hover:text-ink"
                  data-cursor="hot"
                >
                  WhatsApp vendas
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <p className="mono-label text-ink-mute">Legal</p>
          <ul className="mt-4 space-y-2.5">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-ink-dim transition hover:text-ink"
                  data-cursor="hot"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 font-[family-name:var(--font-mono)] text-[0.65rem] leading-relaxed text-ink-mute">
            Não inclui nesta fase: {siteConfig.excludedScope.join(" · ")}.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-wide flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-mono)] text-[0.65rem] text-ink-mute">
            © {new Date().getFullYear()} Oficina. Produto proprietário.
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[0.65rem] text-ink-mute">
            R$ {siteConfig.priceMonthly}/mês · R$ {siteConfig.priceYearly}/ano · trial{" "}
            {siteConfig.trialDays} dias
          </p>
        </div>
      </div>
    </footer>
  );
}
