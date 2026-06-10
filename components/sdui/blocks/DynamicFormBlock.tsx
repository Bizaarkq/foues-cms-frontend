import type { FormBlockProps } from "@/types/blocks";
import { submitForm } from "@/app/actions/submit-form";
import DynamicFormLoader from "./DynamicFormLoader";

export default function DynamicFormBlock({ title, submit_label, form }: FormBlockProps) {
  if (!form) return null;

  const formDef = {
    documentId: form.documentId,
    title: title ?? form.title,
    description: form.description,
    submit_label: submit_label ?? form.submit_label,
    success_message: form.success_message,
    error_message: form.error_message,
    fields: form.fields,
  };

  return (
    <section className="py-8 px-4">
      <DynamicFormLoader formDef={formDef} action={submitForm} />
    </section>
  );
}
