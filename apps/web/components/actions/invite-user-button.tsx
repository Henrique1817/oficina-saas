"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type InviteResult = { acceptUrl: string; email: string; role: string };

export function InviteUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MECHANIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLink(null);
    try {
      const invite = await apiFetch<InviteResult>("/api/v1/invites", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setLink(invite.acceptUrl);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao convidar");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        Convidar usuário
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-line bg-bg-panel p-4">
      <h2 className="font-semibold">Novo convite</h2>
      {error && <p className="text-sm text-danger">{error}</p>}
      {link && (
        <p className="break-all text-sm text-success">
          Link: <a href={link}>{link}</a>
        </p>
      )}
      <input
        type="email"
        required
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="MECHANIC">Mecânico</option>
        <option value="MANAGER">Gerente</option>
        <option value="ADMIN">Admin</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Criar convite"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </div>
    </form>
  );
}
