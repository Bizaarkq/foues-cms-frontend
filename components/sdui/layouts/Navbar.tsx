/**
 * Navbar — dos filas: barra superior accent + barra principal blanca con logo.
 * RSC (sin "use client"). Recibe NavbarData desde getPageByPath().
 * Dropdown: grupo `group` + `group-hover:flex` sin JavaScript.
 *
 * Lógica de items por type:
 * - 'section': link si path no es null, span si no. Dropdown si children.length > 0
 * - 'header': siempre span (no clickeable). Dropdown si children.length > 0
 * - 'page': Link href. Dropdown si children.length > 0
 */

import Link from "next/link";
import { ChevronDown, Monitor, LogIn, LogOut } from "lucide-react";
import type { NavbarData, RouteNavItem } from "@/types/page";
import { auth, signOut } from "@/lib/auth";
import { env } from "@/lib/env";

function NavItem({ item }: { item: RouteNavItem }) {
  const hasChildren = item.children.length > 0;
  const label = item.label ?? item.slug ?? item.path;

  const triggerClass =
    "flex items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-[var(--color-foues-text-body)] hover:bg-[var(--color-foues-surface-sunken)] hover:text-[var(--color-foues-navy)] transition-colors";

  let trigger: React.ReactNode;

  if (item.type === 'header') {
    // Header: always non-clickable span
    trigger = (
      <span className={`${triggerClass} cursor-default`}>
        <span className="group-hover:text-[var(--color-foues-navy)] transition-colors">
          {label}
        </span>
        {hasChildren && (
          <ChevronDown className="h-4 w-4 text-[var(--color-foues-text-muted)] transition-transform group-hover:rotate-180" />
        )}
      </span>
    );
  } else if (item.type === 'section') {
    // Section: link if path is non-null, span otherwise
    trigger = item.path ? (
      <Link href={item.path} className={triggerClass}>
        {label}
        {hasChildren && (
          <ChevronDown className="h-4 w-4 text-[var(--color-foues-text-muted)] transition-transform group-hover:rotate-180" />
        )}
      </Link>
    ) : (
      <span className={`${triggerClass} cursor-default`}>
        <span className="group-hover:text-[var(--color-foues-navy)] transition-colors">
          {label}
        </span>
        {hasChildren && (
          <ChevronDown className="h-4 w-4 text-[var(--color-foues-text-muted)] transition-transform group-hover:rotate-180" />
        )}
      </span>
    );
  } else {
    // page: always a link
    trigger = (
      <Link href={item.path} className={triggerClass}>
        {label}
        {hasChildren && (
          <ChevronDown className="h-4 w-4 text-[var(--color-foues-text-muted)] transition-transform group-hover:rotate-180" />
        )}
      </Link>
    );
  }

  return (
    <li className="relative group">
      {trigger}

      {/* Dropdown */}
      {hasChildren && (
        <ul className="absolute left-0 top-full z-10 hidden min-w-56 flex-col rounded-md border border-[var(--color-foues-border)] bg-[var(--color-foues-surface-raised)] py-2 shadow-lg group-hover:flex">
          {item.children.map((child) => {
            const childLabel = child.label ?? child.slug ?? child.path;
            return (
              <li key={child.documentId}>
                {child.type === 'header' ? (
                  <span className="block px-4 py-2 text-sm font-semibold text-[var(--color-foues-text-muted)] cursor-default">
                    {childLabel}
                  </span>
                ) : (
                  <Link
                    href={child.path}
                    className="block px-4 py-2 text-sm text-[var(--color-foues-text-body)] hover:bg-[var(--color-foues-surface-sunken)] hover:text-[var(--color-foues-navy)]"
                  >
                    {childLabel}
                  </Link>
                )}
                {child.children.length > 0 && (
                  <ul className="border-l border-[var(--color-foues-border)] pl-2">
                    {child.children.map((grandchild) => {
                      const gcLabel = grandchild.label ?? grandchild.slug ?? grandchild.path;
                      return (
                        <li key={grandchild.documentId}>
                          {grandchild.type === 'header' ? (
                            <span className="block px-4 py-1.5 text-sm text-[var(--color-foues-text-faint)] cursor-default">
                              {gcLabel}
                            </span>
                          ) : (
                            <Link
                              href={grandchild.path}
                              className="block px-4 py-1.5 text-sm text-[var(--color-foues-text-muted)] hover:bg-[var(--color-foues-surface-sunken)] hover:text-[var(--color-foues-navy)]"
                            >
                              {gcLabel}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export async function Navbar({ navbar }: { navbar: NavbarData }) {
  const session = await auth();
  const userName = session?.user?.name?.split(' ')[0] ?? null;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Barra superior */}
      <div
        className="flex h-9 items-center justify-end gap-6 px-6"
        style={{ backgroundColor: "var(--color-foues-accent)" }}
      >
        {env.campusVirtualUrl && (
          <a
            href={env.campusVirtualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
          >
            <Monitor className="h-4 w-4" />
            <span>Campus Virtual</span>
          </a>
        )}
        {session ? (
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión{userName ? ` (${userName})` : ''}</span>
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Iniciar sesión</span>
          </Link>
        )}
      </div>

      {/* Barra principal */}
      <div className="bg-[var(--color-foues-surface-raised)] shadow-sm">
        <nav className="mx-auto flex max-w-[1920px] items-center justify-between gap-8 px-4 h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-foues-navy)" }}
            >
              UES
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-foues-text-muted)]">
                Universidad de El Salvador
              </span>
              <span
                className="text-base font-bold"
                style={{ color: "var(--color-foues-navy)" }}
              >
                Facultad de Odontología
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <ul className="hidden md:flex items-center gap-1">
            {navbar.items
              .flatMap((root) => root.children)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <NavItem key={item.documentId} item={item} />
              ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
