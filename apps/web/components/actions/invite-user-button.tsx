"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type InviteResult = {
  acceptUrl: string;
  email: string;
  role: string;
  emailSent?: boolean;
  emailChannel?: "resend" | "supabase" | "none";
};

export function InviteUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MECHANIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const invite = await apiFetch<InviteResult>("/api/v1/invites", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setResult(invite);
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
      <p className="text-xs text-ink-mute">
        Enviamos um e-mail mágico (Supabase) personalizado. O convidado entra sem senha e
        aceita o convite. Um e-mail só pode ter um papel nesta oficina.
      </p>
      {error && <p className="text-sm text-alert">{error}</p>}
      {result?.emailSent && (
        <p className="text-sm text-ok">
          E-mail enviado para <strong>{result.email}</strong>
          {result.emailChannel === "supabase" ? " (SMTP Supabase)" : ""}.
        </p>
      )}
      {result && !result.emailSent && (
        <div className="space-y-1 text-sm text-signal">
          <p>
            Convite criado, mas o e-mail não saiu. Configure{" "}
            <code className="text-xs">RESEND_API_KEY</code> (recomendado) ou o SMTP do
            Supabase Auth.
          </p>
          <p className="break-all text-ink-mute">
            Link:{" "}
            <a href={result.acceptUrl} className="text-signal underline">
              {result.acceptUrl}
            </a>
          </p>
        </div>
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
          {loading ? "Enviando..." : "Convidar e enviar e-mail"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </div>
    </form>
  );
}
