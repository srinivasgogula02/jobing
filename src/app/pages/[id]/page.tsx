import { Metadata } from "next";
import { getPage } from "@/app/actions/pages";
import { permanentRedirect } from "next/navigation";
import HtmlViewerClient from "../HtmlViewerClient";
import { publicPageUrl } from "@/lib/pages-runtime-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${id} — Jobing Pages`,
    description: `A page deployed on Jobing Pages.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function DeployedPage({ params }: PageProps) {
  const { id } = await params;
  let decodedId = id.toLowerCase();
  try {
    decodedId = decodeURIComponent(id).toLowerCase();
  } catch {
    console.warn("Invalid URI component in page ID", id);
  }

  const page = await getPage(decodedId);

  if (!page) {
    // Page doesn't exist yet — show the editor so user can create it
    return <HtmlViewerClient id={decodedId} initialHtml="" isNew={true} />;
  }

  permanentRedirect(publicPageUrl(decodedId));
}
