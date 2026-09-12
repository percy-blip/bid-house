# Bid House — Run B Brief: UI Overhaul to the Noir-Gold Contract

You are restyling and restructuring the Bid House client to satisfy `docs/UI_STRUCTURE_SPEC.md` — read it fully first; §1–4 are normative. All assets already exist under `client-assets/` (served at `/client-assets/...`, verified by `npm run verify-assets`). Game logic and protocol stay EXACTLY as-is — client-only changes (index.html, styles.css, client.ts) plus smoke-test WS-frame assertions if needed. Do NOT git commit.

## Hard requirements

1. **Design system (§1):** exact CSS custom properties from the spec (bg-deep/panel/raised, ink, gold, gem, tier colors). 8px card radius, gold hairline borders, tabular numerals for prices/timers. Subtle CSS noise texture on body. No webfonts.
2. **Screens (§2):** Auth (split brand panel + form card) → CharacterSelect (carousel of 6, using `client-assets/characters/*.png`) → HouseBrowser (§3.2 cards: sigil, specialty chip, fee, prime hour, members, heat meter, live counts; deployments pinned on top with cooldown timers) → AuctionHall (§3.3) + SeasonEndOverlay.
3. **AuctionHall layout (§3.3):** 12-col grid `3|6|3`:
   - Left: character card (portrait, xp ring, passive, cooldown timer), ability bar (icons from `client-assets/icons/`, conic cooldown sweep, uses pips), inventory grid (item tiles with tier frames `t1–t4`, category art from `client-assets/items/art-{category}-{tier}.png`, tag chips), Open Box button with `box-basic.svg`/`box-fine.svg`.
   - Center: featured hero slot (pulsing gold border, `featured.svg` badge, countdown ring) + live auction feed cards (item art, tier frame, current bid flip animation, min-bid hint, countdown ring going red <30s, bid input, contextual ability buttons per auction).
   - Right: orders board (`order.svg` header, requirement chips, `skull.svg` when fakes allowed, reward row, Fulfill enabled on match) + house ledger (fee, specialty, heat, members with character portrait chips + rookie 🌱).
4. **Top bar (§3.1):** house switcher dropdown, season countdown (gold <24h, red <1h), coins/fame/xp with currency icons, logout.
5. **Motion (§4):** countdown rings via SVG stroke-dashoffset, bid pulse, anti-snipe "+5s" chip, gavel-slam settle vignette (gavel.svg), featured shimmer, all ≤250ms ease-out, `prefers-reduced-motion` respected.
6. **Privacy (§4.4 — critical):** fake ribbons (`ribbon-fake-owner.svg`) render ONLY from private state for own items; appraised seal (`seal-appraised.svg`) only for the peeker's own peek results. NEVER derive authenticity from public auction payloads.
7. **House sigils:** compose at runtime from `sigil-base.svg` + `glyph-*.svg` chosen deterministically from house name hash + specialty tint.
8. **Modals:** BoxRevealOverlay (shake → pop → item rises with tier glow), AbilityTargetModal, toasts top-right 4s.

## Engineering constraints

- Keep it dependency-free: no npm installs, no frameworks. Vanilla TS + CSS.
- Keep the client a single compiled bundle (`tsc` outputs `dist/client/`); assets referenced by URL.
- `npm run build` strict-clean. Extend `npm run smoke` minimally: assert (a) index.html references the new CSS/JS, (b) WS public auction frames contain no `fake` field or seller name (privacy regression guard — log a PASS/FAIL line).
- Responsive: ≤720px collapses to single column with bottom tab nav (Floor / You / Board). This may be basic but must be usable.
- Do NOT change server protocol or game logic. If the client needs a field that doesn't exist, note it in the handoff instead of hacking the server.

## Final message

Files changed, screen-by-screen notes, any spec deviations, exact smoke output, and remaining manual-QA items.
