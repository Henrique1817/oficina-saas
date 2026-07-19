import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Acesso negado</h1>
      <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
      <Link href="/workshop" className="text-primary underline">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
