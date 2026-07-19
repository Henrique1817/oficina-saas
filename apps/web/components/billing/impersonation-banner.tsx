"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImpersonationBanner({ orgName }: { orgName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function end() {
    setLoading(true);
    await fetch("/api/v1/platform/impersonate/end", { method: "POST" });
    setLoading(false);
    router.push("/workshop");
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
      <p>
        Modo suporte: você está vendo a oficina <strong>{orgName}</strong> como ADMIN.
      </p>
      <button
        type="button"
        onClick={end}
        disabled={loading}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-background disabled:opacity-60"
      >
        {loading ? "Saindo..." : "Encerrar impersonação"}
      </button>
    </div>
  );
}
