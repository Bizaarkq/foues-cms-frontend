"use client";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useTransition, useState } from "react";
import { buildZodSchema } from "@/lib/build-zod-schema";
import type { FormDefinition } from "@/types/forms";
import type { SubmitFormResult } from "@/app/actions/submit-form";
import { TextInput } from "./form-fields/TextInput";
import { NumberInput } from "./form-fields/NumberInput";
import { TextareaInput } from "./form-fields/TextareaInput";
import { SelectInput } from "./form-fields/SelectInput";
import { CheckboxInput } from "./form-fields/CheckboxInput";
import { RadioInput } from "./form-fields/RadioInput";
import { DateInput } from "./form-fields/DateInput";
import type { FormFieldDef } from "@/types/forms";

function renderField(
  field: FormFieldDef,
  register: ReturnType<typeof useForm>["register"],
  errors: ReturnType<typeof useForm>["formState"]["errors"]
) {
  const error = errors[field.name] as import("react-hook-form").FieldError | undefined;
  switch (field.field_type) {
    case "text": case "email": case "tel":
      return <TextInput key={field.name} field={field} register={register} error={error} />;
    case "number":
      return <NumberInput key={field.name} field={field} register={register} error={error} />;
    case "textarea":
      return <TextareaInput key={field.name} field={field} register={register} error={error} />;
    case "select":
      return <SelectInput key={field.name} field={field} register={register} error={error} />;
    case "checkbox":
      return <CheckboxInput key={field.name} field={field} register={register} error={error} />;
    case "radio":
      return <RadioInput key={field.name} field={field} register={register} error={error} />;
    case "date":
      return <DateInput key={field.name} field={field} register={register} error={error} />;
    default:
      return null;
  }
}

type Status = "idle" | "submitting" | "success" | "error";

interface Props {
  formDef: FormDefinition;
  action: (input: { formId: string; data: unknown }) => Promise<SubmitFormResult>;
}

export default function DynamicForm({ formDef, action }: Props) {
  const schema = useMemo(() => buildZodSchema(formDef.fields), [formDef.fields]);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<FieldValues>({
    resolver: zodResolver(schema),
  });
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  function onSubmit(data: FieldValues) {
    startTransition(async () => {
      setStatus("submitting");
      const result = await action({ formId: formDef.documentId, data });
      if (result.ok) {
        setStatus("success");
      } else {
        if (result.fieldErrors) {
          for (const [name, message] of Object.entries(result.fieldErrors)) {
            setError(name, { type: "server", message });
          }
        }
        setStatus("error");
        setServerError(result.error ?? formDef.error_message ?? "Error al enviar el formulario.");
      }
    });
  }

  if (status === "success") {
    return <p className="text-[var(--color-foues-state-success)] font-medium">{formDef.success_message}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {formDef.title ? <h2 className="text-xl font-semibold">{formDef.title}</h2> : null}
      {formDef.fields.map(field => renderField(field, register, errors))}
      {status === "error" ? <p className="text-[var(--color-foues-state-error)] text-sm">{serverError}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="self-start px-6 py-2 bg-[var(--color-foues-action-primary)] text-white rounded font-medium hover:bg-[var(--color-foues-action-primary-hover)] disabled:opacity-50"
      >
        {isPending ? "Enviando…" : (formDef.submit_label || "Enviar")}
      </button>
    </form>
  );
}
