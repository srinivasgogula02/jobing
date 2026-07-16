import type { FormDefinition } from "@/lib/form-definition";

export type EditableForm = {
  id: string;
  name: string;
  status: "draft" | "published" | "paused" | "archived" | "trashed";
  revision: number;
  publishedVersion: number;
  endpointId: string;
  definition: FormDefinition;
  updatedAt: string;
};
