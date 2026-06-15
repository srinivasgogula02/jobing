import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicResult } from "@/app/actions/readiness";
import ResultClient from "./ResultClient";

// Result is reachable by opaque public_result_id. Anyone with the link can SEE
// the score (that's the share loop); only the owner (who holds the capture token
// in sessionStorage) can attach contact info. No PII is ever rendered here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicResult(id);
  const title = data
    ? `I scored ${data.result.score}/100 on AI-Readiness`
    : "AI-Readiness Score";
  const description = data?.result.verdict ?? "Check your AI-Readiness Score in 2 minutes.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicResult(id);
  if (!data) notFound();
  return <ResultClient publicResultId={data.publicResultId} result={data.result} />;
}
