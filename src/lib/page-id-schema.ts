import { z } from "zod";
import {
  PAGE_ID_ERROR,
  PAGE_ID_MAX_LENGTH,
  PAGE_ID_PATTERN,
  RESERVED_PAGE_IDS,
} from "@/lib/page-id";

export const pageIdSchema = z.string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(PAGE_ID_MAX_LENGTH)
  .regex(PAGE_ID_PATTERN, PAGE_ID_ERROR)
  .refine((value) => !RESERVED_PAGE_IDS.has(value), PAGE_ID_ERROR)
  .describe("Unique page address using 1-63 lowercase letters, numbers, or hyphens. It must start and end with a letter or number.");
