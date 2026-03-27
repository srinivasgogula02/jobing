import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LegalContent, LegalSection } from "@/components/LegalContent";

export const metadata = {
  title: "Privacy Policy | Jobing AI",
};

export default function PrivacyPage() {
  return (
    <DashboardLayout>
      <LegalContent title="Privacy Policy" lastUpdated="March 27, 2026">
        <LegalSection title="1. Introduction">
          <p>
            Your privacy is of utmost importance to us. This Privacy Policy explains how Jobing AI collects, uses, and protects your personal information when you use our Service.
          </p>
        </LegalSection>

        <LegalSection title="2. Information We Collect">
          <p>
            <strong>Account Data:</strong> We use Clerk for authentication. This includes your email address, name, and profile picture provided during sign-up.
          </p>
          <p>
            <strong>Profile Information:</strong> We store the professional background data you provide (Education, Experience, Skills, etc.) in our secure database hosted by Supabase.
          </p>
          <p>
            <strong>LinkedIn Data:</strong> If you use our LinkedIn Import feature, we temporarily process your public LinkedIn profile data to populate your Jobing AI profile. We do not store your LinkedIn credentials.
          </p>
        </LegalSection>

        <LegalSection title="3. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide and maintain our AI-powered resume building Service.</li>
            <li>To tailer your resume content based on your professional background and provided job descriptions.</li>
            <li>To provide customer support and notify you of important service updates.</li>
            <li>To improve our AI models and user experience (using anonymized and aggregated data).</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. AI Processing">
          <p>
            Your professional data is processed by OpenAI's large language models to generate resume content. We do not use your data to train public AI models. All data sent to OpenAI is handled in accordance with their Enterprise Privacy policies, which prevent the use of customer data for model training.
          </p>
        </LegalSection>

        <LegalSection title="5. Data Storage and Security">
          <p>
            We use industry-standard security measures to protect your data. All communication is encrypted via SSL/TLS. Your data is stored in secure databases provided by Supabase, protected by Row Level Security (RLS) to ensure only you can access your information.
          </p>
        </LegalSection>

        <LegalSection title="6. Your Rights">
          <p>
            You have the right to access, correct, or delete your personal data at any time. You can view and edit your profile in the Profile section of the dashboard. You can also delete your entire profile and account data by using the "Clear Profile" feature or contacting our support.
          </p>
        </LegalSection>

        <LegalSection title="7. Contact Us">
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at <strong>support@jobing.ai</strong>.
          </p>
        </LegalSection>
      </LegalContent>
    </DashboardLayout>
  );
}
