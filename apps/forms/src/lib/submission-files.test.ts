import { describe, expect, it } from "vitest";
import { formDefinitionSchema } from "./form-definition";
import { collectSubmissionFiles } from "./submission-files";

describe("submission files", () => {
  it("accepts a configured safe file and normalizes its name", async () => {
    const definition = formDefinitionSchema.parse({
      schemaVersion: 1,
      title: "Application",
      fields: [{ id: crypto.randomUUID(), key: "resume", type: "file", label: "Resume", required: true, validation: { acceptedFileTypes: ["application/pdf"] } }],
    });
    const data = new FormData();
    data.set("resume", new File(["resume"], "../resume.pdf", { type: "application/pdf" }));
    const result = await collectSubmissionFiles(definition, data);
    expect(result.errors).toEqual({});
    expect(result.files[0]).toMatchObject({ fieldKey: "resume", fileName: "resume.pdf", contentType: "application/pdf" });
  });

  it("rejects active content even when no custom accept list is set", async () => {
    const definition = formDefinitionSchema.parse({
      schemaVersion: 1,
      title: "Upload",
      fields: [{ id: crypto.randomUUID(), key: "attachment", type: "file", label: "Attachment" }],
    });
    const data = new FormData();
    data.set("attachment", new File(["<svg/>"] , "image.svg", { type: "image/svg+xml" }));
    const result = await collectSubmissionFiles(definition, data);
    expect(result.errors.attachment).toContain("not supported");
  });
});
