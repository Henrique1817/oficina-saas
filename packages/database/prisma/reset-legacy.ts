/**
 * Wipe total (Auth + DB públicos, exceto _prisma_migrations) e bootstrap Legacy.
 *
 * Uso (raiz):
 *   OWNER_PASSWORD='...' pnpm --filter @oficina/database db:reset-legacy
 *
 * Nunca commitar senha.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, UserRole, PlatformRole } from "@prisma/client";

function loadDotEnv() {
  for (const p of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
    try {
      const text = readFileSync(p, "utf8");
      for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = val;
      }
      return;
    } catch {
      /* next */
    }
  }
}

loadDotEnv();

const prisma = new PrismaClient();

const email = (process.env.OWNER_EMAIL ?? "henrimi4710@gmail.com").trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
const fullName = process.env.OWNER_FULL_NAME ?? "Henrique Miguel";
const orgName = process.env.OWNER_ORG_NAME ?? "Legacy";
const orgSlug = (process.env.OWNER_ORG_SLUG ?? "legacy").toLowerCase();

async function supabaseAdmin(path: string, init: RequestInit & { method: string }) {
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

async function deleteAllAuthUsers() {
  let deleted = 0;
  for (let page = 1; page <= 50; page++) {
    const data = (await supabaseAdmin(`/admin/users?page=${page}&per_page=200`, {
      method: "GET",
    })) as { users?: { id: string; email?: string }[] };
    const users = data.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      await supabaseAdmin(`/admin/users/${u.id}`, { method: "DELETE" });
      deleted += 1;
      console.log(`Auth removido: ${u.email ?? u.id}`);
    }
    if (users.length < 200) break;
  }
  console.log(`Auth: ${deleted} usuário(s) apagado(s)`);
}

async function wipePublicTables() {
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      ) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
  console.log("DB: tabelas public truncadas (migrations preservadas)");
}

async function main() {
  if (!password || password.length < 8) {
    throw new Error("Defina OWNER_PASSWORD (mín. 8 caracteres).");
  }

  console.log("=== 1) Wipe Auth ===");
  await deleteAllAuthUsers();

  console.log("=== 2) Wipe DB ===");
  await wipePublicTables();

  console.log("=== 3) Criar Auth owner ===");
  const created = (await supabaseAdmin("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  })) as { id?: string; user?: { id: string } };
  const userId = created.id ?? created.user?.id;
  if (!userId) throw new Error("Falha ao criar usuário Auth");
  console.log(`Auth: ${email} criado`);

  console.log("=== 4) Legacy + cortesia + ADMIN + Platform OWNER ===");

  // Auth / triggers podem recriar profile ao criar o user — upsert em tudo
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {
      name: orgName,
      planStatus: "ACTIVE",
      trialEndsAt: null,
      pastDueAt: null,
      suspendedAt: null,
      billingExempt: true,
      designPartner: false,
      mpPayerId: null,
      mpPreapprovalId: null,
      internalNote: "Oficina do dono — nunca cobrar (billingExempt permanente).",
    },
    create: {
      name: orgName,
      slug: orgSlug,
      planStatus: "ACTIVE",
      trialEndsAt: null,
      pastDueAt: null,
      suspendedAt: null,
      billingExempt: true,
      designPartner: false,
      internalNote: "Oficina do dono — nunca cobrar (billingExempt permanente).",
    },
  });

  await prisma.stockLocation.upsert({
    where: {
      organizationId_name: { organizationId: org.id, name: "Oficina Principal" },
    },
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

  await prisma.platformUser.upsert({
    where: { email },
    update: {
      userId,
      role: PlatformRole.OWNER,
      active: true,
    },
    create: {
      userId,
      email,
      role: PlatformRole.OWNER,
      active: true,
      invitedByEmail: "bootstrap:reset-legacy",
    },
  });

  console.log(`Org: ${org.name} (${org.slug}) ACTIVE + billingExempt`);
  console.log(`Tenant: ADMIN · Console: OWNER`);
  console.log(`Login: ${email} → produto /login e admin /login`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
