"use client";

import Link from "next/link";

export function PastDueBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="mb-6 rounded-lg border border-accent/50 bg-accent/10 px-4 py-3 text-sm">
      Pagamento pendente. Você ainda tem cerca de <strong>{daysLeft} dia(s)</strong> de
      acesso.{" "}
      <Link href="/billing" className="font-medium text-accent underline-offset-2 hover:underline">
        Regularizar assinatura
      </Link>
    </div>
  );
}
