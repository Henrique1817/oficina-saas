export const siteConfig = {
  name: "Oficina",
  tagline: "A oficina no controle — OS, estoque e orçamento sem planilha.",
  description:
    "SaaS multi-tenant para oficinas mecânicas brasileiras. Ciclo fechado: clientes, orçamento, OS, estoque e ferramentas — com trial de 14 dias.",
  pitch:
    "Para oficinas pequenas e médias que ainda vivem de planilha, WhatsApp e caderno.",
  priceMonthly: 97,
  priceYearly: 970,
  trialDays: 14,
  currency: "BRL",
  locale: "pt-BR",
  excludedScope: [
    "NF-e",
    "Multi-filial",
    "App mobile nativo",
    "White-label",
  ] as const,
  roles: [
    {
      name: "Admin",
      description: "Tudo: usuários, billing e operação.",
    },
    {
      name: "Gerente",
      description: "Operação completa — cadastros, OS, estoque, ferramentas.",
    },
    {
      name: "Mecânico",
      description: "Operação no chão, com restrições sensatas nas OS.",
    },
  ] as const,
} as const;

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3002"
  );
}

/**
 * Soft launch: CTAs de login/signup ficam "Em Breve".
 * Desligar com NEXT_PUBLIC_PLATFORM_COMING_SOON=false no deploy.
 */
export function isPlatformComingSoon() {
  const v = process.env.NEXT_PUBLIC_PLATFORM_COMING_SOON?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}

export function signupUrl() {
  return `${getAppUrl()}/signup`;
}

export function loginUrl() {
  return `${getAppUrl()}/login`;
}

export function whatsappUrl(message?: string) {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "");
  if (!phone) return null;
  const text =
    message ??
    "Oi! Quero ver uma demonstração do Oficina para a minha oficina.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
