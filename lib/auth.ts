/**
 * lib/auth.ts — NextAuth v5 (Auth.js) configuration.
 *
 * Spec A — "Domain-Restricted Google Sign-In":
 *   Only @ues.edu.sv Google accounts are accepted. signIn callback returns
 *   false for any other domain, which aborts session creation.
 *
 * Design decisions:
 *   - JWT session strategy (no DB) — proxy needs O(1) cookie presence check
 *   - AUTH_SECRET / AUTH_URL / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *     read from env (v5 native names, mapped from conventional GOOGLE_* vars)
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { env } from './env';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.auth.googleId,
      clientSecret: env.auth.googleSecret,
    }),
  ],
  secret: env.auth.secret,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    signIn({ profile }) {
      // Only allow @ues.edu.sv accounts — reject all others
      return !!profile?.email?.endsWith('@ues.edu.sv');
    },
    jwt({ token, profile }) {
      // Copy email + name from OAuth profile into token on first sign-in
      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
      }
      return token;
    },
  },
});
