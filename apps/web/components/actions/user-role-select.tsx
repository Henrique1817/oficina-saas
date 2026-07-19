"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  async function save(next: string) {
    setRole(next);
    setLoading(true);
    try {
      await apiFetch(`/api/v1/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: next }),
      });
      router.refresh();
    } catch {
      setRole(currentRole);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={role}
      disabled={loading}
      onChange={(e) => save(e.target.value)}
      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
    >
      <option value="MECHANIC">MECHANIC</option>
      <option value="MANAGER">MANAGER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}

export function UserRoleSelectHint() {
  return null;
}
