/**
 * Promove um e-mail a ADMIN da oficina + OWNER da plataforma,
 * normaliza e-mails e remove duplicatas (case-insensitive).
 *
 * Uso (com .env de produção):
 *   OWNER_EMAIL=henrimi4710@gmail.com \
 *   ORG_SLUG=oficina-principal \
 *   pnpm --filter @oficina/database db:ensure-admin
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.env.OWNER_EMAIL ?? "henrimi4710@gmail.com").trim().toLowerCase();
const orgSlug = (process.env.ORG_SLUG ?? "oficina-principal").trim().toLowerCase();
const fullName = process.env.OWNER_FULL_NAME ?? "Henrique Miguel";

async function normalizeAndDedupeProfiles() {
  const profiles = await prisma.profile.findMany({
    include: { memberships: true },
    orderBy: { createdAt: "asc" },
  });

  const byLower = new Map<string, typeof profiles>();
  for (const p of profiles) {
    const key = p.email.trim().toLowerCase();
    const list = byLower.get(key) ?? [];
    list.push(p);
    byLower.set(key, list);
  }

  let merged = 0;

  for (const [lower, group] of byLower) {
    // normaliza e-mail do “vencedor”
    const scored = [...group].sort((a, b) => {
      const score = (p: (typeof group)[0]) => {
        let s = 0;
        if (p.email === lower) s += 10;
        if (p.role === "ADMIN") s += 5;
        s += p.memberships.filter((m) => m.role === "ADMIN").length * 3;
        s += p.memberships.length;
        if (p.active) s += 1;
        return s;
      };
      return score(b) - score(a);
    });

    const winner = scored[0]!;
    if (winner.email !== lower) {
      await prisma.profile.update({
        where: { id: winner.id },
        data: { email: lower },
      });
    }

    for (const loser of scored.slice(1)) {
      // move memberships (sem colidir unique org+user)
      for (const m of loser.memberships) {
        const existing = await prisma.membership.findUnique({
          where: {
            organizationId_userId: {
              organizationId: m.organizationId,
              userId: winner.id,
            },
          },
        });
        if (existing) {
          const rank = { ADMIN: 3, MANAGER: 2, MECHANIC: 1 } as const;
          const keepRole =
            rank[existing.role] >= rank[m.role] ? existing.role : m.role;
          await prisma.membership.update({
            where: { id: existing.id },
            data: {
              role: keepRole,
              active: existing.active || m.active,
            },
          });
          await prisma.membership.delete({ where: { id: m.id } });
        } else {
          await prisma.membership.update({
            where: { id: m.id },
            data: { userId: winner.id },
          });
        }
      }

      // FKs Restrict / SetNull — reapontar para o winner
      await prisma.serviceOrderLabor.updateMany({
        where: { mechanicId: loser.id },
        data: { mechanicId: winner.id },
      });
      await prisma.toolCheckout.updateMany({
        where: { checkedOutById: loser.id },
        data: { checkedOutById: winner.id },
      });
      await prisma.serviceOrder.updateMany({
        where: { assignedMechanicId: loser.id },
        data: { assignedMechanicId: winner.id },
      });
      await prisma.inventoryMovement.updateMany({
        where: { createdById: loser.id },
        data: { createdById: winner.id },
      });
      await prisma.serviceOrderStatusHistory.updateMany({
        where: { changedById: loser.id },
        data: { changedById: winner.id },
      });
      await prisma.organizationInvite.updateMany({
        where: { invitedById: loser.id },
        data: { invitedById: winner.id },
      });

      await prisma.profile.delete({ where: { id: loser.id } });
      merged += 1;
      console.log(`Profile duplicado removido: ${loser.email} → ${lower}`);
    }
  }

  return merged;
}

async function normalizeAndDedupePlatformUsers() {
  const rows = await prisma.platformUser.findMany({ orderBy: { createdAt: "asc" } });
  const byLower = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.email.trim().toLowerCase();
    const list = byLower.get(key) ?? [];
    list.push(r);
    byLower.set(key, list);
  }

  let merged = 0;
  for (const [lower, group] of byLower) {
    const winner =
      group.find((g) => g.role === "OWNER") ??
      group.find((g) => g.active) ??
      group[0]!;

    if (winner.email !== lower) {
      await prisma.platformUser.update({
        where: { id: winner.id },
        data: { email: lower },
      });
    }

    for (const loser of group.filter((g) => g.id !== winner.id)) {
      if (loser.userId && !winner.userId) {
        await prisma.platformUser.update({
          where: { id: winner.id },
          data: { userId: loser.userId },
        });
      }
      await prisma.platformUser.delete({ where: { id: loser.id } });
      merged += 1;
      console.log(`PlatformUser duplicado removido: ${loser.email} → ${lower}`);
    }
  }
  return merged;
}

async function normalizeInvites() {
  const invites = await prisma.organizationInvite.findMany();
  let n = 0;
  for (const inv of invites) {
    const lower = inv.email.trim().toLowerCase();
    if (inv.email !== lower) {
      await prisma.organizationInvite.update({
        where: { id: inv.id },
        data: { email: lower },
      });
      n += 1;
    }
  }
  return n;
}

async function main() {
  console.log(`E-mail alvo: ${email}`);
  console.log(`Org slug: ${orgSlug}`);

  const profilesMerged = await normalizeAndDedupeProfiles();
  const platformMerged = await normalizeAndDedupePlatformUsers();
  const invitesFixed = await normalizeInvites();
  console.log(
    `Dedup: ${profilesMerged} profiles, ${platformMerged} platform users, ${invitesFixed} invites normalizados`,
  );

  let org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    org = await prisma.organization.findFirst({
      where: { name: { contains: "Principal", mode: "insensitive" } },
    });
  }
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Oficina Principal",
        slug: orgSlug,
        planStatus: "ACTIVE",
        billingExempt: true,
      },
    });
    await prisma.stockLocation.create({
      data: {
        organizationId: org.id,
        name: "Oficina Principal",
        description: "Estoque geral",
      },
    });
    console.log(`Org criada: ${org.slug}`);
  }

  let profile = await prisma.profile.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!profile) {
    // precisa do UUID do Auth — tenta via Supabase Admin se disponível
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId: string | null = null;

    if (url && key && !url.includes("example.supabase")) {
      for (let page = 1; page <= 20 && !userId; page++) {
        const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });
        if (!res.ok) break;
        const data = (await res.json()) as {
          users?: { id: string; email?: string }[];
        };
        const found = data.users?.find((u) => u.email?.toLowerCase() === email);
        if (found) userId = found.id;
        if ((data.users?.length ?? 0) < 200) break;
      }
    }

    if (!userId) {
      throw new Error(
        `Profile não encontrado para ${email}. Faça login uma vez no app (cria o profile) ou configure SUPABASE_SERVICE_ROLE_KEY.`,
      );
    }

    profile = await prisma.profile.create({
      data: {
        id: userId,
        email,
        fullName,
        role: UserRole.ADMIN,
        active: true,
      },
    });
    console.log("Profile criado a partir do Auth");
  } else {
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        email,
        fullName: profile.fullName || fullName,
        role: UserRole.ADMIN,
        active: true,
      },
    });
    console.log("Profile atualizado → ADMIN");
  }

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: profile.id,
      },
    },
    update: { role: UserRole.ADMIN, active: true },
    create: {
      organizationId: org.id,
      userId: profile.id,
      role: UserRole.ADMIN,
      active: true,
    },
  });
  console.log(`Membership ADMIN em ${org.slug}`);

  // garante stock location
  const loc = await prisma.stockLocation.findFirst({
    where: { organizationId: org.id },
  });
  if (!loc) {
    await prisma.stockLocation.create({
      data: {
        organizationId: org.id,
        name: "Oficina Principal",
        description: "Estoque geral",
      },
    });
  }

  await prisma.platformUser.upsert({
    where: { email },
    update: {
      userId: profile.id,
      role: "OWNER",
      active: true,
    },
    create: {
      email,
      userId: profile.id,
      role: "OWNER",
      active: true,
      invitedByEmail: "ensure-admin",
    },
  });
  console.log("PlatformUser → OWNER (console admin)");

  // sanity: nenhum e-mail duplicado (case-insensitive)
  const dupProfiles = await prisma.$queryRaw<{ email: string; n: bigint }[]>`
    SELECT lower(email) AS email, COUNT(*)::bigint AS n
    FROM profiles
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  `;
  const dupPlatform = await prisma.$queryRaw<{ email: string; n: bigint }[]>`
    SELECT lower(email) AS email, COUNT(*)::bigint AS n
    FROM platform_users
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  `;

  if (dupProfiles.length || dupPlatform.length) {
    console.error("Ainda há duplicatas:", { dupProfiles, dupPlatform });
    process.exit(1);
  }

  console.log("OK — sem e-mails duplicados.");
  console.log(`Login: ${email} · org ${org.slug} · papel ADMIN · console OWNER`);
  console.log("Confirme PLATFORM_ADMIN_EMAILS inclui este e-mail no Vercel/admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
