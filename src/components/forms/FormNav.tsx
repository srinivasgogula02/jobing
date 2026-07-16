import Link from "next/link";

export function FormNav({ formId, current }: { formId: string; current: "build" | "responses" | "share" }) {
  const base = `/dashboard/forms/${formId}`;
  return <nav className="form-nav" aria-label="Form sections">
    <Link href={`${base}/edit`} aria-current={current === "build" ? "page" : undefined}>Questions</Link>
    <Link href={base} aria-current={current === "responses" ? "page" : undefined}>Responses</Link>
    <Link href={`${base}/share`} aria-current={current === "share" ? "page" : undefined}>Share</Link>
  </nav>;
}
