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
      <div className="flex flex-col h-full space-y-5 lg:p-0">
        <div className="flex items-center justify-between bg-white px-5 py-3 lg:mb-6 lg:p-6 lg:rounded-2xl lg:border lg:border-[#e5e5e5] lg:shadow-sm border-b border-[#f0f0f0] lg:border-none shrink-0">
          <div className="flex-1">
             <h1 className="text-lg md:text-2xl font-black text-[#1a1a1a] tracking-tight leading-tight">Create Resume</h1>
             <p className="text-[10px] md:text-sm text-[#6b7280] font-bold uppercase tracking-widest mt-1">AI-Powered Builder</p>
          </div>
        </div>
        <CreateResumeForm initialCredits={credits} />
      </div>
    </DashboardLayout>
  );
}
