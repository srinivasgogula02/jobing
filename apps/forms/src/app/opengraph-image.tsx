import { ImageResponse } from "next/og";

export const alt = "Add any form to any website by asking your AI with Jobing Forms";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0E1219", color: "#F2F4F7", padding: "62px 68px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, fontWeight: 700 }}><span>Jobing Forms</span><span style={{ color: "#C6F24E", fontSize: 20 }}>ONE AI CONNECTOR</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: "#C6F24E", fontSize: 88, lineHeight: .9, fontWeight: 900, letterSpacing: -6 }}>ANY FORM. ANY WEBSITE.</div>
        <div style={{ marginTop: 30, fontSize: 42, fontWeight: 700 }}>Ask your AI. Jobing handles everything underneath.</div>
      </div>
      <div style={{ display: "flex", gap: 24, fontSize: 20, color: "#8B93A1" }}><span>Custom design</span><span>·</span><span>Native HTML</span><span>·</span><span>AI analysis</span></div>
    </div>,
    size,
  );
}
