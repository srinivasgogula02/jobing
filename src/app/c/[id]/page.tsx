import { Metadata } from "next";
import { getNote } from "@/app/actions/copy";
import CopyClient from "./CopyClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Shared Note | Jobing AI",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function CopyPage({ params }: PageProps) {
  const { id } = await params;
  let decodedId = id;
  try {
    decodedId = decodeURIComponent(id);
  } catch (e) {
    console.warn("Invalid URI component in copy ID", id);
  }
  
  const note = await getNote(decodedId);
  
  return <CopyClient id={decodedId} initialContent={note?.content || ""} isNew={false} />;
}
