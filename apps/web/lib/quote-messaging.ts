import type { WhatsappTemplate } from "@oficina/shared";

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsappTemplate[] = [
  {
    id: "orcamento",
    label: "Orçamento",
    body: [
      "Olá {{customer}}!",
      "Segue o orçamento #{{orderNumber}} do veículo {{plate}} ({{vehicle}}).",
      "Total: {{total}}.",
      "Validade: {{validityDays}} dias.",
      "Qualquer dúvida, fale com a {{workshop}}.",
    ].join("\n"),
  },
  {
    id: "lembrete",
    label: "Lembrete de resposta",
    body: [
      "Oi {{customer}}, tudo bem?",
      "Passando para lembrar do orçamento #{{orderNumber}} ({{plate}}), total {{total}}.",
      "Podemos seguir com o serviço?",
      "{{workshop}}",
    ].join("\n"),
  },
  {
    id: "aprovado",
    label: "Serviço aprovado",
    body: [
      "{{customer}}, recebemos a aprovação do orçamento #{{orderNumber}}.",
      "Vamos cuidar do {{plate}}. Prazo previsto: {{dueAt}}.",
      "Qualquer novidade avisamos por aqui.",
      "{{workshop}}",
    ].join("\n"),
  },
];

export type QuotePlaceholders = {
  customer: string;
  orderNumber: string | number;
  plate: string;
  vehicle: string;
  total: string;
  workshop: string;
  validityDays: string | number;
  dueAt: string;
};

export function parseWhatsappTemplates(raw: unknown): WhatsappTemplate[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_WHATSAPP_TEMPLATES;
  }
  const parsed: WhatsappTemplate[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as WhatsappTemplate).id === "string" &&
      typeof (item as WhatsappTemplate).label === "string" &&
      typeof (item as WhatsappTemplate).body === "string"
    ) {
      parsed.push({
        id: (item as WhatsappTemplate).id,
        label: (item as WhatsappTemplate).label,
        body: (item as WhatsappTemplate).body,
      });
    }
  }
  return parsed.length > 0 ? parsed : DEFAULT_WHATSAPP_TEMPLATES;
}

export function fillQuoteTemplate(body: string, values: QuotePlaceholders): string {
  return body
    .replaceAll("{{customer}}", values.customer)
    .replaceAll("{{orderNumber}}", String(values.orderNumber))
    .replaceAll("{{plate}}", values.plate)
    .replaceAll("{{vehicle}}", values.vehicle)
    .replaceAll("{{total}}", values.total)
    .replaceAll("{{workshop}}", values.workshop)
    .replaceAll("{{validityDays}}", String(values.validityDays))
    .replaceAll("{{dueAt}}", values.dueAt);
}

export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function whatsappUrl(phone: string | null | undefined, text: string) {
  const digits = phone ? digitsOnly(phone) : "";
  const withCountry = digits
    ? digits.startsWith("55")
      ? digits
      : `55${digits}`
    : "";
  const base = withCountry ? `https://wa.me/${withCountry}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
