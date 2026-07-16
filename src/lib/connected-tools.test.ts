import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  from: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: db.from }),
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
  db.from.mockImplementation(() => ({
    select: () => ({ eq: () => ({ maybeSingle: db.maybeSingle }) }),
    insert: db.insert,
  }));
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

    expect(db.from).toHaveBeenCalledWith("pages");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      id: "launch-page",
      html_content: "<main>Hello</main>",
      user_id: "user_456",
    }));
    expect(result).toEqual({ id: "launch-page", url: "https://launch-page.jobing.online" });
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
    db.insert.mockResolvedValue({ error: { code: "23505" } });
    db.maybeSingle.mockResolvedValue({ data: { id: "launch", user_id: "someone_else", html_content: "<p>Other</p>" } });
    await expect(deployConnectedPage("user_456", "launch", "<p>Page</p>")).rejects.toThrow('ID "launch" is already taken');
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it("treats an exact owner and HTML retry as a successful idempotent replay", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "jobing.online");
    db.insert.mockResolvedValue({ error: { code: "23505" } });
    db.maybeSingle.mockResolvedValue({ data: { id: "launch", user_id: "user_456", html_content: "<p>Page</p>" } });
    await expect(deployConnectedPage("user_456", "launch", "<p>Page</p>"))
      .resolves.toEqual({ id: "launch", url: "https://launch.jobing.online" });
    expect(db.insert).toHaveBeenCalledOnce();
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
