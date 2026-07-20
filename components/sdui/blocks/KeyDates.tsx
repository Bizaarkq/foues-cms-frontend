import { CalendarDays } from "lucide-react";
import type { KeyDatesProps } from "@/types/blocks";
import type { DateEntry } from "@/types/elements";
import { EmptyState } from "@/components/sdui/EmptyState";
import { KeyDatesCalendarClient } from "@/components/sdui/blocks/KeyDatesCalendarClient";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  formatDateRange,
  parseISODate,
} from "./key-dates-utils";

/**
 * KeyDates ("Calendario") — fechas importantes en dos vistas:
 * - list (RSC, acá): lista cronológica con chip de rango + badge de categoría.
 * - calendar: mes ancla estilo Google Calendar, delegado al componente
 *   cliente KeyDatesCalendarClient (chips por día + modal de día).
 * Helpers compartidos en key-dates-utils.ts.
 */

// ---------------------------------------------------------------------------
// List sub-component
// ---------------------------------------------------------------------------

function DateList({ items }: { items: DateEntry[] }) {
  if (items.length === 0) {
    return <EmptyState icon={CalendarDays} message="Todavía no hay fechas configuradas." />;
  }

  const sorted = [...items].sort(
    (a, b) => parseISODate(a.start_date).getTime() - parseISODate(b.start_date).getTime()
  );

  return (
    <ul
      className="mt-6 divide-y"
      style={{ borderColor: "color-mix(in srgb, var(--color-foues-navy) 10%, transparent)" }}
    >
      {sorted.map((item, i) => (
        <li key={i} className="flex flex-col gap-2 py-4 md:flex-row md:items-baseline md:gap-6">
          {/* Date chip */}
          <span
            className="shrink-0 rounded px-3 py-1 text-sm font-semibold text-white md:w-56"
            style={{ backgroundColor: "var(--color-foues-navy)" }}
          >
            {formatDateRange(item.start_date, item.end_date)}
          </span>

          {/* Label + category badge + description */}
          <div>
            <p className="font-medium" style={{ color: "var(--color-foues-navy)" }}>
              {item.label}
              {item.category && (
                <span
                  className="ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold text-white"
                  style={{ backgroundColor: CATEGORY_COLOR[item.category] }}
                >
                  {CATEGORY_LABEL[item.category]}
                </span>
              )}
            </p>
            {item.description && (
              <p
                className="mt-1 text-sm"
                style={{ color: "color-mix(in srgb, var(--color-foues-navy) 70%, transparent)" }}
              >
                {item.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function KeyDates({ title, display_mode, items }: KeyDatesProps) {
  const effectiveMode = display_mode ?? "list";

  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-8">
            <h2
              className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {title}
            </h2>
            <span
              className="mt-2 block h-1 w-16 rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
          </div>
        )}

        {effectiveMode === "calendar" ? (
          <KeyDatesCalendarClient items={items} />
        ) : (
          <DateList items={items} />
        )}
      </div>
    </section>
  );
}
