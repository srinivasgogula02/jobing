import "server-only";

import { lookup } from "node:dns/promises";
import https from "node:https";
import { isIP } from "node:net";

const MAX_RESPONSE_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 8_000;

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return (
    a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
  );
}

function isBlockedIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isBlockedIpv4(mapped[1]) : false;
}

export function isPublicIntegrationAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return !isBlockedIpv4(address);
  if (family === 6) return !isBlockedIpv6(address);
  return false;
}

export function parseIntegrationUrl(raw: string, allowedHosts?: readonly string[]) {
  const url = new URL(raw);
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:"
    || url.username
    || url.password
    || url.port && url.port !== "443"
    || url.hash
    || hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || hostname.endsWith(".home.arpa")
    || isIP(hostname) !== 0
  ) {
    throw new Error("INTEGRATION_URL_NOT_ALLOWED");
  }
  if (allowedHosts && !allowedHosts.includes(hostname)) throw new Error("INTEGRATION_HOST_NOT_ALLOWED");
  return url;
}

async function pinnedAddress(hostname: string) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => !isPublicIntegrationAddress(entry.address))) {
    throw new Error("INTEGRATION_DESTINATION_NOT_PUBLIC");
  }
  return addresses[0];
}

export type IntegrationHttpResponse = {
  status: number;
  body: string;
  headers: Record<string, string | string[] | undefined>;
};

export async function integrationHttpRequest(input: {
  method: "POST" | "PUT" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body: string | Buffer;
  allowedHosts?: readonly string[];
  timeoutMs?: number;
}): Promise<IntegrationHttpResponse> {
  const url = parseIntegrationUrl(input.url, input.allowedHosts);
  const resolved = await pinnedAddress(url.hostname);
  const body = typeof input.body === "string" ? Buffer.from(input.body, "utf8") : input.body;

  return new Promise((resolve, reject) => {
    const request = https.request({
      protocol: "https:",
      // Connect to the vetted address directly. Keeping DNS out of
      // https.request avoids Node's version-dependent lookup callback shapes
      // while servername and Host preserve TLS and HTTP origin validation.
      hostname: resolved.address,
      servername: url.hostname,
      port: 443,
      method: input.method,
      path: `${url.pathname}${url.search}`,
      headers: {
        accept: "application/json",
        "content-length": String(body.byteLength),
        ...input.headers,
        host: url.host,
      },
      timeout: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.byteLength;
        if (size > MAX_RESPONSE_BYTES) {
          request.destroy(new Error("INTEGRATION_RESPONSE_TOO_LARGE"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        resolve({
          status: response.statusCode ?? 502,
          body: Buffer.concat(chunks).toString("utf8"),
          headers: response.headers,
        });
      });
    });

    request.on("timeout", () => request.destroy(new Error("INTEGRATION_TIMEOUT")));
    request.on("error", reject);
    request.end(body);
  });
}
