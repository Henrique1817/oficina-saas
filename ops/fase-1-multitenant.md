# Fase 1 — Multi-tenant

## Aplicar migração (obrigatório)

O cliente Prisma já foi gerado. A migração `20260717000000_multi_tenant` precisa rodar no banco:

```bash
# na raiz, com .env carregado (DATABASE_URL + DIRECT_URL)
pnpm --filter @oficina/database exec prisma migrate deploy
pnpm db:seed
```

Se o pooler falhar na porta 5432, use a connection string de **Session mode** do Supabase para `DIRECT_URL`.

## O que entregamos

- Models: `Organization`, `Membership`, `OrganizationInvite` + `organizationId` nos dados de negócio
- Cookie `oficina_org` + header `x-oficina-org`
- Auth/API/páginas filtradas por org
- Convites: `POST /api/v1/invites`, `POST /api/v1/invites/accept`, UI admin + `/invite/[token]`
- Sem membership → `/onboarding`

## Org default (backfill)

- id: `org_default_oficina`
- slug: `oficina-principal`
