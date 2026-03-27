import { ExternalLink, MapPin, Building2, Clock, DollarSign, Briefcase } from "lucide-react";
import type { JSearchJob } from "@/lib/jsearch";

interface JobCardProps {
  job: JSearchJob;
}

export function JobCard({ job }: JobCardProps) {
  // Format location
  const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : "Remote / India";

  // Format salary
  const salaryString = job.job_min_salary && job.job_max_salary
    ? `${job.job_salary_currency || '$'}${Math.floor(job.job_min_salary).toLocaleString()} - ${job.job_salary_currency || '$'}${Math.floor(job.job_max_salary).toLocaleString()} / ${job.job_salary_period ? job.job_salary_period.toLowerCase() : 'yr'}`
    : "Salary undisclosed";

  return (
    <div className="group relative bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:border-[#C1FF00] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full animate-fade-in-up">
      {/* Top row: Logo & Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl border border-[#f0f0f0] bg-[#fafafa] flex items-center justify-center p-2.5 shrink-0 overflow-hidden shadow-sm">
          {job.employer_logo ? (
            <img 
              src={job.employer_logo} 
              alt={job.employer_name} 
              className="w-full h-full object-contain mix-blend-multiply"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Building2 size={24} className="text-[#a3a3a3]" />
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {job.job_posted_at && (
            <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider bg-[#f5f5f4] px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <Clock size={10} /> {job.job_posted_at}
            </span>
          )}
          {job.job_is_remote && (
            <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider bg-[#ecfdf5] px-2 py-0.5 rounded-md text-right">
              Remote
            </span>
          )}
        </div>
      </div>

      {/* Middle row: Title & Company */}
      <div className="mb-4">
        <h3 className="text-[16px] font-black leading-snug text-[#1a1a1a] mb-1 group-hover:text-[#000] line-clamp-2">
          {job.job_title}
        </h3>
        <p className="text-[14px] font-medium text-[#6b7280] flex items-center gap-1.5">
          {job.employer_name}
        </p>
      </div>

      {/* Attributes */}
      <div className="flex flex-col gap-2.5 mb-5 mt-auto border-t border-[#f0f0f0] pt-4">
        <div className="flex items-center gap-2.5 text-[13px] text-[#6b7280]">
          <MapPin size={14} className="shrink-0 text-[#a3a3a3]" />
          <span className="truncate">{locationString}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#6b7280]">
          <Briefcase size={14} className="shrink-0 text-[#a3a3a3]" />
          <span className="truncate capitalize">{job.job_employment_type?.toLowerCase() || 'Full-time'}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#6b7280]">
          <DollarSign size={14} className="shrink-0 text-[#a3a3a3]" />
          <span className="truncate">{salaryString}</span>
        </div>
      </div>

      {/* Primary CTA */}
      <a 
        href={job.job_apply_link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-2.5 bg-[#1a1a1a] group-hover:bg-[#C1FF00] group-hover:text-[#1a1a1a] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-[14px] shadow-sm transition-all focus:ring-2 focus:ring-[#C1FF00] focus:ring-offset-1 focus:outline-none focus:scale-[0.98] active:scale-95"
      >
        <span className="truncate max-w-[80%]">Apply via {job.job_publisher}</span>
        <ExternalLink size={14} className="shrink-0" />
      </a>
    </div>
  );
}
