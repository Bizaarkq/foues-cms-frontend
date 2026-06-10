/**
 * proxy.ts — Next.js 16 proxy (previously middleware.ts).
 *
 * Responsibility: Server-Action rate limiter.
 * Limits POST requests carrying the next-action header to 5 per minute per IP.
 *
 * Auth enforcement lives in the Server Component (app/[[...slug]]/page.tsx)
 * after getPageByPath() resolves route.visibility from Strapi.
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Rate limiter state (Server Actions only)
// ---------------------------------------------------------------------------

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 5;
const timestamps = new Map<string, number[]>();

// ---------------------------------------------------------------------------
// Proxy function
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest): NextResponse {
  // --- Rate limiter (Server Actions only) ---
  const isServerAction =
    request.method === 'POST' && request.headers.has('next-action');

  if (isServerAction) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const now = Date.now();
    const windowStart = now - RATE_WINDOW_MS;
    const reqs = (timestamps.get(ip) ?? []).filter((t) => t > windowStart);

    if (reqs.length >= RATE_MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    reqs.push(now);
    timestamps.set(ip, reqs);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static files and images (Next.js internals).
    // Auth exemption logic is handled inside the proxy function above.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
