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
      className="relative w-full max-w-md space-y-5 border border-line bg-bg-panel p-8 md:p-10"
    >
      <div>
        <p className="eyebrow">Trial · 14 dias</p>
        <h1 className="display-lg mt-3 text-3xl text-ink">Criar oficina</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-dim">
          Cartão no cadastro; cobrança automática só depois do trial.
        </p>
      </div>
      {error && <p className="text-sm text-alert">{error}</p>}
      <div>
        <label htmlFor="signup-name">Seu nome</label>
        <input
          id="signup-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div>
        <label htmlFor="signup-workshop">Nome da oficina</label>
        <input
          id="signup-workshop"
          type="text"
          value={workshopName}
          onChange={(e) => setWorkshopName(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div>
        <label htmlFor="signup-email">E-mail</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="signup-password">Senha</label>
        <input
          id="signup-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div>
        <label htmlFor="signup-plan">Plano</label>
        <select
          id="signup-plan"
          value={interval}
          onChange={(e) => setInterval(e.target.value as "monthly" | "yearly")}
        >
          <option value="monthly">Mensal — R$ 97/mês</option>
          <option value="yearly">Anual — R$ 970/ano</option>
        </select>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Continuar para o cartão"}
      </Button>
      <p className="text-center text-sm text-ink-mute">
        Já tem conta?{" "}
        <Link href="/login" className="text-signal hover:underline">
          Entrar
        </Link>
      </p>
      <p className="pt-1 text-center font-[family-name:var(--font-mono)] text-[0.65rem] tracking-wider text-ink-mute">
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

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(232,146,42,0.1),transparent_60%)]"
      />
      <div className="grain opacity-[0.08]" aria-hidden />
      <Suspense fallback={<p className="text-ink-mute">Carregando...</p>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
