# SDUI Content Blocks: Accordion, Tabs, Table, Carousel

**Date:** 2026-07-12
**Status:** Approved
**Repos affected:** `foues-cms-frontend` (blocks, types, GraphQL), `foues-cms-api` (schemas, table-editor custom field plugin)

## Overview

Add four curated content blocks to the SDUI system: accordion, tabs, data table, and carousel. Editors compose pages with these blocks in Strapi and provide only **content** — all UI decisions (styling, behavior, accessibility) are fixed in the frontend components, which wrap `@skeletonlabs/skeleton-react` v4 primitives (Accordion, Tabs, Table styles, Carousel — all verified available in the installed version; no new frontend dependencies).

Explicitly rejected alternative: exposing raw Skeleton components with editable props from Strapi. That couples content to UI library versions, lets editors break visual consistency and accessibility, and makes validation impossible. Curated blocks keep design control in one place.

## Common pipeline (all four blocks)

Each block follows the documented six-step checklist:

1. CMS component schema in `foues-cms-api/src/components/blocks/` + entry in the page dynamic zone **and** in the `block-group` children dynamic zone (so blocks can live inside `blocks.section`).
2. GraphQL fragment in `LEAF_BLOCK_FRAGMENTS` (`lib/strapi.ts`).
3. `TYPENAME_TO_COMPONENT` entry (`lib/strapi.ts`).
4. Registry entry (`components/sdui/registry.ts`).
5. TS type in `types/blocks.ts`.
6. Component in `components/sdui/blocks/`.

Constraints inherited from existing decisions:

- No hyphens in new CMS enum values (Strapi → GraphQL underscore gotcha).
- Unknown/malformed block data renders nothing (or a safe empty state), never crashes.
- Components style with `--color-foues-*` CSS variables, never raw colors.
- User-facing copy is Spanish (es-SV).

## Block 1 — Accordion (`blocks.accordion`)

- **Schema:** optional `title` (string) + repeatable `elements.accordion-item` { `label` (string, required), `content` (richtext/markdown, required) }.
- **Frontend:** client component (`"use client"`) wrapping Skeleton `Accordion`. Content rendered with `react-markdown` (same approach as the `RichText` block).
- **Empty state:** no items → renders nothing.

## Block 2 — Tabs (`blocks.tabs`)

- **Schema:** optional `title` (string) + repeatable `elements.tab-item` { `label` (string, required), `content` (richtext/markdown, required) }.
- **Frontend:** client component wrapping Skeleton `Tabs`. First tab active by default.
- **Empty state:** no items → renders nothing; a single item renders as a plain section (no tab bar).

## Block 3 — Table (`blocks.table`)

- **Schema:** optional `title` (string), optional `description` (text), required `data` (JSON field) with shape:

  ```json
  { "headers": ["string"], "rows": [["string"]] }
  ```

- **Editing UX — Strapi custom field (local plugin `table-editor`):**
  - Renders an editable grid in the admin: add/edit/delete rows and columns by hand.
  - "Import CSV/Excel" action: parses the file **in the browser** (PapaParse for CSV, SheetJS for XLSX), shows a preview, and fills the same grid. Import is a convenience that populates the grid; manual editing always remains available, before or after import.
  - The plugin stores plain JSON in the `data` field — parsing never happens at render time.
  - Parse failures surface in the admin UI (editor sees the error and can fix the file); nothing invalid reaches the frontend.
- **Frontend:** pure RSC (no client JS). Renders the JSON with Skeleton table styles inside an `overflow-x-auto` wrapper (page body never scrolls horizontally).
- **GraphQL:** the `data` field travels as the `JSON` scalar — no inner fragment needed.
- **Defensive rendering:** if `data` is missing or malformed (no `headers` array, ragged rows), render nothing. Ragged rows are padded/truncated to header length rather than crashing.

## Block 4 — Carousel (`blocks.carousel`)

- **Schema:** optional `title` (string) + repeatable `elements.slide` { `image` (media, required), `title` (string, optional), `text` (text, optional), `link` (string, optional) } + `autoplay` (boolean, default false — a content-level decision, the only behavior flag exposed).
- **Frontend:** client component wrapping Skeleton `Carousel` (includes autoplay trigger support natively). Images resolved through the existing media URL helper (`lib/media.ts`) against `STRAPI_PUBLIC_URL`.
- **Empty state:** no slides → renders nothing; a single slide renders statically (no controls).
- **Distinction from `PhotoGallery`:** the gallery is an image grid; the carousel is a sequential slideshow with optional text/CTA per slide.

## Error handling

- All four blocks follow decision #4: malformed or empty content degrades to rendering nothing — never a crash, never a broken page.
- Table import errors are an **admin-time** concern only (custom field UI); the frontend trusts the stored JSON shape but still guards against it defensively.

## Testing / verification

- Gate: `npx tsc --noEmit` (project verification gate; no test runner exists yet).
- Manual verification: seed one page in Strapi containing all four blocks (top-level and inside a section) and verify rendering, plus the table custom field grid + CSV and XLSX import in the admin.

## Implementation order

1. Accordion
2. Tabs
3. Carousel
4. Table (last — carries the Strapi plugin work)

Each block is independently shippable; the pipeline steps for one block don't touch the others.

## Out of scope

- Table bound to Strapi collections (auto-fetching data tables) — rejected for now; all table data is editor-entered.
- Exposing Skeleton component props in Strapi.
- Server-side file parsing for table import.
