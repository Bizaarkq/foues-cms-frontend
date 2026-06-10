# =============================================================================
# Stage 1: base -- Node + pnpm setup shared by all stages
# =============================================================================
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app


# =============================================================================
# Stage 2: deps -- Install dependencies only
#               (leverages Docker layer cache if lockfile unchanged)
# =============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-frontend-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# =============================================================================
# Stage 3: builder -- Build the Next.js application
# =============================================================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars required by lib/env.ts (imported from next.config.ts).
# ARG alone is NOT enough -- env.ts reads process.env at module load,
# so each var must also be set as ENV before `pnpm build`.
ARG STRAPI_URL
ENV STRAPI_URL=$STRAPI_URL

ARG STRAPI_API_TOKEN
ENV STRAPI_API_TOKEN=$STRAPI_API_TOKEN

ARG FORM_SUBMIT_TOKEN
ENV FORM_SUBMIT_TOKEN=$FORM_SUBMIT_TOKEN

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build


# =============================================================================
# Stage 4: runner -- Minimal production image
# =============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Re-declare ARGs + ENVs for runtime SSR (ARGs do NOT cross stage boundaries)
ARG STRAPI_URL
ENV STRAPI_URL=$STRAPI_URL

ARG STRAPI_API_TOKEN
ENV STRAPI_API_TOKEN=$STRAPI_API_TOKEN

ARG FORM_SUBMIT_TOKEN
ENV FORM_SUBMIT_TOKEN=$FORM_SUBMIT_TOKEN

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --spider --quiet http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
