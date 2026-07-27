import Link from "next/link";
import {
  isPlatformComingSoon,
  loginUrl,
  signupUrl,
  siteConfig,
  whatsappUrl,
} from "@/lib/site";

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
  const comingSoon = isPlatformComingSoon();

  return (
    <footer className="border-t border-line bg-bg-elevated">
      <div className="container-wide grid gap-8 py-10 sm:gap-10 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12 md:py-16">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[0.12em] uppercase text-ink sm:text-3xl">
            Oficina
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-dim sm:mt-4">
            {siteConfig.tagline}
          </p>
          <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
            {comingSoon ? (
              <>
                <span
                  className="inline-flex w-full cursor-not-allowed items-center justify-center bg-signal/40 px-4 py-3 text-xs font-semibold text-bg sm:w-auto sm:py-2.5"
                  aria-disabled="true"
                  title="Em breve"
                >
                  Em Breve
                </span>
                <span
                  className="inline-flex w-full cursor-not-allowed items-center justify-center border border-line px-4 py-3 text-xs text-ink-mute sm:w-auto sm:py-2.5"
                  aria-disabled="true"
                  title="Em breve"
                >
                  Em Breve
                </span>
              </>
            ) : (
              <>
                <a
                  href={signupUrl()}
                  className="inline-flex w-full items-center justify-center bg-signal px-4 py-3 text-xs font-semibold text-bg transition hover:bg-signal-bright sm:w-auto sm:py-2.5"
                  data-cursor="hot"
                >
                  Trial 14 dias
                </a>
                <a
                  href={loginUrl()}
                  className="inline-flex w-full items-center justify-center border border-line px-4 py-3 text-xs text-ink-dim transition hover:border-line-strong hover:text-ink sm:w-auto sm:py-2.5"
                  data-cursor="hot"
                >
                  Entrar no app
                </a>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:contents">
          <div>
            <p className="mono-label text-ink-mute">Produto</p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
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
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
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
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-wide flex flex-col gap-3 py-4 sm:gap-2 sm:py-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="font-[family-name:var(--font-mono)] text-[0.65rem] text-ink-mute">
              © {new Date().getFullYear()} Oficina. Produto proprietário.
            </p>
            <p className="max-w-xl font-[family-name:var(--font-mono)] text-[0.65rem] leading-relaxed text-ink-mute">
              Não inclui nesta fase: {siteConfig.excludedScope.join(" · ")}.
            </p>
          </div>
          <p className="font-[family-name:var(--font-mono)] text-[0.65rem] text-ink-mute md:text-right">
            R$ {siteConfig.priceMonthly}/mês · R$ {siteConfig.priceYearly}/ano · trial{" "}
            {siteConfig.trialDays} dias
          </p>
        </div>
      </div>
    </footer>
  );
}
