# ==============================================================================
# Shogun Projects - Multi-Stage South African Cloud Dockerfile
# Targets:
#   - `api`    : Express REST API + Socket.io Real-Time Gateway
#   - `worker` : BullMQ Background Queue Workers
# Pinned Timezone: Africa/Johannesburg (SAST, UTC+2) | POPIA Compliant
# ==============================================================================

FROM node:20-alpine AS base
RUN apk add --no-cache tzdata openssl ca-certificates && \
    cp /usr/share/zoneinfo/Africa/Johannesburg /etc/localtime && \
    echo "Africa/Johannesburg" > /etc/timezone
ENV TZ=Africa/Johannesburg \
    DEFAULT_TIMEZONE=Africa/Johannesburg \
    NODE_ENV=production
WORKDIR /app/server

# ------------------------------------------------------------------------------
# Stage 1: Install Server Dependencies
# ------------------------------------------------------------------------------
FROM base AS deps
COPY server/package.json server/package-lock.json* ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Generate Prisma Client & Compile TypeScript
# ------------------------------------------------------------------------------
FROM deps AS builder
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/tsconfig.json ./tsconfig.json
COPY server/src ./src
RUN npm run build && npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 3: Production BullMQ Worker Runtime (`worker`)
# ------------------------------------------------------------------------------
FROM base AS worker
ENV TZ=Africa/Johannesburg \
    DEFAULT_TIMEZONE=Africa/Johannesburg \
    DATA_RESIDENCY_REGION=za-jhb \
    ENFORCE_LOCAL_RESIDENCY=true \
    NODE_ENV=production

COPY --from=builder --chown=node:node /app/server/package.json ./package.json
COPY --from=builder --chown=node:node /app/server/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/prisma ./prisma
COPY --from=builder --chown=node:node /app/server/dist ./dist

USER node
CMD ["node", "dist/worker.js"]

# ------------------------------------------------------------------------------
# Stage 4: Production Express + Socket.io API Runtime (`api` - default)
# ------------------------------------------------------------------------------
FROM base AS api
ENV TZ=Africa/Johannesburg \
    DEFAULT_TIMEZONE=Africa/Johannesburg \
    DATA_RESIDENCY_REGION=za-jhb \
    ENFORCE_LOCAL_RESIDENCY=true \
    ENABLE_WORKERS=false \
    PORT=5000 \
    NODE_ENV=production

COPY --from=builder --chown=node:node /app/server/package.json ./package.json
COPY --from=builder --chown=node:node /app/server/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/prisma ./prisma
COPY --from=builder --chown=node:node /app/server/dist ./dist

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/v1/health/residency || exit 1

CMD ["node", "dist/server.js"]
