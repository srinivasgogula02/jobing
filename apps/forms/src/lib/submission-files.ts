import type { FormDefinition } from "@/lib/form-definition";
import type { SubmissionUpload } from "@/lib/forms-store";

export const MAX_FILE_BYTES = 2_000_000;
export const MAX_UPLOAD_BYTES = 3_000_000;

const safeMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function safeFileName(value: string) {
  const name = value.split(/[\\/]/u).at(-1)?.replace(/[\u0000-\u001f\u007f]/gu, "").trim() || "upload";
  return name.slice(0, 240);
}

function extension(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]{1,10}$/u);
  return match?.[0] ?? "";
}

function configuredTypeAllowed(file: File, accepted: string[]) {
  if (accepted.length === 0) return true;
  const fileExtension = extension(file.name);
  return accepted.some((rule) => {
    const normalized = rule.trim().toLowerCase();
    if (normalized.startsWith(".")) return normalized === fileExtension;
    if (normalized.endsWith("/*")) return file.type.toLowerCase().startsWith(normalized.slice(0, -1));
    return normalized === file.type.toLowerCase();
  });
}

export async function collectSubmissionFiles(definition: FormDefinition, data: FormData) {
  const files: SubmissionUpload[] = [];
  const names: Record<string, string> = {};
  const errors: Record<string, string> = {};
  let totalBytes = 0;

  for (const field of definition.fields) {
    if (field.type !== "file" || field.hidden) continue;
    const value = data.get(field.key);
    if (!(value instanceof File) || value.size === 0) {
      if (field.required) errors[field.key] = `${field.label} is required.`;
      continue;
    }
    const limit = Math.min((field.validation?.maxFileSizeMb ?? 2) * 1_000_000, MAX_FILE_BYTES);
    if (value.size > limit) {
      errors[field.key] = `Choose a file smaller than ${Math.round(limit / 1_000_000)} MB.`;
      continue;
    }
    if (!safeMimeTypes.has(value.type.toLowerCase())) {
      errors[field.key] = "This file type is not supported.";
      continue;
    }
    if (!configuredTypeAllowed(value, field.validation?.acceptedFileTypes ?? [])) {
      errors[field.key] = "Choose one of the allowed file types.";
      continue;
    }
    totalBytes += value.size;
    if (totalBytes > MAX_UPLOAD_BYTES) {
      errors[field.key] = "The combined uploads are too large.";
      continue;
    }
    const fileName = safeFileName(value.name);
    files.push({
      fieldKey: field.key,
      fileName,
      contentType: value.type.toLowerCase(),
      contentBase64: Buffer.from(await value.arrayBuffer()).toString("base64"),
    });
    names[field.key] = fileName;
  }
  return { files, names, errors };
}
