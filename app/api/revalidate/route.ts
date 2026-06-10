/**
 * app/api/revalidate/route.ts
 *
 * Strapi webhook target for on-demand ISR cache invalidation.
 *
 * Spec C — "Revalidation Endpoint":
 *   - Secret validated via `x-revalidate-secret` header (fallback: body.secret)
 *   - model === 'route'  → revalidateTag('routes')
 *   - model === 'page'   → revalidateTag('pages') + revalidateTag('page:${path}')
 *   - unknown model      → 200 no-op
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

  if (model === 'route') {
    // Use { expire: 0 } for immediate expiration — webhook needs fresh data right away
    revalidateTag('routes', { expire: 0 });
    return NextResponse.json({ revalidated: true, tags: ['routes'] });
  }

  if (model === 'page') {
    revalidateTag('pages', { expire: 0 });

    // Attempt fine-grained path tag when the entry carries a resolved route path
    const path = body.entry?.route?.path;
    if (path && typeof path === 'string') {
      revalidateTag(`page:${path}`, { expire: 0 });
      return NextResponse.json({ revalidated: true, tags: ['pages', `page:${path}`] });
    }

    return NextResponse.json({ revalidated: true, tags: ['pages'] });
  }

  // Unknown model — safe no-op per spec
  return NextResponse.json({ revalidated: false, reason: 'unknown model' });
}
