/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * NextAuth v5 catch-all route handler.
 * Re-exports GET and POST handlers from lib/auth.ts.
 * Spec A — auth API route for OAuth callback flow.
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
