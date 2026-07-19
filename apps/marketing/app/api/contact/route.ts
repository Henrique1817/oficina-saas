import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Dados inválidos.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Soft launch: valida e registra no server log.
  // Integre Resend/CRM aqui quando o canal de vendas estiver pronto.
  console.info("[marketing/contact]", {
    at: new Date().toISOString(),
    name: parsed.data.name,
    email: parsed.data.email,
    workshop: parsed.data.workshop,
    messageLength: parsed.data.message.length,
  });

  return NextResponse.json({
    ok: true,
    message: "Recebemos sua mensagem. Em breve retornamos pelo e-mail informado.",
  });
}
