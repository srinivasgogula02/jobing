import { getPromptForEdit } from '@/app/actions/prompt';
import { PromptForm } from '@/components/PromptForm';
import { notFound, redirect } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Quick auth check to redirect earlier if not logged in
    const user = await currentUser();
    if (!user) {
        redirect('/sign-in');
    }

    const result = await getPromptForEdit(id);

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md text-center">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-6">
                        {result.error === "Unauthorized." 
                            ? "You do not have permission to edit this prompt." 
                            : "The prompt you're trying to edit could not be found."}
                    </p>
                    <a href="/" className="inline-flex items-center justify-center px-4 py-2 font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                        Return Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Prompt</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">Update your prompt details and system instructions below.</p>
                </div>

                <PromptForm 
                    isEditMode={true} 
                    promptId={id} 
                    initialData={result.data} 
                />
            </div>
        </div>
    );
}
