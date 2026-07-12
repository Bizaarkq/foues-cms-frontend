/**
 * lib/auth.ts — NextAuth v5 (Auth.js) configuration.
 *
 * Spec A — "Domain-Restricted Google Sign-In":
 *   Only @ues.edu.sv Google accounts are accepted. signIn callback returns
 *   false for any other domain, which aborts session creation.
 *
 * Spec 2026-07-11 (sesión de usuario):
 *   - En el login, el jwt callback registra el acceso en el CMS
 *     (track-login) y guarda el rol en el token — disponible en toda la
 *     sesión sin queries extra. Fail-open: si el CMS no responde, el login
 *     procede con role = null.
 *   - maxAge 30 días DECLARADO (antes era el default implícito): sesión
 *     rolling — se renueva con uso, expira tras 30 días sin uso. Sin
 *     auto-logout agresivo (portal informativo) ni "Recordarme" (el
 *     re-login con Google cuesta un clic). Si el gating por rol llega a
 *     proteger contenido sensible, bajar este número es UNA línea.
 *
 * Design decisions:
 *   - JWT session strategy (no DB) — proxy needs O(1) cookie presence check
 *   - AUTH_SECRET / AUTH_URL / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *     read from env (v5 native names, mapped from conventional GOOGLE_* vars)
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { SessionRole } from '@/types/next-auth';
import { env } from './env';
import { trackLogin } from './track-login';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.auth.googleId,
      clientSecret: env.auth.googleSecret,
    }),
  ],
  secret: env.auth.secret,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días rolling — decisión explícita (spec §3)
  },
  pages: { signIn: '/login' },
  callbacks: {
    signIn({ profile }) {
      // Only allow @ues.edu.sv accounts — reject all others
      return !!profile?.email?.endsWith('@ues.edu.sv');
    },
    async jwt({ token, profile }) {
      // `profile` solo existe en el momento del login: copiar identidad y
      // registrar el acceso en el CMS (una sola vez por login)
      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.role = profile.email
          ? await trackLogin(profile.email, profile.name)
          : null;
      }
      return token;
    },
    session({ session, token }) {
      // El JWT de @auth/core es Record<string, unknown> por debajo — el cast
      // acota lo que nosotros mismos escribimos en el jwt callback.
      session.user.role = (token.role as SessionRole | null | undefined) ?? null;
      return session;
    },
  },
});
