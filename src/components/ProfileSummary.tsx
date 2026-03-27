"use client";

import {
  GraduationCap, Briefcase, Rocket, Wrench, FileText, Mail, Phone,
  Linkedin, Github, UserCircle, Award, Globe, BookOpen, Heart, Smile,
  Trophy, Users, BarChart3, BookMarked, Link as LinkIcon, Info, CheckCircle2, Globe2
} from "lucide-react";
import { humanize, sortedSectionKeys, SECTION_ICONS, computeCompletionScore } from "@/lib/profileConfig";

// ── Icon lookup ──────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Mail, GraduationCap, Briefcase, Rocket, Wrench, FileText, Award, Globe,
  BookOpen, Heart, Smile, Trophy, Users, BarChart3, BookMarked, Link: LinkIcon, Info,
};

function getIcon(key: string) {
  const iconName = SECTION_ICONS[key];
  return ICON_MAP[iconName] || Info;
}

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center">
        <Icon size={14} className="text-[#1a1a1a]" />
      </div>
      <h3 className="text-[12px] font-bold text-[#6b7280] uppercase tracking-[0.15em]">{title}</h3>
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return <p className="text-[13px] text-[#9ca3af] italic pl-10.5">{message}</p>;
}

// ── Completion Score Ring ────────────────────────────────────────────────────
export function ScoreRing({ percent, score, total, hideTextOnMobile = false }: { percent: number; score: number; total: number; hideTextOnMobile?: boolean }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent === 100 ? '#22c55e' : percent >= 60 ? '#C1FF00' : '#f59e0b';

  return (
    <div className="flex items-center gap-3">
      <svg width={52} height={52} viewBox="0 0 52 52" className="transform -rotate-90">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={radius} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute w-[52px] h-[52px] flex items-center justify-center">
        <span className="text-[13px] font-black text-[#1a1a1a]">{percent}%</span>
      </div>
      <div className={`ml-1 ${hideTextOnMobile ? 'hidden lg:block' : ''}`}>
        <p className="text-[13px] font-bold text-[#1a1a1a]">{score}/{total} fields</p>
        <p className="text-[11px] text-[#9ca3af]">
          {percent === 100 ? 'Ready to create resume!' : 'Complete your profile'}
        </p>
      </div>
    </div>
  );
}

// ── Dynamic renderers ────────────────────────────────────────────────────────

/** Contact info — special-cased for icon decorations */
function renderContactInfo(data: Record<string, any>) {
  const iconMap: Record<string, any> = {
    email: Mail, phone: Phone, linkedin: Linkedin, github: Github, website: Globe2,
  };

  const entries = Object.entries(data).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 pl-10.5">
      {entries.map(([key, value]) => {
        const Icon = iconMap[key] || Info;
        return (
          <div key={key} className="flex items-center gap-2.5 text-[14px] text-[#1a1a1a] font-medium">
            <Icon size={14} className="text-[#9ca3af] shrink-0" /> <span className="break-all">{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Array of objects → timeline card list */
function renderObjectArray(items: any[]) {
  return (
    <div className="space-y-4 pl-10.5 relative before:content-[''] before:absolute before:left-[10.5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#f0f0f0]">
      {items.map((item, i) => {
        // Try to find a "title" field — first key that looks like a name/title
        const keys = Object.keys(item);
        const titleKey = keys.find((k) => /name|title|degree|role|test|language|label/i.test(k)) || keys[0];
        const subtitleKey = keys.find((k) => /school|university|company|organization|issuer|provider|journal/i.test(k));
        const dateKey = keys.find((k) => /date|year|period/i.test(k));
        const descKey = keys.find((k) => /description|desc|details|summary/i.test(k));
        const rest = keys.filter((k) => ![titleKey, subtitleKey, dateKey, descKey].includes(k));

        return (
          <div key={i} className="relative pl-6 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#C1FF00] border-2 border-white shadow-sm" />
            {titleKey && <p className="text-[15px] font-bold text-[#1a1a1a]">{String(item[titleKey])}</p>}
            {subtitleKey && item[subtitleKey] && (
              <p className="text-[13px] text-[#6b7280] mt-0.5 font-medium">{String(item[subtitleKey])}</p>
            )}
            {dateKey && item[dateKey] && (
              <p className="text-[12px] text-[#9ca3af] mt-1">{String(item[dateKey])}</p>
            )}
            {descKey && item[descKey] && (
              <p className="text-[13px] text-[#1a1a1a] mt-2 leading-relaxed bg-[#fafafa] p-3 rounded-xl border border-[#f0f0f0]">
                {String(item[descKey])}
              </p>
            )}
            {rest.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rest.map((k) => (
                  <span key={k} className="text-[11px] text-[#6b7280] bg-[#f5f5f4] px-2 py-0.5 rounded-md">
                    {humanize(k)}: {String(item[k])}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Array of strings → pill/tag layout */
function renderStringArray(items: string[]) {
  return (
    <div className="flex flex-wrap gap-2 pl-10.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="px-3 py-1.5 text-[12px] font-bold rounded-lg bg-[#fafafa] text-[#1a1a1a] border border-[#e5e5e5] animate-fade-in-up hover:border-[#d4d4d4] hover:shadow-sm cursor-default transition-all"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/** Plain string → paragraph */
function renderString(value: string) {
  return <p className="text-[14px] text-[#1a1a1a] leading-relaxed pl-10.5">{value}</p>;
}

/** Plain object → key-value list */
function renderObject(data: Record<string, any>) {
  return (
    <div className="space-y-2 pl-10.5">
      {Object.entries(data).filter(([, v]) => v != null && v !== '').map(([k, v]) => (
        <div key={k} className="flex items-start gap-2 text-[14px]">
          <span className="text-[#9ca3af] font-medium shrink-0">{humanize(k)}:</span>
          <span className="text-[#1a1a1a] font-medium break-all">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

/** Route to the right renderer based on data type */
function renderSectionContent(key: string, value: unknown) {
  if (key === 'contactInfo' && value && typeof value === 'object' && !Array.isArray(value)) {
    return renderContactInfo(value as Record<string, any>);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === 'string') return renderStringArray(value as string[]);
    if (typeof value[0] === 'object') return renderObjectArray(value);
    // Fallback for other primitives
    return renderStringArray(value.map(String));
  }

  if (typeof value === 'string') {
    return value.trim() ? renderString(value) : null;
  }

  if (value && typeof value === 'object') {
    return renderObject(value as Record<string, any>);
  }

  if (value != null) {
    return renderString(String(value));
  }

  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
interface ProfileSummaryProps {
  profileData: Record<string, any>;
}

export function ProfileSummary({ profileData }: ProfileSummaryProps) {
  const data = profileData || {};
  const INTERNAL_KEYS = new Set(['hasSeenCompletionPopup']);
  const sectionKeys = sortedSectionKeys(data).filter((k) => !INTERNAL_KEYS.has(k));
  const completion = computeCompletionScore(data);
  const isEmpty = sectionKeys.length === 0;

  return (
    <div className="h-full overflow-y-auto slim-scrollbar space-y-4 pr-1">
      {/* Header Card with Score */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center shadow-sm">
            <UserCircle size={24} className="text-[#1a1a1a]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold text-[#1a1a1a]">Profile Data</h2>
            <p className="text-[11px] text-[#9ca3af] uppercase tracking-widest font-bold mt-0.5">Extracted by AI</p>
          </div>
        </div>

        {/* Completion Score */}
        <div className="mt-5 p-4 rounded-xl bg-[#fafafa] border border-[#f0f0f0] relative">
          <ScoreRing percent={completion.percent} score={completion.score} total={completion.total} />
          {completion.missing.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {completion.missing.map((m) => (
                  <span
                    key={m.key}
                    className="text-[11px] text-[#f59e0b] bg-[#fef3c7] px-2 py-0.5 rounded-md font-semibold"
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isEmpty && (
          <div className="mt-5 p-5 rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] text-center">
            <p className="text-[14px] font-medium text-[#1a1a1a] mb-1">Your profile is empty</p>
            <p className="text-[13px] text-[#6b7280]">Start chatting to populate your background.</p>
          </div>
        )}
      </div>

      {/* Dynamic Section Cards */}
      {sectionKeys.map((key) => {
        const value = data[key];
        const content = renderSectionContent(key, value);
        if (!content) return null;

        const Icon = getIcon(key);
        const label = humanize(key);

        return (
          <div key={key} className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-sm animate-fade-in-up">
            <SectionHeader icon={Icon} title={label} />
            {content}
          </div>
        );
      })}
    </div>
  );
}
