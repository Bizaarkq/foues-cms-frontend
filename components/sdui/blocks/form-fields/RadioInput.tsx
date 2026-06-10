"use client";
import type { FieldError, UseFormRegister, FieldValues } from "react-hook-form";
import type { FormFieldDef } from "@/types/forms";
import { parseOptions } from "@/lib/build-zod-schema";

interface Props {
  field: FormFieldDef;
  register: UseFormRegister<FieldValues>;
  error?: FieldError;
}

export function RadioInput({ field, register, error }: Props) {
  const options = parseOptions(field.options);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[var(--color-foues-text-body)]">
        {field.label}{field.required ? " *" : ""}
      </span>
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 text-sm text-[var(--color-foues-text-body)] cursor-pointer">
            <input
              type="radio"
              value={opt}
              {...register(field.name)}
              className="border-[var(--color-foues-border-input)] text-[var(--color-foues-input-checked)] focus:ring-[var(--color-foues-input-focus-ring)]"
            />
            {opt}
          </label>
        ))}
      </div>
      {error ? <p className="text-xs text-[var(--color-foues-state-error)]">{error.message}</p> : null}
    </div>
  );
}
