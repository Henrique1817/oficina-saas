"use client";

import { createClient } from "@/lib/supabase/client";
import { ORG_COOKIE } from "@oficina/auth";

function readOrgSlugFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ORG_COOKIE}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  const orgSlug = readOrgSlugFromDocument();
  if (orgSlug) {
    headers.set("x-oficina-org", orgSlug);
  }

  const res = await fetch(path, { ...init, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}
