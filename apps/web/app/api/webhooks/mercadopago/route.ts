import { apiError, apiSuccess } from "@oficina/shared";
import {
  coerceId,
  getWebhookSecret,
  processMercadoPagoWebhook,
  validateMercadoPagoHmac,
  webhookBodySchema,
  webhookQuerySchema,
} from "@/server/modules/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;

export async function GET() {
  return apiSuccess({ ok: true, service: "mercadopago-webhook" });
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error("[mp:webhook] MERCADOPAGO_WEBHOOK_SECRET ausente");
    return apiError("Webhook não configurado", 503, "WEBHOOK_NOT_CONFIGURED");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return apiError("Payload muito grande", 413);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return apiError("Payload muito grande", 413);
  }

  let bodyJson: unknown = {};
  if (rawBody.trim()) {
    try {
      bodyJson = JSON.parse(rawBody);
    } catch {
      return apiError("JSON inválido", 400);
    }
  }

  const url = new URL(request.url);
  const queryParsed = webhookQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  const bodyParsed = webhookBodySchema.safeParse(bodyJson);

  if (!queryParsed.success || !bodyParsed.success) {
    return apiError("Payload inválido", 400);
  }

  const query = queryParsed.data;
  const body = bodyParsed.data;

  const dataIdQuery = coerceId(query["data.id"] ?? query.id);
  const dataIdBody = coerceId(body.data?.id);
  const dataId = dataIdQuery || dataIdBody;

  const hmac = validateMercadoPagoHmac({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataIdQuery,
    dataIdBody,
    secret,
  });

  if (!hmac.ok) {
    console.warn("[mp:webhook] hmac failed", hmac.reason);
    return apiError("Não autorizado", 401, "WEBHOOK_HMAC_INVALID");
  }

  if (!dataId) {
    return apiSuccess({ received: true, ignored: "no_data_id" });
  }

  const topic =
    body.type ||
    body.topic ||
    query.type ||
    query.topic ||
    body.action ||
    query.action ||
    "unknown";

  try {
    await processMercadoPagoWebhook({ topic, dataId });
    return apiSuccess({ received: true });
  } catch (err) {
    console.error("[mp:webhook] internal error", err);
    return apiError("Erro interno", 500, "WEBHOOK_ERROR");
  }
}
