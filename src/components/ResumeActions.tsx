"use client";

import { useState } from "react";
import { ExternalLink, Download, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResumeActions({ resume }: { resume: any }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/resumes/${resume.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }

            // Refresh the server component smoothly
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex items-center gap-2.5 md:gap-3 mt-auto pt-4 md:pt-5 border-t border-[var(--bg-muted)]">
            {resume.pdf_url && (
                <>
                    <a
                        href={resume.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary flex-1 py-2.5 text-[13px] gap-2"
                    >
                        <ExternalLink size={14} /> View
                    </a>
                    <a
                        href={resume.pdf_url}
                        download="Resume.pdf"
                        className="btn-secondary px-3 py-2.5"
                        title="Download PDF"
                    >
                        <Download size={16} />
                    </a>
                </>
            )}
            
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-secondary px-3 py-2.5 border-[#fee2e2] text-[#ef4444] hover:bg-[#fef2f2] hover:border-[#fca5a5] hover:text-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Delete Resume"
            >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
        </div>
    );
}
