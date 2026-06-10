"use client";
import dynamic from "next/dynamic";
import type { FormDefinition } from "@/types/forms";
import type { SubmitFormResult } from "@/app/actions/submit-form";

const DynamicForm = dynamic(() => import("./DynamicForm"), { ssr: false });

interface Props {
  formDef: FormDefinition;
  action: (input: { formId: string; data: unknown }) => Promise<SubmitFormResult>;
}

export default function DynamicFormLoader({ formDef, action }: Props) {
  return <DynamicForm formDef={formDef} action={action} />;
}
