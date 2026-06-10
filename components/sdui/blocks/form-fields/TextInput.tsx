"use client";
import type { FieldError, UseFormRegister, FieldValues } from "react-hook-form";
import type { FormFieldDef } from "@/types/forms";

interface Props {
  field: FormFieldDef;
  register: UseFormRegister<FieldValues>;
  error?: FieldError;
}

export function TextInput({ field, register, error }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.name} className="text-sm font-medium text-[var(--color-foues-text-body)]">
        {field.label}{field.required ? " *" : ""}
      </label>
      <input
        id={field.name}
        type={field.field_type}
        placeholder={field.placeholder ?? undefined}
        {...register(field.name)}
        className="border border-[var(--color-foues-border-input)] rounded px-3 py-2 text-sm text-[var(--color-foues-input-text)] bg-[var(--color-foues-input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foues-input-focus-ring)]"
      />
      {error ? <p className="text-xs text-[var(--color-foues-state-error)]">{error.message}</p> : null}
    </div>
  );
}
