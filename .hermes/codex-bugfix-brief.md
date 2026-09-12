# Bid House — Bug-Fix Brief: art-director review BUG-01..06

`docs/UI_REVIEW.md` (read it — the bug table is authoritative) found 5 product defects + 1 QA-harness defect. Fix all of them, nothing else. Do not refactor unrelated code, do not redesign, do not touch game logic.

## BUG-01 (P1) — SVG icons render black
Monochrome SVGs under `client-assets/icons/` use `currentColor`, but they're loaded as external `<img>` documents so parent text color never reaches them. Result: logo, house sigils, currency/ability icons are black-on-plum (near invisible).
Fix: render these icons via CSS `mask` (`mask-image: url(...)`, `mask-repeat: no-repeat`, currentColor as background) or inline the SVGs where they're used. Brand/sigil/gem/currency icons must read as gold/gem colors with ≥3:1 contrast against their surfaces. Verify every icon instance (logo, house cards, ability slots, currency displays, nav).

## BUG-02 (P1) — primary-button hover unreadable
`button:hover:not(:disabled)` overrides `.primary`'s background while keeping `#211708` text → dark-on-dark. Fix: give `.primary:hover:not(:disabled)` (and pressed/focus) explicit gold background + dark foreground; scope generic hover embellishment to hover-capable devices (`@media (hover: hover)`). Audit ALL primary buttons, not just character select.

## BUG-03 (P1) — character carousel discards selection
`renderCharacters()` rebuilds the carousel DOM; the card-click handler then calls `scrollIntoView()` on the OLD detached node. Arrow handlers change selection without scrolling the new card into view. Fix: scroll the newly rendered selected node (or update selection without rebuilding), so card taps, arrows, and swipe all keep displayed card + counter + `selectedCharacter` in sync. All six bidders must be reachable and confirmable by every input method.

## BUG-04 (P2) — mobile safe-area inset applied above nav buttons
`padding: max(6px, env(safe-area-inset-bottom)) 8px 6px` puts the inset on TOP of the buttons; body reserves a fixed 62px; viewport lacks `viewport-fit=cover`. Fix: inset belongs on the bottom padding; reserve the resulting nav height in hall content so nothing is covered; add `viewport-fit=cover` to the meta viewport tag in index.html.

## BUG-05 (P1) — first-deploy flow discards non-Mara choice
Without `pendingHouse`, first-deploy confirmation opens the directory; tapping deploy there then resets `selectedCharacter=0` and returns to selection — the player's choice is discarded and selection demanded twice. Fix: carry the chosen character through house selection so the first deploy action reads "Deploy <name> here" and deploys that character; keep character change available only as a deliberate action.

## BUG-06 (P1, QA harness) — screenshots capture wrong screens
`qa-shots.mjs` saved character-select bytes as hall/reveal/mobile-hall shots. Fix the harness: after every navigation action, assert the intended screen is visible (check the target container lacks `hidden` / has `offsetParent`) before screenshotting; log and stop the affected branch if not. Also add: an assertion that hall screenshot contains at least one populated region (bid panel / inventory / feed text) so empty-state captures are labeled as such. Re-run `node qa-shots.mjs` against the local dev server (`npm run dev` or serve `dist/client` via the built server) and confirm the new shots differ from character select.

## Acceptance
- `npm run build`, `npm run smoke`, `npm run verify-assets` all pass.
- No changes to WS protocol, game rules, or persistence.
- Re-run the fixed `qa-shots.mjs`; confirm 09/10 (mobile hall) and 06 (desktop hall) are genuinely the auction layout.
- Do NOT git commit.

Final message: one line per bug — fixed / not-fixed + evidence.
