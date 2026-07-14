import { formDefinitionSchema, type FormDefinitionInput } from "@/lib/form-definition";

type SubmissionResult =
  | { success: true; values: Record<string, string | string[]> }
  | { success: false; errors: Record<string, string> };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function isHoneypotRejection(input: { value: string; origin: string | null; hostedOrigin: string }) {
  return Boolean(input.value) && input.origin !== input.hostedOrigin;
}

export function validateSubmission(definitionInput: FormDefinitionInput, input: Record<string, unknown>): SubmissionResult {
  const definition = formDefinitionSchema.parse(definitionInput);
  const errors: Record<string, string> = {};
  const values: Record<string, string | string[]> = {};

  for (const field of definition.fields) {
    if (field.hidden) continue;
    const raw = input[field.key];
    const multiple = Array.isArray(raw) ? raw.map(String).map((value) => value.trim()).filter(Boolean) : undefined;
    const value = multiple ?? (raw === undefined || raw === null ? "" : String(raw).trim());
    const empty = Array.isArray(value) ? value.length === 0 : value === "";

    if (empty) {
      if (field.required) errors[field.key] = `${field.label} is required.`;
      continue;
    }

    const scalar = Array.isArray(value) ? value[0] ?? "" : value;
    if (field.type === "email" && !emailPattern.test(scalar)) errors[field.key] = "Enter a valid email address.";
    if (field.type === "url") {
      try { if (new URL(scalar).protocol !== "https:") throw new Error(); } catch { errors[field.key] = "Enter a valid HTTPS URL."; }
    }
    if (field.type === "number" && (!Number.isFinite(Number(scalar)) || scalar === "")) errors[field.key] = "Enter a valid number.";
    if (field.validation?.minLength !== undefined && scalar.length < field.validation.minLength) errors[field.key] = `Use at least ${field.validation.minLength} characters.`;
    if (field.validation?.maxLength !== undefined && scalar.length > field.validation.maxLength) errors[field.key] = `Use no more than ${field.validation.maxLength} characters.`;
    if (field.validation?.min !== undefined && Number(scalar) < field.validation.min) errors[field.key] = `Enter ${field.validation.min} or more.`;
    if (field.validation?.max !== undefined && Number(scalar) > field.validation.max) errors[field.key] = `Enter ${field.validation.max} or less.`;
    if (field.options && (Array.isArray(value) ? value : [value]).some((entry) => !field.options!.some((option) => option.value === entry))) {
      errors[field.key] = "Choose a valid option.";
    }
    if (!errors[field.key]) values[field.key] = value;
  }

  return Object.keys(errors).length ? { success: false, errors } : { success: true, values };
}
