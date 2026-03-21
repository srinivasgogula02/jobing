import { getAllPrompts } from './actions/prompt';
import { PromptCard } from '@/components/PromptCard';
import { MessageSquare, Flame, Image as ImageIcon, Video, Search } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
    // Fetch all prompts (trending/all) for the initial load
    const prompts = await getAllPrompts('trending');

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans">
            {/* Hero Section */}
            <section className="relative pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
                        Discover & Buy <span className="text-yellow-400">Premium AI Prompts</span>
                    </h1>
                    <p className="text-base text-slate-500 max-w-lg mx-auto font-medium mb-6">
                        The secure marketplace for AI creators. Use top-performing prompts, keep your logic hidden.
                    </p>
                    
                    <div className="flex items-center justify-center">
                       <div className="relative max-w-md w-full">
                           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                               <Search className="h-4 w-4 text-slate-400" />
                           </div>
                           <input 
                               type="text" 
                               placeholder="Search prompts (e.g. SEO, Marketing...)" 
                               className="block w-full pl-11 pr-24 py-3 border-0 rounded-xl text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-yellow-400 text-sm bg-white shadow-sm transition-shadow"
                           />
                           <button className="absolute inset-y-1 right-1 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors">
                               Search
                           </button>
                       </div>
                    </div>
                </div>
            </section>

            {/* Marketplace Section */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                
                {/* Category Navigation */}
                <div className="flex items-center justify-between mb-10 overflow-hidden">
                    <div className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar w-full">
                        {/* Trending (Active visually for this default view) */}
                        <button className="relative flex items-center gap-2 px-5 py-3 rounded-xl border border-yellow-400 bg-yellow-50 focus:ring-2 focus:ring-yellow-400/50 shadow-sm transition-all duration-200 shrink-0 group">
                            <Flame className="w-4 h-4 text-yellow-600 group-hover:animate-pulse" />
                            <span className="text-sm font-bold text-slate-900">Trending</span>
                        </button>

                        {/* Chat */}
                        <button className="relative flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 shrink-0 group">
                            <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Chat</span>
                        </button>

                        <div className="w-px h-8 bg-slate-200 mx-2 shrink-0"></div>

                        {/* Image - Disabled */}
                        <button disabled className="relative flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed shrink-0">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-500">Image</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[9px] uppercase font-bold tracking-wider rounded-md">Soon</span>
                        </button>

                        {/* Video - Disabled */}
                        <button disabled className="relative flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed shrink-0">
                            <Video className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-500">Video</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[9px] uppercase font-bold tracking-wider rounded-md">Soon</span>
                        </button>
                    </div>
                </div>

                {/* Prompts Grid */}
                {prompts && prompts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {prompts.map((prompt: any) => (
                            <PromptCard key={prompt.id} prompt={prompt} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                        <div className="w-16 h-16 border-2 border-slate-200 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Prompts Found</h3>
                        <p className="max-w-md text-slate-500 mb-8">
                            There are currently no prompts available in this category. Be the first to publish one!
                        </p>
                        <Link href="/create" className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                            Create a Prompt
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}

// Ensure Sparkles is imported if used in empty state
import { Sparkles } from 'lucide-react';
