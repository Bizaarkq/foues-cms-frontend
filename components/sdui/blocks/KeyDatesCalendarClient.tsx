"use client";

/**
 * KeyDatesCalendarClient — Google-Calendar-style month view of the
 * "Calendario" block (client component: the day dialog needs interactivity;
 * the list view stays RSC in KeyDates.tsx).
 *
 * Month navigation: the initial month is the visitor's CURRENT month,
 * clamped into [first, last] month carrying dates; the arrows jump to the
 * nearest month that has dates (never paging through empty months). A
 * current month inside the range but without dates still renders, with an
 * inline note. Events spanning a month boundary appear in both months.
 * Desktop (md+) day cells stack up to MAX_VISIBLE_CHIPS category-colored
 * event chips plus a "+N más" hint; mobile cells show colored dots instead
 * (chip text is unreadable at ~45px cells). Any day with events opens a
 * native <dialog> listing ALL of that day's events — one mechanism for
 * touch, keyboard and mouse (showModal() gives focus trap + Escape for
 * free); the browser title tooltip stays as a desktop hover extra.
 * Multi-day events repeat their chip on every day of the range.
 */

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { DateEntry } from "@/types/elements";
import { EmptyState } from "@/components/sdui/EmptyState";
import {
  CATEGORY_LABEL,
  chipColor,
  daysInMonth,
  formatDateRange,
  getMondayOffset,
  isInRange,
  parseISODate,
} from "./key-dates-utils";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const MAX_VISIBLE_CHIPS = 3;

/** Comparable month key: year * 12 + month (0-based). */
function toMonthKey(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

/** Sorted unique keys of every month overlapped by at least one item's range. */
function monthKeysWithEvents(items: DateEntry[]): number[] {
  const keys = new Set<number>();
  for (const item of items) {
    const start = toMonthKey(parseISODate(item.start_date));
    const end =
      item.end_date && item.end_date > item.start_date
        ? toMonthKey(parseISODate(item.end_date))
        : start;
    for (let key = start; key <= end; key++) keys.add(key);
  }
  return [...keys].sort((a, b) => a - b);
}

const monthNameFmt = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

function monthKeyName(key: number): string {
  return monthNameFmt.format(new Date(Math.floor(key / 12), key % 12, 1));
}

export function KeyDatesCalendarClient({ items }: { items: DateEntry[] }) {
  // Month being viewed. Initial = the visitor's current month, clamped into
  // the [first, last] months carrying dates. Computed in the initializer so
  // it runs once; a server/client TZ midnight edge would at most trigger a
  // one-off hydration re-render with the visitor's month — acceptable.
  const [viewKey, setViewKey] = useState<number>(() => {
    const keys = monthKeysWithEvents(items);
    if (keys.length === 0) return toMonthKey(new Date());
    const today = toMonthKey(new Date());
    return Math.min(Math.max(today, keys[0]), keys[keys.length - 1]);
  });
  // Day-of-month whose dialog is open (null = closed).
  const [openDay, setOpenDay] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync React state with the native dialog (external system, no setState here).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openDay !== null && !dialog.open) dialog.showModal();
    if (openDay === null && dialog.open) dialog.close();
  }, [openDay]);

  if (items.length === 0) {
    return <EmptyState icon={CalendarDays} message="Todavía no hay fechas configuradas." />;
  }

  const sorted = [...items].sort(
    (a, b) => parseISODate(a.start_date).getTime() - parseISODate(b.start_date).getTime()
  );

  const eventKeys = monthKeysWithEvents(sorted);
  const anchorYear = Math.floor(viewKey / 12);
  const anchorMonth = viewKey % 12; // 0-based

  // Arrow targets: nearest month WITH dates before/after the viewed one —
  // empty months in between are skipped, not paged through.
  const prevKey = [...eventKeys].reverse().find((k) => k < viewKey);
  const nextKey = eventKeys.find((k) => k > viewKey);

  function goTo(key: number | undefined) {
    if (key === undefined) return;
    setOpenDay(null);
    setViewKey(key);
  }

  const monthName = monthKeyName(viewKey);
  const totalDays = daysInMonth(anchorYear, anchorMonth);
  const firstDayOffset = getMondayOffset(new Date(anchorYear, anchorMonth, 1).getDay());

  // Items overlapping the viewed month (boundary-spanning events show in both)
  const inMonth = sorted.filter((item) => {
    const start = toMonthKey(parseISODate(item.start_date));
    const end =
      item.end_date && item.end_date > item.start_date
        ? toMonthKey(parseISODate(item.end_date))
        : start;
    return start <= viewKey && viewKey <= end;
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

  const openItems = openDay !== null ? getCellItems(openDay) : [];
  const dayTitleFmt = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const openDayTitle =
    openDay !== null ? dayTitleFmt.format(new Date(anchorYear, anchorMonth, openDay)) : "";

  return (
    <div className="mt-6">
      {/* Month header + navigation (arrows jump to the nearest month with dates) */}
      <div className="mb-4 flex items-center justify-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => goTo(prevKey)}
          disabled={prevKey === undefined}
          aria-label={
            prevKey !== undefined ? `Mes anterior con fechas: ${monthKeyName(prevKey)}` : "No hay meses anteriores con fechas"
          }
          className="flex h-9 w-9 items-center justify-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] hover:bg-[var(--color-foues-surface-sunken)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          style={{
            borderColor: "var(--color-foues-border-subtle)",
            color: "var(--color-foues-navy)",
          }}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <p
          className="min-w-44 text-center text-xl font-semibold capitalize"
          style={{ color: "var(--color-foues-navy)" }}
          aria-live="polite"
        >
          {monthName}
        </p>
        <button
          type="button"
          onClick={() => goTo(nextKey)}
          disabled={nextKey === undefined}
          aria-label={
            nextKey !== undefined ? `Mes siguiente con fechas: ${monthKeyName(nextKey)}` : "No hay meses siguientes con fechas"
          }
          className="flex h-9 w-9 items-center justify-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] hover:bg-[var(--color-foues-surface-sunken)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          style={{
            borderColor: "var(--color-foues-border-subtle)",
            color: "var(--color-foues-navy)",
          }}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

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
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} className="min-h-16 md:min-h-24" />;
          }
          const matched = getCellItems(day);
          const hasEvents = matched.length > 0;
          const extra = matched.length - MAX_VISIBLE_CHIPS;

          const cellContent = (
            <>
              <span
                className={`px-1 text-xs sm:text-sm ${hasEvents ? "font-semibold" : ""}`}
                style={{
                  color: hasEvents
                    ? "var(--color-foues-navy)"
                    : "color-mix(in srgb, var(--color-foues-navy) 70%, transparent)",
                }}
              >
                {day}
              </span>
              {hasEvents && (
                <>
                  {/* md+: stacked event chips */}
                  <span className="mt-0.5 hidden w-full flex-col gap-0.5 md:flex">
                    {matched.slice(0, MAX_VISIBLE_CHIPS).map((item, j) => (
                      <span
                        key={j}
                        className="block w-full truncate rounded-sm px-1 py-px text-left text-[11px] font-medium leading-4 text-white"
                        style={{ backgroundColor: chipColor(item) }}
                      >
                        {item.label}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span
                        className="px-1 text-left text-[11px] font-medium"
                        style={{ color: "var(--color-foues-text-muted)" }}
                      >
                        +{extra} más
                      </span>
                    )}
                  </span>
                  {/* < md: category dots (chip text unreadable at this size) */}
                  <span className="mt-1 flex gap-1 px-1 md:hidden" aria-hidden="true">
                    {matched.slice(0, 3).map((item, j) => (
                      <span
                        key={j}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: chipColor(item) }}
                      />
                    ))}
                  </span>
                </>
              )}
            </>
          );

          return hasEvents ? (
            <button
              key={day}
              type="button"
              onClick={() => setOpenDay(day)}
              title={matched.map((m) => m.label).join(", ")}
              aria-haspopup="dialog"
              aria-label={`Día ${day}: ${matched.length} ${matched.length === 1 ? "evento" : "eventos"}`}
              className="flex min-h-16 cursor-pointer flex-col items-start rounded-md border p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] motion-safe:transition-colors hover:bg-[color-mix(in_srgb,var(--color-foues-accent)_6%,transparent)] md:min-h-24"
              style={{ borderColor: "var(--color-foues-border-subtle)" }}
            >
              {cellContent}
            </button>
          ) : (
            <div
              key={day}
              className="flex min-h-16 flex-col items-start rounded-md border p-1 md:min-h-24"
              style={{
                borderColor: "color-mix(in srgb, var(--color-foues-border-subtle) 50%, transparent)",
              }}
            >
              {cellContent}
            </div>
          );
        })}
      </div>

      {/* Day dialog — ALL events of the clicked day (not just the overflow) */}
      <dialog
        ref={dialogRef}
        onClose={() => setOpenDay(null)}
        onClick={(e) => {
          // Backdrop click: the dialog itself is the target only outside the panel
          if (e.target === dialogRef.current) setOpenDay(null);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border p-0 shadow-xl backdrop:bg-black/40"
        style={{
          borderColor: "var(--color-foues-border-subtle)",
          background: "var(--color-foues-surface-raised)",
        }}
        aria-label={openDayTitle || undefined}
      >
        {openDay !== null && (
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <h4
                className="text-lg font-bold capitalize"
                style={{ color: "var(--color-foues-navy)" }}
              >
                {openDayTitle}
              </h4>
              <button
                type="button"
                onClick={() => setOpenDay(null)}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] hover:bg-[var(--color-foues-surface-sunken)]"
                style={{ color: "var(--color-foues-text-muted)" }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-4">
              {openItems.map((item, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.category && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: chipColor(item) }}
                      >
                        {CATEGORY_LABEL[item.category]}
                      </span>
                    )}
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-foues-text-base)" }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-foues-text-muted)" }}>
                    {formatDateRange(item.start_date, item.end_date)}
                  </p>
                  {item.description && (
                    <p className="text-sm" style={{ color: "var(--color-foues-text-secondary)" }}>
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>

      {/* Current month inside the range but without dates: say so instead of
          silently showing a blank grid (only the arrows reveal the rest). */}
      {inMonth.length === 0 && (
        <p
          className="mt-4 text-center text-sm"
          style={{ color: "var(--color-foues-text-muted)" }}
        >
          Este mes no tiene fechas programadas — usá las flechas para ver los meses con fechas.
        </p>
      )}
    </div>
  );
}
