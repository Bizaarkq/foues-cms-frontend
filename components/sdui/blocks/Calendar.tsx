import { CalendarDays } from "lucide-react";
import type { CalendarProps } from "@/types/blocks";
import type { ScheduleCategory, ScheduleItemElement } from "@/types/elements";
import { EmptyState } from "@/components/sdui/EmptyState";

/**
 * Calendar — calendario académico / agenda de eventos.
 * Lista cronológica agrupada por mes: chip de fecha + título + descripción
 * + badge de categoría. (Reemplaza el stub que mostraba "[stub]" al visitante.)
 */

const CATEGORY_LABEL: Record<ScheduleCategory, string> = {
  academic: "Académico",
  event: "Evento",
  deadline: "Fecha límite",
  holiday: "Asueto",
  other: "Otro",
};

const CATEGORY_COLOR: Record<ScheduleCategory, string> = {
  academic: "var(--color-foues-navy)",
  event: "var(--color-foues-accent)",
  deadline: "var(--color-foues-red)",
  holiday: "var(--color-foues-state-success)",
  other: "var(--color-foues-text-muted)",
};

/** Parse ISO "YYYY-MM-DD" as local midnight (avoids TZ drift). */
function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00");
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
}

export default function Calendar({ title, items }: CalendarProps) {
  const sorted = [...items].sort(
    (a, b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime()
  );

  // Agrupar por mes conservando el orden cronológico
  const groups: { label: string; entries: ScheduleItemElement[] }[] = [];
  const byKey = new Map<string, number>();
  const monthFmt = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  for (const item of sorted) {
    const d = parseISODate(item.date);
    const key = monthKey(d);
    let idx = byKey.get(key);
    if (idx === undefined) {
      idx = groups.length;
      byKey.set(key, idx);
      groups.push({ label: monthFmt.format(d), entries: [] });
    }
    groups[idx].entries.push(item);
  }

  const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit" });
  const weekdayFmt = new Intl.DateTimeFormat("es-ES", { weekday: "short" });

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

        {sorted.length === 0 ? (
          <EmptyState icon={CalendarDays} message="Todavía no hay eventos en el calendario." />
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="mb-4 text-lg font-semibold capitalize text-[var(--color-foues-text-strong)]">
                  {group.label}
                </h3>
                <ul className="space-y-3">
                  {group.entries.map((item, i) => {
                    const d = parseISODate(item.date);
                    const color = CATEGORY_COLOR[item.category] ?? CATEGORY_COLOR.other;
                    return (
                      <li
                        key={`${item.date}-${i}`}
                        className="flex items-start gap-4 rounded-xl border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)] p-4 shadow-sm"
                      >
                        {/* Chip de fecha */}
                        <div
                          className="flex w-14 shrink-0 flex-col items-center rounded-lg py-2 text-white"
                          style={{ backgroundColor: "var(--color-foues-navy)" }}
                        >
                          <span className="text-xl font-bold leading-none">{dayFmt.format(d)}</span>
                          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                            {weekdayFmt.format(d)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--color-foues-text-base)]">{item.title}</p>
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {CATEGORY_LABEL[item.category] ?? CATEGORY_LABEL.other}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-[var(--color-foues-text-secondary)]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
