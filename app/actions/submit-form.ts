"use server";
import { cache } from "react";
import { env } from "@/lib/env";
import { buildZodSchema, sanitizeFields } from "@/lib/build-zod-schema";
import type { FormFieldDef } from "@/types/forms";
import { headers } from "next/headers";

export interface SubmitFormResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Per-request cached re-fetch of trusted form fields — never trust client-passed fields (server-cache-react)
interface FormMeta { fields: FormFieldDef[]; title: string }

const getFormMeta = cache(async (formId: string): Promise<FormMeta | null> => {
  try {
    const res = await fetch(
      `${env.strapi.url}/api/forms/${formId}?populate=fields`,
      {
        headers: { Authorization: `Bearer ${env.strapi.formSubmitToken}` },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json() as { data: { fields: FormFieldDef[]; title: string } | null };
    if (!json.data) return null;
    return { fields: json.data.fields, title: json.data.title };
  } catch {
    return null;
  }
});

export async function submitForm(input: { formId: string; data: unknown }): Promise<SubmitFormResult> {
  console.log("[submitForm] called with formId:", input.formId);
  try {
    if (!input.formId || typeof input.formId !== "string") {
      return { ok: false, error: "Formulario inválido." };
    }

    const meta = await getFormMeta(input.formId);
    if (!meta) return { ok: false, error: "Formulario no encontrado." };
    const { fields, title: formTitle } = meta;

    const schema = buildZodSchema(sanitizeFields(fields));
    const parsed = schema.safeParse(input.data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[field] = (issues as string[])?.[0] ?? "Inválido";
      }
      return { ok: false, error: "Datos inválidos.", fieldErrors };
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";

    const res = await fetch(`${env.strapi.url}/api/form-submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.strapi.formSubmitToken}`,
      },
      body: JSON.stringify({
        data: {
          form_id: input.formId,
          form_title: formTitle,
          data: parsed.data,
          submitted_at: new Date().toISOString(),
          ip_address: ip,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "(unreadable)");
      console.error(`[submitForm] Strapi POST failed: HTTP ${res.status} — ${body}`);
      return { ok: false, error: "Error al guardar el envío." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Error inesperado." };
  }
}
