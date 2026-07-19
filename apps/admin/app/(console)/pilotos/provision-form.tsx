"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { provisionPilot } from "./actions";

export function ProvisionPilotForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [contact, setContact] = useState("");
  const [trialDays, setTrialDays] = useState("90");
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setInviteUrl(null);
    startTransition(async () => {
      const result = await provisionPilot({
        name,
        ownerEmail,
        contact: contact || undefined,
        trialDays: Number(trialDays) || 90,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.membershipAttached) {
        setMessage(
          `Piloto criado (${result.slug}). Dono já tinha conta — membership ADMIN ligada.`,
        );
      } else if (result.inviteUrl) {
        setInviteUrl(result.inviteUrl);
        setMessage(`Piloto criado (${result.slug}). Envie o link no WhatsApp:`);
      } else {
        setMessage(`Piloto criado (${result.slug}).`);
      }
      setName("");
      setOwnerEmail("");
      setContact("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Nome da oficina
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Oficina Silva"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          E-mail do dono (ADMIN)
          <input
            required
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="dono@oficina.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Contato WhatsApp
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="(11) 99999-9999"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Trial / cortesia (dias)
          <input
            type="number"
            min={14}
            max={365}
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Criando…" : "Provisionar piloto"}
      </button>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {inviteUrl && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
          <code className="block break-all text-xs text-accent">{inviteUrl}</code>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
          >
            Copiar link
          </button>
        </div>
      )}
    </form>
  );
}
