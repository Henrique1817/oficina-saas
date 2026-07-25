/**
 * Bootstrap da conta do criador/dono da plataforma.
 * Uso (na raiz, com .env carregado):
 *   pnpm --filter @oficina/database db:bootstrap-owner
 *
 * Env: OWNER_PASSWORD (obrigatório). Demais opcionais.
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.env.OWNER_EMAIL ?? "henrimi4710@gmail.com").trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
const fullName = process.env.OWNER_FULL_NAME ?? "Henrique Miguel";
const orgName = process.env.OWNER_ORG_NAME ?? "Legacy";
const orgSlug = (process.env.OWNER_ORG_SLUG ?? "legacy").toLowerCase();

async function supabaseAdmin(
  path: string,
  init: RequestInit & { method: string },
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
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
  // list users and filter (ok para bootstrap único)
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

async function main() {
  if (!password) {
    throw new Error("Defina OWNER_PASSWORD no ambiente (não commitado).");
  }

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
    console.log("Auth: usuário existente atualizado");
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

  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {
      name: orgName,
      planStatus: "ACTIVE",
      trialEndsAt: null,
      pastDueAt: null,
      mpPayerId: null,
      mpPreapprovalId: null,
      billingExempt: true,
    },
    create: {
      name: orgName,
      slug: orgSlug,
      planStatus: "ACTIVE",
      trialEndsAt: null,
      pastDueAt: null,
      billingExempt: true,
    },
  });
  console.log(`Org: ${org.name} (${org.slug}) ACTIVE + cortesia — sem Mercado Pago/cobrança`);

  await prisma.stockLocation.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Oficina Principal" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Oficina Principal",
      description: "Estoque geral",
    },
  });

  await prisma.profile.upsert({
    where: { id: userId },
    update: { email, fullName, role: UserRole.ADMIN, active: true },
    create: {
      id: userId,
      email,
      fullName,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId } },
    update: { role: UserRole.ADMIN, active: true },
    create: {
      organizationId: org.id,
      userId,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  console.log("Membership: ADMIN");
  console.log(`Login: ${email} → /login (org ${orgSlug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
