import type { FormDefinition } from "@/lib/form-definition";
import type { ClientIntegration } from "@/lib/integration-definition";

const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/gu, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function selectedValues(value: unknown) {
  return new Set(Array.isArray(value) ? value.map(String) : value === undefined || value === null ? [] : [String(value)]);
}

function control(field: FormDefinition["fields"][number], value?: unknown) {
  const attrs = `id="${escape(field.key)}" name="${escape(field.key)}"${field.required && !field.condition ? " required" : ""}${field.placeholder ? ` placeholder="${escape(field.placeholder)}"` : ""}`;
  const selected = selectedValues(value);
  if (field.type === "textarea") return `<textarea ${attrs} rows="5">${escape(value)}</textarea>`;
  if (field.type === "select") return `<select ${attrs}><option value="">Choose one</option>${field.options!.map((o) => `<option value="${escape(o.value)}"${selected.has(o.value) ? " selected" : ""}>${escape(o.label)}</option>`).join("")}</select>`;
  if (field.type === "radio" || field.type === "checkbox") return `<div class="choices">${field.options!.map((o) => `<label class="choice"><input type="${field.type}" name="${escape(field.key)}" value="${escape(o.value)}"${field.required ? " required" : ""}${selected.has(o.value) ? " checked" : ""}> <span>${escape(o.label)}</span></label>`).join("")}</div>`;
  if (field.type === "consent") return `<label class="choice"><input type="checkbox" ${attrs} value="yes"${selected.has("yes") ? " checked" : ""}> <span>${escape(field.label)}</span></label>`;
  if (field.type === "yes_no") return `<div class="choices choices-inline"><label class="choice"><input type="radio" name="${escape(field.key)}" value="yes"${field.required && !field.condition ? " required" : ""}${selected.has("yes") ? " checked" : ""}> <span>Yes</span></label><label class="choice"><input type="radio" name="${escape(field.key)}" value="no"${field.required && !field.condition ? " required" : ""}${selected.has("no") ? " checked" : ""}> <span>No</span></label></div>`;
  if (field.type === "rating") return `<div class="rating" role="radiogroup" aria-label="${escape(field.label)}">${[1,2,3,4,5].map((rating) => `<label><input type="radio" name="${escape(field.key)}" value="${rating}"${field.required && !field.condition ? " required" : ""}${selected.has(String(rating)) ? " checked" : ""}><span>${rating}</span></label>`).join("")}</div>`;
  if (field.type === "file") return `<input type="file" ${attrs}${field.validation?.acceptedFileTypes?.length ? ` accept="${escape(field.validation.acceptedFileTypes.join(","))}"` : ""}><p class="file-hint">Private upload, up to ${field.validation?.maxFileSizeMb ?? 2} MB.</p>`;
  const type = ["email", "number", "tel", "url", "date", "time"].includes(field.type) ? field.type : "text";
  return `<input type="${type}" ${attrs} value="${escape(value)}"${field.validation?.minLength !== undefined ? ` minlength="${field.validation.minLength}"` : ""}${field.validation?.maxLength !== undefined ? ` maxlength="${field.validation.maxLength}"` : ""}${field.validation?.min !== undefined ? ` min="${field.validation.min}"` : ""}${field.validation?.max !== undefined ? ` max="${field.validation.max}"` : ""}>`;
}

export function renderPublicForm(input: { definition: FormDefinition; endpointId: string; action: string; clientIntegrations?: ClientIntegration[]; submissionId?: string; message?: string; closedMessage?: string; formError?: string; errors?: Record<string,string>; values?: Record<string,unknown> }) {
  const { definition } = input;
  const visibleFields = definition.fields.filter((field) => !field.hidden);
  const hiddenFields = definition.fields.filter((field) => field.hidden).map((field) => `<input type="hidden" name="${escape(field.key)}" value="${escape(input.values?.[field.key] ?? field.defaultValue ?? "")}">`).join("");
  const fields = visibleFields.map((field, index) => `<div class="field" data-field-key="${escape(field.key)}"${field.required ? " data-required=\"true\"" : ""}${field.condition ? ` data-condition="${escape(JSON.stringify(field.condition))}"` : ""}><div class="field-number">${String(index + 1).padStart(2, "0")}</div><div><label for="${escape(field.key)}">${escape(field.label)}${field.required ? " <span aria-hidden=\"true\">*</span>" : ""}</label>${field.description ? `<p>${escape(field.description)}</p>` : ""}${control(field,input.values?.[field.key])}${input.errors?.[field.key] ? `<p class="error" role="alert">${escape(input.errors[field.key])}</p>` : ""}</div></div>`).join("");
  const theme = definition.presentation;
  const themeStyle = `--canvas:${theme.backgroundColor};--text:${theme.textColor};--lime:${theme.accentColor}`;
  const progress = definition.settings.showProgress ? `<div class="form-progress" data-form-progress><span data-progress-bar></span><small data-progress-label>0% complete</small></div>` : "";
  const content = input.message
    ? `<section class="success" role="status"><strong>${escape(definition.confirmation.title)}</strong><p>${escape(input.message)}</p></section>`
    : input.closedMessage
      ? `<section class="closed" role="status"><strong>Responses are closed</strong><p>${escape(input.closedMessage)}</p></section>`
      : `<form method="post" enctype="multipart/form-data" action="${escape(input.action)}" data-public-form>${input.formError ? `<section class="form-error" role="alert"><strong>We could not send your response.</strong><p>${escape(input.formError)}</p></section>` : ""}${progress}<input type="hidden" name="_submission_id" value="${escape(input.submissionId ?? "")}"><input type="hidden" name="_jobing_form_context" value="hosted">${hiddenFields}<label class="trap" aria-hidden="true">Leave this empty<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>${fields}<button type="submit" data-submit-button data-default-label="${escape(definition.settings.submitButtonLabel)}">${escape(definition.settings.submitButtonLabel)}</button><p class="privacy">Your response is sent securely to the form owner.</p></form>`;
  const googleAnalytics = input.clientIntegrations?.find((item) => item.provider === "google_analytics")?.config.measurementId;
  const facebookPixel = input.clientIntegrations?.find((item) => item.provider === "facebook_pixel")?.config.pixelId;
  const analytics = `${typeof googleAnalytics === "string" ? ` data-google-analytics="${escape(googleAnalytics)}"` : ""}${typeof facebookPixel === "string" ? ` data-facebook-pixel="${escape(facebookPixel)}"` : ""}`;
  return `<!doctype html><html lang="en" data-font="${escape(theme.fontFamily)}" data-spacing="${escape(theme.spacing)}" data-button="${escape(theme.buttonStyle)}" data-form-id="${escape(input.endpointId)}"${input.message ? " data-submitted=\"true\"" : ""}${analytics}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(definition.title)} · Jobing Forms</title><link rel="stylesheet" href="/forms/public-form.css"><script src="/forms/public-form.js" defer></script></head><body style="${themeStyle}"><main><header><a href="https://jobing.site/forms" class="brand">Jobing <span>Forms</span></a><p class="eyebrow">Secure response</p><h1>${escape(definition.title)}</h1>${definition.description ? `<p class="lede">${escape(definition.description)}</p>` : ""}</header>${content}</main></body></html>`;
}
