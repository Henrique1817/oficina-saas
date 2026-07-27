"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!window.confirm("Cancelar este convite pendente?")) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/invites/${inviteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cancelar");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={cancel}>
        {loading ? "Cancelando..." : "Cancelar"}
      </Button>
      {error && <p className="text-xs text-alert">{error}</p>}
    </div>
  );
}
