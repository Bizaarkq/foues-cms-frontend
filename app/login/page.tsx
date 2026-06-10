/**
 * app/login/page.tsx — Sign-in page.
 *
 * Spec A — "Login page accessible without session":
 *   This page must be reachable without a session (exempt in proxy.ts).
 *
 * Spec A — "Successful login / Rejected login":
 *   signIn('google') triggers the OAuth flow; NextAuth's signIn callback
 *   rejects non-@ues.edu.sv accounts and surfaces an error state.
 *
 * Design: minimal centered card using --color-foues-* tokens.
 * No client state needed — signIn is called via a Server Action.
 */

import { signIn, auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  // If already authenticated, redirect to home
  const session = await auth();
  if (session) redirect('/');

  const { error, callbackUrl } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-foues-surface-sunken)] px-4">
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg p-8 flex flex-col items-center gap-6"
        style={{ backgroundColor: 'var(--color-foues-surface)' }}
      >
        {/* Faculty identity */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: 'var(--color-foues-navy)' }}
            aria-hidden="true"
          >
            F
          </div>
          <h1
            className="text-xl font-bold mt-2"
            style={{ color: 'var(--color-foues-navy)' }}
          >
            FOUES
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--color-foues-text-muted)' }}
          >
            Facultad de Odontología — UES
          </p>
        </div>

        <p
          className="text-sm text-center"
          style={{ color: 'var(--color-foues-text-secondary)' }}
        >
          Sign in with your UES institutional account to continue.
        </p>

        {/* Domain restriction error */}
        {error === 'AccessDenied' && (
          <div
            className="w-full rounded-lg px-4 py-3 text-sm text-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-foues-state-error) 10%, transparent)',
              color: 'var(--color-foues-state-error)',
              border: '1px solid color-mix(in srgb, var(--color-foues-state-error) 30%, transparent)',
            }}
            role="alert"
          >
            Access denied. Only <strong>@ues.edu.sv</strong> accounts are allowed.
          </div>
        )}

        {/* Generic error */}
        {error && error !== 'AccessDenied' && (
          <div
            className="w-full rounded-lg px-4 py-3 text-sm text-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-foues-state-error) 10%, transparent)',
              color: 'var(--color-foues-state-error)',
              border: '1px solid color-mix(in srgb, var(--color-foues-state-error) 30%, transparent)',
            }}
            role="alert"
          >
            Sign-in failed. Please try again.
          </div>
        )}

        {/* Google sign-in — Server Action */}
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl ?? '/' });
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--color-foues-navy)',
              color: '#ffffff',
            }}
            // Inline hover handled via Tailwind (CSS var not available in hover:)
          >
            {/* Google logo SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path
                fill="#ffffff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#ffffff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#ffffff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#ffffff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p
          className="text-xs text-center"
          style={{ color: 'var(--color-foues-text-faint)' }}
        >
          Access restricted to @ues.edu.sv accounts.
        </p>
      </div>
    </main>
  );
}
