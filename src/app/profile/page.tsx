import { DashboardLayout } from "@/components/DashboardLayout";
import { ProfilePageClient } from "@/components/ProfilePageClient";
import { currentUser, auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const metadata = {
  title: "Profile | Jobing AI",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function getProfileData(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data } = await supabase
    .from('user_profiles')
    .select('profile_data')
    .eq('clerk_user_id', userId)
    .single();
  return data?.profile_data || {};
}

export default async function ProfilePage() {
  // Edge-case bulletproof: forcefully redirect using Clerk's internal router if deeply accessed or prefetched without auth.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const user = await currentUser();
  const initialProfileData = user ? await getProfileData(user.id) : {};

  return (
    <DashboardLayout>
      <ProfilePageClient initialProfileData={initialProfileData} />
    </DashboardLayout>
  );
}
