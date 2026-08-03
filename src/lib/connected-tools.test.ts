import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  from: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: db.from, rpc: db.rpc }),
}));
vi.mock("@/lib/page-entitlements", () => ({
  getPageEntitlement: vi.fn().mockResolvedValue({ planKey: "free", planName: "Free", pageLimit: 5, customDomainLimit: 0 }),
}));

import {
  createConnectedNote,
  deleteConnectedPage,
  deployConnectedPage,
  getConnectedPage,
  listConnectedPages,
  updateConnectedPage,
} from "./connected-tools";

beforeEach(() => {
  vi.unstubAllEnvs();
  db.maybeSingle.mockResolvedValue({ data: null });
  db.insert.mockResolvedValue({ error: null });
  db.rpc.mockResolvedValue({ data: { status: "created", count: 1, limit: 5 }, error: null });
  db.from.mockImplementation(() => {
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: db.maybeSingle,
      insert: db.insert,
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    return builder;
  });
});

describe("connected note creation", () => {
  it("normalizes an ID, stores the owner, and returns a shareable URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.jobing.site/");
    const result = await createConnectedNote("user_123", "  Team-Notes  ", "Final decisions");

    expect(db.from).toHaveBeenCalledWith("copies");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      id: "team-notes",
      content: "Final decisions",
      user_id: "user_123",
    }));
    expect(result).toEqual({ id: "team-notes", url: "https://preview.jobing.site/c/team-notes" });
  });

  it.each(["", "contains spaces", "bad/id", "a".repeat(65)])(
    "rejects invalid note ID %j before accessing the database",
    async (id) => {
      await expect(createConnectedNote("user_123", id, "content")).rejects.toThrow("Use 1-64 letters");
      expect(db.from).not.toHaveBeenCalled();
    },
  );

  it.each(["", "x".repeat(100_001)])("rejects invalid note content", async (content) => {
    await expect(createConnectedNote("user_123", "valid-id", content)).rejects.toThrow("between 1 and 100,000");
    expect(db.from).not.toHaveBeenCalled();
  });

  it("does not overwrite an existing note", async () => {
    db.insert.mockResolvedValue({ error: { code: "23505" } });
    await expect(createConnectedNote("user_123", "taken", "content")).rejects.toThrow('ID "taken" is already taken');
    expect(db.insert).toHaveBeenCalledOnce();
    expect(db.maybeSingle).not.toHaveBeenCalled();
  });

  it("returns a safe operation error when storage fails", async () => {
    db.insert.mockResolvedValue({ error: { message: "database unavailable" } });
    await expect(createConnectedNote("user_123", "new-note", "content")).rejects.toThrow("The note could not be saved right now.");
  });
});

describe("connected page deployment", () => {
  it("stores HTML under the requesting user and returns the live URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "jobing.online");
    const result = await deployConnectedPage("user_456", "Launch-Page", "<main>Hello</main>");

    expect(db.rpc).toHaveBeenCalledWith("jobing_create_page", expect.objectContaining({
      p_page_id: "launch-page",
      p_html: "<main>Hello</main>",
      p_user_id: "user_456",
      p_page_limit: 5,
    }));
    expect(result).toEqual({ id: "launch-page", url: "https://launch-page.jobing.online", pageCount: 1, pageLimit: 5 });
  });

  it.each(["new", "edit", "admin", "api", "settings", "tools", "www", "forms", "assets", "mail"])(
    "rejects reserved page ID %s",
    async (id) => {
      await expect(deployConnectedPage("user_456", id, "<p>Page</p>")).rejects.toThrow("Use 1-63 lowercase letters");
      expect(db.from).not.toHaveBeenCalled();
    },
  );

  it.each(["has_underscore", "-starts-bad", "ends-bad-", "a".repeat(64)])(
    "rejects page IDs that cannot be DNS labels: %s",
    async (id) => {
      await expect(deployConnectedPage("user_456", id, "<p>Page</p>")).rejects.toThrow("Use 1-63 lowercase letters");
      expect(db.from).not.toHaveBeenCalled();
    },
  );

  it.each(["", "x".repeat(500_001)])("rejects invalid page HTML", async (html) => {
    await expect(deployConnectedPage("user_456", "valid-page", html)).rejects.toThrow("between 1 and 500,000");
    expect(db.from).not.toHaveBeenCalled();
  });

  it("does not overwrite an existing page", async () => {
    db.rpc.mockResolvedValue({ data: { status: "page_id_taken" }, error: null });
    await expect(deployConnectedPage("user_456", "launch", "<p>Page</p>")).rejects.toThrow('ID "launch" is already taken');
    expect(db.rpc).toHaveBeenCalledOnce();
  });

  it("treats an exact owner and HTML retry as a successful idempotent replay", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "jobing.online");
    db.rpc.mockResolvedValue({ data: { status: "idempotent", count: 1, limit: 5 }, error: null });
    await expect(deployConnectedPage("user_456", "launch", "<p>Page</p>"))
      .resolves.toEqual({ id: "launch", url: "https://launch.jobing.online", pageCount: 1, pageLimit: 5 });
    expect(db.rpc).toHaveBeenCalledOnce();
  });

  it("returns an actionable error when the page plan limit is reached", async () => {
    db.rpc.mockResolvedValue({ data: { status: "limit_reached", count: 5, limit: 5 }, error: null });
    await expect(deployConnectedPage("user_456", "sixth-page", "<p>Page</p>"))
      .rejects.toMatchObject({ code: "page_limit_reached" });
  });
});

describe("connected page management", () => {
  it("lists only the connected user's pages without returning HTML", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "jobing.online");
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: "launch", created_at: "2026-07-01T00:00:00Z", updated_at: "2026-07-02T00:00:00Z" }],
      error: null,
    });
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    db.from.mockReturnValueOnce({ select: vi.fn(() => ({ eq })) });

    await expect(listConnectedPages("user_456")).resolves.toEqual([{
      id: "launch",
      url: "https://launch.jobing.online",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-02T00:00:00Z",
    }]);
    expect(eq).toHaveBeenCalledWith("user_id", "user_456");
  });

  it("reads page HTML only when the page belongs to the connected user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "launch", html_content: "<main>Hi</main>", created_at: "created", updated_at: "updated" },
      error: null,
    });
    const ownerEq = vi.fn(() => ({ maybeSingle }));
    const idEq = vi.fn(() => ({ eq: ownerEq }));
    db.from.mockReturnValueOnce({ select: vi.fn(() => ({ eq: idEq })) });

    await expect(getConnectedPage("user_456", "Launch")).resolves.toMatchObject({ id: "launch", html: "<main>Hi</main>" });
    expect(ownerEq).toHaveBeenCalledWith("user_id", "user_456");
  });

  it("updates an owned page and keeps its public address", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "jobing.online");
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "launch", updated_at: "updated" }, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const updatedAtEq = vi.fn(() => ({ select }));
    const ownerEq = vi.fn(() => ({ eq: updatedAtEq }));
    const idEq = vi.fn(() => ({ eq: ownerEq }));
    const update = vi.fn(() => ({ eq: idEq }));
    db.from.mockReturnValueOnce({ update });

    await expect(updateConnectedPage("user_456", "launch", "<main>New</main>", "2026-07-15T00:00:00Z"))
      .resolves.toEqual({ id: "launch", url: "https://launch.jobing.online", updatedAt: "updated" });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ html_content: "<main>New</main>" }));
    expect(updatedAtEq).toHaveBeenCalledWith("updated_at", "2026-07-15T00:00:00Z");
  });

  it("deletes only an owned page and reports missing pages safely", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const ownerEq = vi.fn(() => ({ select }));
    const idEq = vi.fn(() => ({ eq: ownerEq }));
    db.from.mockReturnValueOnce({ delete: vi.fn(() => ({ eq: idEq })) });

    await expect(deleteConnectedPage("user_456", "missing"))
      .rejects.toThrow("not found in your Jobing account");
  });
});
