import { describe, expect, it } from "vitest";
import { dualmarkConfig, hasMarkdownTwin, markdownTwinPath } from "@/lib/dualmark";

async function renderTwin(path: string) {
  const page = dualmarkConfig.staticPages?.find((candidate) => candidate.pattern === path);
  if (!page) throw new Error(`Missing Markdown twin for ${path}`);
  return Promise.resolve(page.render());
}

describe("Markdown twins", () => {
  it("describes the current connector product on the primary pages", async () => {
    expect(await renderTwin("/")).toContain("Give your AI the tools to finish the work");
    expect(await renderTwin("/")).toContain("https://jobing.site/mcp");
    expect(await renderTwin("/connector")).toContain("Create, duplicate, and edit private form drafts");
    expect(await renderTwin("/pricing")).toContain("Starter: $9 per month");
    expect(await renderTwin("/about")).toContain("close that gap between an AI answer and a finished result");
  });

  it("does not advertise the retired resume product", async () => {
    const currentProductPages = ["/", "/connector", "/about", "/pricing", "/privacy", "/terms"];
    const combined = (await Promise.all(currentProductPages.map(renderTwin))).join("\n").toLowerCase();

    expect(combined).not.toContain("ats-beating");
    expect(combined).not.toContain("resume building");
    expect(combined).not.toContain("job-hunting agent");
    expect(combined).not.toContain("emails recruiters");
    expect(combined).not.toContain("₹249");
  });

  it("advertises only twins that are intentionally maintained", () => {
    expect(hasMarkdownTwin("/connector")).toBe(true);
    expect(hasMarkdownTwin("/connector/")).toBe(true);
    expect(hasMarkdownTwin("/blog")).toBe(false);
    expect(hasMarkdownTwin("/blog/old-career-post")).toBe(false);
    expect(markdownTwinPath("/connector")).toBe("/connector.md");
  });

  it("states the privacy boundaries for responses and uploaded files", async () => {
    const privacy = (await renderTwin("/privacy")).replace(/\s+/gu, " ");
    expect(privacy).toContain("Reading form answers requires separate access");
    expect(privacy).toContain("Uploaded file contents are not returned through the connector");
  });
});
