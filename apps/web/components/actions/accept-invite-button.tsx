"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      router.push("/workshop");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao aceitar convite");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="button" disabled={loading} onClick={accept} className="w-full">
        {loading ? "Aceitando..." : "Aceitar convite"}
      </Button>
    </div>
  );
}
