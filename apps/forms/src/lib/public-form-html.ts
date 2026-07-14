import type { FormDefinition } from "@/lib/form-definition";

const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/gu, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function control(field: FormDefinition["fields"][number]) {
  const attrs = `id="${escape(field.key)}" name="${escape(field.key)}"${field.required ? " required" : ""}`;
  if (field.type === "textarea") return `<textarea ${attrs} rows="5"></textarea>`;
  if (field.type === "select") return `<select ${attrs}><option value="">Choose one</option>${field.options!.map((o) => `<option value="${escape(o.value)}">${escape(o.label)}</option>`).join("")}</select>`;
  if (field.type === "radio" || field.type === "checkbox") return `<div class="choices">${field.options!.map((o) => `<label class="choice"><input type="${field.type}" name="${escape(field.key)}" value="${escape(o.value)}"${field.required ? " required" : ""}> <span>${escape(o.label)}</span></label>`).join("")}</div>`;
  if (field.type === "consent") return `<label class="choice"><input type="checkbox" ${attrs} value="yes"> <span>${escape(field.label)}</span></label>`;
  const type = ["email", "number", "tel", "url", "date"].includes(field.type) ? field.type : "text";
  return `<input type="${type}" ${attrs}${field.validation?.minLength !== undefined ? ` minlength="${field.validation.minLength}"` : ""}${field.validation?.maxLength !== undefined ? ` maxlength="${field.validation.maxLength}"` : ""}${field.validation?.min !== undefined ? ` min="${field.validation.min}"` : ""}${field.validation?.max !== undefined ? ` max="${field.validation.max}"` : ""}>`;
}

export function renderPublicForm(input: { definition: FormDefinition; endpointId: string; action: string; siteKey: string; submissionId: string; message?: string; errors?: Record<string,string> }) {
  const { definition } = input;
  const fields = definition.fields.map((field, index) => `<div class="field"><div class="field-number">${String(index + 1).padStart(2, "0")}</div><div><label for="${escape(field.key)}">${escape(field.label)}${field.required ? " <span aria-hidden=\"true\">*</span>" : ""}</label>${field.description ? `<p>${escape(field.description)}</p>` : ""}${control(field)}${input.errors?.[field.key] ? `<p class="error" role="alert">${escape(input.errors[field.key])}</p>` : ""}</div></div>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(definition.title)} · Jobing Forms</title><link rel="stylesheet" href="/forms/public-form.css"><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></head><body><main><header><a href="https://jobing.site/forms" class="brand">Jobing <span>Forms</span></a><p class="eyebrow">Secure response</p><h1>${escape(definition.title)}</h1>${definition.description ? `<p class="lede">${escape(definition.description)}</p>` : ""}</header>${input.message ? `<section class="success" role="status"><strong>Response received</strong><p>${escape(input.message)}</p></section>` : `<form method="post" action="${escape(input.action)}"><input type="hidden" name="_submission_id" value="${escape(input.submissionId)}"><input type="hidden" name="_jobing_form_context" value="hosted">${fields}<div class="cf-turnstile" data-sitekey="${escape(input.siteKey)}" data-action="turnstile-spin-v1"></div><button type="submit">Send response</button><p class="privacy">Protected by Cloudflare Turnstile. Your response is sent securely to the form owner.</p></form>`}</main></body></html>`;
}
