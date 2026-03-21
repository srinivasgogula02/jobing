"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/follow";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface FollowButtonProps {
    targetUserId: string;
    initialIsFollowing: boolean;
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggleFollow = async () => {
        // Optimistic update
        const previousState = isFollowing;
        setIsFollowing(!previousState);

        startTransition(async () => {
            const result = await toggleFollow(targetUserId);
            if (!result.success) {
                // Revert on error
                setIsFollowing(previousState);
                alert(result.error || "Failed to update follow status");
            } else {
                router.refresh();
            }
        });
    };

    return (
        <button
            onClick={handleToggleFollow}
            disabled={isPending}
            className={`px-6 py-1.5 font-bold rounded-lg transition-all duration-200 text-sm flex items-center justify-center min-w-[100px] ${isFollowing
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black shadow-sm"
                } disabled:opacity-70`}
        >
            {isPending ? (
                <Loader2 size={16} className="animate-spin" />
            ) : isFollowing ? (
                "Following"
            ) : (
                "Follow"
            )}
        </button>
    );
}
