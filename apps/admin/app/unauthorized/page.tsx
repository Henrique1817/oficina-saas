"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Sem acesso ao console</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Contas de oficina (tenants) não entram aqui. Só membros ativos em{" "}
        <code className="text-xs">platform_users</code> (equipe Oficina) — ou e-mails na
        allowlist de bootstrap <code className="text-xs">PLATFORM_ADMIN_EMAILS</code>.
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        Produto das oficinas: use a porta 3000. Este console é só da equipe da plataforma.
      </p>
      <div className="flex gap-4 text-sm">
        <button type="button" onClick={signOut} className="text-primary hover:underline">
          Sair e voltar ao login
        </button>
        <Link href="/login" className="text-muted-foreground hover:underline">
          Login
        </Link>
      </div>
    </main>
  );
}
