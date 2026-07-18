export type DashboardFormForNextStep = {
  id: string;
  status: "draft" | "published" | "paused" | "archived" | "trashed";
  updatedAt: string;
};

export type DashboardPageForNextStep = {
  id: string;
  updated_at: string;
};

export type DashboardNextStep =
  | { kind: "connect"; title: string; body: string; href: string; action: string }
  | { kind: "create"; title: string; body: string; href: string; action: string }
  | { kind: "finish_form"; title: string; body: string; href: string; action: string }
  | { kind: "review_responses"; title: string; body: string; href: string; action: string }
  | { kind: "update_page"; title: string; body: string; href: string; action: string };

function newest<T>(items: T[], getDate: (item: T) => string) {
  return [...items].sort((a, b) => Date.parse(getDate(b)) - Date.parse(getDate(a)))[0];
}

export function resolveDashboardNextStep(input: {
  connectionCount: number;
  pages: DashboardPageForNextStep[];
  forms: DashboardFormForNextStep[];
}): DashboardNextStep {
  if (input.connectionCount === 0) {
    return {
      kind: "connect",
      title: "Connect the AI app you already use",
      body: "Add the Jobing URL once, approve the abilities you need, then ask for a page or form in normal language.",
      href: "/connector",
      action: "See connection steps",
    };
  }

  if (input.pages.length === 0 && input.forms.length === 0) {
    return {
      kind: "create",
      title: "Create the first thing customers can use",
      body: "Ask your connected AI for a focused web page with a custom form, or start manually from Jobing.",
      href: "/pages",
      action: "Open the page editor",
    };
  }

  const drafts = input.forms.filter((form) => form.status === "draft");
  const latestDraft = newest(drafts, (form) => form.updatedAt);
  if (latestDraft) {
    return {
      kind: "finish_form",
      title: "Finish the form that is still private",
      body: "Review its questions and success message, then publish it when it is ready to receive responses.",
      href: `/dashboard/forms/${latestDraft.id}/edit`,
      action: "Continue form draft",
    };
  }

  const publishedForms = input.forms.filter((form) => form.status === "published");
  const latestPublishedForm = newest(publishedForms, (form) => form.updatedAt);
  if (latestPublishedForm) {
    return {
      kind: "review_responses",
      title: "Check what people sent",
      body: "Open the latest form inbox, review new enquiries, and ask your AI to summarize the answers when useful.",
      href: `/dashboard/forms/${latestPublishedForm.id}`,
      action: "Open response inbox",
    };
  }

  const latestPage = newest(input.pages, (page) => page.updated_at);
  if (latestPage) {
    return {
      kind: "update_page",
      title: "Keep your latest page current",
      body: "Open the editor or ask your connected AI to make a focused change while preserving the public link.",
      href: `/pages/${latestPage.id}/edit`,
      action: "Edit latest page",
    };
  }

  return {
    kind: "create",
    title: "Create the next useful workflow",
    body: "Start with a web page, a custom form, or both together.",
    href: "/pages",
    action: "Open the page editor",
  };
}

export function usagePercentage(used: number, limit: number) {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}
