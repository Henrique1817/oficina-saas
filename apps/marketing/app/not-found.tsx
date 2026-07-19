import Link from "next/link";
import { TrialCta } from "@/components/ui/cta";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-[var(--header-h)] text-center">
      <p className="mono-label text-signal">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ink-dim">
        Volte para a home ou comece o trial direto.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex border border-line-strong px-5 py-3 text-sm text-ink-dim transition hover:border-signal hover:text-signal"
        >
          Ir para home
        </Link>
        <TrialCta />
      </div>
    </div>
  );
}
