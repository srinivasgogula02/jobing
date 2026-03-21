"use client";

import { useClerk } from "@clerk/nextjs";

export function EditProfileButton() {
    const { openUserProfile } = useClerk();

    return (
        <button
            onClick={() => openUserProfile()}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg text-black transition-colors text-sm"
        >
            Edit Profile
        </button>
    );
}
