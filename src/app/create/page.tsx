// Server component — no "use client"
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateResumeForm } from "@/components/CreateResumeForm";
import { getUserCredits } from "@/app/actions/user";

export const metadata = {
  title: "Create Resume | Jobing AI",
};

export default async function CreateResumePage() {
  const credits = await getUserCredits();

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-5 max-w-7xl mx-auto">
        <div className="space-y-1.5 shrink-0 px-2 mt-4">
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight">Create Tailored Resume</h1>
          <p className="text-[15px] text-[#6b7280]">
            Paste the job description and let AI build the perfect LaTeX resume for you.
          </p>
        </div>
        <CreateResumeForm initialCredits={credits} />
      </div>
    </DashboardLayout>
  );
}
