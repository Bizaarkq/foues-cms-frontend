"use client";

/**
 * UserMenu — menú de cuenta del top bar (desktop).
 * Avatar con inicial → dropdown con nombre, correo, badge del rol y
 * "Cerrar sesión" (server action recibida como prop desde el Navbar RSC).
 * Accesible: aria-expanded/haspopup, Escape y clic fuera cierran, focus
 * visible.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

interface UserMenuProps {
  name: string;
  email: string;
  roleName: string | null;
  signOutAction: () => Promise<void>;
}

export function UserMenu({ name, email, roleName, signOutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const firstName = name.trim().split(" ")[0] || name;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 text-sm text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white"
          aria-hidden
        >
          {initial}
        </span>
        <span>{firstName}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)] p-2 shadow-lg"
        >
          <div className="border-b border-[var(--color-foues-border-subtle)] px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-[var(--color-foues-text-strong)]">{name}</p>
            <p className="truncate text-xs text-[var(--color-foues-text-muted)]">{email}</p>
            {roleName && (
              <span
                className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--color-foues-accent)]"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-foues-accent) 14%, transparent)",
                }}
              >
                {roleName}
              </span>
            )}
          </div>
          <form action={signOutAction} className="pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--color-foues-text-body)] transition-colors hover:bg-[var(--color-foues-surface-sunken)] focus-visible:outline-2 focus-visible:outline-[var(--color-foues-accent)]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
