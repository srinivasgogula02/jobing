import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LegalContent, LegalSection } from "@/components/LegalContent";

export const metadata = {
  title: "Terms of Service | Jobing AI",
  description: "Terms for using the Jobing AI connector, Pages, Forms, dashboard, billing, and public utilities.",
};

export default function TermsPage() {
  return (
    <DashboardLayout>
      <LegalContent title="Terms of Service" lastUpdated="July 18, 2026">
        <LegalSection title="1. Acceptance">
          <p>These terms apply to the Jobing AI connector, Pages, Forms, dashboard, billing, and public utilities. By using Jobing, you agree to these terms. If you do not agree, do not use the service.</p>
        </LegalSection>

        <LegalSection title="2. The service">
          <p>Jobing lets users connect a compatible AI app, publish focused web pages, create and run forms, collect responses, manage a response inbox, and use related utilities. Features, limits, and availability may change as the product evolves.</p>
          <p>Jobing is not a full application backend, CRM, payment processor, live scheduling system, or professional legal, hiring, financial, or medical decision service.</p>
        </LegalSection>

        <LegalSection title="3. Accounts and AI connections">
          <p>You are responsible for your account, approved AI connections, and activity performed with those permissions. Review requested permissions before allowing access and disconnect an AI app that is no longer trusted or needed.</p>
        </LegalSection>

        <LegalSection title="4. User content">
          <p>You retain ownership of pages, form content, notes, and other material you provide, subject to rights held by other people. You grant Jobing the limited permission needed to store, process, publish, transmit, and display that content to operate the service.</p>
          <p>You must have the right to publish your content, including text, images, scripts, fonts, trademarks, and other third-party material. Public pages and notes may be viewed by anyone with the link.</p>
        </LegalSection>

        <LegalSection title="5. Forms and respondent information">
          <p>Form owners choose the questions, purpose, and people who receive the form. They are responsible for lawful collection, clear notices, appropriate consent, response handling, and decisions made from the information. Do not collect passwords, payment-card details, or sensitive information that is not necessary for the stated purpose.</p>
          <p>The connected AI can read responses only when the user grants response access and asks for them. AI summaries or rankings are assistance, not final decisions. A person must review high-impact decisions such as hiring, education, housing, credit, healthcare, or access to essential services.</p>
        </LegalSection>

        <LegalSection title="6. Acceptable use">
          <p>Do not use Jobing to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Break the law or another person&apos;s rights.</li>
            <li>Publish malware, phishing, deceptive impersonation, or harmful code.</li>
            <li>Collect passwords, full payment-card details, or authentication secrets.</li>
            <li>Harass, exploit, discriminate against, or defraud people.</li>
            <li>Send abusive traffic, bypass limits, or interfere with the service.</li>
            <li>Publish content without the required rights or consent.</li>
            <li>Make prohibited automated high-impact decisions.</li>
            <li>Misrepresent Jobing pages as reviewed or endorsed by Jobing.</li>
          </ul>
          <p>Jobing may restrict or remove content, connections, or accounts that create risk, violate these terms, or threaten the service or other people.</p>
        </LegalSection>

        <LegalSection title="7. AI-generated material">
          <p>AI-generated pages, form questions, summaries, and recommendations can be incorrect, incomplete, biased, inaccessible, or unsuitable. You must review the result before publishing or relying on it. Jobing does not guarantee a particular business, hiring, marketing, or financial outcome.</p>
        </LegalSection>

        <LegalSection title="8. Plans and payments">
          <p>Free and paid plans have form and response allowances described on the <Link className="underline" href="/pricing">pricing page</Link>. Valid form submissions may continue being saved after a response viewing allowance is reached, while additional responses can remain locked until enough allowance is available.</p>
          <p>Paid plans renew monthly unless cancelled. Checkout and payment details are handled by the payment provider. Cancelling normally leaves paid access active until the end of the current billing period, after which the workspace returns to applicable free limits. Fees already charged are non-refundable except where required by law or explicitly stated during checkout.</p>
        </LegalSection>

        <LegalSection title="9. Availability and third-party services">
          <p>Jobing depends on hosting, authentication, database, AI-app, payment, analytics, and other providers. The service may be interrupted, changed, or discontinued, and Jobing does not guarantee uninterrupted availability or compatibility with every AI app.</p>
        </LegalSection>

        <LegalSection title="10. Disclaimers and liability">
          <p>The service is provided on an “as is” and “as available” basis to the extent permitted by law. Jobing disclaims warranties that are not expressly stated. To the extent permitted by law, Jobing is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, opportunities, data, or goodwill arising from use of the service.</p>
          <p>Nothing in these terms excludes rights or liability that cannot legally be excluded. Users may have additional consumer rights under local law.</p>
        </LegalSection>

        <LegalSection title="11. Changes and contact">
          <p>Jobing may update these terms as the service changes. The current version and date will be published here. Questions can be sent through <Link className="underline" href="/feedback">Jobing feedback</Link>.</p>
        </LegalSection>
      </LegalContent>
    </DashboardLayout>
  );
}
