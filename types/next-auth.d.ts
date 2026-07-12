/**
 * Augmentación de tipos de Auth.js: la sesión lleva el rol del usuario
 * (resuelto por el CMS en el login vía track-login). `null` cuando el
 * registro falló (fail-open) o el usuario no tiene rol asignado.
 */

import type { DefaultSession } from "next-auth";

export interface SessionRole {
  key: string | null;
  name: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      role: SessionRole | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: SessionRole | null;
  }
}
