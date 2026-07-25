import { NextResponse } from "next/server";
import { prisma } from "@oficina/database";
import { contactSchema } from "@/lib/contact-schema";

export const runtime = "nodejs";

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

  const { name, email, workshop, message } = parsed.data;

  try {
    const lead = await prisma.contactLead.create({
      data: {
        name,
        email,
        workshop,
        message,
        source: "marketing",
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      id: lead.id,
      message:
        "Recebemos sua mensagem. Em breve retornamos pelo e-mail informado.",
    });
  } catch (err) {
    console.error("[marketing/contact] persist failed", err);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Não foi possível registrar sua mensagem agora. Tente de novo em instantes.",
      },
      { status: 503 },
    );
  }
}
