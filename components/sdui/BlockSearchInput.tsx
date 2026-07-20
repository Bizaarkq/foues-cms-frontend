"use client";

/**
 * BlockSearchInput — shared search field for list-type SDUI blocks
 * (document repository, magazine archive, article list). Controlled input
 * with search icon and clear button; the owning block does the actual
 * matching (see lib/search.ts).
 */

import { Search, X } from "lucide-react";

export function BlockSearchInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Accessible name; also the placeholder fallback. */
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: "var(--color-foues-text-muted)" }}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={placeholder ?? label}
        className="w-full rounded border bg-[var(--color-foues-surface-raised)] py-2 pl-9 pr-9 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] [&::-webkit-search-cancel-button]:hidden"
        style={{
          borderColor: "var(--color-foues-border-subtle)",
          color: "var(--color-foues-text-base)",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)]"
          style={{ color: "var(--color-foues-text-muted)" }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
