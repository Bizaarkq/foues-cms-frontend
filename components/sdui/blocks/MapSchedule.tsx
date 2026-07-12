import type { MapScheduleProps } from "@/types/blocks";

export default function MapSchedule({
  clinic_name,
  address,
  embed_url,
  hours,
  schedule_text,
}: MapScheduleProps) {
  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left: embedded map */}
          <div className="relative w-full aspect-video md:aspect-auto md:min-h-[360px] rounded-xl overflow-hidden border border-[var(--color-foues-border-subtle)]">
            <iframe
              src={embed_url}
              title={`Mapa de ${clinic_name}`}
              className="absolute inset-0 w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-popups"
              allowFullScreen
            />
          </div>

          {/* Right: clinic schedule */}
          <div
            className="flex flex-col rounded-xl border p-8 md:p-10"
            style={{
              borderColor:
                "color-mix(in srgb, var(--color-foues-navy) 10%, transparent)",
            }}
          >
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

            {address ? (
              <p
                className="text-sm mb-4"
                style={{
                  color:
                    "color-mix(in srgb, var(--color-foues-navy) 70%, transparent)",
                }}
              >
                {address}
              </p>
            ) : null}

            {hours.length > 0 && (
              <dl
                className="divide-y"
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

            {schedule_text ? (
              <div
                className="prose prose-sm max-w-none mt-6 md:prose-base"
                style={{
                  color:
                    "color-mix(in srgb, var(--color-foues-navy) 90%, transparent)",
                }}
                dangerouslySetInnerHTML={{ __html: schedule_text }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
