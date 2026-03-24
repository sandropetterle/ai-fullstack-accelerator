# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:25-alpine@sha256:5209bcaca9836eb3448b650396213dbe9d9a34d31840c2ae1f206cb2986a8543 AS deps

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# ── Stage 2: Dev (used by docker-compose for local development) ──────────────
FROM deps AS dev

COPY . .

# npm run develop will build + watch automatically
CMD ["npm", "run", "develop"]

# ── Stage 3: Build (production build) ────────────────────────────────────────
FROM deps AS build

COPY . .

# Build requires APP_KEYS at minimum — passed via build args in CI
ARG APP_KEYS=""
ARG API_TOKEN_SALT=""
ARG ADMIN_JWT_SECRET=""
ARG TRANSFER_TOKEN_SALT=""
ARG JWT_SECRET=""
ENV APP_KEYS=${APP_KEYS}
ENV API_TOKEN_SALT=${API_TOKEN_SALT}
ENV ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
ENV TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}
ENV JWT_SECRET=${JWT_SECRET}

RUN npm run build

# ── Stage 4: Production ─────────────────────────────────────────────────────
FROM node:25-alpine@sha256:5209bcaca9836eb3448b650396213dbe9d9a34d31840c2ae1f206cb2986a8543 AS production

WORKDIR /app

# Non-root user for security (same pattern as backend)
RUN addgroup -S strapi && adduser -S strapi -G strapi

# Copy built artifacts
COPY --from=build --chown=strapi:strapi /app/dist ./dist
COPY --from=build --chown=strapi:strapi /app/node_modules ./node_modules
COPY --from=build --chown=strapi:strapi /app/package*.json ./
COPY --from=build --chown=strapi:strapi /app/public ./public
# Strapi 5 requires tsconfig.json + config/ source at runtime to resolve compiled config paths
COPY --from=build --chown=strapi:strapi /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=strapi:strapi /app/config ./config

# Create writable directories required at runtime
RUN mkdir -p /app/public/uploads /app/database/migrations && \
    chown -R strapi:strapi /app/public /app/database

USER strapi

EXPOSE 1337

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# Health check (Strapi doesn't have /health by default, use _health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:1337/_health || exit 1

CMD ["npm", "start"]
