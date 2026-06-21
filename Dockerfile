# Slim Railway image — Next.js web only (no worker services in the image).
FROM oven/bun:1.3.3 AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/agent-core/package.json ./packages/agent-core/
COPY packages/integration-core/package.json ./packages/integration-core/
COPY packages/graph-core/package.json ./packages/graph-core/

COPY apps/web ./apps/web
COPY packages ./packages
COPY scripts ./scripts
COPY services ./services

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

ENV RAILWAY_ENV=true
ENV NEXT_PUBLIC_SLIM_DEPLOY=true
# Railway injects these at build — bake prod URL into client bundle when present.
ARG NEXT_PUBLIC_APP_URL
ARG BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL

RUN bun install --frozen-lockfile
RUN bunx turbo run build --filter=@cortex/web

FROM oven/bun:1.3.3 AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV RAILWAY_ENV=true
ENV NEXT_PUBLIC_SLIM_DEPLOY=true

COPY --from=builder /app/package.json /app/bun.lock /app/tsconfig.base.json ./
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/services/temporal-worker ./services/temporal-worker
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>r.json()).then(j=>process.exit(j.db?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "start:web"]
