/**
 * key-dates-utils — date/category helpers shared by the two views of the
 * "Calendario" block: DateList (RSC, KeyDates.tsx) and the client month
 * grid (KeyDatesCalendarClient.tsx). No "use client" — importable from both.
 */

import type { DateCategory, DateEntry } from "@/types/elements";

// ---------------------------------------------------------------------------
// Categories (merged in from the former blocks.calendar)
// ---------------------------------------------------------------------------

export const CATEGORY_LABEL: Record<DateCategory, string> = {
  academico: "Académico",
  evento: "Evento",
  fecha_limite: "Fecha límite",
  asueto: "Asueto",
  otro: "Otro",
};

export const CATEGORY_COLOR: Record<DateCategory, string> = {
  academico: "var(--color-foues-navy)",
  evento: "var(--color-foues-accent)",
  fecha_limite: "var(--color-foues-red)",
  asueto: "var(--color-foues-state-success)",
  otro: "var(--color-foues-text-muted)",
};

/** Solid chip color for an entry: its category color, accent when uncategorised. */
export function chipColor(item: DateEntry): string {
  return item.category ? CATEGORY_COLOR[item.category] : "var(--color-foues-accent)";
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Parse an ISO date string ("YYYY-MM-DD") as local midnight to avoid TZ drift. */
export function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00");
}

/** Convert JS getDay() (0=Sun…6=Sat) to Monday-start offset (0=Mon…6=Sun). */
export function getMondayOffset(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Number of days in a given year/month (0-based month). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Check whether a given Date falls within a DateEntry's range (inclusive). */
export function isInRange(day: Date, item: DateEntry): boolean {
  const start = parseISODate(item.start_date);
  const end = item.end_date ? parseISODate(item.end_date) : start;
  return day >= start && day <= end;
}

/** Format a date range. Returns "15 mar 2026" or "15 mar – 30 mar 2026". */
export function formatDateRange(start: string, end: string | null): string {
  const fmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
  const fmtYear = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

  const s = parseISODate(start);
  if (!end || end === start) {
    return fmtYear.format(s);
  }
  const e = parseISODate(end);
  return `${fmt.format(s)} – ${fmtYear.format(e)}`;
}
