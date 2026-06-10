'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * SessionProviderWrapper — thin 'use client' boundary that mounts NextAuth's
 * SessionProvider so that Client Components can call useSession().
 *
 * Kept in its own file so that app/layout.tsx stays a Server Component.
 * Spec A — "SessionProvider Client Wrapper"
 */
export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
