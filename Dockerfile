# =============================================================================
# Stage 1: base — Node + pnpm setup compartido por todos los stages
# =============================================================================
FROM node:20-alpine AS base

# Instalar pnpm globalmente vía corepack (sin necesidad de npm install -g)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app


# =============================================================================
# Stage 2: deps — Instalar SÓLO dependencias de producción y desarrollo
#               (aprovecha la caché de Docker si package.json / lockfile no cambia)
# =============================================================================
FROM base AS deps

# Copiar sólo los archivos de manifiesto para aprovechar la caché de capas
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar todas las dependencias (dev incluidas, se necesitan para el build)
RUN pnpm install --frozen-lockfile


# =============================================================================
# Stage 3: builder — Compilar la aplicación Next.js
# =============================================================================
FROM base AS builder

WORKDIR /app

# Copiar node_modules desde el stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar el resto del código fuente
COPY . .

# Variables de entorno de build-time (pueden sobreescribirse con --build-arg)
# NEXT_PUBLIC_* deben declararse aquí si el build las necesita en tiempo de compilación
ARG NEXT_PUBLIC_STRAPI_URL=http://strapi:1337
ENV NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL}

# Deshabilitar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED=1

# Activar el output "standalone" para una imagen final mínima.
# Si ya está configurado en next.config.ts, esta variable lo activa igual.
ENV NEXT_OUTPUT=standalone

# Build de producción
# next.config.ts debe tener: output: 'standalone'
RUN pnpm build


# =============================================================================
# Stage 4: runner — Imagen final mínima (sólo lo necesario para ejecutar)
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Seguridad: ejecutar como usuario no-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Variables de entorno de runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar los archivos públicos estáticos
COPY --from=builder /app/public ./public

# Copiar el output standalone (incluye el servidor y dependencias mínimas)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# El servidor de producción standalone de Next.js
CMD ["node", "server.js"]
