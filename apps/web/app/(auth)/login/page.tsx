"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8"
    >
      <h1 className="text-2xl font-bold">Oficina</h1>
      <p className="text-sm text-muted-foreground">Entre com suas credenciais Supabase</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {info && <p className="text-sm text-success">{info}</p>}
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
        onClick={handleForgotPassword}
        disabled={loading}
      >
        Esqueci a senha
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Nova oficina?{" "}
        <a href="/signup" className="text-primary hover:underline">
          Criar conta
        </a>
      </p>
      <p className="pt-2 text-center text-xs text-muted-foreground">
        <a href="/termos" className="hover:text-foreground hover:underline">
          Termos
        </a>
        {" · "}
        <a href="/privacidade" className="hover:text-foreground hover:underline">
          Privacidade
        </a>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
