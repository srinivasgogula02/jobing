import { fetchJobs } from "@/lib/jsearch";
import { JobsClient } from "./JobsClient";

// Opt into aggressive Edge/Server caching. This page only rebuilds every 12 hours max.
export const revalidate = 43200; 

export default async function JobsPage() {
  // Fire all three searches in parallel using Promise.all
  // The Vercel Data Cache will intercept these if they were fetched within the last 12 hours,
  // returning completely instantly without hitting the JSearch API.
  const [softwareJobs, dataJobs, marketingJobs] = await Promise.all([
    fetchJobs("software engineer OR web developer OR frontend OR backend"),
    fetchJobs("data analyst OR data scientist OR machine learning OR python OR ai"),
    // Adding some product / design terms explicitly for the 3rd bucket
    fetchJobs("product manager OR marketing OR ui ux designer OR growth")
  ]);

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <JobsClient 
        softwareJobs={softwareJobs} 
        dataJobs={dataJobs} 
        marketingJobs={marketingJobs} 
      />
    </main>
  );
}
