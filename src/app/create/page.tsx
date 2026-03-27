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

        <CreateResumeForm initialCredits={credits} />
      </div>
    </DashboardLayout>
  );
}
