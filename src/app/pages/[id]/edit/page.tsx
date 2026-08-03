import { Metadata } from "next";
import { getPage } from "@/app/actions/pages";
import { auth } from "@clerk/nextjs/server";
import HtmlViewerClient from "../../HtmlViewerClient";
import LoginButton from "../../LoginButton";
import { getPreferredPageUrl } from "@/lib/page-domain-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit ${id} — Jobing Pages`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: PageProps) {
  const { id } = await params;
  let decodedId = id.toLowerCase();
  try {
    decodedId = decodeURIComponent(id).toLowerCase();
  } catch {
    console.warn("Invalid URI component in page ID", id);
  }

  const page = await getPage(decodedId);

  if (!page) {
    // If doesn't exist, just create a new one with this ID
    return <HtmlViewerClient id={decodedId} initialHtml="" isNew={true} />;
  }

  // Anonymous pages cannot be edited
  if (!page.user_id) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans flex-col p-6 text-center">
        <div className="bg-white dark:bg-[#111] p-8 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full">
          <h1 className="text-2xl font-black mb-3">Page Locked</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">This page was deployed anonymously and is permanently locked. It cannot be edited by anyone.</p>
          <a href={`/pages/${decodedId}`} className="block w-full py-3 bg-[#C1FF00] hover:bg-[#aee600] text-black font-bold rounded-lg transition-colors">View Live Page</a>
        </div>
      </div>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    // They are not logged in, but this page is owned by someone
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans flex-col p-6 text-center">
        <div className="bg-white dark:bg-[#111] p-8 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full">
          <h1 className="text-2xl font-black mb-3">Login Required</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">This page is owned by a user. If you are the creator, please log in to edit it.</p>
          <div className="flex flex-col gap-3">
            <LoginButton redirectUrl={`/pages/${decodedId}/edit`} />
            <a href={`/pages/${decodedId}`} className="block w-full py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-lg transition-colors">View Live Page</a>
          </div>
        </div>
      </div>
    );
  }

  if (page.user_id !== userId) {
    // They are logged in, but not the owner
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans flex-col p-6 text-center">
        <div className="bg-white dark:bg-[#111] p-8 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full">
          <h1 className="text-2xl font-black mb-3 text-red-500">Access Denied</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">You do not have permission to edit this page. Only the original creator can edit it.</p>
          <a href={`/pages/${decodedId}`} className="block w-full py-3 bg-[#C1FF00] hover:bg-[#aee600] text-black font-bold rounded-lg transition-colors">View Live Page</a>
        </div>
      </div>
    );
  }

  // They are the owner!
  return <HtmlViewerClient id={decodedId} initialHtml={page.html_content} isNew={false} initialLiveUrl={await getPreferredPageUrl(decodedId)} />;
}
