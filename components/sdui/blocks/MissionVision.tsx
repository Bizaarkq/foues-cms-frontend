import { Target, Lightbulb } from "lucide-react";
import type { MissionVisionProps } from "@/types/blocks";

export default function MissionVision({
  mission_title,
  mission_text,
  vision_title,
  vision_text,
}: MissionVisionProps) {
  return (
    <section className="w-full py-16" style={{ backgroundColor: "color-mix(in srgb, var(--color-foues-accent) 12%, var(--color-foues-surface))" }}>
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 max-w-4xl mx-auto">
          {/* Misión */}
          <div className="flex flex-col items-center text-center gap-5">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
            >
              <Target className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <h3
              className="text-lg font-bold uppercase tracking-wider"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {mission_title}
            </h3>
            <p className="text-sm text-[var(--color-foues-text-muted)] leading-relaxed">{mission_text}</p>
          </div>

          {/* Visión */}
          <div className="flex flex-col items-center text-center gap-5">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
            >
              <Lightbulb className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <h3
              className="text-lg font-bold uppercase tracking-wider"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {vision_title}
            </h3>
            <p className="text-sm text-[var(--color-foues-text-muted)] leading-relaxed">{vision_text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
