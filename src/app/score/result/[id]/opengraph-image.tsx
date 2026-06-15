import { ImageResponse } from "next/og";
import { getPublicResult } from "@/app/actions/readiness";
import { aspirationalLine } from "@/lib/readiness-score";

// Instagram Story share-card (1080×1920). Generated from the opaque
// public_result_id only — no phone, no email, ever. Gaps are framed as
// "NEXT UPGRADES" (aspirational, shareable), per DESIGN.md.
export const alt = "My AI-Readiness Score";
export const size = { width: 1080, height: 1920 };
export const contentType = "image/png";

const CANVAS = "#0E1219";
const LIME = "#C6F24E";
const TEXT = "#F2F4F7";
const MUTED = "#8B93A1";
const LINE = "#262D3A";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, monospace";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicResult(id);

  if (!data) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: CANVAS, color: TEXT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
          Readiness
        </div>
      ),
      { ...size },
    );
  }

  const r = data.result;
  const R = 300;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - r.score / 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: CANVAS,
          color: TEXT,
          display: "flex",
          flexDirection: "column",
          padding: "96px 80px",
          fontFamily: MONO,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 600 }}>
            Readiness<span style={{ color: LIME }}>.</span>
          </div>
          <div style={{ fontSize: 28, letterSpacing: 6, color: MUTED }}>AI-READINESS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 140 }}>
          <div style={{ position: "relative", display: "flex", width: 680, height: 680, alignItems: "center", justifyContent: "center" }}>
            <svg width="680" height="680" viewBox="0 0 680 680" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx="340" cy="340" r={R} fill="none" stroke={LINE} strokeWidth="22" />
              <circle cx="340" cy="340" r={R} fill="none" stroke={LIME} strokeWidth="22" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
            </svg>
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 280, fontWeight: 600 }}>
              {r.score}
              <span style={{ fontSize: 80, color: MUTED }}>/100</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 46, lineHeight: 1.25, marginTop: 80, color: TEXT, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          {aspirationalLine(r)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 56, gap: 18 }}>
          <div style={{ fontSize: 28, letterSpacing: 6, color: LIME }}>NEXT UPGRADES</div>
          {r.gaps.map((g) => (
            <div key={g.category} style={{ display: "flex", justifyContent: "space-between", fontSize: 34, color: MUTED }}>
              <span>▸ {g.label}</span>
              <span style={{ color: TEXT }}>{g.percent}%</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 30, color: MUTED }}>
          <span>Check yours ↗</span>
          <span style={{ color: LIME }}>jobing.site/score</span>
        </div>
      </div>
    ),
    {
      ...size,
      // Versioned + short cache: bake score_version into the cache key via the
      // header so a scoring change busts crawler caches; keep the window short.
      headers: {
        "cache-control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
        "x-score-version": String(r.scoreVersion),
      },
    },
  );
}
