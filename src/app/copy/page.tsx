import CopyClient from "@/app/c/[id]/CopyClient";

export const dynamic = "force-dynamic";

function generateRandomId(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CopyRootPage() {
  const randomId = generateRandomId();
  return <CopyClient id={randomId} initialContent="" isNew={true} />;
}