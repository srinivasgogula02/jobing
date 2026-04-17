import { redirect } from "next/navigation";

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
  redirect(`/c/${randomId}`);
}
