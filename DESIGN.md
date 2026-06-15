# Design System — Readiness (AI-career brand)

> Clean career brand, intentionally separate from the Jobing/Notepad cheat-tool
> identity (see CEO plan `~/.gstack/projects/srinivasgogula02-jobing/ceo-plans/2026-06-15-intent-first-career-platform.md`).

## Product Context
- **What this is:** An AI-Readiness Score — a free, ~2-minute diagnostic that returns a 0–100 score + skill gaps + a personalized path. It is the intent-capture product for an AI-career platform.
- **Who it's for:** Final-year Indian (Telugu-first) engineering students anxious about AI taking their jobs. Mobile-first; traffic comes from Instagram reels.
- **Business role:** Captures consented leads (email/phone) monetized via affiliate offers, a consented get-hired opt-in, and a weekly AI-career intel email. Students are inventory; edtech/recruiters/sponsors are the payer.
- **Space/industry:** Career / edtech / AI-upskilling.
- **Project type:** Mobile-first web app (Next.js + Tailwind + Clerk + Supabase).

## Memorable Thing
"A serious tool that's on your side." A scared student should feel, in 3 seconds:
calm, capable, *measured* — not alarmed, not pandered to. Fear earns the click;
this earns the email.

## Aesthetic Direction
- **Direction:** Editorial authority on a dark canvas, **warmed for clarity**.
- **Decoration level:** Intentional — faint grain + a whisper of grid on dark surfaces. No gradients, no blobs, no decorative illustration.
- **Mood:** Serious software, human voice. Confident, never clickbait.
- **Audience-fit note (from Codex outside voice):** Avoid reading as "elite / Western-SaaS / not for someone like me." Mitigations baked in below: sans verdict headline for instant clarity, a useful-authority proof cue, lifted-off-pure-black canvas, serif reserved for brand wordmark + hero only.

## Typography
- **Display/Hero & wordmark:** **Fraunces** (opsz, 600) — warm intelligent serif; carries brand character and "on your side" authority. Reserve for the wordmark and hero headline; do NOT use for in-flow result verdicts.
- **Body / UI / result verdicts:** **Geist Sans** — clean, modern, instantly legible on mobile. The Score verdict headline is sans (warmed for clarity per outside-voice review).
- **Data / Score / labels:** **Geist Mono** (400–600, tabular-nums) — the score number and gap labels read as an instrument measurement, building lead-converting trust.
- **Loading:** Google Fonts — `Fraunces` (opsz 9..144), `Geist`, `Geist Mono`. Self-host for production performance.
- **Scale (mobile-first):** hero clamp(34px,6vw,60px)/1.05; verdict 22px/1.22; body 17px/1.55; data/labels 12–15px mono; eyebrow 11–12px mono uppercase, letter-spacing .16em.

## Color
- **Approach:** Restrained — one accent + neutrals; color is rare and meaningful.
- **Canvas:** `#0E1219` (ink near-black, lifted slightly off pure black so it reads approachable, not severe).
- **Surface:** `#161B25` · **Surface-2:** `#1F2531` · **Line:** `#262D3A`
- **Primary text:** `#F2F4F7` · **Muted text:** `#8B93A1`
- **Accent — electric lime `#C6F24E`** (dim `#9BBF3C`): optimism / "ahead of AI", the deliberate opposite of alarm-red. Use **sparingly** — score ring, the one primary CTA, key data only. Scarcity keeps it premium and stops it reading "cyber test."
- **Semantic:** success `#5BD6A0`, warning `#E8B964`, error `#E8736B`, info `#8B93A1`.
- **Light mode:** canvas `#F7F8FA`, surface `#FFFFFF`, text `#0B0E14`, accent darkened to `#6F9018` for contrast on light.

## Spacing
- **Base unit:** 8px.
- **Density:** comfortable-to-spacious — room to breathe lowers anxiety.
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64).

## Layout
- **Approach:** Hybrid — editorial for landing/result, grid-disciplined for assessment steps.
- **Grid:** mobile-first single column; ≤560px is the primary target. Widen to a 2-col stage (mock + copy) on desktop only.
- **Max content width:** ~1080px.
- **Border radius:** sm 6px, md 12px, lg 20px, phone-frame 28px, pill 9999px.

## Motion
- **Approach:** Intentional, quiet.
- **Signature moment:** the Score counts up on reveal (the emotional beat). Lime ring draws in behind it.
- **Easing:** enter ease-out, exit ease-in, move ease-in-out. **Duration:** micro 50–100ms, short 150–250ms, score count-up ~700ms.

## Signature Component — Score Reveal (mobile)
- Big **mono** number inside a thin **lime** progress ring (instrument reading, not quiz).
- **Sans** verdict headline (warm, clear): e.g. "You're ahead of most — with three gaps to close."
- **Useful-authority proof cue** directly under the score (from outside-voice review): e.g. "Top 38% of final-years · based on hiring signals for 2026 fresher roles." Always ground the score in a real basis.
- 3 skill-gap rows: mono label + thin lime bar + mono percent.
- One lime primary CTA ("Get my personalized plan →"), one ghost "Share my score ↗".

## Required Artifact — Instagram Story share-card (from outside-voice review)
Because the funnel IS reels, every Score result must generate a **shareable Story
card** (1080×1920): score + sans verdict + top-3 gaps + one aspirational line
("AI-ready for support roles — needs project proof for dev roles"). Branding subtle
but visible. This turns each result into free top-of-funnel and is first-class scope,
not a nice-to-have.

## Anti-slop guardrails
No purple/violet gradients, no 3-column icon grid, no centered-everything, no Inter/
Roboto/Space Grotesk, no gradient CTA, no stock-photo hero, no system-ui as display.
Lime stays rare. Serif stays out of in-flow result copy.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-15 | Initial design system created | /design-consultation; posture = calm authority (user-chosen over playful/alarm) |
| 2026-06-15 | Warmed for clarity | Codex outside voice flagged "elite/Western-SaaS" risk for Instagram Telugu students; verdict → sans, canvas lifted, serif reserved for brand/hero |
| 2026-06-15 | Added proof cue + Story share-card | Codex: shift to useful authority; reels funnel needs shareable score export |
