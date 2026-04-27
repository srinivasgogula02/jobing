// Server component — no "use client"
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateResumeForm } from "@/components/CreateResumeForm";
import { getUserCredits } from "@/app/actions/user";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "Create Resume | Jobing AI",
};

export default async function CreateResumePage() {
  // Edge-case bulletproof: forcefully redirect using Clerk's internal router if deeply accessed or prefetched without auth.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const credits = await getUserCredits();

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-5 lg:p-0">

        <CreateResumeForm initialCredits={credits} />
      </div>
    </DashboardLayout>
  );
}
