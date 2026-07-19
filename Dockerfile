# syntax=docker/dockerfile:1

# Oficina — imagem de produção (Next.js standalone + Prisma)
# Build: docker compose build
# Run:   docker compose up -d

ARG NODE_VERSION=20

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ─── Dependências ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .

# Prisma generate não precisa de DB real
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"

# NEXT_PUBLIC_* entram no bundle — passar no build (compose/args)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @oficina/database db:generate \
  && pnpm --filter @oficina/web build \
  && CLIENT_SRC=$(find /app/node_modules/.pnpm -type d -path "*/node_modules/.prisma/client" | head -1) \
  && if [ -z "$CLIENT_SRC" ]; then echo "Prisma .prisma/client not found" >&2; exit 1; fi \
  && PNPM_PKG=$(echo "$CLIENT_SRC" | sed -n 's|.*/\.pnpm/\(@prisma+client@[^/]*\)/.*|\1|p') \
  && DEST="/app/apps/web/.next/standalone/node_modules/.pnpm/${PNPM_PKG}/node_modules" \
  && mkdir -p "$DEST" /app/apps/web/.next/standalone/tmp/prisma-engines \
  && cp -a "$(dirname "$CLIENT_SRC")" "$DEST/" \
  && cp -a "$CLIENT_SRC"/libquery_engine* /app/apps/web/.next/standalone/tmp/prisma-engines/ 2>/dev/null || true \
  && ls -la "$DEST/.prisma/client" | head \
  && echo "Copied Prisma engines via $PNPM_PKG"

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && npm install -g prisma@6.19.3

WORKDIR /app

# Standalone preserva a árvore do monorepo
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Schema + migrations para migrate no boot
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./packages/database/prisma

COPY --chown=nextjs:nodejs docker/entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
WORKDIR /app/apps/web
ENTRYPOINT ["/app/entrypoint.sh"]
