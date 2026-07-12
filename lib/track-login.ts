/**
 * trackLogin — registra el inicio de sesión en el CMS y devuelve el rol.
 *
 * Fail-open por diseño (spec §3): el registro de accesos es informativo y
 * JAMÁS bloquea el login. Si Strapi está caído o lento (timeout 3 s), el
 * usuario entra igual con role = null y el error queda en el log.
 */

import { env } from "./env";
import type { SessionRole } from "@/types/next-auth";

export async function trackLogin(
  email: string,
  name: string | null | undefined
): Promise<SessionRole | null> {
  try {
    const res = await fetch(`${env.strapi.url}/api/site-users/track-login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.siteUserToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name: name ?? "" }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = (await res.json()) as { ok: boolean; role: SessionRole | null };
    return json.role ?? null;
  } catch (err) {
    console.error("[track-login] registro de acceso falló (el login continúa):", err);
    return null;
  }
}
