import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/workshop");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_90%_-10%,rgba(232,146,42,0.14),transparent_55%),radial-gradient(ellipse_60%_40%_at_-5%_100%,rgba(184,242,74,0.06),transparent_50%)]"
      />
      <div className="grain opacity-[0.1]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[42%] h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent"
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold uppercase tracking-[0.18em] text-ink">
          Oficina
        </p>
        <Link
          href="/login"
          className="mono-label text-ink-mute transition-colors hover:text-signal"
        >
          Entrar
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-6xl flex-col justify-center px-6 pb-20 pt-8">
        <p className="landing-rise font-[family-name:var(--font-display)] text-[clamp(3.5rem,14vw,9rem)] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-ink">
          Oficina
        </p>
        <h1 className="landing-rise-delay mt-6 max-w-[18ch] text-[clamp(1.5rem,3.5vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.02em] text-ink">
          Pare de gerenciar a oficina no caderno.
        </h1>
        <p className="landing-rise-delay-2 mt-5 max-w-md text-base leading-relaxed text-ink-dim">
          OS, estoque e orçamento no WhatsApp — sem planilha. Trial de 14 dias; cobrança só
          depois.
        </p>
        <div className="landing-rise-delay-2 mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center bg-signal px-7 py-3.5 text-sm font-semibold tracking-wide text-bg transition hover:bg-signal-bright"
          >
            Começar 14 dias grátis
          </Link>
          <Link
            href="/login"
            className="border border-line-strong px-6 py-3.5 text-sm text-ink-dim transition hover:border-signal hover:text-signal"
          >
            Já tenho conta
          </Link>
        </div>
      </main>
    </div>
  );
}
