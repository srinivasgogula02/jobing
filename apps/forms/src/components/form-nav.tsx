import Link from "next/link";

export function FormNav({ formId, current }: { formId: string; current: "build" | "responses" | "share" }) {
  return (
    <nav className="form-nav" aria-label="Form sections">
      <Link href={`/dashboard/forms/${formId}/edit`} aria-current={current === "build" ? "page" : undefined}>Questions</Link>
      <Link href={`/dashboard/forms/${formId}`} aria-current={current === "responses" ? "page" : undefined}>Responses</Link>
      <Link href={`/dashboard/forms/${formId}/share`} aria-current={current === "share" ? "page" : undefined}>Share</Link>
    </nav>
  );
}
