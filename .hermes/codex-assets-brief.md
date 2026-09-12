# Bid House — Run A Brief: Full Asset Generation

You are generating the complete visual asset set for Bid House per the design contract in `docs/UI_STRUCTURE_SPEC.md` (read §1 and §5 first — they are normative). This run is ASSETS ONLY: produce the files + a verification manifest. Do not touch game code, server code, or styles. Do NOT git commit.

## Track 1 — SVG icons and frames (`client-assets/`)

Create every file in §5.1, §5.4 (base + glyphs), §5.5, plus §5.1's `logo.svg`:
- 24×24 viewBox, stroke 1.5px, `currentColor`, clean bezier icons, consistent stroke geometry across the set.
- Tier frames `t1..t4.svg`: 4:5 card borders using the tier colors in §1 (T4 gets a subtle repeating gold-dash pattern — pure SVG, no scripts).
- `sigil-base.svg` shield + `glyph-*.svg` ×12 simple heraldic symbols (gavel, gem, coin, star, mask, key, flame, book, crown, anchor, moon, comet) that the client can compose.
- `ribbon-fake-owner.svg` corner ribbon; `seal-appraised.svg` wax-seal style.
- Files must be valid standalone SVG (open without JS).

## Track 2 — imagegen PNGs (`client-assets/items/` and `client-assets/characters/`)

Use the Codex imagegen skill. For every image:
- Flat solid **magenta `#FF00FF` background** (no gradients, no vignette on the bg).
- Then **chroma-key to alpha**: remove pixels near magenta. **Preserve authored RGB** for the rest — do NOT whiten or tone-correct. 
- Verify per file: correct dimensions, >10% non-transparent coverage, residual magenta ≈ 0, color spread > 30, object fully inside frame with margin.

Specs:
- **Items** — 20 files `art-{category}-{tier}.png` (categories: art, relic, tech, fashion, oddity; tiers 1–4), 256×256. Painterly still-life of an object befitting the category+tier, on dark velvet, dramatic single light source; T3+ gem-like rim light, T4 gold-leaf accents. No text, no hands, no watermark.
- **Characters** — 6 busts 512×512: `mara.png` (violet), `brick.png` (rust), `june.png` (jade), `rex.png` (gold), `nia.png` (black-silver), `sol.png` (azure). Waist-up noir auction-house bidders, art-deco backdrop hints, confident poses, period attire. No text.

## Deliverables

1. All asset files under `client-assets/`.
2. `client-assets/manifest.json` — array of `{file, track, dims, alphaCoverage, magentaResidual, colorSpread, ok}` for every file; all `ok: true`.
3. A `scripts/verify-assets.mjs` that re-checks the manifest against the files on disk (re-runnable). Wire `npm run verify-assets`.
4. Final message: counts per track, any generation failures + retries, and the manifest summary.

## Constraints

- No new runtime dependencies (sharp/pureimage only if already present; otherwise use PNG parsing via zlib or a tiny local script — check package.json first).
- `npm run build` and `npm run smoke` must stay green (don't break anything).
- If an imagegen call fails repeatedly, reduce to 5 retry batches and note it in the handoff; never ship a placeholder file — leave it missing and flag it instead.
- Do NOT git commit.
