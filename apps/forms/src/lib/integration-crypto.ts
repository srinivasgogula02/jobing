import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";

function keyFromEnvironment(keyId: string) {
  const currentId = process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID?.trim() || "primary";
  const previousId = process.env.FORMS_INTEGRATION_PREVIOUS_ENCRYPTION_KEY_ID?.trim();
  const encoded = keyId === currentId
    ? process.env.FORMS_INTEGRATION_ENCRYPTION_KEY
    : keyId === previousId
      ? process.env.FORMS_INTEGRATION_PREVIOUS_ENCRYPTION_KEY
      : undefined;

  if (!encoded) throw new Error("INTEGRATION_ENCRYPTION_KEY_UNAVAILABLE");
  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== 32) throw new Error("INTEGRATION_ENCRYPTION_KEY_INVALID");
  return key;
}

export function integrationEncryptionConfigured() {
  try {
    keyFromEnvironment(process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID?.trim() || "primary");
    return true;
  } catch {
    return false;
  }
}

export function encryptIntegrationSecret(secret: unknown) {
  const keyId = process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID?.trim() || "primary";
  const key = keyFromEnvironment(keyId);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(secret), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    keyId,
    ciphertext: [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join("."),
  };
}

export function decryptIntegrationSecret<T = Record<string, unknown>>(keyId: string, ciphertext: string): T {
  const [version, ivValue, tagValue, encryptedValue, extra] = ciphertext.split(".");
  if (version !== VERSION || !ivValue || !tagValue || !encryptedValue || extra) {
    throw new Error("INTEGRATION_SECRET_INVALID");
  }

  const decipher = createDecipheriv("aes-256-gcm", keyFromEnvironment(keyId), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as T;
}
