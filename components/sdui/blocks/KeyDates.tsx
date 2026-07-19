import { CalendarDays } from "lucide-react";
import type { KeyDatesProps } from "@/types/blocks";
import type { DateCategory, DateEntry } from "@/types/elements";
import { EmptyState } from "@/components/sdui/EmptyState";

// ---------------------------------------------------------------------------
// Categories (merged in from the former blocks.calendar)
// ---------------------------------------------------------------------------

const CATEGORY_LABEL: Record<DateCategory, string> = {
  academico: "Académico",
  evento: "Evento",
  fecha_limite: "Fecha límite",
  asueto: "Asueto",
  otro: "Otro",
};

const CATEGORY_COLOR: Record<DateCategory, string> = {
  academico: "var(--color-foues-navy)",
  evento: "var(--color-foues-accent)",
  fecha_limite: "var(--color-foues-red)",
  asueto: "var(--color-foues-state-success)",
  otro: "var(--color-foues-text-muted)",
};

/** Solid chip color for an entry: its category color, accent when uncategorised. */
function chipColor(item: DateEntry): string {
  return item.category ? CATEGORY_COLOR[item.category] : "var(--color-foues-accent)";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse an ISO date string ("YYYY-MM-DD") as local midnight to avoid TZ drift. */
function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00");
}

/** Convert JS getDay() (0=Sun…6=Sat) to Monday-start offset (0=Mon…6=Sun). */
function getMondayOffset(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Number of days in a given year/month (0-based month). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Check whether a given Date falls within a DateEntry's range (inclusive). */
function isInRange(day: Date, item: DateEntry): boolean {
  const start = parseISODate(item.start_date);
  const end = item.end_date ? parseISODate(item.end_date) : start;
  return day >= start && day <= end;
}

/** Format a date range. Returns "15 mar 2026" or "15 mar – 30 mar 2026". */
function formatDateRange(start: string, end: string | null): string {
  const fmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
  const fmtYear = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

  const s = parseISODate(start);
  if (!end || end === start) {
    return fmtYear.format(s);
  }
  const e = parseISODate(end);
  return `${fmt.format(s)} – ${fmtYear.format(e)}`;
}

// ---------------------------------------------------------------------------
// Calendar sub-component
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function CalendarGrid({ items }: { items: DateEntry[] }) {
  if (items.length === 0) {
    return <EmptyState icon={CalendarDays} message="Todavía no hay fechas configuradas." />;
  }

  // Anchor month = first item's start_date after sorting
  const sorted = [...items].sort(
    (a, b) => parseISODate(a.start_date).getTime() - parseISODate(b.start_date).getTime()
  );

  const anchor = parseISODate(sorted[0].start_date);
  const anchorYear = anchor.getFullYear();
  const anchorMonth = anchor.getMonth(); // 0-based

  const monthName = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(anchorYear, anchorMonth, 1)
  );

  const totalDays = daysInMonth(anchorYear, anchorMonth);
  const firstDayOffset = getMondayOffset(new Date(anchorYear, anchorMonth, 1).getDay());

  // Items inside and outside the anchor month
  const inMonth = sorted.filter((item) => {
    const d = parseISODate(item.start_date);
    return d.getFullYear() === anchorYear && d.getMonth() === anchorMonth;
  });
  const outOfMonth = sorted.filter((item) => {
    const d = parseISODate(item.start_date);
    return !(d.getFullYear() === anchorYear && d.getMonth() === anchorMonth);
  });

  // Build cell array: nulls for leading blanks, then day numbers
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  function getCellItems(day: number): DateEntry[] {
    const date = new Date(anchorYear, anchorMonth, day);
    return inMonth.filter((item) => isInRange(date, item));
  }

  return (
    <div className="mt-6">
      {/* Month header */}
      <p
        className="mb-4 text-center text-xl font-semibold capitalize"
        style={{ color: "var(--color-foues-navy)" }}
      >
        {monthName}
      </p>

      {/* Weekday header */}
      <div
        className="mb-2 grid grid-cols-7 border-b pb-2 text-xs uppercase tracking-wide"
        style={{ color: "color-mix(in srgb, var(--color-foues-navy) 60%, transparent)" }}
      >
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} className="aspect-square" />;
          }
          const matched = getCellItems(day);
          const isHighlighted = matched.length > 0;
          const tooltipLabel = matched.map((m) => m.label).join(", ");

          return (
            <div
              key={day}
              title={tooltipLabel || undefined}
              className={[
                "aspect-square flex items-center justify-center rounded-md text-xs sm:text-sm",
                isHighlighted ? "font-semibold" : "",
              ].join(" ")}
              style={
                isHighlighted
                  ? {
                      // Day tint follows the (first) matched entry's category
                      backgroundColor: `color-mix(in srgb, ${chipColor(matched[0])} 15%, transparent)`,
                      color: "var(--color-foues-navy)",
                    }
                  : { color: "color-mix(in srgb, var(--color-foues-navy) 70%, transparent)" }
              }
            >
              {day}
              {isHighlighted && (
                // Señal no-cromática: lector de pantalla anuncia el evento
                // (el resaltado visual es solo color + peso de fuente)
                <span className="sr-only">, evento: {tooltipLabel}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend for anchor-month items */}
      {inMonth.length > 0 && (
        <ul className="mt-6 space-y-2">
          {inMonth.map((item, i) => (
            <li key={i} className="flex items-baseline gap-3">
              <span
                className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: chipColor(item) }}
              >
                {formatDateRange(item.start_date, item.end_date)}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--color-foues-navy)" }}>
                {item.label}
                {item.category && (
                  <span className="sr-only"> ({CATEGORY_LABEL[item.category]})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Out-of-month items */}
      {outOfMonth.length > 0 && (
        <div className="mt-6">
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "color-mix(in srgb, var(--color-foues-navy) 60%, transparent)" }}
          >
            Otras fechas
          </p>
          <ul className="space-y-2">
            {outOfMonth.map((item, i) => (
              <li key={i} className="flex items-baseline gap-3">
                <span
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-foues-navy) 60%, transparent)" }}
                >
                  {formatDateRange(item.start_date, item.end_date)}
                </span>
                <span className="text-sm" style={{ color: "var(--color-foues-navy)" }}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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
          <CalendarGrid items={items} />
        ) : (
          <DateList items={items} />
        )}
      </div>
    </section>
  );
}
