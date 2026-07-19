"use client";

import type {
  ServiceOrder,
  Customer,
  Vehicle,
  ServiceOrderLine,
  ServiceOrderLabor,
  Part,
  Profile,
} from "@oficina/database";

type OrderWithRelations = ServiceOrder & {
  customer: Customer;
  vehicle: Vehicle;
  assignedMechanic: Profile | null;
  lines: (ServiceOrderLine & { part: Part | null })[];
  laborEntries: (ServiceOrderLabor & { mechanic: { fullName: string } })[];
};

type WorkshopBrand = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

function money(value: number | { toString(): string }) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AuthorizationPrintView({
  order,
  workshop,
}: {
  order: OrderWithRelations;
  workshop: WorkshopBrand;
}) {
  const authorized = Boolean(order.workAuthorizedAt);
  const issuedAt = order.workAuthorizedAt
    ? new Date(order.workAuthorizedAt).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  return (
    <div className="authz-print-root min-h-screen bg-white text-black">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .authz-print-root {
            padding: 0;
          }
        }
      `}</style>

      <div className="no-print mx-auto flex max-w-3xl flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-sm bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Imprimir / Salvar PDF
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-sm border border-gray-300 px-4 py-2 text-sm"
        >
          Fechar
        </button>
      </div>

      <article className="mx-auto max-w-3xl p-8 md:p-12">
        <header className="border-b-2 border-black pb-6">
          <p className="text-sm uppercase tracking-widest text-gray-600">{workshop.name}</p>
          {(workshop.phone || workshop.email || workshop.address) && (
            <div className="mt-2 space-y-0.5 text-xs text-gray-600">
              {workshop.phone && <p>Tel.: {workshop.phone}</p>}
              {workshop.email && <p>{workshop.email}</p>}
              {workshop.address && (
                <p className="whitespace-pre-wrap">{workshop.address}</p>
              )}
            </div>
          )}
          <h1 className="mt-4 text-3xl font-bold">Autorização de serviço</h1>
          <p className="mt-1 text-sm text-gray-600">OS #{order.orderNumber} · {issuedAt}</p>
          {authorized && (
            <p className="mt-2 text-sm font-medium text-green-800">
              Autorizado digitalmente por {order.workAuthorizedBy}
              {order.workAuthorizedMethod === "print" ? " (via impresso)" : ""}
            </p>
          )}
        </header>

        <section className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-semibold uppercase text-gray-600">Cliente</h2>
            <p className="font-medium">{order.customer.name}</p>
            {order.customer.phone && <p>{order.customer.phone}</p>}
            {order.customer.document && <p>Doc.: {order.customer.document}</p>}
          </div>
          <div>
            <h2 className="mb-2 font-semibold uppercase text-gray-600">Veículo</h2>
            <p className="font-mono font-medium">{order.vehicle.plate}</p>
            <p>
              {order.vehicle.vehicleModel}
              {order.vehicle.vehicleYear ? ` (${order.vehicle.vehicleYear})` : ""}
            </p>
          </div>
        </section>

        {order.description && (
          <section className="mt-6 text-sm">
            <h2 className="mb-1 font-semibold">Serviço solicitado</h2>
            <p className="whitespace-pre-wrap text-gray-800">{order.description}</p>
          </section>
        )}

        <section className="mt-8 text-sm leading-relaxed text-gray-800">
          <h2 className="mb-3 font-semibold">Termo de autorização</h2>
          <p>
            Eu, cliente identificado acima, autorizo a oficina <strong>{workshop.name}</strong> a
            executar os serviços e aplicar as peças/mão de obra descritos nesta ordem de serviço
            nº <strong>{order.orderNumber}</strong>, no veículo informado, no valor estimado de{" "}
            <strong>{money(order.total)}</strong>
            {Number(order.discount) > 0
              ? ` (já considerando desconto de ${money(order.discount)})`
              : ""}
            .
          </p>
          <p className="mt-3">
            Declaro estar ciente de que: (i) o valor pode variar se forem encontradas necessidades
            adicionais, hipótese em que a oficina deverá me comunicar antes de prosseguir, salvo
            emergência de segurança; (ii) peças e serviços listados abaixo fazem parte desta
            autorização; (iii) este documento não constitui nota fiscal.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 border-b border-gray-300 pb-1 font-semibold">Itens autorizados</h2>
          <ul className="space-y-1 text-sm">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between border-b border-gray-100 py-2">
                <span>
                  [{line.type}] {line.description} ×{Number(line.quantity)}
                </span>
                <span>{money(line.total)}</span>
              </li>
            ))}
            {order.laborEntries.map((labor) => (
              <li key={labor.id} className="flex justify-between border-b border-gray-100 py-2">
                <span>
                  Mão de obra: {labor.description} ({labor.minutes} min)
                </span>
                <span>{money(labor.total)}</span>
              </li>
            ))}
          </ul>
          {order.lines.length === 0 && order.laborEntries.length === 0 && (
            <p className="text-gray-500">Nenhum item.</p>
          )}
          <p className="mt-4 text-right text-lg font-bold">Total: {money(order.total)}</p>
        </section>

        {order.workAuthorizedNotes && (
          <section className="mt-6 text-sm">
            <h2 className="mb-1 font-semibold">Observações do aceite</h2>
            <p className="whitespace-pre-wrap text-gray-700">{order.workAuthorizedNotes}</p>
          </section>
        )}

        <footer className="mt-12 grid gap-10 border-t border-gray-300 pt-8 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-8 text-xs uppercase tracking-wider text-gray-500">Cliente</p>
            {authorized ? (
              <>
                <p className="font-medium">{order.workAuthorizedBy}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Aceite {order.workAuthorizedMethod === "digital" ? "digital" : "impresso"} em{" "}
                  {order.workAuthorizedAt
                    ? new Date(order.workAuthorizedAt).toLocaleString("pt-BR")
                    : "—"}
                </p>
              </>
            ) : (
              <>
                <p>Assinatura: _______________________________</p>
                <p className="mt-4">Nome: ___________________________________</p>
                <p className="mt-4">Data: ____/____/________</p>
              </>
            )}
          </div>
          <div>
            <p className="mb-8 text-xs uppercase tracking-wider text-gray-500">Oficina</p>
            <p>Responsável: _____________________________</p>
            <p className="mt-4">{workshop.name}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
