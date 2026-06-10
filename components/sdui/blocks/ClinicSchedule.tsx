import type { ClinicScheduleProps } from "@/types/blocks";

export default function ClinicSchedule({
  clinic_name,
  hours,
  schedule_text,
}: ClinicScheduleProps) {
  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        <div
          className="rounded-xl border bg-[var(--color-foues-surface-raised)] p-8 shadow-sm md:p-10"
          style={{
            borderColor:
              "color-mix(in srgb, var(--color-foues-navy) 10%, transparent)",
          }}
        >
          {/* Clinic name heading — InfoCard panel pattern (ADR-7) */}
          <div className="mb-6">
            <h2
              className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {clinic_name}
            </h2>
            <span
              className="mt-2 block h-1 w-16 rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
          </div>

          {/* Schedule rows — two-column day/time list (ADR-3) */}
          {hours.length > 0 && (
            <dl
              className="mt-6 divide-y"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-foues-navy) 10%, transparent)",
              }}
            >
              {hours.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-2"
                >
                  <dt
                    className="font-semibold"
                    style={{ color: "var(--color-foues-navy)" }}
                  >
                    {entry.day_range}
                  </dt>
                  <dd
                    style={{
                      color:
                        "color-mix(in srgb, var(--color-foues-navy) 80%, transparent)",
                    }}
                  >
                    {entry.time_range}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* Optional richtext footnote — ADR-4, InfoCard pattern */}
          {schedule_text && (
            <div
              className="prose prose-sm max-w-none mt-6 md:prose-base"
              style={{
                color:
                  "color-mix(in srgb, var(--color-foues-navy) 90%, transparent)",
              }}
              // Strapi v5 richtext is admin-authored HTML — trust the source
              dangerouslySetInnerHTML={{ __html: schedule_text }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
