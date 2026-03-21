"use client"

import { useState } from 'react';
import { createPrompt, updatePrompt } from '@/app/actions/prompt';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquare, Image as ImageIcon, Video, Sparkles, AlertCircle } from 'lucide-react';
import { PromptPlayground } from './PromptPlayground';

interface PromptFormProps {
    isEditMode?: boolean;
    initialData?: {
        title: string;
        description?: string | null;
        prompt_text?: string;
    };
    promptId?: string;
}

export function PromptForm({ initialData, promptId }: PromptFormProps) {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [outputType, setOutputType] = useState('chat');
    
    // Default to 'chat' if initialData has no valid output_type, otherwise just use chat for now
    
    const isEditMode = !!initialData && !!promptId;

    const [currentSystemPrompt, setCurrentSystemPrompt] = useState(initialData?.prompt_text || '');

    async function handleSubmit(formData: FormData) {
        setStatus('pending');
        setMessage('');

        try {
            // Append the selected output type since it's managed by state
            formData.append('outputType', outputType);
            
            let result;
            if (isEditMode) {
                result = await updatePrompt(promptId, formData);
            } else {
                result = await createPrompt(formData);
            }

            if (result.success) {
                setStatus('success');
                setMessage(isEditMode ? 'Prompt updated successfully!' : 'Prompt created successfully!');
                // Wait briefly then redirect to the homepage or their profile
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                setStatus('error');
                setMessage(result.error || `Failed to ${isEditMode ? 'update' : 'create'} prompt.`);
            }
        } catch (error) {
            console.error("Form submission error:", error);
            setStatus('error');
            setMessage('An unexpected error occurred.');
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Configuration Form */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md order-2 lg:order-1">
                <div className="p-1 bg-gradient-to-r from-yellow-300 to-yellow-500"></div>
                <form action={handleSubmit} className="p-6 md:p-8 space-y-8">

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Output Type</label>
                        
                        {/* Scroll container for mobile */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 hide-scrollbar">
                            {/* Chat - Active */}
                            <button
                                type="button"
                                onClick={() => setOutputType('chat')}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 shrink-0 group ${
                                    outputType === 'chat' 
                                        ? 'border-yellow-400 bg-yellow-50 focus:ring-2 focus:ring-yellow-400/50 shadow-sm' 
                                        : 'border-slate-200 bg-white hover:border-yellow-200'
                                }`}
                            >
                                <MessageSquare className={`w-4 h-4 ${outputType === 'chat' ? 'text-yellow-600' : 'text-slate-400 group-hover:text-yellow-500'}`} />
                                <span className={`text-sm font-bold ${outputType === 'chat' ? 'text-slate-900' : 'text-slate-600'}`}>Chat</span>
                            </button>

                            {/* Image - Disabled */}
                            <button
                                type="button"
                                disabled
                                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed shrink-0"
                            >
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-500">Image</span>
                                <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[9px] uppercase font-bold tracking-wider rounded-md">
                                    Soon
                                </span>
                            </button>

                            {/* Video - Disabled */}
                            <button
                                type="button"
                                disabled
                                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed shrink-0"
                            >
                                <Video className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-500">Video</span>
                                <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[9px] uppercase font-bold tracking-wider rounded-md">
                                    Soon
                                </span>
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-semibold text-slate-700">Marketplace Title <span className="text-red-500">*</span></label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                defaultValue={initialData?.title}
                                placeholder="e.g. The Ultimate LinkedIn Hook Generator"
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all focus:shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</label>
                            <p className="text-xs text-slate-500 mb-2">Sell your prompt. What does it do? Why should people buy it?</p>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                defaultValue={initialData?.description || ''}
                                placeholder="Write a compelling description..."
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all resize-none focus:shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 space-y-2 relative group">
                        <div className="absolute -inset-1 bg-slate-100 rounded-2xl blur-lg group-focus-within:bg-yellow-100/50 transition duration-500"></div>
                        
                        <div className="bg-white p-1 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 relative">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 ml-2 tracking-wider">SYSTEM_PROMPT</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-bold uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                                    Anti-Leak Match
                                </div>
                            </div>
                            <div className="p-4 md:p-6 bg-white rounded-b-xl border-t border-slate-100/50">
                                <p className="text-xs text-slate-400 mb-3 font-mono">
                                    {"// Paste your secret system instructions here. Try testing it in the playground."}
                                </p>
                                <textarea
                                    id="promptText"
                                    name="promptText"
                                    required
                                    rows={8}
                                    value={currentSystemPrompt}
                                    onChange={(e) => setCurrentSystemPrompt(e.target.value)}
                                    placeholder="You are an expert copywriter..."
                                    className="w-full bg-transparent text-slate-700 font-mono text-sm leading-relaxed focus:outline-none placeholder-slate-300 resize-y min-h-[150px] selection:bg-yellow-200 selection:text-black"
                                    style={{ spellcheck: false } as React.CSSProperties}
                                />
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 ${status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {status === 'success' ? (
                                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm font-medium">{message}</p>
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={status === 'pending' || status === 'success'}
                            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {status === 'pending' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{isEditMode ? 'Updating...' : 'Encrypting & Publishing...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>{isEditMode ? 'Update & Publish Prompt' : 'Create & Publish Prompt'}</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                        {!isEditMode && (
                            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                                By publishing, you agree to our Marketplace Terms and verify you own this IP.
                            </p>
                        )}
                    </div>
                </form>
            </div>

            {/* Right: LLM Playground */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-8 lg:h-[calc(100vh-8rem)]">
                <PromptPlayground systemPrompt={currentSystemPrompt} />
            </div>
        </div>
    );
}
