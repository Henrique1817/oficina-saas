import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { getAccessToken } from "./env";

let config: MercadoPagoConfig | null = null;

export function getMercadoPagoConfig(): MercadoPagoConfig {
  if (config) return config;
  config = new MercadoPagoConfig({
    accessToken: getAccessToken(),
    options: { timeout: 15_000 },
  });
  return config;
}

export function getPreApprovalClient(): PreApproval {
  return new PreApproval(getMercadoPagoConfig());
}

export function getPaymentClient(): Payment {
  return new Payment(getMercadoPagoConfig());
}

/** GET autorizado_payments/{id} — SDK não expõe client dedicado em todas as versões. */
export async function fetchAuthorizedPayment(id: string): Promise<unknown> {
  const token = getAccessToken();
  const res = await fetch(
    `https://api.mercadopago.com/authorized_payments/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`authorized_payment_fetch_failed:${res.status}:${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchPreApproval(id: string) {
  const client = getPreApprovalClient();
  return client.get({ id });
}

export async function fetchPayment(id: string) {
  const client = getPaymentClient();
  return client.get({ id });
}
