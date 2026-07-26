import type { IconType } from "react-icons";
import { FaSlack } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { RiChatSmile3Line } from "react-icons/ri";
import {
  SiAirtable,
  SiGoogleanalytics,
  SiGoogledrive,
  SiGooglesheets,
  SiHubspot,
  SiMailchimp,
  SiMeta,
  SiNotion,
  SiTelegram,
  SiZapier,
} from "react-icons/si";
import { TbWebhook } from "react-icons/tb";
import type { FormIntegrationProvider } from "@/lib/forms-service";

const providerMarks: Record<FormIntegrationProvider, { icon: IconType; color: string }> = {
  webhook: { icon: TbWebhook, color: "#151915" },
  google_sheets: { icon: SiGooglesheets, color: "#0f9d58" },
  airtable: { icon: SiAirtable, color: "#f82b60" },
  facebook_pixel: { icon: SiMeta, color: "#0866ff" },
  email: { icon: MdAlternateEmail, color: "#4f6b2a" },
  slack: { icon: FaSlack, color: "#4a154b" },
  lark: { icon: RiChatSmile3Line, color: "#3370ff" },
  telegram: { icon: SiTelegram, color: "#26a5e4" },
  notion: { icon: SiNotion, color: "#111111" },
  zapier: { icon: SiZapier, color: "#ff4f00" },
  hubspot: { icon: SiHubspot, color: "#ff5c35" },
  mailchimp: { icon: SiMailchimp, color: "#241c15" },
  google_drive: { icon: SiGoogledrive, color: "#4285f4" },
  google_analytics: { icon: SiGoogleanalytics, color: "#e37400" },
};

export function IntegrationLogo({
  provider,
  name,
}: {
  provider: FormIntegrationProvider;
  name: string;
}) {
  const mark = providerMarks[provider];
  const Icon = mark.icon;

  return (
    <span className="integration-mark" style={{ color: mark.color }} aria-hidden="true">
      <Icon title={`${name} logo`} />
    </span>
  );
}
