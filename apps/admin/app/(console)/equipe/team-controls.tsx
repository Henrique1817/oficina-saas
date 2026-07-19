"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PlatformRole } from "@oficina/database";
import {
  invitePlatformMember,
  setPlatformMemberActive,
  updatePlatformMemberRole,
} from "./actions";
import { PLATFORM_ROLE_LABEL } from "@/lib/roles";

const ROLE_OPTIONS: PlatformRole[] = ["OWNER", "SUPPORT", "FINANCE", "VIEWER"];

export function EquipeInviteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlatformRole>("SUPPORT");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          try {
            await invitePlatformMember(email, role);
            setEmail("");
            setMessage("Membro adicionado / reativado");
            router.refresh();
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Erro");
          }
        });
      }}
    >
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="pessoa@oficina.com"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as PlatformRole)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {PLATFORM_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        Convidar
      </button>
      {message && <p className="w-full text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}

export function EquipeMemberRow({
  id,
  email,
  role,
  active,
  linked,
  canManage,
}: {
  id: string;
  email: string;
  role: PlatformRole;
  active: boolean;
  linked: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!canManage) {
    return (
      <tr className="border-b border-border/40">
        <td className="py-2 pr-3">{email}</td>
        <td className="py-2 pr-3">{PLATFORM_ROLE_LABEL[role]}</td>
        <td className="py-2 pr-3 text-muted-foreground">
          {!active ? "Inativo" : linked ? "Ativo" : "Convite pendente"}
        </td>
        <td className="py-2 text-muted-foreground">—</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/40">
      <td className="py-2 pr-3">
        {email}
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </td>
      <td className="py-2 pr-3">
        <select
          disabled={pending || !active}
          value={role}
          onChange={(e) => {
            const next = e.target.value as PlatformRole;
            setMessage(null);
            startTransition(async () => {
              try {
                await updatePlatformMemberRole(id, next);
                router.refresh();
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Erro");
              }
            });
          }}
          className="rounded border border-border bg-background px-2 py-1 text-sm disabled:opacity-60"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {PLATFORM_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-3 text-muted-foreground">
        {!active ? "Inativo" : linked ? "Ativo" : "Convite pendente"}
      </td>
      <td className="py-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              try {
                await setPlatformMemberActive(id, !active);
                router.refresh();
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Erro");
              }
            });
          }}
          className="text-xs text-primary hover:underline disabled:opacity-60"
        >
          {active ? "Desativar" : "Reativar"}
        </button>
      </td>
    </tr>
  );
}
