import crypto from "node:crypto";

const CLOCK_SKEW_SECONDS = 5 * 60;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const HEX_SHA256_PATTERN = /^[a-f0-9]{64}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type InternalSignatureHeaders = {
  keyId: string;
  timestamp: number;
  nonce: string;
  bodySha256: string;
  signature: string;
};

export class InternalAuthError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "InternalAuthError";
  }
}

export function sha256Hex(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function signaturePayload(input: {
  method: string;
  path: string;
  timestamp: number;
  nonce: string;
  bodySha256: string;
}) {
  return ["v1", input.method.toUpperCase(), input.path, String(input.timestamp), input.nonce, input.bodySha256].join("\n");
}

export function signInternalPayload(secret: string, input: Parameters<typeof signaturePayload>[0]) {
  return crypto.createHmac("sha256", secret).update(signaturePayload(input)).digest("base64url");
}

function readHeaders(headers: Headers): InternalSignatureHeaders {
  const keyId = headers.get("x-jobing-key-id") || "";
  const timestampValue = headers.get("x-jobing-timestamp") || "";
  const nonce = headers.get("x-jobing-nonce") || "";
  const bodySha256 = headers.get("x-jobing-content-sha256") || "";
  const signatureHeader = headers.get("x-jobing-signature") || "";
  const timestamp = Number(timestampValue);
  const signature = signatureHeader.startsWith("v1=") ? signatureHeader.slice(3) : "";

  if (!KEY_ID_PATTERN.test(keyId) || !Number.isInteger(timestamp) || !NONCE_PATTERN.test(nonce) || !HEX_SHA256_PATTERN.test(bodySha256) || !SIGNATURE_PATTERN.test(signature)) {
    throw new InternalAuthError("invalid_headers", "The internal authentication headers are invalid.");
  }

  return { keyId, timestamp, nonce, bodySha256, signature };
}

function signingSecrets() {
  const currentId = process.env.FORMS_INTERNAL_KEY_ID;
  const currentSecret = process.env.FORMS_INTERNAL_SECRET;
  const previousId = process.env.FORMS_INTERNAL_PREVIOUS_KEY_ID;
  const previousSecret = process.env.FORMS_INTERNAL_PREVIOUS_SECRET;
  const secrets = new Map<string, string>();

  const validSecret = (value: string | undefined) => Boolean(
    value
    && value.trim() === value
    && !/[\u0000\r\n]/u.test(value)
    && Buffer.byteLength(value, "utf8") >= 32
    && Buffer.byteLength(value, "utf8") <= 4_096,
  );

  if (!currentId || !KEY_ID_PATTERN.test(currentId) || !validSecret(currentSecret)) {
    throw new InternalAuthError("invalid_configuration", "Internal request authentication is not configured correctly.");
  }
  secrets.set(currentId, currentSecret as string);

  if (previousId || previousSecret) {
    if (
      !previousId
      || !previousSecret
      || previousId === currentId
      || !KEY_ID_PATTERN.test(previousId)
      || !validSecret(previousSecret)
    ) {
      throw new InternalAuthError("invalid_configuration", "Internal request authentication is not configured correctly.");
    }
    secrets.set(previousId, previousSecret);
  }
  return secrets;
}

export function verifyInternalSignature(input: {
  method: string;
  path: string;
  rawBody: string;
  headers: Headers;
  nowSeconds?: number;
  secrets?: Map<string, string>;
}) {
  const parsed = readHeaders(input.headers);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > CLOCK_SKEW_SECONDS) {
    throw new InternalAuthError("expired_signature", "The internal request signature has expired.");
  }

  const actualBodyHash = sha256Hex(input.rawBody);
  if (!crypto.timingSafeEqual(Buffer.from(actualBodyHash), Buffer.from(parsed.bodySha256))) {
    throw new InternalAuthError("body_mismatch", "The internal request body hash does not match.");
  }

  const secret = (input.secrets ?? signingSecrets()).get(parsed.keyId);
  if (!secret) throw new InternalAuthError("unknown_key", "The internal signing key is unknown.");

  const expected = signInternalPayload(secret, {
    method: input.method,
    path: input.path,
    timestamp: parsed.timestamp,
    nonce: parsed.nonce,
    bodySha256: parsed.bodySha256,
  });
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(parsed.signature);
  if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    throw new InternalAuthError("bad_signature", "The internal request signature is invalid.");
  }

  return parsed;
}
