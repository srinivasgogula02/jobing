import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(async () => [{ address: "8.8.8.8", family: 4 }]),
  request: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:https", () => ({
  default: {
    request: mocks.request,
  },
}));

import { integrationHttpRequest } from "@/lib/integration-http";

describe("integration HTTPS transport", () => {
  it("pins the resolved IP without using Node's version-sensitive lookup callback", async () => {
    mocks.request.mockImplementation((options, onResponse) => {
      const request = new EventEmitter() as EventEmitter & {
        end: (body: Buffer) => void;
        destroy: (error: Error) => void;
      };
      request.destroy = (error) => request.emit("error", error);
      request.end = () => {
        const response = new EventEmitter() as EventEmitter & {
          statusCode: number;
          headers: Record<string, string>;
        };
        response.statusCode = 202;
        response.headers = {};
        onResponse(response);
        queueMicrotask(() => response.emit("end"));
      };
      return request;
    });

    await expect(integrationHttpRequest({
      method: "POST",
      url: "https://hooks.example.com/forms?source=jobing",
      body: "{}",
    })).resolves.toMatchObject({ status: 202 });

    const options = mocks.request.mock.calls[0][0];
    expect(options.hostname).toBe("8.8.8.8");
    expect(options.servername).toBe("hooks.example.com");
    expect(options.headers.host).toBe("hooks.example.com");
    expect(options.lookup).toBeUndefined();
  });
});
