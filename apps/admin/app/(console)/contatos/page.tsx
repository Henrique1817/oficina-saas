import { prisma, type ContactLeadStatus } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { markContactLeadStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ContactLeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  ARCHIVED: "Arquivado",
};

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim().toUpperCase() ?? "";
  const status =
    statusRaw === "NEW" || statusRaw === "CONTACTED" || statusRaw === "ARCHIVED"
      ? (statusRaw as ContactLeadStatus)
      : undefined;

  const leads = await prisma.contactLead.findMany({
    where: {
      AND: [
        status ? { status } : {},
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { workshop: { contains: q, mode: "insensitive" } },
                { message: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Contatos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensagens do formulário /contato do site marketing (Supabase)
        </p>
      </div>

      <Card>
        <form method="get" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Nome, e-mail, oficina ou mensagem"
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="NEW">Novo</option>
            <option value="CONTACTED">Contatado</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Filtrar
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Leads ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
        ) : (
          <ul className="space-y-4">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="border-b border-border/40 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {lead.name}{" "}
                      <span className="text-muted-foreground">· {lead.workshop}</span>
                    </p>
                    <p className="text-sm">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-accent hover:underline"
                      >
                        {lead.email}
                      </a>
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {lead.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {STATUS_LABEL[lead.status]} ·{" "}
                      {lead.createdAt.toLocaleString("pt-BR")} · {lead.source}
                    </p>
                  </div>
                  <form action={markContactLeadStatus} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={lead.id} />
                    {lead.status !== "CONTACTED" ? (
                      <button
                        type="submit"
                        name="status"
                        value="CONTACTED"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        Marcar contatado
                      </button>
                    ) : null}
                    {lead.status !== "ARCHIVED" ? (
                      <button
                        type="submit"
                        name="status"
                        value="ARCHIVED"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        Arquivar
                      </button>
                    ) : null}
                    {lead.status !== "NEW" ? (
                      <button
                        type="submit"
                        name="status"
                        value="NEW"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        Reabrir
                      </button>
                    ) : null}
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
