import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback do magic link / invite do Supabase Auth.
 * Troca o `code` por sessão e redireciona para `next` (ex.: /invite/{token}).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") || "/workshop";
  const next = nextRaw.startsWith("/") ? nextRaw : "/workshop";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth:callback] exchange failed", error.message);
      const login = new URL("/login", url.origin);
      login.searchParams.set("error", "link_invalido");
      login.searchParams.set("redirect", next);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
