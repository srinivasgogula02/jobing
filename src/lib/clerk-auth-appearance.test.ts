import { describe, expect, it } from "vitest";
import { clerkAuthAppearance } from "./clerk-auth-appearance";

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) throw new Error(`Expected a six-digit color, received ${hex}`);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Clerk authentication appearance", () => {
  it("uses Clerk's current dark-theme tokens instead of deprecated text aliases", () => {
    expect(clerkAuthAppearance.theme).toBeTruthy();
    expect(clerkAuthAppearance).not.toHaveProperty("baseTheme");
    expect(clerkAuthAppearance.variables).toMatchObject({
      colorBackground: "#161B25",
      colorForeground: "#F2F4F7",
      colorMutedForeground: "#8B93A1",
      colorInput: "#1F2531",
      colorInputForeground: "#F2F4F7",
      colorPrimary: "#C6F24E",
      colorPrimaryForeground: "#0E1219",
    });
  });

  it("keeps every essential text pairing at WCAG AA contrast", () => {
    const variables = clerkAuthAppearance.variables as Record<string, string>;
    expect(contrast(variables.colorForeground, variables.colorBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(variables.colorMutedForeground, variables.colorBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(variables.colorInputForeground, variables.colorInput)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(variables.colorPrimaryForeground, variables.colorPrimary)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps interactive control boundaries visible against the card", () => {
    const background = clerkAuthAppearance.variables.colorBackground;
    expect(contrast(clerkAuthAppearance.elements.formFieldInput.borderColor, background)).toBeGreaterThanOrEqual(3);
    expect(contrast(clerkAuthAppearance.elements.socialButtonsBlockButton.borderColor, background)).toBeGreaterThanOrEqual(3);
  });
});
