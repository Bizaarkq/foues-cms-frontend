import { z } from "zod";
import type { FormFieldDef } from "@/types/forms";

export function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split("\n").map(s => s.trim()).filter(Boolean);
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
        if (opts.length === 0) throw new Error(`Field "${field.name}" (${field.field_type}) has no options defined.`);
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
