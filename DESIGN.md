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
- **Credibility disclosure** under the proof cue (mono, muted): "Based on: skills · projects · AI tools · interview readiness." Stops the score reading as made-up, which protects the capture ask that follows.
- 3 skill-gap rows: mono label + thin lime bar + mono percent.
- One lime primary CTA ("Get my personalized plan →"), one ghost "Share my score ↗".

## Required Artifact — Instagram Story share-card (from outside-voice review)
Because the funnel IS reels, every Score result must generate a **shareable Story
card** (1080×1920): score + sans verdict + top-3 gaps + one aspirational line
("AI-ready for support roles — needs project proof for dev roles"). Branding subtle
but visible. This turns each result into free top-of-funnel and is first-class scope,
not a nice-to-have.
- **Frame gaps as growth, not shame** (outside-voice review): on the public card the three gaps are labelled **"NEXT UPGRADES,"** never "gaps/weaknesses." A student won't share a card that exposes weakness publicly; aspirational framing keeps the share-loop alive.

## Capture screen — lead form (the conversion crux)
> Shown AFTER the Score Reveal. This is the funnel's biggest drop-off point; the
> student already got the emotional payoff, so the ask must feel like service, not
> extraction. Decisions below come from /plan-design-review (Codex outside voice).
- **Earn the ask first:** a short **plan-preview card** above the form ("6-WEEK PLAN · 3 GAPS" + 3 concrete bullets). The student sees what they get before giving anything.
- **WhatsApp-first, one required channel.** Phone with `+91` country-code selector is the required field (this audience lives on WhatsApp). **Email is optional**, clearly labelled "— optional".
- **Split, explicit consent — never bundled.** Three separate checkboxes:
  1. "Send my plan on WhatsApp" *(required, pre-checked)*
  2. "Also send weekly AI-career intel" *(optional)*
  3. "Share relevant openings from hiring & upskilling partners" *(optional — this is the resale opt-in)*
  This reverses the earlier *implied-consent* + *email+phone-both-required* eng calls. Explicit per-purpose consent makes leads cleanly resaleable (DPDP-safe) and lifts conversion.
- **No inline validation error until the field is touched** (blur), never on first paint.
- **Grounding microcopy:** "Simple English · No login · Privacy" in muted mono. Closes audience-fit distance for a Telugu-first student without gimmicks.

## Form field tokens
- **Input:** bg `--surface`, 1px `--line`, radius 10px, padding 13px 14px, Geist Sans 15px, text `--text`. Focus: 2px lime ring (see a11y). Error: border `--error` + mono error message `--error` 11.5px (only after blur).
- **Label:** Geist Mono 10.5px, uppercase, letter-spacing .12em, `--muted`, above field (never placeholder-as-label).
- **Country code:** fixed 78px, mono, same surface/line as input.
- **Consent row:** 16px lime-outlined box + 11px `--muted` body; checked = lime fill. Privacy link in `--lime`.

## Responsive & Accessibility (mobile-first, the whole funnel is thumbs on phones)
- **Touch targets:** min 44×44px on every tappable element (options, CTA, checkboxes, country-code, share). Assessment option rows are full-width tap zones.
- **Mobile keyboard:** phone field `inputmode="numeric"` / `type="tel"`; email field `type="email"` `autocomplete="email"`. Avoid layout shift when the soft keyboard opens (CTA stays reachable, not covered).
- **Focus:** visible 2px `--lime` focus ring on all interactive elements; logical tab order; assessment navigable by keyboard (options as radio group, Enter advances).
- **ARIA / semantics:** one `<main>` landmark per screen; score reveal exposes the number to screen readers (`aria-label="AI-Readiness Score 68 out of 100"`), the ring is decorative (`aria-hidden`); gap bars have text equivalents (the mono % is the accessible value).
- **Contrast:** body text ≥4.5:1 on `--canvas`. Lime `#C6F24E` is an accent/affordance, not body text; never set small muted mono below 4.5:1 — bump to `--text` if it carries meaning. Verify the proof-cue and "Based on" lines pass.
- **Reduced motion:** honor `prefers-reduced-motion` — the score count-up and ring draw become an instant set, no animation.
- **Breakpoints:** ≤560px single column (primary). Desktop ≥768px: 2-col stage (phone mock + copy) for landing/result only; assessment stays single-column centered.

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
| 2026-06-15 | Capture = WhatsApp-first + split consent + plan-preview | /plan-design-review (Codex): bundled email+phone+consent was the funnel's biggest drop-off ("lead form wearing a diagnostic mask"). Reverses prior implied-consent + both-required eng calls; makes leads DPDP-clean and resaleable. |
| 2026-06-15 | Added a11y/responsive spec + form tokens | /plan-design-review Pass 6 was 4/10 (unspecified). 44px targets, focus rings, mobile keyboards, ARIA, contrast, reduced-motion now defined so T5 builds accessible. |
| 2026-06-15 | Score credibility disclosure + "Next upgrades" framing + success state | Codex: ground the score so the capture ask survives; reframe public gaps as upgrades; add post-capture "Plan sent — check WhatsApp" success state. |
