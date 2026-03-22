import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { computeCompletionScore } from '@/lib/profileConfig';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data } = await supabase
    .from('user_profiles')
    .select('profile_data')
    .eq('clerk_user_id', user.id)
    .single();

  const profileData = data?.profile_data || {};
  const completion = computeCompletionScore(profileData);

  return new Response(JSON.stringify({ profileData, completion }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
