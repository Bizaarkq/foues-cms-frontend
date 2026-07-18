# Design: Role-gated document repository

**Date:** 2026-07-18
**Status:** Approved (brainstorming session)
**Repos affected:** `foues-cms-frontend` (this repo) + `foues-cms-api` (Strapi v5, sibling)

## Problem

The faculty needs a document repository (regulations, meeting minutes, internal files) where:

- Read access is restricted per role (logged-in users, NextAuth session role).
- Certain roles can upload documents from the site — some uploaders must NOT have Strapi admin access.
- Uploads are tracked (who uploaded) and downloads are logged (who downloaded, when).
- Only PDF files are accepted in v1.
- Repository files live in their own media-library folder, separated from the rest of the site media.

The central constraint: Strapi's local upload provider serves everything under `/uploads` publicly. A role-gated repository cannot rely on URL obscurity, so file delivery and file exposure must both be controlled.

## Decisions

1. **Access granularity: per category.** Documents belong to a category; the category defines `allowed_roles` (readers), `upload_enabled` + `upload_roles` (writers), and `requires_approval`.
2. **Frontend is upload-only.** No modify/delete from the site. Deletion and edits happen in the CMS admin only; users needing changes contact Unidad Informática.
3. **Publication flow per category.** `requires_approval: true` → uploaded document is created as draft and published manually from Strapi. `false` → published immediately.
4. **File protection: Next proxy + CMS middleware (approach 2 of 3).** Downloads go through a Next route that validates session + role and streams server-to-server; additionally, a custom Strapi middleware blocks public access to files belonging to the documents folder. Chosen over proxy-only (leaked direct URLs stay open) and over private storage/S3 (new infra, overkill for v1).
5. **Staged delivery.** Stage 1 is read-only (CMS-managed documents, listing, gated downloads, download log). Stage 2 adds site uploads. The data model ships upload-ready in stage 1.

## Data model (foues-cms-api)

Three new content types (no hyphens in enum values — GraphQL underscore gotcha):

### `document-category`
- `name`, `slug`, `description`
- `allowed_roles` — relation to roles (same pattern as `route.allowed_roles`); empty = any logged-in user. The relation is one-way: `user-role` is not modified to point back at categories.
- `upload_enabled` — boolean
- `upload_roles` — relation to roles; who may upload when enabled
- `requires_approval` — boolean
- Per-category media-folder mapping is **deferred to stage 2**. Stage 1 protection is tree-wide: all repository files live under a single root "Documents" media folder, and the CMS middleware blocks public access to anything under that folder regardless of which category owns it. A dedicated `media_folder` field per category (for stage-2 per-category folder routing) is not part of the stage 1 schema.

### `document`
- `title`
- `file` — media (single), PDF-only in v1
- `category` — required relation to `document-category`
- `uploaded_by_name`, `uploaded_by_email` — strings copied from the NextAuth session (uploaders are not Strapi users)
- Draft & publish **enabled** — the approval flow rides on it

### `document-download`
- `document` — relation
- `user_email`, `user_name` — from session
- `downloaded_at` — datetime

Reviewed from the Strapi admin; no frontend surface.

## Frontend: SDUI block (`blocks.document-repository`)

Self-fetching async RSC, same pattern as `blocks.magazine-archive`:

- Block fields: `title` + `categories` relation (empty = all categories).
- The GraphQL query fetches categories + **published** documents WITHOUT role filtering, cached with tags `documents` / `document-category` (24 h ISR).
- Role filtering happens in JS in the RSC per request against the session role — same pattern as the navbar's `filterByVisibility`. Filtering is never baked into the cached fetch.
- The upload button renders only when `upload_enabled` and the session role is in `upload_roles` (server-side re-validation is authoritative; see Uploads).
- Requires the full block chain: CMS schema + dynamic-zone entry, GraphQL fragment in `LEAF_BLOCK_FRAGMENTS`, `TYPENAME_TO_COMPONENT` entry, registry entry, TS type in `types/blocks.ts`, component in `components/sdui/blocks/`.

## Downloads: token-holding proxy

`app/api/documents/[documentId]/route.ts` (GET):

1. `auth()` — reject anonymous.
2. Fetch document + category server-to-server with a new restricted token `DOCUMENT_TOKEN` (added to `../foues-cms-api/scripts/create-api-tokens.js` and `lib/env.ts`).
3. Check the session role against the category's `allowed_roles` (empty = any logged-in user). Fail → 404 (do not reveal existence).
4. Stream the file from Strapi with `Content-Disposition: attachment`.
5. Log the download to `document-download` fire-and-forget — a logging failure NEVER blocks the download (magazine-track precedent).

The browser never sees the real `/uploads` URL.

**Shared-secret decision.** The proxy's server-to-server file read (step 4) sends header `x-document-access-secret: <DOCUMENT_ACCESS_SECRET>`. This is a second, separate credential from `DOCUMENT_TOKEN`: `DOCUMENT_TOKEN` authenticates the Strapi REST/GraphQL API calls (fetching document/category metadata, posting the download log); `DOCUMENT_ACCESS_SECRET` is checked by the CMS-side upload-serving middleware specifically to let the proxy's raw file fetch through the folder block — it is not a Strapi API token and grants no API access. Both live in `lib/env.ts` (`env.documentToken`, `env.documentAccessSecret`) and are never sent to the browser.

## Uploads (stage 2): Server Action

`app/actions/submit-document.ts`, following the `submit-form` trust model — the client defines nothing:

1. `auth()` + re-fetch the category server-side; verify `upload_enabled` and session role ∈ `upload_roles`.
2. Validate the file: MIME type AND magic bytes (`%PDF`), plus a max size limit.
3. Upload to the category's media folder and create the `document` entry — draft if `requires_approval`, published otherwise — with uploader identity from the session.
4. `revalidateTag('documents', { expire: 0 })` so published documents appear immediately.
5. Rate limiting: covered by the existing Server Action rate limit in `proxy.ts`.

**Stage-2 gotcha:** Strapi's built-in `POST /api/upload` controller force-assigns uploaded files to the "API Uploads" system folder — it does not accept a target folder from the request. Routing site-originated uploads into the repository's own "Documents" folder tree (so the stage-1 middleware protects them) therefore requires a **custom CMS controller/route** that calls the upload service and then moves/creates the `upload_file` row with the correct `folderPath`, rather than delegating to the default upload endpoint as-is.

## CMS middleware: closing the folder

Custom global middleware in `foues-cms-api`, registered before `strapi::public`, intercepting `GET /uploads/*`.

**Known gotcha:** media-library folders are virtual (DB-only) — the local provider stores all files flat in `/uploads`, so path-prefix blocking on the filesystem path is impossible. The middleware must resolve the requested filename against `upload_files` and block when the file's folder falls anywhere under the root "Documents" folder tree, with an in-memory cache so regular site assets don't incur a DB hit per request. Server-to-server requests from the Next proxy pass via the `x-document-access-secret` header (see `DOCUMENT_ACCESS_SECRET` above).

**Verified facts** (confirmed against the real Strapi v5 core code, not assumed):
- Strapi's `config.middlewares` array (where a custom global middleware is registered) runs entirely **before** the koa-router that dispatches to `strapi::public`'s static file handler — the uploads static handler is mounted later, at `strapi.server.listen()` time. This means a middleware registered ahead of `strapi::public` in `config/middlewares.ts` is guaranteed to see every `GET /uploads/*` request first; there is no ordering race to worry about.
- Every row in `upload_files` (Strapi's file table) carries an indexed `folderPath` column (materialised path, e.g. `/1/3`), not just a `folder` foreign key — so the "does this file live under the Documents folder tree" check is a single indexed prefix comparison (`folderPath LIKE '/<documents-folder-id>%'`) rather than a recursive parent-folder walk per request. This is what makes the in-memory cache cheap: cache `filename → folderPath` and test the prefix on each request without hitting the DB.

## Caching & revalidation

- Block query tags: `documents`, `document-category`.
- `/api/revalidate` model mapping additions: `document` → `documents`; `document-category` → `documents` + `document-category`. (The existing catch-all fallback also expires `pages` + `routes`.)
- The Strapi webhook must include the new content types' events.

## Stages

**Stage 1 — read-only repository**
CMS content types + media folder + restricted token + SDUI block (listing, role-filtered) + download proxy + CMS middleware + download log. Documents managed from Strapi admin.

**Stage 2 — site uploads**
Upload Server Action + upload UI (button/form in the block) + approval flow (draft) + uploader tracking surfaced in admin.

## Testing / verification

- `npx tsc --noEmit` gate on the frontend.
- Manual flow verification per stage: role sees only its categories; wrong role gets 404 on direct download URL; direct `/uploads/<doc-file>` blocked by middleware while regular media stays public; download log entries created; (stage 2) non-PDF rejected, approval flow creates drafts.

## Out of scope (v1)

- Modify/replace documents from the site.
- Non-PDF file types.
- Private storage providers (S3/MinIO, signed URLs).
- Download stats dashboards (raw log entries in admin only).
- Versioning of documents.
