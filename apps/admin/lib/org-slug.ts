import { prisma } from "@oficina/database";

function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "oficina";
}

export async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
