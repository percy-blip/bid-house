# Bid House — UI/UX Review Task (art-director pass, NO code changes)

You are reviewing the Bid House web client as a senior game UI art director. Produce a written review document only — do NOT modify any game code, styles, or assets.

## Inputs to study

1. `docs/UI_STRUCTURE_SPEC.md` — the design contract this UI was built against.
2. `qa-shots/*.png` — real screenshots: 01 auth desktop, 02 character select, 03 house browser, 04 empty hall, 05 box reveal, 06 hall desktop, 08 auth mobile, 09 mobile post-login, 10 hall mobile. Study every one.
3. `src/client/index.html`, `src/client/styles.css`, `src/client/client.ts` — the actual implementation (read as needed to confirm what the screenshots show).

## What to write

Create `docs/UI_REVIEW.md` with:

1. **Verdict per screen** (auth, character select, house browser, hall, box reveal, mobile) — what works, what breaks the noir-gold fantasy, with reference to the spec sections.
2. **Top 10 enhancements** ranked by impact, each with: what's wrong / missing, concrete recommendation (specific enough for a coder to implement: layout, sizing, color, motion, copy), and spec reference.
3. **Mobile-specific issues** — touch targets, bottom nav, safe areas, information density at 390px.
4. **Motion/juice gaps** — where the game feels static despite the motion spec.
5. **Asset usage audit** — which of the 71 `client-assets/` files are actually referenced by the client, which are loaded but poorly presented, which aren't wired at all.
6. **Quick wins vs structural** — separate "fix in an hour" from "needs a redesign pass".

Be specific and critical; praise only what's genuinely good. If a screenshot reveals an actual bug (misalignment, clipping, unreadable contrast), flag it as BUG with the evidence.

Do NOT git commit. Final message: the 10 enhancements in one line each + bug count.
