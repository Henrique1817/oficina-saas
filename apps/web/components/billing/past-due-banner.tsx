"use client";

import Link from "next/link";

export function PastDueBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="mb-6 border border-signal/40 bg-signal/10 px-4 py-3 text-sm text-ink-dim">
      Pagamento pendente. Você ainda tem cerca de{" "}
      <strong className="text-signal">{daysLeft} dia(s)</strong> de acesso.{" "}
      <Link href="/billing" className="font-semibold text-signal underline-offset-2 hover:underline">
        Regularizar assinatura
      </Link>
    </div>
  );
}
