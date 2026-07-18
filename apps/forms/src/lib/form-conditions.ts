import type { FormDefinition } from "@/lib/form-definition";

type FormValue = unknown;

function values(value: FormValue) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === undefined || value === null) return [];
  const normalized = String(value).trim();
  return normalized ? [normalized] : [];
}

export function conditionMatches(condition: NonNullable<FormDefinition["fields"][number]["condition"]>, input: Record<string, FormValue>) {
  const actual = values(input[condition.fieldKey]);
  const expected = condition.value?.trim() ?? "";
  if (condition.operator === "is_empty") return actual.length === 0;
  if (condition.operator === "is_not_empty") return actual.length > 0;
  if (condition.operator === "equals") return actual.includes(expected);
  if (condition.operator === "not_equals") return !actual.includes(expected);
  if (condition.operator === "contains") return actual.some((item) => item.toLocaleLowerCase().includes(expected.toLocaleLowerCase()));
  if (condition.operator === "not_contains") return actual.every((item) => !item.toLocaleLowerCase().includes(expected.toLocaleLowerCase()));
  const numericActual = Number(actual[0]);
  const numericExpected = Number(expected);
  if (!Number.isFinite(numericActual) || !Number.isFinite(numericExpected)) return false;
  return condition.operator === "greater_than" ? numericActual > numericExpected : numericActual < numericExpected;
}

export function fieldIsVisible(field: FormDefinition["fields"][number], input: Record<string, FormValue>) {
  if (field.hidden) return false;
  return field.condition ? conditionMatches(field.condition, input) : true;
}

export function formAvailability(definition: FormDefinition, submissionCount: number, now = new Date()) {
  const settings = definition.settings;
  const message = settings.closedMessage ?? "This form is not accepting responses right now.";
  if (settings.acceptResponses === false) return { accepting: false as const, reason: "paused" as const, message };
  if (settings.opensAt && now < new Date(settings.opensAt)) return { accepting: false as const, reason: "not_open" as const, message };
  if (settings.closesAt && now >= new Date(settings.closesAt)) return { accepting: false as const, reason: "closed" as const, message };
  if (settings.responseLimit !== undefined && submissionCount >= settings.responseLimit) return { accepting: false as const, reason: "response_limit" as const, message };
  return { accepting: true as const };
}
