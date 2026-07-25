import Link from "next/link";
import { Card } from "@/components/ui/card";
import { searchSupport } from "@/lib/support";
import { STATUS_LABEL } from "@/lib/billing-metrics";

export const dynamic = "force-dynamic";

export default async function SuportePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const { orgs, profiles } = query.length >= 2 ? await searchSupport(query) : { orgs: [], profiles: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Suporte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busca por e-mail, nome, slug ou ID Mercado Pago · abra a oficina para a timeline
        </p>
      </div>

      <Card>
        <form method="get" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="ex.: legacy, henri@, preapproval_…"
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Buscar
          </button>
        </form>
        {query.length > 0 && query.length < 2 && (
          <p className="mt-2 text-xs text-muted-foreground">Digite ao menos 2 caracteres</p>
        )}
      </Card>

      {query.length >= 2 && (
        <>
          <Card>
            <h2 className="mb-3 font-semibold">Oficinas ({orgs.length})</h2>
            {orgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma oficina</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {orgs.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2"
                  >
                    <div>
                      <Link href={`/oficinas/${o.id}`} className="font-medium hover:underline">
                        {o.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{o.slug}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{STATUS_LABEL[o.planStatus]}</p>
                      <p>
                        {o._count.memberships} membros · {o._count.serviceOrders} OS
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Pessoas ({profiles.length})</h2>
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum perfil</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {profiles.map((p) => (
                  <li key={p.id} className="border-b border-border/40 pb-2">
                    <p className="font-medium">
                      {p.fullName}{" "}
                      <span className="font-normal text-muted-foreground">({p.email})</span>
                    </p>
                    {p.memberships.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem membership ativa</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5 text-xs">
                        {p.memberships.map((m) => (
                          <li key={m.id}>
                            <Link
                              href={`/oficinas/${m.organization.id}`}
                              className="text-primary hover:underline"
                            >
                              {m.organization.name}
                            </Link>{" "}
                            · {STATUS_LABEL[m.organization.planStatus]} · {m.role}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
