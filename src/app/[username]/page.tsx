
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Grid, Lock } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { BioEditor } from '@/components/BioEditor';
import { EditProfileButton } from '@/components/EditProfileButton';
import { FollowButton } from '@/components/FollowButton';
import { getFollowStats, getFollowStatus } from '@/app/actions/follow';
import { getUserPrompts } from '@/app/actions/prompt';
import { PromptCard } from '@/components/PromptCard';

interface ProfileProps {
    params: Promise<{
        username: string;
    }>;
}

export async function generateMetadata({ params }: ProfileProps) {
    const { username } = await params;

    const { data: user } = await supabase
        .from('users')
        .select('name, username')
        .eq('username', username)
        .single();

    if (!user) {
        return {
            title: 'User Not Found | Promwin',
        };
    }

    return {
        title: `${user.name} (@${user.username}) | Promwin`,
        description: `Check out ${user.name}'s premium AI prompts on Promwin.`,
    };
}

export default async function ProfilePage({ params }: ProfileProps) {
    const { username } = await params;

    // Fetch user data
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 bg-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">User not found</h2>
                    <p className="text-slate-500">This profile doesn't exist or hasn't been set up yet.</p>
                </div>
            </div>
        );
    }

    const clerkUser = await currentUser();
    const isOwnProfile = clerkUser?.id === user.id;

    // Fetch real stats and follow status and prompts
    const [stats, followStatus, prompts] = await Promise.all([
        getFollowStats(user.id),
        getFollowStatus(user.id),
        getUserPrompts(user.id)
    ]);

    return (
        <div className="min-h-screen bg-white">
            {/* Header section (mimics Instagram profile header) */}
            <header className="max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-8 border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-8">

                {/* Avatar */}
                <div className="shrink-0 relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-slate-100 p-1">
                    <div className="w-full h-full relative rounded-full overflow-hidden bg-slate-100">
                        {user.image_url ? (
                            <Image
                                src={user.image_url}
                                alt={user.name || username}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl font-light">
                                {user.name?.charAt(0) || username.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info & Stats */}
                <div className="flex-1 flex flex-col items-center sm:items-start w-full mt-2 sm:mt-0">
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full justify-center sm:justify-start">
                        <h1 className="text-2xl font-normal text-slate-900">{user.username}</h1>
                        <div className="flex gap-2">
                            {isOwnProfile ? (
                                <EditProfileButton />
                            ) : (
                                <>
                                    <FollowButton
                                        targetUserId={user.id}
                                        initialIsFollowing={followStatus.isFollowing}
                                    />
                                    <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg text-slate-900 transition-colors text-sm">
                                        Message
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-8 mb-6 text-slate-900 justify-center sm:justify-start w-full">
                        <div className="text-center sm:text-left">
                            <span className="font-semibold text-base">{prompts?.length || 0}</span> <span className="text-slate-500 font-normal">prompts</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <span className="font-semibold text-base">{stats.followers}</span> <span className="text-slate-500 font-normal">followers</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <span className="font-semibold text-base">{stats.following}</span> <span className="text-slate-500 font-normal">following</span>
                        </div>
                    </div>

                    <div className="text-center sm:text-left w-full">
                        <h2 className="font-semibold text-slate-900 text-sm">{user.name}</h2>
                        {isOwnProfile ? (
                            <BioEditor initialBio={user.bio} />
                        ) : (
                            user.bio ? (
                                <p className="text-slate-800 mt-1 whitespace-pre-wrap text-sm">{user.bio}</p>
                            ) : (
                                <p className="text-slate-400 mt-1 italic text-sm">No bio yet.</p>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Profile Navigation Tabs (Instagram style) */}
            <div className="max-w-4xl mx-auto border-t border-slate-100 flex justify-center gap-14 font-semibold text-xs text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-2 py-4 border-t border-black text-black -mt-[1px]">
                    <Grid size={14} />
                    <span>Prompts</span>
                </div>
                <div className="flex items-center gap-2 py-4 cursor-pointer hover:text-black transition-colors -mt-[1px]">
                    <Lock size={14} />
                    <span>Saved</span>
                </div>
            </div>

            {/* Prompts Section */}
            <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
                {prompts && prompts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 gap-6">
                        {prompts.map((prompt: any) => (
                            <PromptCard key={prompt.id} prompt={prompt} isEditable={isOwnProfile} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                        <div className="w-16 h-16 border-2 border-slate-300 rounded-full flex items-center justify-center mb-6">
                            <Grid size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Prompts Yet</h3>
                        <p className="max-w-md">
                            {user.name} hasn't published any hidden prompts to the marketplace yet.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
