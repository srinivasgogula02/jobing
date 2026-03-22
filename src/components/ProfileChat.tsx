"use client";

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { Send, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

function cleanResponse(text: string): string {
  return text.replace(/<<<PROFILE_UPDATE>>>[\s\S]*?<<<END_PROFILE_UPDATE>>>/g, '').trim();
}

interface MissingField {
  key: string;
  label: string;
}

interface ProfileChatProps {
  onProfileUpdate?: () => void;
  missingFields?: MissingField[];
  fromResume?: boolean;
  isMobile?: boolean;
  hideHeader?: boolean;
}

export function ProfileChat({ 
  onProfileUpdate, 
  missingFields = [], 
  fromResume = false,
  isMobile = false,
  hideHeader = false
}: ProfileChatProps) {
  const transport = useMemo(() => new TextStreamChatTransport({ api: '/api/chat/profile' }), []);
  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(status);
  const autoSentRef = useRef(false);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When streaming → ready, refresh the profile panel
  const refreshProfile = useCallback(() => {
    if (onProfileUpdate) {
      setTimeout(() => onProfileUpdate(), 800);
    }
  }, [onProfileUpdate]);

  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      refreshProfile();
    }
    prevStatusRef.current = status;
  }, [status, refreshProfile]);

  // Auto-send initial guidance message when:
  // 1. User was redirected from resume creation (fromResume) and there are missing fields
  // 2. OR user has missing fields and no messages yet (first visit with incomplete profile)
  useEffect(() => {
    if (autoSentRef.current) return;
    if (status !== 'ready') return;
    if (messages.length > 0) return;

    if (missingFields.length > 0) {
      autoSentRef.current = true;
      const fieldNames = missingFields.map((f) => f.label).join(', ');

      if (fromResume) {
        // User came from the "incomplete profile" popup on the resume page
        sendMessage({
          text: `I was trying to create a resume but my profile is incomplete. I need to add: ${fieldNames}. Can you help me fill in these details?`,
        });
      } else {
        // User just landed on profile page with missing fields
        sendMessage({
          text: `I want to build my resume profile. I still need to add: ${fieldNames}. Can you guide me through adding these?`,
        });
      }
    }
  }, [missingFields, fromResume, messages.length, status, sendMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming' || status === 'submitted') return;
    const currentInput = input;
    setInput('');
    await sendMessage({ text: currentInput });
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  const getMessageText = (m: any): string => {
    let text = '';
    if (m.parts && Array.isArray(m.parts)) {
      text = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
    } else if (typeof m.content === 'string') {
      text = m.content;
    }
    return cleanResponse(text);
  };

  return (
    <div className={`flex-1 flex flex-col h-full min-h-0 bg-white relative ${isMobile ? '' : 'rounded-2xl border border-[#e5e5e5] shadow-sm'} overflow-hidden`}>
      {/* Header */}
      {!hideHeader && (
        <div className="px-6 py-4 border-b border-[#f0f0f0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
              <Sparkles size={16} className="text-[#C1FF00]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1a1a1a]">AI Assistant</h2>
              <p className="text-[12px] text-[#6b7280]">Chat to build your resume profile</p>
            </div>
          </div>
        </div>
      )}
 
      {/* Messages */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'} space-y-5 slim-scrollbar bg-[#fafafa]`}>
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-[#9ca3af]">
            <div className="text-center max-w-[320px] space-y-4">
              <div className="w-16 h-16 rounded-[20px] bg-white shadow-sm border border-[#e5e5e5] flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-[17px] font-bold text-[#1a1a1a]">Let&apos;s build your profile</h3>

              {missingFields.length > 0 ? (
                <>
                  <p className="text-[14px] leading-relaxed text-[#6b7280]">
                    {fromResume
                      ? "You need to complete your profile before creating a resume. Let's fill in the missing details."
                      : "I'll help you add the remaining details to your profile."}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                    {missingFields.map((f) => (
                      <span
                        key={f.key}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#92400e] bg-[#fef3c7] px-2.5 py-1 rounded-lg border border-[#fde68a]/60"
                      >
                        <AlertCircle size={11} /> {f.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#9ca3af] mt-1">Starting automatically...</p>
                </>
              ) : (
                <p className="text-[14px] leading-relaxed text-[#6b7280]">
                  I&apos;m here to gather your resume details. Start by telling me about your education or an internship.
                </p>
              )}
            </div>
          </div>
        )}
        
        {messages.map((m) => {
          const displayText = getMessageText(m);
          if (!displayText && m.role === 'assistant') return null;
          
          return (
            <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] gap-3 px-4 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-[#1a1a1a] text-white rounded-br-sm' 
                  : 'bg-white text-[#1a1a1a] border border-[#e5e5e5] rounded-bl-sm'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {m.role === 'user' 
                    ? <User size={16} className="text-[#9ca3af]" /> 
                    : <span className="text-sm">✨</span>
                  }
                </div>
                <div className="flex-1 chat-markdown">
                  {m.role === 'assistant' ? (
                    <ReactMarkdown>{displayText}</ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{displayText}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex max-w-[85%] gap-3 px-4 py-3.5 rounded-2xl bg-white text-[#1a1a1a] border border-[#e5e5e5] rounded-bl-sm shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-sm">✨</span>
              </div>
              <div className="flex items-center gap-1.5 h-5">
                <div className="w-1.5 h-1.5 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className={`p-4 bg-white border-t border-[#f0f0f0] shrink-0 ${isMobile ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : ''}`}>
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            className="w-full bg-[#fafafa] hover:bg-[#f5f5f4] border border-[#e5e5e5] rounded-xl pl-5 pr-14 py-4 text-base text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#C1FF00] focus:border-[#C1FF00] focus:bg-white transition-all shadow-sm"
            value={input}
            placeholder="E.g., I studied CS at MIT from 2018 to 2022..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2.5 bg-[#C1FF00] hover:bg-[#a8e600] disabled:bg-[#f5f5f4] disabled:text-[#9ca3af] text-[#1a1a1a] rounded-lg transition-all flex items-center justify-center font-bold shadow-sm"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
