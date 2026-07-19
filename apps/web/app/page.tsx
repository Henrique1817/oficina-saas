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
        className="landing-sheen pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 70% 20%, rgba(245, 158, 11, 0.18), transparent 55%),
            radial-gradient(ellipse 70% 50% at 10% 80%, rgba(59, 130, 246, 0.12), transparent 50%),
            linear-gradient(145deg, #0a0e13 0%, #151c26 42%, #1a1520 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -12deg,
            transparent,
            transparent 11px,
            rgba(231, 236, 243, 0.35) 11px,
            rgba(231, 236, 243, 0.35) 12px
          )`,
        }}
      />
      <div
        aria-hidden
        className="landing-pulse-line pointer-events-none absolute left-0 right-0 top-[42%] h-px bg-gradient-to-r from-transparent via-accent to-transparent"
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.2em] text-accent">
          Oficina
        </p>
        <Link
          href="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Entrar
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-6xl flex-col justify-center px-6 pb-20 pt-8">
        <p className="landing-rise font-[family-name:var(--font-display)] text-6xl uppercase leading-none tracking-tight text-foreground sm:text-8xl md:text-9xl">
          Oficina
        </p>
        <h1 className="landing-rise-delay mt-6 max-w-xl text-2xl font-medium leading-snug text-foreground/90 sm:text-3xl">
          A oficina no controle — OS, estoque e orçamento sem planilha.
        </h1>
        <p className="landing-rise-delay-2 mt-4 max-w-md text-base text-muted-foreground">
          14 dias grátis. Cadastre o cartão no início; a cobrança começa só depois do trial.
        </p>
        <div className="landing-rise-delay-2 mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center rounded-lg bg-accent px-7 text-sm font-semibold text-background transition hover:brightness-110"
          >
            Começar trial
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Já tenho conta
          </Link>
        </div>
      </main>
    </div>
  );
}
