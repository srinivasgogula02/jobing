import { z } from "zod";

export const integrationProviderSchema = z.enum([
  "airtable",
  "email",
  "facebook_pixel",
  "google_analytics",
  "google_drive",
  "google_sheets",
  "hubspot",
  "lark",
  "mailchimp",
  "notion",
  "slack",
  "telegram",
  "webhook",
  "zapier",
]);

export type IntegrationProvider = z.infer<typeof integrationProviderSchema>;

export class InvalidIntegrationConfigurationError extends Error {
  constructor(public readonly provider: IntegrationProvider) {
    super("The integration configuration is invalid.");
    this.name = "InvalidIntegrationConfigurationError";
  }
}

export const clientIntegrationProviderSchema = z.enum(["google_analytics", "facebook_pixel"]);

const fieldKeySchema = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/);
const targetFieldSchema = z.string().trim().min(1).max(200);
const fieldMappingSchema = z.record(fieldKeySchema, targetFieldSchema).default({});
const optionalFieldKeySchema = fieldKeySchema.optional();
const httpsUrlSchema = z.string().url().max(4_000).refine((value) => new URL(value).protocol === "https:", "Use an HTTPS URL");
const providerUrlSchema = (hosts: readonly string[]) => httpsUrlSchema.refine(
  (value) => hosts.includes(new URL(value).hostname.toLowerCase()),
  "Use the webhook URL issued by this provider",
);

const configSchemas = {
  airtable: z.object({
    baseId: z.string().trim().min(3).max(100),
    tableId: z.string().trim().min(1).max(200),
    fieldMappings: fieldMappingSchema,
  }),
  email: z.object({
    recipients: z.array(z.string().email()).min(1).max(10),
    subject: z.string().trim().min(1).max(160).default("New response to {{form_name}}"),
  }),
  facebook_pixel: z.object({
    pixelId: z.string().trim().regex(/^\d{5,32}$/),
  }),
  google_analytics: z.object({
    measurementId: z.string().trim().toUpperCase().regex(/^G-[A-Z0-9]{4,20}$/),
  }),
  google_drive: z.object({
    folderId: z.string().trim().min(3).max(200),
    includeResponseSummary: z.boolean().default(true),
  }),
  google_sheets: z.object({
    spreadsheetId: z.string().trim().min(10).max(240),
    sheetName: z.string().trim().min(1).max(120).default("Responses"),
    fieldOrder: z.array(fieldKeySchema).max(100).default([]),
  }),
  hubspot: z.object({
    emailField: fieldKeySchema,
    firstNameField: optionalFieldKeySchema,
    lastNameField: optionalFieldKeySchema,
    phoneField: optionalFieldKeySchema,
    companyField: optionalFieldKeySchema,
    jobTitleField: optionalFieldKeySchema,
  }),
  lark: z.object({
    title: z.string().trim().min(1).max(120).default("New form response"),
  }),
  mailchimp: z.object({
    audienceId: z.string().trim().min(1).max(100),
    emailField: fieldKeySchema,
    firstNameField: optionalFieldKeySchema,
    lastNameField: optionalFieldKeySchema,
    tags: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  }),
  notion: z.object({
    databaseId: z.string().trim().min(10).max(100),
    titleProperty: z.string().trim().min(1).max(200),
    titleField: fieldKeySchema,
    fieldMappings: fieldMappingSchema,
  }),
  slack: z.object({
    title: z.string().trim().min(1).max(120).default("New form response"),
  }),
  telegram: z.object({
    chatId: z.string().trim().min(1).max(100),
    threadId: z.string().trim().max(100).optional(),
  }),
  webhook: z.object({
    eventName: z.string().trim().min(1).max(100).default("form.response.created"),
  }),
  zapier: z.object({
    eventName: z.string().trim().min(1).max(100).default("form.response.created"),
  }),
} satisfies Record<IntegrationProvider, z.ZodType>;

const secretSchemas = {
  airtable: z.object({ accessToken: z.string().trim().min(10).max(2_000) }),
  email: z.object({}),
  facebook_pixel: z.object({}),
  google_analytics: z.object({}),
  google_drive: z.object({ serviceAccountJson: z.string().trim().min(50).max(32_000) }),
  google_sheets: z.object({ serviceAccountJson: z.string().trim().min(50).max(32_000) }),
  hubspot: z.object({ accessToken: z.string().trim().min(10).max(2_000) }),
  lark: z.object({ webhookUrl: providerUrlSchema(["open.larksuite.com", "open.feishu.cn"]) }),
  mailchimp: z.object({ apiKey: z.string().trim().min(10).max(500) }),
  notion: z.object({ accessToken: z.string().trim().min(10).max(2_000) }),
  slack: z.object({ webhookUrl: providerUrlSchema(["hooks.slack.com", "hooks.slack-gov.com"]) }),
  telegram: z.object({ botToken: z.string().trim().min(20).max(500) }),
  webhook: z.object({
    webhookUrl: httpsUrlSchema,
    signingSecret: z.string().trim().min(16).max(500),
  }),
  zapier: z.object({ webhookUrl: providerUrlSchema(["hooks.zapier.com"]) }),
} satisfies Record<IntegrationProvider, z.ZodType>;

export const integrationCatalog: ReadonlyArray<{
  provider: IntegrationProvider;
  name: string;
  category: "Automation" | "Analytics" | "CRM" | "Files" | "Notifications";
  description: string;
  secretRequired: boolean;
}> = [
  { provider: "email", name: "Email", category: "Notifications", description: "Send a response summary to up to 10 recipients.", secretRequired: false },
  { provider: "slack", name: "Slack", category: "Notifications", description: "Post each new response to a Slack channel.", secretRequired: true },
  { provider: "lark", name: "Lark Suite", category: "Notifications", description: "Post new responses to a Lark group.", secretRequired: true },
  { provider: "telegram", name: "Telegram", category: "Notifications", description: "Send response summaries through a Telegram bot.", secretRequired: true },
  { provider: "google_sheets", name: "Google Sheets", category: "Automation", description: "Append each response as a spreadsheet row.", secretRequired: true },
  { provider: "airtable", name: "Airtable", category: "Automation", description: "Create one Airtable record for every response.", secretRequired: true },
  { provider: "notion", name: "Notion", category: "Automation", description: "Create a page in a Notion database.", secretRequired: true },
  { provider: "zapier", name: "Zapier", category: "Automation", description: "Trigger a Zap from every valid submission.", secretRequired: true },
  { provider: "webhook", name: "Webhook", category: "Automation", description: "Send a signed JSON event to your own HTTPS endpoint.", secretRequired: true },
  { provider: "hubspot", name: "HubSpot", category: "CRM", description: "Create or update a HubSpot contact.", secretRequired: true },
  { provider: "mailchimp", name: "Mailchimp", category: "CRM", description: "Add or update a contact in a Mailchimp audience.", secretRequired: true },
  { provider: "google_drive", name: "Google Drive", category: "Files", description: "Copy uploaded files and a response summary to Drive.", secretRequired: true },
  { provider: "google_analytics", name: "Google Analytics", category: "Analytics", description: "Track hosted form views, starts, and completions with GA4.", secretRequired: false },
  { provider: "facebook_pixel", name: "Meta Pixel", category: "Analytics", description: "Track hosted form views and completions with Meta Pixel.", secretRequired: false },
];

export function parseIntegrationConfig(provider: IntegrationProvider, value: unknown) {
  return configSchemas[provider].parse(value);
}

export function parseIntegrationSecret(provider: IntegrationProvider, value: unknown) {
  return secretSchemas[provider].parse(value);
}

export function integrationNeedsSecret(provider: IntegrationProvider) {
  return integrationCatalog.find((entry) => entry.provider === provider)?.secretRequired === true;
}

export const formIntegrationSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  provider: integrationProviderSchema,
  status: z.enum(["active", "paused"]),
  config: z.record(z.string(), z.unknown()),
  hasSecret: z.boolean(),
  lastDeliveryAt: z.string().nullable().default(null),
  lastSuccessAt: z.string().nullable().default(null),
  lastFailureAt: z.string().nullable().default(null),
  lastErrorCode: z.string().nullable().default(null),
  pendingDeliveries: z.coerce.number().int().nonnegative().default(0),
  failedDeliveries: z.coerce.number().int().nonnegative().default(0),
  updatedAt: z.string(),
});

export type FormIntegration = z.infer<typeof formIntegrationSchema>;

export const clientIntegrationSchema = z.object({
  provider: clientIntegrationProviderSchema,
  config: z.record(z.string(), z.unknown()),
});

export type ClientIntegration = z.infer<typeof clientIntegrationSchema>;

const internalIntegrationActorSchema = z.object({
  userId: z.string().min(1).max(128),
  clientId: z.string().min(1).max(128),
  grantId: z.string().uuid(),
  scopes: z.array(z.string().min(1).max(64)).min(1).max(16),
});

export const formIntegrationRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list"),
    actor: internalIntegrationActorSchema,
  }),
  z.object({
    action: z.literal("save"),
    actor: internalIntegrationActorSchema,
    provider: integrationProviderSchema,
    config: z.unknown(),
    secret: z.unknown().optional(),
    replaceSecret: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("status"),
    actor: internalIntegrationActorSchema,
    provider: integrationProviderSchema,
    status: z.enum(["active", "paused"]),
  }),
  z.object({
    action: z.literal("delete"),
    actor: internalIntegrationActorSchema,
    provider: integrationProviderSchema,
  }),
]);
