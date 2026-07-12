/**
 * MobileBottomNav — RSC wrapper for the mobile bottom navigation (issue #3).
 * Resolves the session, applies the same visibility filtering as the desktop
 * Navbar, and validates the CMS-governed bar shortcuts before handing a
 * plain, serializable payload to the isolated client component.
 *
 * Bar shortcut rules (single type "mobile-navbar" in Strapi, max 3):
 * - external_url wins over route when both are set
 * - internal targets must be an active route WITH a page attached — a tap
 *   must always land on real content (route type alone is not enough:
 *   'section' routes can carry a page too, e.g. /pregrado)
 * - 'requires-login' targets are hidden from anonymous visitors
 *
 * Spec sesión de usuario §4: en móvil el top bar del Navbar no existe — la
 * cuenta (y Campus Virtual) viven en el pie del bottom sheet. Este RSC arma
 * ese bloque (incluido el form del signOut, server action) y lo pasa al
 * client como children: cero lógica de auth en el cliente.
 */

import Link from "next/link";
import { LogIn, LogOut, Monitor } from "lucide-react";
import type { NavbarData } from "@/types/page";
import { auth, signOut } from "@/lib/auth";
import { env } from "@/lib/env";
import { filterByVisibility } from "./Navbar";
import { MobileBottomNavClient, type MobileBarShortcut } from "./MobileBottomNavClient";

function SheetAccount({
  name,
  email,
  roleName,
}: {
  name: string;
  email: string;
  roleName: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: "var(--color-foues-navy)" }}
        aria-hidden
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-foues-text-strong)]">{name}</p>
        <p className="truncate text-xs text-[var(--color-foues-text-muted)]">{email}</p>
      </div>
      {roleName && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--color-foues-accent)]"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-foues-accent) 14%, transparent)",
          }}
        >
          {roleName}
        </span>
      )}
    </div>
  );
}

export async function MobileBottomNav({ navbar }: { navbar: NavbarData }) {
  const session = await auth();
  const isLoggedIn = session != null;

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  // Same shape the desktop Navbar renders: root containers flattened to
  // their children, ordered by route.order.
  const menuItems = filterByVisibility(navbar.items, isLoggedIn)
    .flatMap((root) => root.children)
    .sort((a, b) => a.order - b.order);

  const shortcuts: MobileBarShortcut[] = navbar.mobileNav
    .filter((item) => {
      if (item.external_url) return true;
      if (!item.route) return false;
      if (!item.route.active || !item.route.hasPage || !item.route.path) return false;
      if (item.route.visibility === "requires-login" && !isLoggedIn) return false;
      return true;
    })
    .slice(0, 3)
    .map((item) => ({
      label: item.label,
      icon: item.icon,
      href: item.external_url ?? item.route!.path,
      external: item.external_url != null,
    }));

  const sheetFooter = (
    <div className="flex flex-col gap-3">
      {session?.user?.name && session.user.email ? (
        <>
          <SheetAccount
            name={session.user.name}
            email={session.user.email}
            roleName={session.user.role?.name ?? null}
          />
          <form action={doSignOut}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]"
              style={{
                borderColor: "var(--color-foues-navy)",
                color: "var(--color-foues-navy)",
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]"
          style={{ backgroundColor: "var(--color-foues-navy)" }}
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Iniciar sesión
        </Link>
      )}

      {env.campusVirtualUrl && (
        <a
          href={env.campusVirtualUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--color-foues-text-secondary)] transition-colors hover:text-[var(--color-foues-navy)] focus-visible:outline-2 focus-visible:outline-[var(--color-foues-accent)]"
        >
          <Monitor className="h-4 w-4" aria-hidden />
          Campus Virtual
        </a>
      )}
    </div>
  );

  return (
    <MobileBottomNavClient items={menuItems} shortcuts={shortcuts} sheetFooter={sheetFooter} />
  );
}
