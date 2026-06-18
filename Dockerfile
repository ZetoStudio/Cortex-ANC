# Railway production image — Next.js web app only
FROM oven/bun:1.3.3 AS base
WORKDIR /app

# Workspace manifests (cache layer)
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/agent-core/package.json ./packages/agent-core/
COPY packages/integration-core/package.json ./packages/integration-core/
COPY packages/graph-core/package.json ./packages/graph-core/

COPY . .

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN bun install --frozen-lockfile
RUN bun run build

WORKDIR /app/apps/web

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(j=>process.exit(j.db?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "start"]
