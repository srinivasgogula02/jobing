"use client";

import { useState } from "react";
import { updateBio } from "@/app/actions";

interface BioEditorProps {
    initialBio: string | null;
}

export function BioEditor({ initialBio }: BioEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(initialBio || "");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        setIsSaving(true);
        try {
            await updateBio(bio);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save bio:", error);
            alert("Failed to save bio. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    if (isEditing) {
        return (
            <div className="w-full mt-2">
                <textarea
                    autoFocus
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a bio to tell users about your prompts..."
                    className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-slate-50 text-slate-900 resize-y"
                    maxLength={150}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => {
                            setBio(initialBio || "");
                            setIsEditing(false);
                        }}
                        disabled={isSaving}
                        className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mt-1 group relative">
            {bio ? (
                <p className="text-slate-800 whitespace-pre-wrap text-sm">{bio}</p>
            ) : (
                <p className="text-slate-400 italic text-sm">No bio yet.</p>
            )}

            <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-slate-500 hover:text-black transition-colors mt-2 underline"
            >
                Edit Bio
            </button>
        </div>
    );
}
