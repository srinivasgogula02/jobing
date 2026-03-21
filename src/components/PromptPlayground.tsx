"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { Bot, Send, User, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';

interface PromptPlaygroundProps {
    systemPrompt: string;
}

export function PromptPlayground({ systemPrompt }: PromptPlaygroundProps) {
    const [model, setModel] = useState('google/gemini-2.0-flash-lite');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: {
            systemPrompt,
            model,
        },
    }), [systemPrompt, model]);

    const { messages, status, error, sendMessage } = useChat({
        transport
    });

    // Determine loading state cautiously
    const isLoading = status === 'submitted' || status === 'streaming';

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Manually managing input state as recent Vercel AI SDK versions decouple input state from the chat hook
    const [input, setInput] = useState('');
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!input.trim()) {
            return;
        }

        // Add user message
        sendMessage({
            role: 'user',
            content: input.trim(),
        } as any);

        setInput('');
    };

    return (
        <div className="flex flex-col h-[600px] lg:h-full lg:min-h-[700px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Playground</h3>
                        <p className="text-xs text-slate-500 font-medium">Test your prompt instantly</p>
                    </div>
                </div>

                <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    title="Select AI Model"
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 appearance-none pr-8 cursor-pointer relative z-10 custom-select-arrow"
                    style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat', backgroundSize: '12px' }}
                >
                    <option value="google/gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                    <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    <option value="anthropic/claude-3-haiku-20240307">Claude 3 Haiku</option>
                </select>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <Bot className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-slate-700 font-bold mb-1">Start Chatting</h4>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Send a message to test how the AI responds with your current SYSTEM_PROMPT.
                        </p>
                    </div>
                ) : (
                    messages?.map((m: any) => (
                        <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-slate-100' : 'bg-yellow-50'}`}>
                                {m.role === 'user' ? (
                                    <User className="w-4 h-4 text-slate-600" />
                                ) : (
                                    <Bot className="w-4 h-4 text-yellow-600" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-yellow-100/50 text-slate-800 rounded-tl-sm border border-yellow-200/30'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))
                )}
                
                {isLoading && (
                    <div className="flex gap-4 flex-row">
                        <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-yellow-50">
                            <Bot className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="max-w-[80%] rounded-2xl px-5 py-3.5 text-sm bg-yellow-100/50 text-slate-800 rounded-tl-sm border border-yellow-200/30 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                             <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                             <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>Something went wrong. Could not reach the model.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={onSubmit} className="relative flex items-center">
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-5 pr-14 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all placeholder-slate-400"
                        value={input || ''}
                        placeholder="Type a message to test..."
                        onChange={handleInputChange}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !(input || '').trim()}
                        title="Send message"
                        className="absolute right-2 p-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-200 disabled:text-slate-400 text-black rounded-full transition-colors"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-[1px]" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
