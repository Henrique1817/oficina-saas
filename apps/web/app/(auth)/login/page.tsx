"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push(searchParams.get("redirect") ?? "/workshop");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Informe o e-mail para recuperar a senha");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/login`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo("Se o e-mail existir, enviamos o link de recuperação.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-md space-y-5 border border-line bg-bg-panel p-8 md:p-10"
    >
      <div>
        <p className="eyebrow">Acesso</p>
        <h1 className="display-lg mt-3 text-3xl text-ink">Oficina</h1>
        <p className="mt-2 text-sm text-ink-dim">Entre para ver o chão da sua oficina.</p>
      </div>
      {error && <p className="text-sm text-alert">{error}</p>}
      {info && <p className="text-sm text-ok">{info}</p>}
      <div>
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          placeholder="voce@oficina.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-xs text-ink-mute hover:text-ink hover:underline"
        onClick={handleForgotPassword}
        disabled={loading}
      >
        Esqueci a senha
      </button>
      <p className="text-center text-sm text-ink-mute">
        Nova oficina?{" "}
        <Link href="/signup" className="text-signal hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="pt-2 text-center font-[family-name:var(--font-mono)] text-[0.65rem] tracking-wider text-ink-mute">
        <Link href="/termos" className="hover:text-ink">
          Termos
        </Link>
        {" · "}
        <Link href="/privacidade" className="hover:text-ink">
          Privacidade
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(232,146,42,0.1),transparent_60%)]"
      />
      <div className="grain opacity-[0.08]" aria-hidden />
      <Suspense fallback={<p className="text-ink-mute">Carregando...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
