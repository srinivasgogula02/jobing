import { getTodaysDailyUpdate, getPublishedDailyUpdates } from "@/app/actions/daily-updates";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Zap, Calendar, Flame, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const metadata = {
  title: "Upskill | Daily AI Career Updates | Jobing AI",
  description: "Level up your career with daily AI-powered insights on resume optimization, job search strategies, and industry trends.",
  keywords: ["career tips", "AI updates", "job search", "skill development", "professional growth"],
};

export const revalidate = 3600;

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "beginner":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "intermediate":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "advanced":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function getCategoryColor(category: string) {
  const colors: { [key: string]: string } = {
    "Resume": "bg-[#C1FF00]/10 text-[#8bb800] border-[#C1FF00]/30",
    "Interview": "bg-purple-50 text-purple-700 border-purple-200",
    "ATS": "bg-green-50 text-green-700 border-green-200",
    "Networking": "bg-pink-50 text-pink-700 border-pink-200",
    "Salary": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Career": "bg-orange-50 text-orange-700 border-orange-200",
  };
  return colors[category] || colors["Resume"];
}

export default async function UpskillPage() {
  const todaysUpdate = await getTodaysDailyUpdate();
  const allUpdates = await getPublishedDailyUpdates();
  const pastUpdates = todaysUpdate
    ? allUpdates.filter(u => u.id !== todaysUpdate.id)
    : allUpdates;

  const readTime = todaysUpdate ? estimateReadTime(todaysUpdate.content) : 0;

  return (
    <DashboardLayout breadcrumbs={[{ label: "Upskill" }]}>
      <div className="flex flex-col w-full gap-8 pb-16">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#C1FF00]/10 to-transparent border border-[#C1FF00]/20 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-[#C1FF00]/20 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={24} className="text-[#8bb800]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1a1a1a] tracking-tight mb-2">
                Level Up Your Career
              </h1>
              <p className="text-[#6b7280] text-lg font-medium">
                Daily AI-powered insights to supercharge your job search. One update a day keeps rejection at bay.
              </p>
            </div>
          </div>
        </div>

        {/* Today's Update — Featured Card */}
        {todaysUpdate ? (
          <div className="group">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C1FF00]/15 border border-[#C1FF00]/30 rounded-lg">
                <Flame size={14} className="text-[#8bb800]" />
                <span className="text-[12px] font-bold text-[#1a1a1a] uppercase tracking-wider">Today's Update</span>
              </div>
            </div>

            <div className="bg-white border-2 border-[#C1FF00]/40 rounded-2xl overflow-hidden hover:border-[#C1FF00]/60 transition-all shadow-lg shadow-[#C1FF00]/10">

              {/* Header */}
              <div className="bg-gradient-to-r from-[#C1FF00]/5 to-transparent border-b border-[#C1FF00]/20 px-8 py-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-black text-[#1a1a1a] tracking-tight leading-tight mb-3">
                      {todaysUpdate.title}
                    </h2>
                    <p className="text-[#6b7280] text-base font-medium leading-relaxed">
                      {todaysUpdate.description}
                    </p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#C1FF00]/20">
                  <div className={`px-3 py-1.5 rounded-lg border text-[12px] font-bold uppercase tracking-wider ${getCategoryColor(todaysUpdate.category)}`}>
                    {todaysUpdate.category}
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border text-[12px] font-bold uppercase tracking-wider ${getDifficultyColor(todaysUpdate.difficulty)}`}>
                    {todaysUpdate.difficulty}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280] font-bold uppercase tracking-wider ml-auto">
                    <Clock size={14} />
                    {readTime} min read
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-8 max-w-3xl">
                <div className="prose prose-sm max-w-none text-[#1a1a1a]">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-[#1a1a1a]" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-[#1a1a1a]" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-[#1a1a1a]" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 text-[#6b7280] leading-relaxed font-medium" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-[#6b7280]" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-[#6b7280]" {...props} />,
                      li: ({node, ...props}) => <li className="text-[#6b7280] font-medium" {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-[#C1FF00] bg-[#C1FF00]/5 pl-4 py-2 my-4 text-[#6b7280] italic font-medium" {...props} />
                      ),
                      code: ({node, ...props}) => <code className="bg-[#f5f5f4] text-[#1a1a1a] px-2 py-1 rounded font-mono text-sm" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-[#1a1a1a] text-white p-4 rounded-lg overflow-auto mb-4" {...props} />,
                    }}
                  >
                    {todaysUpdate.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-4 bg-[#fafafa] border-t border-[#e5e5e5]">
                <div className="flex items-center gap-2 text-[13px] text-[#6b7280]">
                  <Calendar size={14} />
                  {new Date(todaysUpdate.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <button className="px-4 py-2 bg-[#C1FF00] text-[#1a1a1a] rounded-lg font-bold text-sm hover:bg-[#C1FF00]/90 transition-all">
                  Mark as Read
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl">
            <div className="w-16 h-16 bg-[#C1FF00]/10 flex items-center justify-center mb-6 rounded-2xl border border-[#C1FF00]/20">
              <BookOpen size={32} className="text-[#8bb800]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No Update Today</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm">
              Check back tomorrow for a fresh AI-powered insight to level up your career.
            </p>
          </div>
        )}

        {/* Past Updates Archive */}
        {pastUpdates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen size={20} className="text-[#1a1a1a]" />
              <h2 className="text-2xl font-bold text-[#1a1a1a]">Past Updates</h2>
              <span className="ml-auto text-sm text-[#6b7280] font-medium">
                {pastUpdates.length} {pastUpdates.length === 1 ? 'update' : 'updates'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastUpdates.map((update) => {
                const time = estimateReadTime(update.content);
                return (
                  <div
                    key={update.id}
                    className="group bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:border-[#C1FF00]/40 hover:shadow-lg hover:shadow-[#C1FF00]/10 transition-all"
                  >
                    {/* Card Header */}
                    <div className="bg-[#fafafa] border-b border-[#e5e5e5] px-6 py-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8bb800] transition-colors line-clamp-2 leading-snug">
                            {update.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-[#6b7280] text-sm font-medium line-clamp-2 leading-relaxed">
                        {update.description}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-white space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${getCategoryColor(update.category)}`}>
                          {update.category}
                        </div>
                        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${getDifficultyColor(update.difficulty)}`}>
                          {update.difficulty}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                        <div className="flex items-center gap-1 text-[12px] text-[#6b7280]">
                          <Clock size={12} />
                          {time} min
                        </div>
                        <div className="text-[12px] text-[#9ca3af]">
                          {new Date(update.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <button className="w-full py-2 bg-[#f5f5f4] hover:bg-[#C1FF00]/15 text-[#1a1a1a] font-bold text-sm rounded-lg transition-colors">
                        Read Update
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
