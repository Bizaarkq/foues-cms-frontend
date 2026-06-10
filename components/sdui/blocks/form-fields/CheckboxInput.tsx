"use client";
import type { FieldError, UseFormRegister, FieldValues } from "react-hook-form";
import type { FormFieldDef } from "@/types/forms";

interface Props {
  field: FormFieldDef;
  register: UseFormRegister<FieldValues>;
  error?: FieldError;
}

export function CheckboxInput({ field, register, error }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm text-[var(--color-foues-text-body)] cursor-pointer">
        <input
          id={field.name}
          type="checkbox"
          {...register(field.name)}
          className="rounded border-[var(--color-foues-border-input)] text-[var(--color-foues-input-checked)] focus:ring-[var(--color-foues-input-focus-ring)]"
        />
        {field.label}{field.required ? " *" : ""}
      </label>
      {error ? <p className="text-xs text-[var(--color-foues-state-error)]">{error.message}</p> : null}
    </div>
  );
}
