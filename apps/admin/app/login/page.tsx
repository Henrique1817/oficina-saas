"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push(searchParams.get("redirect") ?? "/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-lg"
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">Console</p>
        <h1 className="mt-1 font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold">
          Oficina
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso exclusivo da equipe da plataforma
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Recomendado: ativar MFA (2FA) na conta no Supabase Auth.
        </p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
        autoComplete="current-password"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar no console"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #a78bfa33, transparent 50%), radial-gradient(ellipse at 80% 80%, #38bdf833, transparent 45%)",
        }}
      />
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
