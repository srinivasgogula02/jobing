import {
  formIntegrationProviderSchema,
  type FormIntegrationProvider,
} from "@/lib/forms-service";

export const formIntegrationCatalog: ReadonlyArray<{
  provider: FormIntegrationProvider;
  name: string;
  category: "Notifications" | "Automation" | "CRM" | "Files" | "Analytics";
  description: string;
  secretLabel?: string;
}> = [
  { provider: "email", name: "Email", category: "Notifications", description: "Send a readable response summary to your team." },
  { provider: "slack", name: "Slack", category: "Notifications", description: "Post each new response to a Slack channel.", secretLabel: "Incoming webhook URL" },
  { provider: "lark", name: "Lark Suite", category: "Notifications", description: "Post each response to a Lark group.", secretLabel: "Bot webhook URL" },
  { provider: "telegram", name: "Telegram", category: "Notifications", description: "Send responses through your Telegram bot.", secretLabel: "Bot token" },
  { provider: "google_sheets", name: "Google Sheets", category: "Automation", description: "Append each response as a new spreadsheet row.", secretLabel: "Service account JSON" },
  { provider: "airtable", name: "Airtable", category: "Automation", description: "Create an Airtable record for every response.", secretLabel: "Personal access token" },
  { provider: "notion", name: "Notion", category: "Automation", description: "Create a page inside a Notion database.", secretLabel: "Internal integration token" },
  { provider: "zapier", name: "Zapier", category: "Automation", description: "Trigger a Zap from every accepted response.", secretLabel: "Catch Hook URL" },
  { provider: "webhook", name: "Webhook", category: "Automation", description: "Send a signed JSON event to your own endpoint.", secretLabel: "Destination URL" },
  { provider: "hubspot", name: "HubSpot", category: "CRM", description: "Create or update a contact in HubSpot.", secretLabel: "Private app access token" },
  { provider: "mailchimp", name: "Mailchimp", category: "CRM", description: "Add or update subscribers in an audience.", secretLabel: "API key" },
  { provider: "google_drive", name: "Google Drive", category: "Files", description: "Copy uploaded files and response summaries to Drive.", secretLabel: "Service account JSON" },
  { provider: "google_analytics", name: "Google Analytics", category: "Analytics", description: "Track hosted form views and completions with GA4." },
  { provider: "facebook_pixel", name: "Meta Pixel", category: "Analytics", description: "Track hosted form views and completions with Meta." },
];

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  const result = value(formData, key);
  return result || undefined;
}

function list(formData: FormData, key: string) {
  return value(formData, key).split(",").map((item) => item.trim()).filter(Boolean);
}

function mappings(formData: FormData) {
  const result: Record<string, string> = {};
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("mapping.")) continue;
    const source = key.slice("mapping.".length);
    const target = String(raw).trim();
    if (source && target) result[source] = target;
  }
  return result;
}

function fieldOrder(formData: FormData) {
  return formData.getAll("fieldOrder").map(String).map((entry) => entry.trim()).filter(Boolean);
}

export function integrationSettingsFromFormData(formData: FormData) {
  const provider = formIntegrationProviderSchema.parse(value(formData, "provider"));
  let config: Record<string, unknown>;
  let secret: Record<string, unknown> | undefined;

  switch (provider) {
    case "email":
      config = { recipients: list(formData, "recipients"), subject: value(formData, "subject") || "New response to {{form_name}}" };
      break;
    case "slack":
      config = { title: value(formData, "title") || "New form response" };
      secret = optional(formData, "webhookUrl") ? { webhookUrl: value(formData, "webhookUrl") } : undefined;
      break;
    case "lark":
      config = { title: value(formData, "title") || "New form response" };
      secret = optional(formData, "webhookUrl") ? { webhookUrl: value(formData, "webhookUrl") } : undefined;
      break;
    case "telegram":
      config = { chatId: value(formData, "chatId"), threadId: optional(formData, "threadId") };
      secret = optional(formData, "botToken") ? { botToken: value(formData, "botToken") } : undefined;
      break;
    case "google_sheets":
      config = { spreadsheetId: value(formData, "spreadsheetId"), sheetName: value(formData, "sheetName") || "Responses", fieldOrder: fieldOrder(formData) };
      secret = optional(formData, "serviceAccountJson") ? { serviceAccountJson: value(formData, "serviceAccountJson") } : undefined;
      break;
    case "google_drive":
      config = { folderId: value(formData, "folderId"), includeResponseSummary: formData.get("includeResponseSummary") === "on" };
      secret = optional(formData, "serviceAccountJson") ? { serviceAccountJson: value(formData, "serviceAccountJson") } : undefined;
      break;
    case "airtable":
      config = { baseId: value(formData, "baseId"), tableId: value(formData, "tableId"), fieldMappings: mappings(formData) };
      secret = optional(formData, "accessToken") ? { accessToken: value(formData, "accessToken") } : undefined;
      break;
    case "notion":
      config = {
        databaseId: value(formData, "databaseId"),
        titleProperty: value(formData, "titleProperty"),
        titleField: value(formData, "titleField"),
        fieldMappings: mappings(formData),
      };
      secret = optional(formData, "accessToken") ? { accessToken: value(formData, "accessToken") } : undefined;
      break;
    case "zapier":
      config = { eventName: value(formData, "eventName") || "form.response.created" };
      secret = optional(formData, "webhookUrl") ? { webhookUrl: value(formData, "webhookUrl") } : undefined;
      break;
    case "webhook":
      config = { eventName: value(formData, "eventName") || "form.response.created" };
      if (Boolean(optional(formData, "webhookUrl")) !== Boolean(optional(formData, "signingSecret"))) {
        throw new Error("WEBHOOK_URL_AND_SIGNING_SECRET_REQUIRED");
      }
      secret = optional(formData, "webhookUrl") ? {
        webhookUrl: value(formData, "webhookUrl"),
        signingSecret: value(formData, "signingSecret"),
      } : undefined;
      break;
    case "hubspot":
      config = {
        emailField: value(formData, "emailField"),
        firstNameField: optional(formData, "firstNameField"),
        lastNameField: optional(formData, "lastNameField"),
        phoneField: optional(formData, "phoneField"),
        companyField: optional(formData, "companyField"),
        jobTitleField: optional(formData, "jobTitleField"),
      };
      secret = optional(formData, "accessToken") ? { accessToken: value(formData, "accessToken") } : undefined;
      break;
    case "mailchimp":
      config = {
        audienceId: value(formData, "audienceId"),
        emailField: value(formData, "emailField"),
        firstNameField: optional(formData, "firstNameField"),
        lastNameField: optional(formData, "lastNameField"),
        tags: list(formData, "tags"),
      };
      secret = optional(formData, "apiKey") ? { apiKey: value(formData, "apiKey") } : undefined;
      break;
    case "google_analytics":
      config = { measurementId: value(formData, "measurementId") };
      break;
    case "facebook_pixel":
      config = { pixelId: value(formData, "pixelId") };
      break;
  }

  return { provider, config, secret, replaceSecret: secret !== undefined };
}
