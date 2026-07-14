import { ImageResponse } from "next/og";

export const alt = "Your AI makes the form and Jobing saves the leads";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0E1219", color: "#F2F4F7", padding: "62px 68px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, fontWeight: 700 }}><span>Jobing <span style={{ color: "#8B93A1" }}>Forms</span></span><span style={{ color: "#C6F24E", fontSize: 20 }}>5 LIVE FORMS</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: "#C6F24E", fontSize: 112, lineHeight: .9, fontWeight: 900, letterSpacing: -7 }}>FORM → LEAD</div>
        <div style={{ marginTop: 30, fontSize: 44, fontWeight: 700 }}>Keep your HTML. Get every response.</div>
      </div>
      <div style={{ display: "flex", gap: 24, fontSize: 20, color: "#8B93A1" }}><span>Native HTML</span><span>·</span><span>No iframe</span><span>·</span><span>One inbox</span></div>
    </div>,
    size,
  );
}
