# Articles (news/events) SDUI — Design

Date: 2026-07-17 · Status: approved by Edwin (chat) · Repos: `foues-cms-frontend` + `foues-cms-api`

## Goal

Surface the existing `article` content type (news and events) on the public site: an
auto-populated, paginated list block placeable from the CMS, and a detail page per
article. Announcements become publishable from Strapi without creating SDUI pages.

Approved scope decisions:

- List + detail, ordered by `publishedAt` descending.
- Articles are categorized `news` | `event` (new `category` enum on `article`).
- Detail lives at a **fixed route** `/articulos/{slug}` (user asked for a dedicated
  route; segment name is Spanish because the site is es-SV). `articulos` becomes a
  reserved path segment — a CMS route with that path would be shadowed by Next.
- `blocks.content-grid` is **removed** from CMS and frontend (its `collection_type`
  was never wired; manual grids are superseded by this block). Its card styles and
  column selection move into `blocks.article-list`, with columns as an integer 1–12
  instead of the `col_1..col_4` enum. Mobile always renders 1 column.
- CMS admin labels (displayName/description in component/content-type schemas) in
  Spanish. Code identifiers stay English.

## CMS changes (`foues-cms-api`, branch from `origin/develop`)

1. **`article` schema** (`src/api/article/content-types/article/schema.json`):
   - `category`: enumeration `["news", "event"]`, required, default `"news"`.
     Hyphen-free values on purpose (Strapi GraphQL enum gotcha).
   - `event_date`: `datetime`, optional. Meaningful only when `category = event`.
   - Update `info.description` (Spanish): article now live, not "reserved".
   - Keep `Title` field name as-is (renaming breaks existing data).
2. **New component** `src/components/blocks/article-list.json`
   (`blocks.article-list`, displayName "Listado de artículos", Spanish description):
   - `title`: string.
   - `category_filter`: enumeration `["news", "event", "all"]`, default `"all"`, required.
   - `page_size`: integer, default 9, min 1, max 24.
   - `card_style`: enumeration `["default", "compact", "featured", "horizontal"]`, default `"default"`.
   - `columns`: integer, default 3, min 1, max 12.
3. **Remove `blocks.content-grid`**: delete `src/components/blocks/content-grid.json`;
   remove it from the `page` and `block-group` dynamic zones and add
   `blocks.article-list` to both. `elements/card.json` stays only if another
   component references it; if content-grid was its only consumer, delete it too.
4. **Data migrations**:
   - Edit `009-showcase-page.ts`: replace its content-grid entry with an
     `article-list` entry (fresh installs must not reference a deleted component).
   - New `010-content-grid-to-article-list.ts`: for existing DBs, replace any
     `blocks.content-grid` entry inside page/block-group content with a
     `blocks.article-list` entry preserving `title` (defaults elsewhere). Manual
     card items are dropped (seed/demo data only). Register in `index.ts`.
   - Update `src/seeds/pages/landing.json` the same way.
5. **Permissions/tokens**: article must be readable by the GraphQL read token —
   verify the token scope script (`scripts/create-api-tokens.js`) includes article
   find/findOne; extend if not.
6. **Deploy checklist (manual, Strapi admin)**: enable webhook entry events for the
   `article` content type; optionally configure Spanish field labels in
   "Configure the view" (admin DB config, not code).

## Frontend changes (`foues-cms-frontend`)

1. **Shared cards**: extract `CardDefault/Compact/Featured/Horizontal` from
   `ContentGrid.tsx` into `components/sdui/elements/cards.tsx` (unchanged visuals,
   still consuming `CardElement`). Delete `ContentGrid.tsx`.
2. **`ArticleList`** (`components/sdui/blocks/ArticleList.tsx`): self-fetching async
   RSC (magazine-archive pattern — no fields from the page query). Maps articles to
   `CardElement`s: title, excerpt → description, image, tag = formatted date
   (`event_date` if event else `publishedAt`, es-SV locale), url = `/articulos/{slug}`.
   Grid: mobile `grid-cols-1`; `md+` uses inline
   `gridTemplateColumns: repeat(columns, minmax(0, 1fr))` (Tailwind cannot emit
   dynamic col counts). Renders pagination links when total > page_size:
   `{pagePath}/pagina/{n}` (page 1 = the page's own path). Empty state via `EmptyState`.
3. **Detail route** `app/articulos/[slug]/page.tsx`: RSC, `params` is a Promise
   (Next 16). Fetches published article by slug (404 → `notFound()`). Renders hero
   image, category chip (Noticia/Evento), date, `MarkdownContent` body, back link.
   `generateMetadata` from Title/excerpt. Public — no auth gate (announcements are
   the official public information channel).
4. **Pagination as virtual child** in `app/[[...slug]]/page.tsx`: when a path has
   ≥3 segments and `segments[-2] === "pagina"` with a numeric last segment, resolve
   the path minus two segments; if that page contains `blocks.article-list`
   (top-level or in sections — generalize `findMagazineArchiveBlocks` into a shared
   block finder), render the parent page injecting `pageNumber` via `BlockRenderer`
   (alongside `pagePath`; `Section` forwards it). Invalid page numbers → 404.
   Magazine issue resolution is unchanged.
5. **GraphQL** (`lib/strapi.ts`):
   - `ARTICLE_LIST_FRAGMENT` in `LEAF_BLOCK_FRAGMENTS` (block fields only);
     `TYPENAME_TO_COMPONENT` entry `ComponentBlocksArticleList`; remove the
     content-grid fragment + mapping.
   - `getArticles({ category, page, pageSize })`: filtered, sorted
     `publishedAt:desc`, paginated, tag `articles`.
   - `getArticleBySlug(slug)`: published only, tags `articles`, `article:{slug}`.
6. **Registry/types**: registry entry `blocks.article-list` (remove
   `blocks.content-grid`); `ArticleListProps` + `Article` types; delete
   `ContentGridProps`/`CollectionType`; drop `contentGridCols` if now unused.
7. **Revalidation** (`app/api/revalidate/route.ts`): explicit mapping
   `article` → `articles` + `article:{slug}`.

## Caching

List and detail queries: 24 h ISR + tags above, consistent with the rest of the site.
Pagination pages are distinct paths, so each is its own ISR entry — no `searchParams`
(would force dynamic rendering).

## Testing / verification

`npx tsc --noEmit` (frontend gate). Manual: seed article via CMS, verify list block,
pagination path, detail page, category filter mismatch → article still reachable at
`/articulos/{slug}` (fixed route is filter-independent), webhook revalidation.

## Out of scope / follow-ups

- "Latest news" highlight block for the home (deferred).
- Category filter UI on the list (block-level filter only for v1).
- Site-wide SEO metadata + sitemap/robots (separate gap, next task).
