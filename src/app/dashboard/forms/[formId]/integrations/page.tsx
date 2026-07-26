import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { FormPageHeader } from "@/components/forms/FormPageHeader";
import { IntegrationLogo } from "@/components/forms/IntegrationLogo";
import { dashboardFormsActor, getDashboardForm } from "@/lib/dashboard-forms";
import { formIntegrationCatalog } from "@/lib/form-integration-catalog";
import { listConnectorFormIntegrations, type FormIntegration, type FormIntegrationProvider } from "@/lib/forms-service";
import {
  deleteFormIntegrationAction,
  saveFormIntegrationAction,
  setFormIntegrationStatusAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Field = { key: string; label: string; type: string };

function configValue(integration: FormIntegration | undefined, key: string) {
  const value = integration?.config[key];
  return typeof value === "string" ? value : "";
}

function configList(integration: FormIntegration | undefined, key: string) {
  const value = integration?.config[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function configMap(integration: FormIntegration | undefined, key: string) {
  const value = integration?.config[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function TextField({ label, name, defaultValue, type = "text", required = false, placeholder, help }: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: "text" | "email" | "password";
  required?: boolean;
  placeholder?: string;
  help?: string;
}) {
  return <label className="integration-field"><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} autoComplete={type === "password" ? "new-password" : undefined} />{help ? <small>{help}</small> : null}</label>;
}

function SecretField({ label, name, connected, multiline = false, help }: {
  label: string;
  name: string;
  connected: boolean;
  multiline?: boolean;
  help?: string;
}) {
  const placeholder = connected ? "Stored securely. Leave blank to keep it." : `Enter ${label.toLowerCase()}`;
  return <label className="integration-field"><span>{label}</span>{multiline
    ? <textarea name={name} rows={5} placeholder={placeholder} autoComplete="off" required={!connected} />
    : <input name={name} type="password" placeholder={placeholder} autoComplete="new-password" required={!connected} />}
    {help ? <small>{help}</small> : null}</label>;
}

function FieldSelect({ label, name, fields, defaultValue, required = false }: {
  label: string;
  name: string;
  fields: Field[];
  defaultValue?: string;
  required?: boolean;
}) {
  return <label className="integration-field"><span>{label}</span><select name={name} defaultValue={defaultValue} required={required}><option value="">Choose a question</option>{fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>;
}

function MappingFields({ fields, integration, label }: { fields: Field[]; integration?: FormIntegration; label: string }) {
  const mapping = configMap(integration, "fieldMappings");
  return <fieldset className="integration-mapping"><legend>Match form questions to {label} fields</legend><p>Leave a destination blank when that answer should not be sent.</p>{fields.map((field) => <label key={field.key}><span>{field.label}<small>{field.key}</small></span><input name={`mapping.${field.key}`} defaultValue={mapping[field.key] ?? field.key} placeholder={`${label} field name`} /></label>)}</fieldset>;
}

function IntegrationFields({ provider, fields, integration }: {
  provider: FormIntegrationProvider;
  fields: Field[];
  integration?: FormIntegration;
}) {
  const hasSecret = integration?.hasSecret === true;
  switch (provider) {
    case "email":
      return <><TextField label="Send notifications to" name="recipients" required defaultValue={configList(integration, "recipients").join(", ")} placeholder="owner@example.com, team@example.com" help="Separate multiple addresses with commas. Maximum 10." /><TextField label="Email subject" name="subject" defaultValue={configValue(integration, "subject") || "New response to {{form_name}}"} help="Use {{form_name}} to include the form name." /></>;
    case "slack":
    case "lark":
      return <><TextField label="Notification title" name="title" defaultValue={configValue(integration, "title") || "New form response"} /><SecretField label={provider === "slack" ? "Incoming webhook URL" : "Bot webhook URL"} name="webhookUrl" connected={hasSecret} /></>;
    case "telegram":
      return <><TextField label="Chat ID" name="chatId" required defaultValue={configValue(integration, "chatId")} /><TextField label="Topic ID" name="threadId" defaultValue={configValue(integration, "threadId")} help="Optional. Use this for a Telegram forum topic." /><SecretField label="Bot token" name="botToken" connected={hasSecret} /></>;
    case "google_sheets": {
      const selected = new Set(configList(integration, "fieldOrder"));
      return <><TextField label="Spreadsheet ID" name="spreadsheetId" required defaultValue={configValue(integration, "spreadsheetId")} help="Copy the ID between /d/ and /edit in the spreadsheet URL." /><TextField label="Worksheet name" name="sheetName" required defaultValue={configValue(integration, "sheetName") || "Responses"} /><fieldset className="integration-checks"><legend>Columns to append</legend>{fields.map((field) => <label key={field.key}><input type="checkbox" name="fieldOrder" value={field.key} defaultChecked={!selected.size || selected.has(field.key)} /> <span>{field.label}</span></label>)}</fieldset><SecretField label="Service account JSON" name="serviceAccountJson" connected={hasSecret} multiline help="Share the spreadsheet with the service account email before connecting." /></>;
    }
    case "google_drive":
      return <><TextField label="Drive folder ID" name="folderId" required defaultValue={configValue(integration, "folderId")} help="Share this folder with the service account email." /><label className="integration-checkbox"><input type="checkbox" name="includeResponseSummary" defaultChecked={integration ? integration.config.includeResponseSummary !== false : true} /> <span>Save a JSON response summary with uploaded files</span></label><SecretField label="Service account JSON" name="serviceAccountJson" connected={hasSecret} multiline /></>;
    case "airtable":
      return <><TextField label="Base ID" name="baseId" required defaultValue={configValue(integration, "baseId")} /><TextField label="Table ID or name" name="tableId" required defaultValue={configValue(integration, "tableId")} /><SecretField label="Personal access token" name="accessToken" connected={hasSecret} /><MappingFields fields={fields} integration={integration} label="Airtable" /></>;
    case "notion":
      return <><TextField label="Database ID" name="databaseId" required defaultValue={configValue(integration, "databaseId")} /><TextField label="Title property name" name="titleProperty" required defaultValue={configValue(integration, "titleProperty") || "Name"} /><FieldSelect label="Question used as the page title" name="titleField" fields={fields} required defaultValue={configValue(integration, "titleField")} /><SecretField label="Internal integration token" name="accessToken" connected={hasSecret} help="Share the target database with this Notion integration." /><MappingFields fields={fields} integration={integration} label="Notion" /></>;
    case "zapier":
      return <><TextField label="Event name" name="eventName" defaultValue={configValue(integration, "eventName") || "form.response.created"} /><SecretField label="Catch Hook URL" name="webhookUrl" connected={hasSecret} /></>;
    case "webhook":
      return <><TextField label="Event name" name="eventName" defaultValue={configValue(integration, "eventName") || "form.response.created"} /><SecretField label="Destination URL" name="webhookUrl" connected={hasSecret} /><SecretField label="Signing secret" name="signingSecret" connected={hasSecret} help="Choose at least 16 characters. Verify X-Jobing-Signature with HMAC-SHA256 over timestamp + '.' + the raw request body. To rotate, enter both fields again." /></>;
    case "hubspot":
      return <><SecretField label="Private app access token" name="accessToken" connected={hasSecret} /><div className="integration-fields-grid"><FieldSelect label="Email" name="emailField" fields={fields} required defaultValue={configValue(integration, "emailField")} /><FieldSelect label="First name" name="firstNameField" fields={fields} defaultValue={configValue(integration, "firstNameField")} /><FieldSelect label="Last name" name="lastNameField" fields={fields} defaultValue={configValue(integration, "lastNameField")} /><FieldSelect label="Phone" name="phoneField" fields={fields} defaultValue={configValue(integration, "phoneField")} /><FieldSelect label="Company" name="companyField" fields={fields} defaultValue={configValue(integration, "companyField")} /><FieldSelect label="Job title" name="jobTitleField" fields={fields} defaultValue={configValue(integration, "jobTitleField")} /></div></>;
    case "mailchimp":
      return <><TextField label="Audience ID" name="audienceId" required defaultValue={configValue(integration, "audienceId")} /><SecretField label="API key" name="apiKey" connected={hasSecret} /><div className="integration-fields-grid"><FieldSelect label="Email" name="emailField" fields={fields} required defaultValue={configValue(integration, "emailField")} /><FieldSelect label="First name" name="firstNameField" fields={fields} defaultValue={configValue(integration, "firstNameField")} /><FieldSelect label="Last name" name="lastNameField" fields={fields} defaultValue={configValue(integration, "lastNameField")} /></div><TextField label="Tags" name="tags" defaultValue={configList(integration, "tags").join(", ")} placeholder="lead, website-form" /></>;
    case "google_analytics":
      return <TextField label="GA4 measurement ID" name="measurementId" required defaultValue={configValue(integration, "measurementId")} placeholder="G-XXXXXXXXXX" />;
    case "facebook_pixel":
      return <TextField label="Meta Pixel ID" name="pixelId" required defaultValue={configValue(integration, "pixelId")} placeholder="123456789012345" />;
  }
}

function statusMessage(query: Record<string, string | string[] | undefined>) {
  if (query.saved) return "Integration saved. New valid responses will use this connection.";
  if (query.removed) return "Integration removed.";
  if (query.error === "credentials_required") return "Add the required connection details before enabling this integration.";
  if (query.error === "invalid_configuration") return "Check the connection fields, URLs, IDs, and credentials, then try again.";
  if (query.error) return "The integration could not be saved. Check every field and try again.";
  return null;
}

export default async function FormIntegrationsPage({ params, searchParams }: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  const { formId } = await params;
  const [form, integrations, query] = await Promise.all([
    getDashboardForm(userId, formId),
    listConnectorFormIntegrations(dashboardFormsActor(userId), formId),
    searchParams,
  ]);
  if (!form) notFound();
  const byProvider = new Map(integrations.map((integration) => [integration.provider, integration]));
  const fields = form.definition.fields.filter((field) => !field.hidden).map((field) => ({ key: field.key, label: field.label, type: field.type }));
  const message = statusMessage(query);
  const openProvider = typeof query.open === "string" ? query.open : typeof query.saved === "string" ? query.saved : "";

  return <div className="forms-workspace"><section className="app-content integrations-page">
    <FormPageHeader formId={form.id} current="integrations" />
    <div className="integration-heading"><div><p className="eyebrow">Integrations</p><h1>Send responses where work happens.</h1><p>Connect this form once. Jobing delivers every valid response in the background and retries temporary failures.</p></div><div className="integration-count"><strong>{integrations.filter((entry) => entry.status === "active").length}</strong><span>active</span></div></div>
    {message ? <p className={query.error ? "integration-notice integration-notice--error" : "integration-notice"} role="status">{message}</p> : null}
    <aside className="integration-privacy"><strong>Know where responses go.</strong><span>Enabling an integration shares new form answers with that provider. Credentials are encrypted and are never returned to the browser or AI connector.</span></aside>

    <div className="integration-catalog">{formIntegrationCatalog.map((entry) => {
      const integration = byProvider.get(entry.provider);
      const active = integration?.status === "active";
      return <details className="integration-item" key={entry.provider} open={openProvider === entry.provider}>
        <summary><IntegrationLogo provider={entry.provider} name={entry.name} /><span className="integration-summary"><strong>{entry.name}</strong><small>{entry.description}</small></span><span className="integration-status" data-state={active ? "active" : integration ? "paused" : "available"}>{active ? "Connected" : integration ? "Paused" : entry.category}</span></summary>
        <div className="integration-setup">
          {integration ? <div className="integration-health"><span>Last success<strong>{integration.lastSuccessAt ? new Date(integration.lastSuccessAt).toLocaleString("en-IN") : "Waiting for a response"}</strong></span><span>Pending<strong>{integration.pendingDeliveries}</strong></span><span>Needs attention<strong>{integration.failedDeliveries}</strong></span></div> : null}
          <form action={saveFormIntegrationAction} className="integration-form">
            <input type="hidden" name="formId" value={form.id} />
            <input type="hidden" name="provider" value={entry.provider} />
            <IntegrationFields provider={entry.provider} fields={fields} integration={integration} />
            <button className="button button--primary" type="submit">{integration ? "Save changes" : `Connect ${entry.name}`}</button>
          </form>
          {integration ? <div className="integration-actions"><form action={setFormIntegrationStatusAction}><input type="hidden" name="formId" value={form.id} /><input type="hidden" name="provider" value={entry.provider} /><input type="hidden" name="status" value={active ? "paused" : "active"} /><button type="submit">{active ? "Pause delivery" : "Resume delivery"}</button></form><form action={deleteFormIntegrationAction}><input type="hidden" name="formId" value={form.id} /><input type="hidden" name="provider" value={entry.provider} /><button className="danger" type="submit">Remove connection</button></form></div> : null}
        </div>
      </details>;
    })}</div>
  </section></div>;
}
