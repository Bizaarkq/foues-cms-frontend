/**
 * app/api/revalidate/route.ts
 *
 * Strapi webhook target for on-demand ISR cache invalidation.
 *
 * Spec C (amended) — "Revalidation Endpoint":
 *   - Secret validated via `x-revalidate-secret` header (fallback: body.secret)
 *   - model === 'route'          → revalidateTag('routes')
 *   - model === 'page'           → revalidateTag('pages') + revalidateTag('page:${path}')
 *   - model === 'magazine-issue' → revalidateTag('magazine-issues') + revalidateTag('magazine-issue:${slug}')
 *   - model === 'article'        → revalidateTag('articles') + revalidateTag('article:${slug}')
 *   - model === 'document'       → revalidateTag('documents')
 *   - model === 'document-category' → revalidateTag('documents')
 *   - model === 'site-setting'   → revalidateTag('site-settings')
 *   - any other model            → revalidateTag('pages') + revalidateTag('routes')
 *     (footer, global-theme, block-group, staff, organizational-unit, form…
 *      all ride inside the unified page query, so every page fetch must expire;
 *      'routes' also covers the global-theme query tag)
 *   - missing model      → 200 no-op
 *   - missing/wrong secret → 401
 *
 * No session required — this endpoint is server-to-server only.
 * Expected Strapi v5 webhook body: { event, model, entry: { route?: { path } } }
 */

import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

interface StrapiWebhookBody {
  event?: string;
  model?: string;
  entry?: {
    route?: { path?: string } | null;
    slug?: string;
    [key: string]: unknown;
  };
  secret?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Secret check — header takes priority, body.secret is a fallback
  const headerSecret = request.headers.get('x-revalidate-secret');

  let body: StrapiWebhookBody = {};
  try {
    body = (await request.json()) as StrapiWebhookBody;
  } catch {
    // Body may be empty or non-JSON — treat as empty object
  }

  const providedSecret = headerSecret ?? body.secret ?? '';

  if (providedSecret !== env.revalidateSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const model = body.model;

  // No model at all (e.g. Strapi's "trigger" test button) — safe no-op
  if (!model || typeof model !== 'string') {
    return NextResponse.json({ revalidated: false, reason: 'missing model' });
  }

  const tags: string[] = [];

  switch (model) {
    case 'route':
      // Every page fetch also carries the 'routes' tag, so this expires
      // all cached pages (the nav tree renders on every one of them).
      tags.push('routes');
      break;

    case 'page': {
      tags.push('pages');
      // Fine-grained path tag when the entry carries a resolved route path
      const path = body.entry?.route?.path;
      if (path && typeof path === 'string') tags.push(`page:${path}`);
      break;
    }

    case 'magazine-issue': {
      // Archive grid (getAllReadyMagazineIssues) + per-edition viewer
      tags.push('magazine-issues');
      const slug = body.entry?.slug;
      if (slug && typeof slug === 'string') tags.push(`magazine-issue:${slug}`);
      break;
    }

    case 'article': {
      // List block (getArticles) + per-article detail page
      tags.push('articles');
      const slug = body.entry?.slug;
      if (slug && typeof slug === 'string') tags.push(`article:${slug}`);
      break;
    }

    case 'publication':
      // Publication data reaches both the archive fetches (magazine-issues
      // tag) and the page query that populates the block's relation (pages).
      tags.push('magazine-issues', 'pages', 'routes');
      break;

    case 'document':
      // Document repository block fetch (getDocumentRepositoryData).
      tags.push('documents');
      break;

    case 'document-category':
      // Same fetch also lists categories — role gate lives on this model.
      tags.push('documents');
      break;

    case 'site-setting':
      // getSiteSettings() (upload size limit, etc).
      tags.push('site-settings');
      break;

    default:
      // footer, global-theme, block-group, staff, organizational-unit, form…
      // — all embedded in the unified page query, so every page must expire.
      // 'routes' additionally covers the global-theme query tag.
      tags.push('pages', 'routes');
  }

  // { expire: 0 } → immediate expiration; webhook callers need fresh data right away
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ revalidated: true, model, tags });
}
