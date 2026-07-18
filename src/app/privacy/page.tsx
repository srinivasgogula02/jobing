import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LegalContent, LegalSection } from "@/components/LegalContent";

export const metadata = {
  title: "Privacy Policy | Jobing AI",
  description: "How Jobing handles account information, pages, forms, responses, connector permissions, billing records, and reliability data.",
};

export default function PrivacyPage() {
  return (
    <DashboardLayout>
      <LegalContent title="Privacy Policy" lastUpdated="July 18, 2026">
        <LegalSection title="1. Scope">
          <p>This policy explains the information Jobing handles when people use the Jobing AI connector, Pages, Forms, dashboard, billing, and public utilities.</p>
        </LegalSection>

        <LegalSection title="2. Information Jobing handles">
          <ul className="list-disc space-y-3 pl-5">
            <li><strong>Account information:</strong> sign-in details such as name, email address, and profile image supplied through our authentication provider.</li>
            <li><strong>Workspace content:</strong> pages, page code, public notes, form definitions, settings, and publishing information created by you or your approved AI.</li>
            <li><strong>Form responses:</strong> answers and files submitted by people using your form.</li>
            <li><strong>Connector records:</strong> the connected AI app, approved permissions, connection status, and basic operation results. Our product analytics are designed not to record full chat prompts or transcripts.</li>
            <li><strong>Billing records:</strong> plan, subscription status, and payment-provider references. Jobing does not receive full payment-card details.</li>
            <li><strong>Reliability and usage information:</strong> events such as which product ability was used, whether it succeeded, broad use-case categories, timing, and errors.</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. How Jobing uses information">
          <p>We use information to provide the requested product, authenticate users, publish and manage pages, run forms, store and return responses, prevent abuse, process subscriptions, provide support, understand reliability, and improve Jobing.</p>
          <p>Jobing does not sell form responses, uploaded files, page content, or private workspace content.</p>
        </LegalSection>

        <LegalSection title="4. AI connections">
          <p>You choose the AI app and approve the Jobing permissions it requests. The AI app has its own terms and privacy practices. Jobing returns only information allowed by the approved permission and requested operation.</p>
          <p>Reading form answers requires separate access. Uploaded file contents are not returned through the connector, although basic file details may be shown.</p>
        </LegalSection>

        <LegalSection title="5. Public content and form owners">
          <p>Published pages, hosted forms, and shared notes can be viewed by anyone with the public link. Form owners decide what questions to ask and are responsible for appropriate notices, lawful consent, and avoiding unnecessary sensitive information.</p>
        </LegalSection>

        <LegalSection title="6. Service providers and storage">
          <p>Jobing uses providers for authentication, hosting, databases, payments, analytics, and error reporting. Information may be processed in regions where those providers operate. The main account service and Forms use separate storage to reduce unnecessary access between product areas.</p>
        </LegalSection>

        <LegalSection title="7. Analytics and error reporting">
          <p>Product analytics and error reporting are configured to avoid prompts, form answers, uploaded file contents, page HTML, names, email addresses, cookies, credentials, and request bodies. No filter is perfect, so Jobing also limits what the application sends to these services.</p>
        </LegalSection>

        <LegalSection title="8. Retention, access, and deletion">
          <p>Jobing keeps information while it is needed to provide the service, prevent abuse, meet legal obligations, and maintain reasonable backups. You can delete individual pages, manage forms and responses, revoke AI connections, and request broader account or data assistance through the <Link className="underline" href="/feedback">feedback page</Link>.</p>
          <p>Some records may remain for a limited period in backups, security logs, payment records, or where retention is legally required.</p>
        </LegalSection>

        <LegalSection title="9. Security">
          <p>Jobing uses encrypted connections, account-based access controls, scoped connector permissions, private response access, validation, request limits, and other safeguards. No online service can promise absolute security. Uploaded files are not currently malware-scanned and should be opened carefully.</p>
        </LegalSection>

        <LegalSection title="10. Contact and changes">
          <p>We may update this policy as the product changes. The current version and date will be published here. Questions or privacy requests can be sent through <Link className="underline" href="/feedback">Jobing feedback</Link>.</p>
        </LegalSection>
      </LegalContent>
    </DashboardLayout>
  );
}
