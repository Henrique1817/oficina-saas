/**
 * Zera o banco e cria a oficina Legacy + dono com acesso total (sem cobrança).
 *
 * Uso (creds reais do Supabase — NÃO commitar senha):
 *   OWNER_PASSWORD='***' \
 *   DATABASE_URL='...' DIRECT_URL='...' \
 *   NEXT_PUBLIC_SUPABASE_URL='...' SUPABASE_SERVICE_ROLE_KEY='...' \
 *   pnpm --filter @oficina/database db:reset-legacy
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.env.OWNER_EMAIL ?? "henrimi4710@gmail.com").trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
const fullName = process.env.OWNER_FULL_NAME ?? "Henrique Miguel";
const orgName = process.env.OWNER_ORG_NAME ?? "Legacy";
const orgSlug = (process.env.OWNER_ORG_SLUG ?? "legacy").toLowerCase();

async function supabaseAdmin(path: string, init: RequestInit & { method: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || url.includes("example.supabase")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY de produção são obrigatórios.",
    );
  }
  const res = await fetch(`${url}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Supabase Auth ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function findUserIdByEmail(): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const data = await supabaseAdmin(`/admin/users?page=${page}&per_page=200`, {
      method: "GET",
    });
    const users = (data as { users?: { id: string; email?: string }[] }).users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (users.length < 200) break;
  }
  return null;
}

async function wipeAll() {
  await prisma.$transaction(async (tx) => {
    await tx.serviceOrderStatusHistory.deleteMany();
    await tx.serviceOrderLabor.deleteMany();
    await tx.serviceOrderLine.deleteMany();
    await tx.toolCheckout.deleteMany();
    await tx.toolMaintenance.deleteMany();
    await tx.inventoryMovement.deleteMany();
    await tx.stockItem.deleteMany();
    await tx.partVehicleFitment.deleteMany();
    await tx.serviceOrder.deleteMany();
    await tx.part.deleteMany();
    await tx.tool.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.vehicleVariant.deleteMany();
    await tx.customer.deleteMany();
    await tx.stockLocation.deleteMany();
    await tx.organizationInvite.deleteMany();
    await tx.membership.deleteMany();
    await tx.platformImpersonationToken.deleteMany();
    await tx.platformAuditLog.deleteMany();
    await tx.platformPipelineStep.deleteMany();
    await tx.platformPipelineRun.deleteMany();
    await tx.platformCronRun.deleteMany();
    await tx.organization.deleteMany();
    await tx.profile.deleteMany();
    await tx.platformUser.deleteMany();
  });
  console.log("Wipe: registros Prisma apagados");
}

async function main() {
  if (!password) {
    throw new Error("Defina OWNER_PASSWORD no ambiente (não commitado).");
  }

  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL!.replace(/^postgresql:/, "http:")).hostname;
    } catch {
      return "?";
    }
  })();
  if (dbHost === "localhost" || dbHost === "127.0.0.1") {
    throw new Error(
      `DATABASE_URL aponta para ${dbHost} — use a connection string do Supabase de produção.`,
    );
  }

  console.log(`DB host: ${dbHost}`);
  console.log(`Criando Legacy para ${email} (${fullName})`);

  await wipeAll();

  let userId = await findUserIdByEmail();
  if (userId) {
    await supabaseAdmin(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    });
    console.log("Auth: usuário atualizado (senha + confirmado)");
  } else {
    const created = (await supabaseAdmin("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    })) as { id?: string; user?: { id: string } };
    userId = created.id ?? created.user?.id;
    if (!userId) throw new Error("Falha ao criar usuário Auth");
    console.log("Auth: usuário criado");
  }

  // Remove outros users Auth? Usuário pediu apagar registros — profiles já foram.
  // Mantém só este e-mail no Auth seria agressivo; opcional via DELETE_OTHER_AUTH=1
  if (process.env.DELETE_OTHER_AUTH === "1") {
    for (let page = 1; page <= 20; page++) {
      const data = await supabaseAdmin(`/admin/users?page=${page}&per_page=200`, {
        method: "GET",
      });
      const users = (data as { users?: { id: string; email?: string }[] }).users ?? [];
      for (const u of users) {
        if (u.email?.toLowerCase() === email) continue;
        await supabaseAdmin(`/admin/users/${u.id}`, { method: "DELETE" });
        console.log(`Auth removido: ${u.email}`);
      }
      if (users.length < 200) break;
    }
  }

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug: orgSlug,
      planStatus: "ACTIVE",
      trialEndsAt: null,
      pastDueAt: null,
      billingExempt: true,
      designPartner: true,
      designPartnerContact: email,
      internalNote: "Dono da plataforma — cortesia permanente (nunca cobrar)",
    },
  });

  await prisma.stockLocation.create({
    data: {
      organizationId: org.id,
      name: "Oficina Principal",
      description: "Estoque geral",
    },
  });

  await prisma.profile.create({
    data: {
      id: userId,
      email,
      fullName,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await prisma.membership.create({
    data: {
      organizationId: org.id,
      userId,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await prisma.platformUser.create({
    data: {
      email,
      userId,
      role: "OWNER",
      active: true,
      invitedByEmail: "reset-legacy",
    },
  });

  console.log("---");
  console.log(`Oficina: ${org.name} (${org.slug}) · ACTIVE · billingExempt=true`);
  console.log(`Usuário: ${email} · ADMIN na org · OWNER no console`);
  console.log("Vercel: PLATFORM_ADMIN_EMAILS deve incluir este e-mail");
  console.log("Login web: /login · Console admin: /login (apps/admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
