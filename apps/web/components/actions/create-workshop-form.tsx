"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type SignupResult = {
  organizationSlug: string;
  checkoutUrl: string | null;
};

export function CreateWorkshopForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<SignupResult>("/api/v1/organizations/signup", {
        method: "POST",
        body: JSON.stringify({ name, interval }),
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      router.push("/onboarding/setup");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar oficina");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      <input
        type="text"
        required
        minLength={2}
        placeholder="Nome da oficina"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <select
        value={interval}
        onChange={(e) => setInterval(e.target.value as "monthly" | "yearly")}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="monthly">Mensal — R$ 97</option>
        <option value="yearly">Anual — R$ 970</option>
      </select>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar e cadastrar cartão"}
      </Button>
    </form>
  );
}
