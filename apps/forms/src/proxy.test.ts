import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextFetchEvent } from "next/server";

const mocks = vi.hoisted(() => ({ clerk: vi.fn() }));

vi.mock("@clerk/nextjs/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@clerk/nextjs/server")>();
  return {
    ...actual,
    clerkMiddleware: () => mocks.clerk,
  };
});

import proxy from "./proxy";

const event = {} as NextFetchEvent;

describe("Forms proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clerk.mockResolvedValue(new Response("clerk"));
  });

  it.each([
    "/f/frm_test",
    "/forms/f/frm_test",
    "/",
    "/forms",
    "/api/health",
  ])("bypasses Clerk completely for public route %s", async (pathname) => {
    const response = await proxy(new NextRequest(`https://forms.jobing.site${pathname}`), event);

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) throw new Error("Expected a middleware response");
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mocks.clerk).not.toHaveBeenCalled();
  });

  it("runs Clerk for authenticated app APIs", async () => {
    const response = await proxy(new NextRequest("https://forms.jobing.site/api/app/forms"), event);

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) throw new Error("Expected a middleware response");
    expect(await response.text()).toBe("clerk");
    expect(mocks.clerk).toHaveBeenCalledTimes(1);
  });
});
