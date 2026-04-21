import { Metadata } from "next";
import { getNote } from "@/app/actions/copy";
import PrivateClient from "./PrivateClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "jobing.site",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function PrivatePage({ params }: PageProps) {
  const { id } = await params;
  let decodedId = id;
  try {
    decodedId = decodeURIComponent(id);
  } catch (e) {
    console.warn("Invalid URI component in private ID", id);
  }
  
  const note = await getNote(decodedId);
  
  return <PrivateClient id={decodedId} initialContent={note?.content || ""} />;
}
