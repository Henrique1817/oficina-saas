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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-ok/35 bg-ok/10 px-4 py-3 text-sm text-ink-dim">
      <p>
        Modo suporte: você está vendo a oficina <strong className="text-ok">{orgName}</strong>{" "}
        como ADMIN.
      </p>
      <button
        type="button"
        onClick={end}
        disabled={loading}
        className="bg-ok px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-60"
      >
        {loading ? "Saindo..." : "Encerrar impersonação"}
      </button>
    </div>
  );
}
