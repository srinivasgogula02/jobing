import type { FormDefinition } from "@/lib/form-definition";

export type FormField = FormDefinition["fields"][number];

export const fieldLabels: Record<FormField["type"], string> = {
  text: "Short text",
  email: "Email",
  tel: "Phone",
  number: "Number",
  textarea: "Long text",
  select: "Dropdown",
  checkbox: "Checkboxes",
  radio: "Multiple choice",
  date: "Date",
  file: "File upload",
  consent: "Consent",
  url: "Website",
};

export function keyFromLabel(label: string, fields: FormField[], ignoredId?: string) {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "").replace(/^[^a-z]+/u, "") || "field";
  const existing = new Set(fields.filter((field) => field.id !== ignoredId).map((field) => field.key));
  let key = base.slice(0, 56);
  let suffix = 2;
  while (existing.has(key)) key = `${base.slice(0, 52)}_${suffix++}`;
  return key;
}

export function createField(type: FormField["type"], fields: FormField[]): FormField {
  const label = fieldLabels[type];
  return {
    id: crypto.randomUUID(),
    key: keyFromLabel(label, fields),
    type,
    label,
    required: false,
    hidden: false,
    ...(["select", "checkbox", "radio"].includes(type)
      ? { options: [{ value: "option_1", label: "Option 1" }, { value: "option_2", label: "Option 2" }] }
      : {}),
    ...(type === "file" ? { validation: { maxFileSizeMb: 2 } } : {}),
  } as FormField;
}

export function duplicateField(field: FormField, fields: FormField[]): FormField {
  const id = crypto.randomUUID();
  return { ...field, id, key: keyFromLabel(`${field.key}_copy`, fields), label: `${field.label} copy` };
}

export function moveField(fields: FormField[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= fields.length || to >= fields.length) return fields;
  const next = [...fields];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function htmlSnippet(endpointUrl: string) {
  return `<form method="POST" enctype="multipart/form-data" action="${endpointUrl}">
  <label>
    Email
    <input name="email" type="email" required>
  </label>
  <button type="submit">Send</button>
</form>`;
}

export function reactSnippet(endpointUrl: string) {
  return `export function ContactForm() {
  return (
    <form method="POST" encType="multipart/form-data" action="${endpointUrl}">
      <input name="email" type="email" required />
      <button type="submit">Send</button>
    </form>
  );
}`;
}
