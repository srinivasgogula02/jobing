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

import { createConnectedNote, deployConnectedPage } from "./connected-tools";

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
    db.maybeSingle.mockResolvedValue({ data: { id: "taken" } });
    await expect(createConnectedNote("user_123", "taken", "content")).rejects.toThrow('ID "taken" is already taken');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns a safe operation error when storage fails", async () => {
    db.insert.mockResolvedValue({ error: { message: "database unavailable" } });
    await expect(createConnectedNote("user_123", "new-note", "content")).rejects.toThrow("Could not create note: database unavailable");
  });
});

describe("connected page deployment", () => {
  it("stores HTML under the requesting user and returns the live URL", async () => {
    const result = await deployConnectedPage("user_456", "Launch-Page", "<main>Hello</main>");

    expect(db.from).toHaveBeenCalledWith("pages");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      id: "launch-page",
      html_content: "<main>Hello</main>",
      user_id: "user_456",
    }));
    expect(result).toEqual({ id: "launch-page", url: "https://jobing-pages.vercel.app/launch-page" });
  });

  it.each(["new", "edit", "admin", "api", "settings", "tools"])(
    "rejects reserved page ID %s",
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
    db.maybeSingle.mockResolvedValue({ data: { id: "launch" } });
    await expect(deployConnectedPage("user_456", "launch", "<p>Page</p>")).rejects.toThrow('ID "launch" is already taken');
    expect(db.insert).not.toHaveBeenCalled();
  });
});
