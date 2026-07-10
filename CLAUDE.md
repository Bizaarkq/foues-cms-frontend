@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 16 (App Router, React 19, TypeScript, Tailwind v4, pnpm) frontend for the Facultad de Odontología UES site. 100% server-driven UI: every public page is rendered from content served by `foues-cms-api` (Strapi v5, cloned as a sibling directory) via GraphQL. Site content and audience are Spanish (es-SV) — user-facing copy must be Spanish.

This file is the **single source of truth for architecture decisions** (no separate ADR/CONTEXT files — those were lost with a previous machine and are consolidated in the "Decisions" section). Bugs and pending work are tracked in **GitHub Issues**.

Next.js 16 has breaking changes vs. training data — read `node_modules/next/dist/docs/` before writing code (see AGENTS.md). Notably: `params`/`searchParams` are Promises; `middleware.ts` is now `proxy.ts`; `revalidateTag(tag, { expire: 0 })` takes a second argument.

## Workflow

- `develop` is the working branch (promoted to `main` when v1 is ready). GitHub account `Bizaarkq` is Edwin (solo dev).
- Conventional commits, optionally gitmoji-prefixed. No AI attribution.
- Verification gate: `npx tsc --noEmit`. No test runner yet — adding tests is planned, not a decision against them.

## Commands

- `pnpm dev` — dev server (needs a running Strapi and a complete `.env`; `lib/env.ts` fails fast on any missing var).
- `npx tsc --noEmit` — type-check (the verification gate).
- `pnpm lint` — eslint.
- Docker: this app is built by the **CMS repo's** compose file (service `foues`, sibling context `../foues-cms-frontend`). See `../foues-cms-api/CLAUDE.md` for deploy commands.

## Environment

`lib/env.ts` is the ONLY place that reads `process.env` — it validates eagerly and fails fast. All vars are server-side only (no `NEXT_PUBLIC_`).

- `STRAPI_URL` — internal server-to-server URL (`http://cms:1337` in Docker).
- `STRAPI_PUBLIC_URL` — browser-facing base for media URLs (falls back to `STRAPI_URL`). `lib/media.ts` and the magazine viewer resolve relative upload paths against it.
- `STRAPI_API_TOKEN` (GraphQL read) / `FORM_SUBMIT_TOKEN` (form fetch + submission create only) / `MAGAZINE_TRACK_TOKEN` (track endpoint only) — restricted tokens created by `../foues-cms-api/scripts/create-api-tokens.js`.
- `AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET` — NextAuth v5. A test OAuth client exists and works on the test server.
- `REVALIDATE_SECRET` — shared secret for the Strapi → `/api/revalidate` webhook.
- `next.config.ts` deliberately does NOT import `lib/env.ts` (runtime vars are unavailable during `docker build`); the Dockerfile passes build-placeholder ARGs for runtime-only vars and real ARGs only for `STRAPI_URL`/`STRAPI_PUBLIC_URL`/tokens needed at build.

## Architecture: SDUI rendering

```
/[[...slug]] → getPageByPath(path) → { route, page.content[], navbar, footer } → BlockRenderer → registry
```

- `app/[[...slug]]/page.tsx` — catch-all. Resolves the path with ONE unified GraphQL query (route + page blocks + nav tree + footer), 404s on unknown routes, picks the layout (`default` | `full-width`), enforces `route.visibility === 'requires-login'` by redirecting to `/login`. **The Server Component is the authoritative access-control gate** — `proxy.ts` does no auth.
- `lib/strapi.ts` — GraphQL client (`gql<T>()`, raw fetch, 24 h ISR + cache tags) and all queries. Strapi GraphQL returns `__typename` (e.g. `ComponentBlocksHeroLanding`), NOT `__component`; `normalizeBlocks()` converts via `TYPENAME_TO_COMPONENT` because `__typename` cannot be aliased and `__component` is not queryable.
- Fragments are stratified (GraphQL forbids recursive fragments): `LEAF_BLOCK_FRAGMENTS` (flat blocks) + `SECTION_BLOCK_FRAGMENT_L1` (`blocks.section` → `block-group.children` populated with leaf fragments). Max nesting depth 2, with cycle detection on block-group documentIds.
- `components/sdui/registry.ts` — `__component` → React component map. Unknown components render null.

**Adding/changing a block** requires ALL of: CMS schema (`../foues-cms-api/src/components/blocks/`) + page dynamic-zone entry, GraphQL fragment in `LEAF_BLOCK_FRAGMENTS`, `TYPENAME_TO_COMPONENT` entry, registry entry, TS type in `types/blocks.ts`, and the component in `components/sdui/blocks/`. Miss one and the block silently renders nothing.

## Caching & revalidation

- All page data: `next: { revalidate: 86400 }` (24 h ISR) + tags `page:{path}`, `pages`, `routes`. Magazine queries tag `magazine-issues` / `magazine-issue:{slug}`. Theme query tags `routes`.
- `app/api/revalidate/route.ts` — Strapi webhook target (secret via `x-revalidate-secret` header, `body.secret` fallback). Uses `revalidateTag(tag, { expire: 0 })` for immediate expiry. Model mapping: `route` → `routes`; `page` → `pages` + `page:{path}`; `magazine-issue` → `magazine-issues` + `magazine-issue:{slug}`; **any other model** → `pages` + `routes` (footer, global-theme, block-group, staff, organizational-unit and form all ride inside the unified page query, so every page fetch must expire). The Strapi-side webhook is configured in the CMS admin — it must have create/update/delete/publish/unpublish entry events enabled for ALL content types that feed rendering.

## Auth

- `lib/auth.ts` — NextAuth v5, Google provider, JWT session (no DB). `signIn` callback rejects any account not ending in `@ues.edu.sv`.
- `app/login/page.tsx` — sign-in page (Server Action → `signIn('google')`); redirects home if already authenticated; shows `AccessDenied` for wrong-domain accounts.
- `proxy.ts` — only rate-limits Server Actions (5/min/IP, in-memory). No auth here by design.
- Navbar shows login/logout in the top bar based on session.

## Forms

`blocks.form` → `DynamicFormBlock` (RSC) → `DynamicFormLoader` (client, `ssr: false`) → `DynamicForm` (react-hook-form + zod resolver).

- `app/actions/submit-form.ts` — Server Action. **Never trusts client-passed field definitions**: re-fetches the form from Strapi (React `cache()`, 5 min revalidate) with `FORM_SUBMIT_TOKEN`, rebuilds the zod schema server-side (`lib/build-zod-schema.ts`), validates, then POSTs the submission with `form_id`, `form_title`, `data`, `submitted_at`, `ip_address`.

## Magazine viewer (revista)

- URLs `/quienes-somos/revista/{slug}` have **no Strapi route record** — the catch-all matches `MAGAZINE_VIEWER_RE` before 404ing and renders `MagazineViewer` (navbar/footer still come from `getPageByPath`).
- `MagazineViewer` (RSC) fetches the issue by slug (only `conversionStatus: "ready"` + published), resolves page image URLs to absolute against `STRAPI_PUBLIC_URL`, renders header + PDF download + `FlipbookClient`.
- `FlipbookClient` — react-pageflip with windowed rendering (only ±2 pages around the current one get real `<img>`s). Fires a `visit` beacon on mount and a `depth` beacon (max page reached, %) on `pagehide` with `keepalive`.
- Beacons POST to `app/api/magazine-track/route.ts`, which validates and forwards server-to-server to Strapi with `MAGAZINE_TRACK_TOKEN` (never exposed to the browser). Tracking failures return 200 — reader experience is never degraded by metrics.
- The archive grid is the `blocks.magazine-archive` SDUI block — a self-fetching async RSC (no fields from the page query).

## Theming

- `app/layout.tsx` injects a pre-paint script (reads `localStorage['foues-theme']`, sets `data-foues-theme='dark'` before first paint — no flash) and `<ThemeVars/>`.
- `ThemeVars` (RSC) fetches the admin-editable palette (`getGlobalTheme()`, single type `global-theme` in Strapi; requires public `find` permission — falls back to hardcoded defaults on any failure) and emits `--color-foues-*` CSS variables for light/dark. Components style with those vars, never raw colors.
- `ThemeToggle` (client) persists the preference.

## Decisions (consolidated — formerly ADRs)

1. **Single unified GraphQL query per path** (route + blocks + nav + footer) — one round-trip, one cache entry per path (Next keys POST fetches by URL + body).
2. **Raw `fetch` GraphQL client** — no Apollo/urql; keeps the caching story native to Next.
3. **Stratified fragments + normalize pass** instead of recursive fragments (GraphQL spec forbids them); `__typename → __component` mapping table.
4. **O(1) block registry**; unknown blocks render nothing rather than crashing.
5. **Auth enforcement in the Server Component**, not middleware/proxy — the route's `visibility` lives in the CMS and is only known after the query resolves.
6. **JWT sessions** — no session DB; keeps the stack stateless.
7. **Server-side form re-fetch** — the client never defines what fields are valid.
8. **Token-holding proxy routes** (`/api/magazine-track`) so restricted Strapi tokens never reach the browser.
9. **`env.ts` fail-fast, `next.config.ts` decoupled from it** — Docker builds run without runtime secrets (placeholder ARGs).

## Known gaps

Canonical tracker is GitHub Issues; highlights as of 2026-07: no mobile menu (Navbar is `hidden md:flex` with no hamburger — missing by design oversight, must be added); Navbar does not filter `requires-login` items for anonymous users nor hide children of hidden groups (it should); login page copy is in English. The magazine model currently assumes a SINGLE publication with N editions (archive title hardcoded, viewer path fixed) — multi-publication support (e.g. informes científicos, each with its own editions) is a pending redesign.
