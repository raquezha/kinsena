# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV CI=true
# Toolchain for better-sqlite3 when no prebuilt binary matches this Node release.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Production dependencies only; the runtime stage stays free of build tools.
FROM base AS prod-deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS build
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ARG APP_VERSION=development
LABEL org.opencontainers.image.title="Kinsena" \
      org.opencontainers.image.version=$APP_VERSION \
      org.opencontainers.image.source="https://github.com/raquezha/kinsena"
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DB_PATH=/app/data/kinsena.db \
    MIGRATIONS_DIR=/app/drizzle
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node drizzle ./drizzle
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 8080
VOLUME /app/data
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/login').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
