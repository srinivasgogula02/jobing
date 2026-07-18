import { formDefinitionSchema, type FormDefinitionInput } from "@/lib/form-definition";
import { fieldIsVisible } from "@/lib/form-conditions";

type SubmissionResult =
  | { success: true; values: Record<string, string | string[]> }
  | { success: false; errors: Record<string, string> };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function isHoneypotRejection(input: { value: string; origin: string | null }) {
  // Browsers and password managers sometimes autofill visually-hidden fields.
  // Treat a filled trap as decisive only for originless scripted requests. Real
  // browser submissions still pass validation, origin policy, and rate limits.
  return Boolean(input.value) && input.origin === null;
}

export function validateSubmission(definitionInput: FormDefinitionInput, input: Record<string, unknown>): SubmissionResult {
  const definition = formDefinitionSchema.parse(definitionInput);
  const errors: Record<string, string> = {};
  const values: Record<string, string | string[]> = {};

  for (const field of definition.fields) {
    if (!field.hidden && !fieldIsVisible(field, input)) continue;
    const raw = input[field.key];
    const multiple = Array.isArray(raw) ? raw.map(String).map((value) => value.trim()).filter(Boolean) : undefined;
    const value = multiple ?? (raw === undefined || raw === null ? "" : String(raw).trim());
    const empty = Array.isArray(value) ? value.length === 0 : value === "";

    if (empty) {
      if (field.required && !field.hidden) errors[field.key] = `${field.label} is required.`;
      continue;
    }

    const scalar = Array.isArray(value) ? value[0] ?? "" : value;
    if (field.type === "email" && !emailPattern.test(scalar)) errors[field.key] = "Enter a valid email address.";
    if (field.type === "url") {
      try { if (new URL(scalar).protocol !== "https:") throw new Error(); } catch { errors[field.key] = "Enter a valid HTTPS URL."; }
    }
    if (field.type === "number" && (!Number.isFinite(Number(scalar)) || scalar === "")) errors[field.key] = "Enter a valid number.";
    if (field.type === "yes_no" && !["yes", "no"].includes(scalar)) errors[field.key] = "Choose yes or no.";
    if (field.type === "rating" && !["1", "2", "3", "4", "5"].includes(scalar)) errors[field.key] = "Choose a rating from 1 to 5.";
    if (field.type === "consent" && scalar !== "yes") errors[field.key] = "Confirm your agreement to continue.";
    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/u.test(scalar)) errors[field.key] = "Enter a valid date.";
    if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/u.test(scalar)) errors[field.key] = "Enter a valid time.";
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
