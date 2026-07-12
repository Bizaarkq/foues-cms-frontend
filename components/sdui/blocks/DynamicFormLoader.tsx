"use client";
import dynamic from "next/dynamic";
import type { FormDefinition } from "@/types/forms";
import type { SubmitFormResult } from "@/app/actions/submit-form";

const DynamicForm = dynamic(() => import("./DynamicForm"), {
  ssr: false,
  // Skeleton mientras baja el bundle del formulario (antes: pantalla en blanco)
  loading: () => (
    <div className="flex flex-col gap-4" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-[var(--color-foues-border-subtle)]" />
        </div>
      ))}
      <div className="mt-2 h-11 w-40 animate-pulse rounded-lg bg-[var(--color-foues-border-subtle)]" />
    </div>
  ),
});

interface Props {
  formDef: FormDefinition;
  action: (input: { formId: string; data: unknown }) => Promise<SubmitFormResult>;
}

export default function DynamicFormLoader({ formDef, action }: Props) {
  return <DynamicForm formDef={formDef} action={action} />;
}
