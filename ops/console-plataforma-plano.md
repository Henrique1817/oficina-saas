# Console da Plataforma — Plano por fases

Painel administrativo **separado do produto das oficinas**, para a equipe Oficina (Henrique / empresa) controlar tenants, cobrança, métricas e suporte.

## Princípios (não negociar cedo)

1. **Monorepo**: `apps/admin` + `apps/web` compartilham `packages/database`, auth e billing — **sem** backend HTTP separado.
2. **Domínio próprio**: `admin.*` (ou porta Docker `3001`) — nunca misturar UX de oficina com console.
3. **Acesso só equipe**: tabela `PlatformUser` (ou evolução de `PLATFORM_ADMIN_EMAILS`) — RBAC interno (OWNER / SUPPORT / FINANCE / VIEWER).
4. **Impersonação auditada**: “entrar como oficina X” só com log + motivo.
5. Critério de cada fase = **usado em produção**, não só código mergeado.

### Estado atual (ponto de partida)

- Produto oficinas: `apps/web` (Docker :3000)
- Embrião: `/admin/growth` (MRR, lista orgs, scorecard) gated por `PLATFORM_ADMIN_EMAILS`
- Dados: `Organization.planStatus`, IDs Mercado Pago (`mpPayerId`, `mpPreapprovalId`), memberships, crons de trial/dunning

---

## Fase A — Fundação do console (`apps/admin`)

**Meta:** app isolado sobe, login só da equipe, shell próprio.

| Entrega | Detalhe |
|---------|---------|
| App | `apps/admin` (Next.js) no Turborepo + Docker service `admin` (:3001) |
| Auth | Mesmo Supabase; allowlist → depois `PlatformUser` |
| Layout | Sidebar console (não reutilizar sidebar da oficina) |
| Home | Redirect para overview; 403 se não for platform user |
| Docs | `ops/console-plataforma.md` — como acessar local/prod |

**Critério de saída**

- [x] `docker compose up` sobe `web` + `admin`
- [x] henrimi4710@… entra no admin; usuário de oficina **não** entra
- [x] Zero links do console apontando para UI de OS/estoque como “home”

**Status:** Fase A entregue — ver `ops/console-plataforma.md`.

**Não fazer nesta fase:** CRUD pesado, sync UI Mercado Pago live.

---

## Fase B — Oficinas (tenants)

**Meta:** ver e operar todas as oficinas cadastradas.

| Entrega | Detalhe |
|---------|---------|
| Lista | Nome, slug, status plano, criada em, #membros, #OS, #clientes, busca/filtro |
| Detalhe | Dados org, trial/pastDue, IDs MP payer/preapproval (link painel Mercado Pago) |
| Ações | Ativar / suspender acesso (flag ou `planStatus`), estender trial, nota interna |
| Impersonate | “Abrir como ADMIN da org” com cookie/session scoped + audit log |

**Critério de saída**

- [x] Encontrar Legacy e qualquer trial em &lt; 10 s
- [x] Suspender org de teste e confirmar bloqueio no `web`
- [x] Impersonate gera registro em `PlatformAuditLog`

**Status:** Fase B entregue.

---

## Fase C — Pagamentos e receita

**Meta:** visão financeira sem abrir o Mercado Pago a cada dúvida.

| Entrega | Detalhe |
|---------|---------|
| Dashboard $ | MRR estimado, ACTIVE, TRIALING, PAST_DUE, CANCELED, churn 30d |
| Lista cobrança | Orgs com `mpPreapprovalId`, status, trialEndsAt, pastDueAt |
| Ações | Link `/billing` (cancelar assinatura); marcar “cortesia” (`billingExempt` se ainda não existir) |
| Alertas | Fila PAST_DUE + trials acabando (reuso da lógica dos crons) |

**Critério de saída**

- [x] Números batem com `/admin/growth` atual (± MRR)
- [x] PAST_DUE e trials &lt; 3 dias visíveis em um painel
- [x] Org cortesia não recebe dunning / não é bloqueada

**Status:** Fase C entregue — ver `ops/console-plataforma.md`.

---

## Fase D — Equipe da plataforma (sua empresa)

**Meta:** controlar quem da Oficina pode o quê no console.

| Entrega | Detalhe |
|---------|---------|
| Model | `PlatformUser` (userId/email, role, active) |
| Roles | `OWNER` · `SUPPORT` · `FINANCE` · `VIEWER` |
| UI | Convidar / desativar membros da equipe |
| Permissões | SUPPORT: tenants+impersonate; FINANCE: $; OWNER: tudo; VIEWER: read-only |
| Migrar | `PLATFORM_ADMIN_EMAILS` → seed inicial OWNER |

**Critério de saída**

- [x] Segundo e-mail da equipe com role SUPPORT (sem poder cortesia global)
- [x] VIEWER não suspende org nem vê ações destrutivas

**Status:** Fase D entregue — ver `ops/console-plataforma.md`.

---

## Fase E — Dashboards e saúde do produto

**Meta:** decidir com dados, não com feeling.

| Entrega | Detalhe |
|---------|---------|
| Aquisição | Signups / semana, conversão trial→pago |
| Uso | OS criadas, orgs ativas (login recente se houver), estoque/OS por tenant top |
| Autonomia | Status crons (último run), Resend/Mercado Pago configurados (scorecard) |
| Ops | Fricção / go-live checklist agregado (opcional, CSV → DB depois) |

**Critério de saída**

- [x] Ritual semanal 15 min só no console (sem `ops/metrics.csv` manual, ou export 1-click)
- [x] Meta 15–20 ACTIVE legível no overview

**Status:** Fase E entregue — ver `ops/console-plataforma.md`.

---

## Fase F — Suporte, risco e endurecimento

**Meta:** operar como SaaS de verdade.

| Entrega | Detalhe |
|---------|---------|
| Suporte | Busca por e-mail/slug; timeline (signup, trial, pagamentos, impersonates) |
| Segurança | Rate limit admin, 2FA recomendado Supabase, IP allowlist opcional |
| Audit | Tela de logs (quem suspendeu / impersonou / estendeu trial) |
| Hardening | Separar cookie/session do `web`; CSP; sem service role no browser |

**Critério de saída**

- [x] Qualquer ação sensível auditável
- [x] Console inacessível a tenants mesmo com URL direta

**Status:** Fase F entregue — ver `ops/console-plataforma.md`.

MVP do console (**A→F**) completo.

---

## Ordem e esforço (estimativa)

| Fase | Foco | Esforço relativo |
|------|------|------------------|
| **A** | App + auth equipe | Pequeno |
| **B** | Tenants + impersonate | Médio |
| **C** | $ / Mercado Pago visão | Médio |
| **D** | RBAC equipe | Pequeno–médio |
| **E** | Dashboards | Médio |
| **F** | Hardening | Contínuo / médio |

Sugestão: **A → B → C** (MVP do console) → **D** → **E** → **F**.

---

## Arquitetura alvo (MVP)

```
apps/web     → produto oficinas (clientes)
apps/admin   → console plataforma (equipe)
packages/database  → Prisma + models PlatformUser, PlatformAuditLog
packages/auth      → helpers isPlatformUser / requirePlatformRole
```

Docker Compose:

```yaml
web:   :3000
admin: :3001   # mesmo .env Supabase/DB; NEXT_PUBLIC_APP_URL distinto
```

---

## Fora de escopo (por enquanto)

- Microserviço backend separado
- App mobile do console
- BI externo (Metabase) — só se Fase E saturar
- Multi-região / read replicas

---

## Próximo passo de execução

**Fases A–F entregues** (MVP do console). Evoluções opcionais: Metabase/BI, IP allowlist em prod, MFA obrigatório via policy Supabase.
