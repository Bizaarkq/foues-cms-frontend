export type FieldType =
  | "text" | "email" | "tel" | "number" | "textarea"
  | "select" | "checkbox" | "radio" | "date";

export interface FormFieldDef {
  name: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  options: string | null;      // newline-separated option strings
  min_length: number | null;
  max_length: number | null;
}

export interface FormDefinition {
  documentId: string;
  title: string;
  description: string | null;
  submit_label: string;
  success_message: string;
  error_message: string | null;
  fields: FormFieldDef[];
}
