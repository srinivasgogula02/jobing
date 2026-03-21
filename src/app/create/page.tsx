"use client"

import { PromptForm } from '@/components/PromptForm';

export default function CreatePromptPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Prompt</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">Share your expertise and start earning. Your system prompt is securely encrypted.</p>
                </div>

                <PromptForm />
            </div>
        </div>
    );
}
