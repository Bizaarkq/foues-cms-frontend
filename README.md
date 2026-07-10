# foues-cms-frontend

Frontend público de la **Facultad de Odontología — Universidad de El Salvador (FOUES)**. Next.js 16 (App Router, React 19, Tailwind v4) con arquitectura 100% server-driven UI: cada página se construye a partir de los bloques definidos en el CMS ([`foues-cms-api`](https://github.com/Bizaarkq/foues-cms-api), Strapi v5) vía GraphQL.

## Requisitos

- Node 22+ y pnpm
- El repo del CMS clonado como **directorio hermano** (`../foues-cms-api`) — allí viven los compose files y el `.env` compartido
- Un Strapi corriendo (local vía Docker, ver README del CMS)

## Desarrollo

```bash
pnpm install
pnpm dev            # necesita todas las vars de entorno (ver abajo)
npx tsc --noEmit    # gate de verificación — correr antes de commitear
pnpm lint
```

## Variables de entorno

`lib/env.ts` es el único lector de `process.env` — valida al cargar y falla temprano. Todas son server-side (sin `NEXT_PUBLIC_`).

| Variable | Uso |
|----------|-----|
| `STRAPI_URL` | URL interna del CMS (server-to-server; `http://cms:1337` en Docker) |
| `STRAPI_PUBLIC_URL` | URL pública para media en el navegador (imágenes, PDFs) |
| `STRAPI_API_TOKEN` | Token de lectura GraphQL |
| `FORM_SUBMIT_TOKEN` | Token restringido para envío de formularios |
| `MAGAZINE_TRACK_TOKEN` | Token restringido para métricas de la revista |
| `AUTH_SECRET` / `AUTH_URL` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | NextAuth v5 (login Google restringido a `@ues.edu.sv`) |
| `REVALIDATE_SECRET` | Secret del webhook de invalidación de cache |
| `CAMPUS_VIRTUAL_URL` | (Opcional) URL del Campus Virtual en el navbar; sin valor, el link no se muestra |

Los tokens se generan con `node scripts/create-api-tokens.js` en el repo del CMS.

## Despliegue

Este repo no se despliega solo: la imagen se construye desde el compose del CMS (`docker compose up -d --build` en `../foues-cms-api`, servicio `foues`). nginx enruta los dominios públicos.

## Documentación

La arquitectura, decisiones y convenciones viven en [`CLAUDE.md`](./CLAUDE.md). Bugs y pendientes en [GitHub Issues](https://github.com/Bizaarkq/foues-cms-frontend/issues).
