"use client";

import type { ServiceOrder, Customer, Vehicle, ServiceOrderLine, ServiceOrderLabor, Part } from "@oficina/database";
import type { Profile } from "@oficina/database";

type OrderWithRelations = ServiceOrder & {
  customer: Customer;
  vehicle: Vehicle;
  assignedMechanic: Profile | null;
  lines: (ServiceOrderLine & { part: Part | null })[];
  laborEntries: (ServiceOrderLabor & { mechanic: { fullName: string } })[];
};

function money(value: number | { toString(): string }) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

function whatsappQuoteUrl(order: OrderWithRelations) {
  const phone = order.customer.phone ? digitsOnly(order.customer.phone) : "";
  const text = [
    `Olá ${order.customer.name}!`,
    `Segue o orçamento #${order.orderNumber} do veículo ${order.vehicle.plate} (${order.vehicle.vehicleModel}).`,
    `Total: ${money(order.total)}.`,
    "Qualquer dúvida, estamos à disposição.",
  ].join("\n");
  const base = phone ? `https://wa.me/55${phone.replace(/^55/, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function QuotePrintView({ order }: { order: OrderWithRelations }) {
  const sentLabel = order.quoteSentAt
    ? new Date(order.quoteSentAt).toLocaleString("pt-BR")
    : "Rascunho (não enviado)";

  return (
    <div className="quote-print-root min-h-screen bg-white text-black">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .quote-print-root {
            padding: 0;
          }
        }
      `}</style>

      <div className="no-print mx-auto flex max-w-3xl flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Imprimir / Salvar PDF
        </button>
        {order.customer.phone && (
          <a
            href={whatsappQuoteUrl(order)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-green-700 bg-green-50 px-4 py-2 text-sm font-medium text-green-900"
          >
            Enviar no WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          Fechar
        </button>
      </div>

      <article className="mx-auto max-w-3xl p-8 md:p-12">
        <header className="border-b-2 border-black pb-6">
          <p className="text-sm uppercase tracking-widest text-gray-600">Oficina Mecânica</p>
          <h1 className="mt-2 text-3xl font-bold">Orçamento #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-600">Emitido em: {sentLabel}</p>
          {order.quoteApprovedAt && (
            <p className="mt-1 text-sm font-medium text-green-800">
              Aprovado em: {new Date(order.quoteApprovedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </header>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <h2 className="mb-2 font-semibold uppercase text-gray-600">Cliente</h2>
            <p className="font-medium">{order.customer.name}</p>
            {order.customer.phone && <p>{order.customer.phone}</p>}
            {order.customer.email && <p>{order.customer.email}</p>}
          </div>
          <div>
            <h2 className="mb-2 font-semibold uppercase text-gray-600">Veículo</h2>
            <p className="font-mono font-medium">{order.vehicle.plate}</p>
            <p>
              {order.vehicle.vehicleModel}
              {order.vehicle.vehicleYear ? ` (${order.vehicle.vehicleYear})` : ""}
            </p>
            {order.vehicle.color && <p>Cor: {order.vehicle.color}</p>}
            {order.vehicle.reportedIssue && (
              <p className="mt-2 text-gray-700">
                <span className="font-medium">Problema relatado:</span> {order.vehicle.reportedIssue}
              </p>
            )}
          </div>
        </section>

        {order.description && (
          <section className="mt-6 text-sm">
            <h2 className="mb-1 font-semibold">Descrição do serviço</h2>
            <p className="whitespace-pre-wrap text-gray-800">{order.description}</p>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 border-b border-gray-300 pb-1 font-semibold">Itens</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-600">
                <th className="py-2 pr-2">Descrição</th>
                <th className="py-2 pr-2 text-right">Qtd</th>
                <th className="py-2 pr-2 text-right">Unit.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    {line.description}
                    {line.type === "PART" && line.part && (
                      <span className="ml-1 text-gray-500">({line.part.sku})</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right">{Number(line.quantity)}</td>
                  <td className="py-2 pr-2 text-right">{money(line.unitPrice)}</td>
                  <td className="py-2 text-right">{money(line.total)}</td>
                </tr>
              ))}
              {order.laborEntries.map((labor) => (
                <tr key={labor.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    Mão de obra: {labor.description}
                    <span className="ml-1 text-gray-500">({labor.minutes} min)</span>
                  </td>
                  <td className="py-2 pr-2 text-right">1</td>
                  <td className="py-2 pr-2 text-right">{money(labor.total)}</td>
                  <td className="py-2 text-right">{money(labor.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {order.lines.length === 0 && order.laborEntries.length === 0 && (
            <p className="text-gray-500">Nenhum item no orçamento.</p>
          )}
        </section>

        <section className="mt-8 ml-auto w-full max-w-xs text-sm">
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span>Peças</span>
            <span>{money(order.partsTotal)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span>Mão de obra</span>
            <span>{money(order.laborTotal)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between border-b border-gray-200 py-2 text-red-700">
              <span>Desconto</span>
              <span>- {money(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 text-lg font-bold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </section>

        <footer className="mt-12 border-t border-gray-300 pt-6 text-xs text-gray-600">
          <p>Validade do orçamento: 7 dias a partir da data de envio.</p>
          <p className="mt-4">Assinatura do cliente: _________________________________________</p>
          <p className="mt-2">Data: ____/____/________</p>
        </footer>
      </article>
    </div>
  );
}
