import { z } from "zod";
import type { FormFieldDef } from "@/types/forms";

export function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split("\n").map(s => s.trim()).filter(Boolean);
}

/**
 * Drops fields that cannot be rendered or validated — today that means
 * select/radio without options (a CMS content mistake). Never throws:
 * a misconfigured field must degrade to a warning, not crash the page.
 * Both DynamicForm (render) and the submit action (validation) must use
 * this so client and server agree on the effective field set.
 */
export function sanitizeFields(fields: FormFieldDef[]): FormFieldDef[] {
  return fields.filter((field) => {
    if (
      (field.field_type === "select" || field.field_type === "radio") &&
      parseOptions(field.options).length === 0
    ) {
      console.warn(
        `[forms] Field "${field.name}" (${field.field_type}) has no options defined — skipping it.`
      );
      return false;
    }
    return true;
  });
}

export function buildZodSchema(fields: FormFieldDef[]): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    switch (field.field_type) {
      case "email":
        schema = z.string().email();
        break;
      case "number":
        schema = z.coerce.number();
        break;
      case "date":
        schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
        break;
      case "checkbox":
        schema = z.boolean();
        break;
      case "select":
      case "radio": {
        const opts = parseOptions(field.options);
        if (opts.length === 0) {
          // sanitizeFields() should have dropped this field already;
          // skip defensively instead of crashing the render/action.
          console.warn(
            `[forms] Field "${field.name}" (${field.field_type}) has no options — excluded from schema.`
          );
          continue;
        }
        schema = z.string().refine(v => opts.includes(v), "Opción inválida");
        break;
      }
      default:
        schema = z.string();
        if (field.max_length) schema = (schema as z.ZodString).max(field.max_length);
        if (field.min_length) schema = (schema as z.ZodString).min(field.min_length);
    }
    if (field.required) {
      if (schema instanceof z.ZodString) schema = schema.min(1, `${field.label} es requerido`);
      else if (schema instanceof z.ZodBoolean) schema = schema.refine(v => v === true, `${field.label} es requerido`);
    } else {
      schema = schema.optional();
    }
    shape[field.name] = schema;
  }
  return z.object(shape).strict();
}
