"use client";

/**
 * MobileBottomNavClient — bottom navigation bar + bottom sheet (issue #3).
 *
 * Visible only under `md`. The bar keeps the primary destinations in the
 * thumb zone: "Inicio" (hardcoded) + up to 3 CMS-governed shortcuts + "Menú".
 * "Menú" opens a bottom sheet with the full 3-level navigation tree as an
 * accordion — same items and visibility rules as the desktop Navbar (the
 * server wrapper pre-filters them).
 *
 * Accessibility: the sheet is a modal dialog (Escape closes, scrim click
 * closes, body scroll locked, focus moves to the close button on open and
 * back to the trigger on close). Accordion toggles are real buttons with
 * aria-expanded.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home, Menu, X } from "lucide-react";
import type { RouteNavItem } from "@/types/page";
import { LucideIcon } from "@/components/ui/LucideIcon";

export interface MobileBarShortcut {
  label: string;
  icon: string | null;
  href: string;
  external: boolean;
}

interface MobileBottomNavClientProps {
  items: RouteNavItem[];
  shortcuts: MobileBarShortcut[];
  /** Pie del sheet renderizado por el RSC padre (cuenta / login / Campus). */
  sheetFooter?: React.ReactNode;
}

const barItemClass =
  "flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 pt-1.5 pb-1 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-foues-accent)]";

function barItemColor(active: boolean): string {
  return active
    ? "text-[var(--color-foues-navy)]"
    : "text-[var(--color-foues-text-muted)] hover:text-[var(--color-foues-navy)]";
}

/** One row of the sheet's navigation tree, recursive over children. */
function SheetNavRow({
  item,
  depth,
  onNavigate,
}: {
  item: RouteNavItem;
  depth: number;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children.length > 0;
  const label = item.label ?? item.slug ?? item.path;
  const isClickable = item.type !== "header" && item.path != null;

  const rowText =
    depth === 0
      ? "text-[15px] font-semibold text-[var(--color-foues-text-body)]"
      : depth === 1
        ? "text-sm font-medium text-[var(--color-foues-text-body)]"
        : "text-sm text-[var(--color-foues-text-muted)]";

  const rowBase = `flex min-h-12 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left ${rowText} focus-visible:outline-2 focus-visible:outline-[var(--color-foues-accent)]`;
  const chevron = (
    <ChevronDown
      className={`h-4.5 w-4.5 shrink-0 text-[var(--color-foues-text-muted)] transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
      aria-hidden
    />
  );

  return (
    <li>
      {isClickable ? (
        <div className="flex items-stretch gap-1">
          <Link
            href={item.path}
            onClick={onNavigate}
            className={`${rowBase} flex-1 active:bg-[var(--color-foues-surface-sunken)]`}
          >
            {label}
          </Link>
          {hasChildren && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={`${expanded ? "Contraer" : "Expandir"} ${label}`}
              onClick={() => setExpanded((v) => !v)}
              className="flex w-12 shrink-0 items-center justify-center rounded-lg active:bg-[var(--color-foues-surface-sunken)] focus-visible:outline-2 focus-visible:outline-[var(--color-foues-accent)]"
            >
              {chevron}
            </button>
          )}
        </div>
      ) : hasChildren ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={`${rowBase} justify-between active:bg-[var(--color-foues-surface-sunken)]`}
        >
          <span>{label}</span>
          {chevron}
        </button>
      ) : (
        <span className={`${rowBase} cursor-default`}>{label}</span>
      )}

      {hasChildren && expanded && (
        <ul className="ml-4 border-l-2 border-[var(--color-foues-border-subtle)] pl-1">
          {item.children.map((child) => (
            <SheetNavRow
              key={child.documentId}
              item={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MobileBottomNavClient({ items, shortcuts, sheetFooter }: MobileBottomNavClientProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Escape closes; body scroll locks while the sheet is open.
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <div className="md:hidden">
      {/* The bar is fixed — this spacer reserves its height in the page flow */}
      <div
        aria-hidden
        className="h-16"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      />

      {/* Scrim + bottom sheet */}
      <div
        className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          onClick={close}
          className={`absolute inset-0 bg-black/45 transition-opacity motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
        />
        <section
          id="mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className={`absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col rounded-t-2xl bg-[var(--color-foues-surface-raised)] shadow-[0_-8px_30px_rgb(0_0_0/0.25)] transition-transform duration-300 motion-reduce:transition-none ${open ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="shrink-0 border-b border-[var(--color-foues-border-subtle)] px-4 pb-2 pt-2">
            <div
              aria-hidden
              className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--color-foues-border-subtle)]"
            />
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-foues-text-muted)]">
                Navegación
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Cerrar menú"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-foues-surface-sunken)] text-[var(--color-foues-text-body)] focus-visible:outline-2 focus-visible:outline-[var(--color-foues-accent)]"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-2 pt-1 pb-4">
            <ul>
              {items.map((item) => (
                <SheetNavRow key={item.documentId} item={item} depth={0} onNavigate={close} />
              ))}
            </ul>
          </div>
          {sheetFooter && (
            <div
              className="shrink-0 border-t border-[var(--color-foues-border-subtle)] px-4 pt-4"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
            >
              {sheetFooter}
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-stretch px-1">
          <Link href="/" className={`${barItemClass} ${barItemColor(pathname === "/")}`}>
            <Home className="h-5.5 w-5.5" aria-hidden />
            <span>Inicio</span>
          </Link>

          {shortcuts.map((shortcut) =>
            shortcut.external ? (
              <a
                key={shortcut.href}
                href={shortcut.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${barItemClass} ${barItemColor(false)}`}
              >
                <LucideIcon name={shortcut.icon} size={22} aria-hidden />
                <span>{shortcut.label}</span>
              </a>
            ) : (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className={`${barItemClass} ${barItemColor(pathname === shortcut.href)}`}
              >
                <LucideIcon name={shortcut.icon} size={22} aria-hidden />
                <span>{shortcut.label}</span>
              </Link>
            )
          )}

          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav-sheet"
            onClick={() => (open ? close() : setOpen(true))}
            className={`${barItemClass} ${barItemColor(open)}`}
          >
            {open ? <X className="h-5.5 w-5.5" aria-hidden /> : <Menu className="h-5.5 w-5.5" aria-hidden />}
            <span>Menú</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
