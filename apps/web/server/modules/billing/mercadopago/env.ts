/**
 * Ambiente Mercado Pago — padrão SigmaCode (Pack_Stud).
 * Secrets só no servidor; nunca expor ACCESS_TOKEN / WEBHOOK_SECRET no client.
 */

export type MercadoPagoMode = "production" | "sandbox";

function trimUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL não configurado");
  return trimUrl(url);
}

export function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token || token.includes("placeholder") || token.length < 20) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }
  return token;
}

/**
 * Obrigatório em produção. Em desenvolvimento pode faltar (webhook local via ngrok).
 */
export function getWebhookSecret(): string | null {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret || secret.includes("placeholder")) return null;
  return secret;
}

/**
 * `MERCADOPAGO_USE_SANDBOX`:
 * - `"true"` → sandbox
 * - `"false"` → nunca sandbox
 * - fallback legado: token `TEST-` só se flag ≠ `"false"`
 */
export function useSandbox(): boolean {
  const flag = process.env.MERCADOPAGO_USE_SANDBOX?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  try {
    const token = getAccessToken();
    return token.startsWith("TEST-");
  } catch {
    return false;
  }
}

export function getMercadoPagoMode(): MercadoPagoMode {
  return useSandbox() ? "sandbox" : "production";
}

export function isMercadoPagoConfigured(): boolean {
  try {
    getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export function getMercadoPagoEnv() {
  return {
    accessToken: getAccessToken(),
    webhookSecret: getWebhookSecret(),
    appUrl: getAppUrl(),
    sandbox: useSandbox(),
    mode: getMercadoPagoMode(),
  };
}
