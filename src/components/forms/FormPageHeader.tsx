import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormNav } from "@/components/forms/FormNav";

export function FormPageHeader({
  formId,
  current,
}: {
  formId: string;
  current: "build" | "responses" | "share";
}) {
  return (
    <div className="form-page-head">
      <Link className="back-link" href="/dashboard/forms" aria-label="Back to all forms">
        <ArrowLeft aria-hidden="true" size={16} />
        <span>Forms</span>
      </Link>
      <FormNav formId={formId} current={current} />
    </div>
  );
}
