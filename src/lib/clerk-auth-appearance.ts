import { dark } from "@clerk/themes";

export const clerkAuthAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "#C6F24E",
    colorPrimaryForeground: "#0E1219",
    colorBackground: "#161B25",
    colorForeground: "#F2F4F7",
    colorMuted: "#1F2531",
    colorMutedForeground: "#8B93A1",
    colorNeutral: "#F2F4F7",
    colorInput: "#1F2531",
    colorInputForeground: "#F2F4F7",
    colorRing: "#C6F24E",
    colorDanger: "#E8736B",
    borderRadius: "0.75rem",
  },
  elements: {
    cardBox: {
      boxShadow: "0 24px 80px rgba(0, 0, 0, 0.28)",
    },
    card: {
      border: "1px solid #262D3A",
    },
    socialButtonsBlockButton: {
      borderColor: "#8B93A1",
      color: "#F2F4F7",
    },
    socialButtonsBlockButtonText: {
      color: "#F2F4F7",
    },
    dividerLine: {
      backgroundColor: "#262D3A",
    },
    dividerText: {
      color: "#8B93A1",
    },
    formFieldLabel: {
      color: "#8B93A1",
    },
    formFieldInput: {
      backgroundColor: "#1F2531",
      borderColor: "#8B93A1",
      color: "#F2F4F7",
    },
    formButtonPrimary: {
      backgroundColor: "#C6F24E",
      color: "#0E1219",
    },
    footerActionText: {
      color: "#8B93A1",
    },
    footerActionLink: {
      color: "#C6F24E",
    },
  },
} as const;
