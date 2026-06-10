import type { ProcessStepsProps } from "@/types/blocks";
import type { StepElement } from "@/types/elements";
import { LucideIcon } from "@/components/ui/LucideIcon";

function StepCard({ step }: { step: StepElement }) {
  return (
    <>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: "var(--color-foues-navy)" }}
        aria-label={`Paso ${step.number}`}
      >
        {step.number}
      </div>

      <div className="mt-3 text-center md:mt-4">
        <LucideIcon
          name={step.icon}
          size={24}
          className="mx-auto mb-2"
          style={{ color: "var(--color-foues-accent)" }}
          aria-hidden="true"
        />
        <p
          className="text-sm font-semibold sm:text-base"
          style={{ color: "var(--color-foues-navy)" }}
        >
          {step.title}
        </p>
        {step.description && (
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-foues-text-muted)] sm:text-sm">
            {step.description}
          </p>
        )}
      </div>
    </>
  );
}

function MobileStepContent({ step }: { step: StepElement }) {
  return (
    <>
      <LucideIcon
        name={step.icon}
        size={20}
        className="mb-1"
        style={{ color: "var(--color-foues-accent)" }}
        aria-hidden="true"
      />
      <p
        className="font-semibold"
        style={{ color: "var(--color-foues-navy)" }}
      >
        {step.title}
      </p>
      {step.description && (
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-foues-text-muted)]">
          {step.description}
        </p>
      )}
    </>
  );
}

function MobileSteps({ steps }: { steps: StepElement[] }) {
  return (
    <ol className="flex flex-col gap-0 md:hidden">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: "var(--color-foues-navy)" }}
            >
              {step.number}
            </div>
            {i < steps.length - 1 && (
              <div
                className="mt-1 w-0.5 flex-1"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-foues-accent) 30%, transparent)",
                  minHeight: "2rem",
                }}
                aria-hidden="true"
              />
            )}
          </div>

          <div className="pb-8 pt-1">
            <MobileStepContent step={step} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function DesktopSteps({ steps }: { steps: StepElement[] }) {
  return (
    <div className="relative hidden md:block">
      <div
        className="absolute left-0 right-0 top-6 h-0.5 -z-10"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-foues-accent) 30%, transparent)",
        }}
        aria-hidden="true"
      />

      <ol className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-6">
        {steps.map((step, i) => (
          <li key={i} className="flex flex-col items-center text-center">
            <StepCard step={step} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ProcessSteps({ title, steps }: ProcessStepsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-10">
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

        <DesktopSteps steps={steps} />
        <MobileSteps steps={steps} />
      </div>
    </section>
  );
}
