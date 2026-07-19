"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setBillingExempt } from "./actions";

export function BillingExemptButton({
  organizationId,
  exempt,
  canWrite,
}: {
  organizationId: string;
  exempt: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canWrite) {
    return (
      <span className="text-xs text-muted-foreground">{exempt ? "Cortesia" : "—"}</span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setBillingExempt(organizationId, !exempt);
          router.refresh();
        });
      }}
      className={
        exempt
          ? "rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
          : "rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/25 disabled:opacity-60"
      }
    >
      {pending ? "…" : exempt ? "Remover cortesia" : "Marcar cortesia"}
    </button>
  );
}
