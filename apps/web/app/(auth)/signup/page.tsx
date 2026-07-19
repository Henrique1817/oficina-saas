"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type SignupResult = {
  organizationSlug: string;
  checkoutUrl: string | null;
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw new Error(signUpError.message);
      if (!data.session) {
        throw new Error(
          "Conta criada. Confirme o e-mail (se exigido) e faça login para continuar o cadastro da oficina.",
        );
      }

      const result = await apiFetch<SignupResult>("/api/v1/organizations/signup", {
        method: "POST",
        body: JSON.stringify({ name: workshopName, interval }),
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      router.push(searchParams.get("redirect") ?? "/onboarding/setup");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8"
    >
      <h1 className="text-2xl font-bold">Criar oficina</h1>
      <p className="text-sm text-muted-foreground">
        14 dias grátis. Cartão no cadastro; cobrança automática depois do trial.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <input
        type="text"
        placeholder="Seu nome"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
        minLength={2}
      />
      <input
        type="text"
        placeholder="Nome da oficina"
        value={workshopName}
        onChange={(e) => setWorkshopName(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
        minLength={2}
      />
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
        placeholder="Senha (mín. 6)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2"
        required
        minLength={6}
      />
      <select
        value={interval}
        onChange={(e) => setInterval(e.target.value as "monthly" | "yearly")}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="monthly">Plano mensal — R$ 97/mês</option>
        <option value="yearly">Plano anual — R$ 970/ano</option>
      </select>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Continuar para o cartão"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
      <p className="pt-1 text-center text-xs text-muted-foreground">
        <Link href="/termos" className="hover:underline">
          Termos
        </Link>
        {" · "}
        <Link href="/privacidade" className="hover:underline">
          Privacidade
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
