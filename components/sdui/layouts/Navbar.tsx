/**
 * Navbar — dos filas: barra superior accent + barra principal blanca con logo.
 * RSC (sin "use client"). Recibe NavbarData desde getPageByPath().
 * Dropdown: grupo `group` + `group-hover:flex` sin JavaScript.
 *
 * Lógica de sections:
 * - path && routes → link clickeable + dropdown al hover
 * - path && !routes → link directo (sin chevron)
 * - !path && routes → span trigger de dropdown
 * - !path && !routes → span estático
 */

import Link from "next/link";
import { ChevronDown, Monitor, LogIn } from "lucide-react";
import type { NavbarData } from "@/types/page";

export function Navbar({ navbar }: { navbar: NavbarData }) {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Barra superior */}
      <div
        className="flex h-9 items-center justify-end gap-6 px-6"
        style={{ backgroundColor: "var(--color-foues-accent)" }}
      >
        <a
          href="#"
          className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
        >
          <Monitor className="h-4 w-4" />
          <span>Campus Virtual</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
        >
          <LogIn className="h-4 w-4" />
          <span>Iniciar sesión</span>
        </a>
      </div>

      {/* Barra principal */}
      <div className="bg-white shadow-sm">
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
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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
            {navbar.sections.map((section) => {
              const hasRoutes = section.routes.length > 0;
              const hasPath = Boolean(section.path);

              return (
                <li key={section.documentId} className="relative group">
                  {/* Trigger: link si tiene path, span si no */}
                  {hasPath ? (
                    <Link
                      href={section.path!}
                      className="flex items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[var(--color-foues-navy)] transition-colors"
                    >
                      {section.name}
                      {hasRoutes && (
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" />
                      )}
                    </Link>
                  ) : (
                    <span className="flex cursor-default items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      <span className="group-hover:text-[var(--color-foues-navy)] transition-colors">
                        {section.name}
                      </span>
                      {hasRoutes && (
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" />
                      )}
                    </span>
                  )}

                  {/* Dropdown */}
                  {hasRoutes && (
                    <ul className="absolute left-0 top-full z-10 hidden min-w-56 flex-col rounded-md border border-gray-100 bg-white py-2 shadow-lg group-hover:flex">
                      {section.routes.map((route) => (
                        <li key={route.documentId}>
                          <Link
                            href={route.path}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--color-foues-navy)]"
                          >
                            {route.label ?? route.path}
                          </Link>
                          {route.children?.length > 0 && (
                            <ul className="border-l border-gray-100 pl-2">
                              {route.children.map((child) => (
                                <li key={child.documentId}>
                                  <Link
                                    href={child.path}
                                    className="block px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-[var(--color-foues-navy)]"
                                  >
                                    {child.label ?? child.path}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
