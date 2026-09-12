# Bid House — art-director UI/UX review

Reviewed 2026-09-12. Phase: production UI acceptance review. Scope: written review only; no code, styles, assets, or handoff edits. Contract: [UI_STRUCTURE_SPEC.md](UI_STRUCTURE_SPEC.md). Evidence: all nine supplied PNGs, `src/client/index.html`, `styles.css`, `client.ts`, the asset inventory, SVG source, and `CODEX_HANDOFF.md`. No live interaction, network-load recording, or physical-device testing was performed.

The palette and portrait direction establish a credible midnight auction house. The interaction presentation is less mature: invisible brand artwork, a compromised primary-button state, a selection flow that discards a choice, and missing visual evidence for the main game prevent approval. The screen where players supposedly spend 95% of their time cannot be judged from these captures. Fix readability and navigation before adding ornament.

## Evidence integrity and bug register

**6 BUGs: 5 product defects and 1 capture/QA defect.** Two product defects are visible in screenshots; three are established by source inspection but not replayed. Other recommendations below are design or contract gaps, not additional counted bugs.

| ID | Priority / basis | Evidence and consequence | Correction / acceptance |
|---|---|---|---|
| BUG-01 | P1, screenshot + source | `01` and `08`: logo is black against plum; desktop decorative gavel nearly disappears. `03`: house shield and glyphs are similarly black. SVGs use `currentColor`, but are embedded as external `<img>` documents; parent text color does not supply their internal stroke color. | Render monochrome icons through CSS masks or trusted inline SVG with semantic color. Gold brand/sigils, gem abilities, legible currency icons. Verify useful icons at least 3:1 against their actual surfaces. Counted once as a shared integration defect. |
| BUG-02 | P1, screenshot + source | `09` and duplicate `10`: “Choose bidder” has almost-black text on a plum button, unlike the gold desktop CTA. `button:hover:not(:disabled)` overrides `.primary` background while retaining `#211708` text. Capture is consistent with that state; touch hover persistence itself was not tested. | Give `.primary:hover:not(:disabled)` an explicit gold background and dark foreground; keep pressed/focus states readable. Scope hover embellishment to hover-capable devices. Check all primary buttons, not just character select. |
| BUG-03 | P1, source | `renderCharacters()` replaces the carousel DOM, then the card click handler calls `scrollIntoView()` on the old, detached card. Arrow handlers change selection without scrolling the new selected card. | Scroll the newly rendered selected node, or update selection without rebuilding nodes. Verify arrows, card taps, and swipe selection across all six bidders; displayed card, counter, and confirmed character must agree. |
| BUG-04 | P2, source | Mobile nav sets `padding:max(6px,env(safe-area-inset-bottom)) 8px 6px`: inset is applied above the buttons, leaving only 6px below them. Body reserves a fixed 62px; viewport lacks `viewport-fit=cover`. | Put inset on bottom padding, reserve the resulting nav height in hall content, and configure viewport coverage deliberately. Check a device with a gesture bar; supplied images cannot establish actual overlap. |
| BUG-05 | P1, source | First-deploy confirmation without `pendingHouse` opens the directory. Tapping its deploy action then sets `selectedCharacter=0` and returns to selection. A non-Mara choice is discarded and the choice is requested twice. `03` → `04` is consistent with the return, but does not demonstrate the discarded nonzero choice. | Persist the chosen character through house selection and deploy it there; keep character selection available for deliberate changes. Test a first-time Brick choice end to end. Contract §2. |
| BUG-06 | P1, capture/QA | `04-hall-empty.png` is character select with a house-choice toast. `05-box-reveal.png` and `06-hall-desktop.png` are byte-identical to `02-character-select.png` by SHA-256. `10-hall-mobile.png` is byte-identical to `09-mobile-post-login.png`. | Recapture after asserting the intended screen is visible and populated. Capture empty hall, live/featured hall, each mobile tab, and reveal at box and item phases. This proves missing evidence, not a proven inability to enter the hall. Contract §§6–7. |

## Verdict per screen

### Auth — promising composition, broken brand rendering

`01-auth-desktop.png` (1440×900): the split composition, generous headline, muted prose, slim brass dividers, and dominant gold entrance button deliver §§1–2 well. The system font is appropriate to the contract; replacing it with a webfont would be unnecessary. The black logo and barely visible gavel undermine the precious-brass identity (BUG-01). The right-side noise is more visibly patterned than tactile; reduce its alpha from `.018` toward `.008–.012` and judge at native size. Field labels are only 12px and the empty error slot creates a large password-to-submit gap. Retain inline errors, but tighten surrounding spacing rather than removing their reserved space.

`08-auth-mobile.png` (390×844): the brand block consumes about 380px before the form begins at y≈400. The membership control touches the bottom crop. This is scrollable content, not evidence of an inaccessible or clipped control. Nevertheless, first access spends too much height on advertising. Use a compact mobile brand header and preserve the entrance and registration actions within the initial viewport when the keyboard is closed. §§2, 6.

### Character select — strongest art, weak decision support

`02-character-select.png`: Mara's violet costume, brass fan geometry, and selected gold edge are the clearest expression of the fantasy. The initial half-empty left side is a consequence of centering the first carousel card, not a screenshot misalignment bug. It still makes six-character discovery inefficient: the previous arrow sits far from the card and the count and confirmation are widely separated. Put arrows near the card region and the counter beside confirmation.

Brick appears much smaller within his portrait area than Mara, beyond the intentional `.92` inactive-card scaling. Normalize visible bust scale using per-portrait presentation settings; keep faces and costume silhouettes intact. Inactive cards at `.5` opacity make ability comparisons unnecessarily difficult. Dim their frame/backdrop, retaining copy near full opacity. Names such as “Pocket Change” and “Second Wind” do not explain effects: add one short mechanical sentence for the selected signature and expandable trait descriptions. §§2, 5.3.

`04-hall-empty.png`, `05-box-reveal.png`, and `06-hall-desktop.png` also show this screen; they add no hall/reveal evidence. `09-mobile-post-login.png` shows one readable portrait card, but tiny trait chips and the broken CTA state. BUGs 02, 03, and 05 make selection a release concern rather than a polish task.

### House browser — complete facts, directory-scale hierarchy

`03-house-browser.png`: deployment capacity is pinned above the house and the required fee, prime time, members, heat, live lots, and orders are present (§§2, 3.2). The single card stretches roughly 1324px wide because `auto-fit` expands its track. Facts become three vast strips; there is no natural scanning center. Cap desktop cards around 420px and keep a left-aligned grid with stable widths. Compress the zero-deployment rack into a 64–80px empty-state row.

The black sigil cannot carry house identity (BUG-01). “PRIME 20:00” omits UTC, and “MEMBERS 1” lacks capacity context; show “20:00 UTC” and `1 / capacity`. A 10% heat value fills one whole segment: acceptable quantization, but explain heat as occupancy and retain the numeric value. The first deploy action should be gold, with copy such as “Deploy Mara here” once the prior choice is retained. §§1, 3.2, 5.4.

### Hall — visual acceptance blocked; source suggests excessive fine print

No supplied screenshot shows the hall. The desktop `3 | 6 | 3` grid, bidder summary, ability slots, inventory, featured area, feed, orders, and ledger exist in source (§3.3). This is structural implementation evidence only, not proof of composition, populated wrapping, or readability.

Source concerns: prices have useful tabular numerals, but bid hints, ability labels, member names, and inventory labels fall to 9px. Category filtering exists; tier/tag filtering does not. Bidder count is absent from `bidPanel()`. The XP ring has no displayed level. House-switcher heat uses repeated colored-circle text rather than meaningful live heat indicators. On an empty floor, “Check back when a lot is listed” gives no path to action: offer “Open your first box” or “List an item” according to inventory and funds. §§3.1–3.3.

The large-bid confirmation is a remote toast rather than a confirmation beside the amount; its flag is attached to the input and does not bind approval to the amount. Recommend an inline “Confirm bid of 320 coins” state that resets on value change, showing the remaining balance. Do not infer runtime safety from this review. §3.4.

Authenticity routing is a good source-level decision: inventory ribbon reads private items and appraisal reads `priv.peeked`. However, the visible appraisal seal is identical for fake and authentic outcomes; the result exists in alt text, and no expiry is implemented. Give the peeker an explicit private result in an accessible local detail view and expire the temporary seal. Never introduce public authenticity styling. §4.4. No WS privacy verification was rerun.

### Box reveal — visual acceptance blocked; ceremony incomplete in source

`05` is a character-selection duplicate. Source supplies a dark overlay, 170px basic-box SVG, 210px-wide item reveal, tier glow, rarity text, and a 4.5s dismissal timer (§3.4). There is no separate lid or lid-pop state, and only the Skip button handles dismissal, not the requested click-to-skip interaction. The final CSS override compresses shake and rise timing; the box remains behind the item. Stage explicit anticipation, lid separation, item rise, and resolved state with individual transitions ≤250ms. Use a clear “Continue” once the reward resolves rather than keeping “Skip reveal” throughout. Keep reward information available in inventory after dismissal. No new artwork is required to establish this choreography.

### Mobile — auth and selection only, hall unproven

`08`, `09`, and `10` were all inspected; `10` supplies no bottom-nav or hall evidence. Typography is reasonable for auth body and character names, but selection traits are small. At 390px, the carousel has approximately 278px of track width for a 280px card, leaving almost no framing clearance. Allocate a full-width swipe region with inset arrows outside the art, 16px page gutters, and cards sized to the actual track. §§2, 6.

## Top 10 enhancements, ranked by impact

| Rank | Wrong / missing | Concrete implementation recommendation | Contract |
|---|---|---|---|
| 1 | Main-game evidence is mislabeled; readiness cannot be assessed. | Repair capture preconditions; assert `gameView`/reveal visibility, then capture empty, populated, featured, reveal, and mobile Floor/You/Board states at 1440×900 and 390×844. Include long names and active cooldowns. Resolve failures before visual sign-off. | §§6–7; BUG-06 |
| 2 | Branding and functional SVGs disappear into dark surfaces. | Use masks/inline SVG for `currentColor`; apply `--gold-bright` to brand, specialty tint to sigils, `--gem` to abilities, readable semantic colors to wallet icons. Check all icon contexts at 3:1 or better. | §§1, 5.1, 5.4; BUG-01 |
| 3 | Primary CTA becomes unreadable in its alternate state. | Explicit gold hover/pressed backgrounds, dark ink, 2px visible focus outline with 2px offset; 44–48px minimum height. Verify normal, hover, focus, pressed, disabled on every `.primary`. | §§1–2, 6; BUG-02 |
| 4 | Character choice is repeated/lost and navigation can select off-screen cards. | Preserve chosen character through directory; label deployment with that name. Update selected-node scrolling after render and synchronize swipe, counter, and confirmation. Put concise ability effects beneath the selected portrait. | §2; BUGs 03, 05 |
| 5 | Mobile chrome and controls are too cramped or hidden. | Reserve nav height plus bottom inset; use 48px tab targets and 44px minimum secondary targets, 8px action gaps. Keep season urgency reachable and offer account/logout in a compact menu. Reflow lot metadata to 14px and body copy to 16px. | §§3.1–3.3, 6; BUG-04 |
| 6 | The floor lacks a complete decision hierarchy. | Make item/name → current bid/time → bid action the reading order. Keep price 24–28px desktop/22px mobile, hints ≥12px desktop/14px mobile; add bidder count, visible level, tier/tag filters, inline amount-specific confirmation, and contextual empty-state actions. | §§3.3–3.4 |
| 7 | Broad cards and inconsistent portrait/art framing waste the art budget. | Cap house cards near 420px; normalize portrait bust scale per asset. Fit item art with `contain` inside stable 4:5 frames, use supplied tier borders with noninteractive overlays, preserve gold trim for T4. | §§3.2–3.3, 5.2–5.5 |
| 8 | State changes have disconnected or missing feedback. | Wire 150ms price rise, gold pulse on both regular/featured lots, ≤250ms anti-snipe ring flash and chip, gem activation plus target line, and winner-specific settlement trail. Trigger on state deltas, not whole-feed remounts. | §4 |
| 9 | Reward reveal lacks a clear opening and resolution. | Separate box shake, lid-pop, and item rise into ≤250ms beats; fade box before art resolves; expose rarity/name and a 44px Continue action. Skip resolves immediately; reduced motion shows final item directly. | §§3.4, 4 |
| 10 | Mobile entrance prioritizes branding over entry. | Reduce brand block to roughly 220–250px with 28–32px headline and one short sentence; retain 20px outer form gutters, 44–48px fields/actions, 14px labels, and visible login/registration actions at 390×844 without keyboard. | §§1–2, 6 |

## Mobile-specific issues and acceptance checks

- **Touch targets:** global buttons start at 44px, but filters override to 28px, contextual abilities 29px, order actions 35px, bid buttons 38px, and modal close 34px. Mobile arrows occupy only 30px-wide tracks. Raise hit areas without shrinking readable content. These are source measurements, not observed hall screenshots.
- **Bottom navigation:** Floor/You/Board and a selected gold rule exist, but no tab status indicates a matching order or newly acquired inventory. Add a restrained count/dot with accessible text; do not duplicate the full board in the Floor. Persist selected panel and expose selected state semantically. Check BUG-04 on an inset device.
- **Information at 390px:** the 76px art column, 8px gap, and stacked bid controls are a sensible starting point. Long names, tier badges, price and countdown still compete in the remaining width; let the title span its row and wrap contextual actions. Four inventory columns need readable detail on tap, not 9px labels as the only identification.
- **Hidden information:** season is removed below 1050px and logout below 720px, with no alternative account action in the source. Keep a compact season/urgency summary and an account menu. Avoid stuffing them into an already crowded wallet row.
- **Forms and focus:** 15px input text merits an iOS focus-zoom check; use 16px inputs. The custom reveal/season overlays declare dialog roles but have no explicit focus management; verify focus entry, background inertness, and return focus. Native dialogs and custom overlays need separate keyboard checks.
- **Required recapture:** all three hall panels, modal with long content, keyboard open, lowest supported width, landscape, nonzero bottom inset, and large wallet values. Other phone resolutions, physical six-inch readability, and localization expansion remain untested; no mobile pass is claimed.

## Motion / juice audit

Static captures cannot demonstrate animation quality. The following is an implementation audit against §4, not a claim that animations were watched.

| Moment | Source evidence / gap | Direction |
|---|---|---|
| Auth glint | Keyframes exist, but final override makes the nominal repeating glint a single 250ms cycle; black gavel further suppresses it. | Correct icon color first; use a brief glint on entrance, optionally spaced by a long idle delay with each active beat ≤250ms. |
| Countdown | SVG rings tick each second and turn urgent; progress assumes a fixed 60s duration. | Use actual lot duration for progress semantics; verify 30s listings and extensions. |
| Bid | `.flip` keyframes exist but no code adds that class. Pulse styling targets `.auction-card`, excluding `.featured-hero`. | Apply/removal on confirmed bid deltas to both card types; preserve typed input and focus across state updates. |
| Anti-snipe | Floating `+5s` is wired; ring flash is absent. | Flash ring and float the chip together in ≤250ms. |
| Settle | Removed lots trigger a gavel/vignette; no explicit winner/price toast trail is constructed here. | Resolve winner-specific copy such as “You won Vintage Orb for 320” from authoritative outcome data. |
| Ability | No gem-flash/target-line animation is wired. | Animate activation only after accepted use, and make the target evident even under reduced motion. |
| Featured | Entrance/shimmer exists, but `renderAuctions()` rewrites the hero on renders. | Animate on featured identity change only; do not restart ceremony during ordinary updates. Add restrained frame pulse. |
| Cooldown | Conic mask is rendered from current time, but `tick()` does not update abilities or redeploy cooldowns; deployment loop is empty. | Tick remaining text/mask and expiry state locally; verify without incoming state traffic. |
| Reveal | Shake/rise exist, lid pop absent; 250ms override replaces intended sequencing. | Explicit staged classes, no blanket duration override; reduced motion resolves directly. |
| Season | Overlay auto-hides after 5s regardless of actual phase. | Keep the non-dismissable result until the authoritative new-season transition; show accurate countdown and final results. §2 as well as §4. |

Reduced-motion CSS exists and is valuable, but JS requests smooth scrolling explicitly; honor the preference there too. Success toasts use green borders although §3.4 asks for gold. Reserve red for errors and use gold success treatment consistently.

## Asset usage audit — all 71 art files accounted for

Inventory is **26 PNG + 45 SVG = 71 art files**, plus `manifest.json` (72 filesystem files total). **58 art files are statically or dynamically wired; 13 are not referenced.** “Wired” means the client can emit a URL for the file. It does not prove a network request or visible presentation during this session. There is no blanket preload of all assets in the inspected client. The six portraits are emitted together when character cards render; other families depend on game state.

| Files under `client-assets/` | Count | Reference / presentation status |
|---|---:|---|
| `characters/mara.png`, `brick.png`, `june.png`, `rex.png`, `nia.png`, `sol.png` | 6 | Dynamic `characters/${id}.png` in carousel, identity, deployments, ledger and player targets. Mara/Brick and a June sliver are visible in desktop evidence; only Mara on mobile. Visible bust scale inconsistent; opacity suppresses inactive art. Hall avatar crops unverified. |
| `items/art-art-1.png`, `art-art-2.png`, `art-art-3.png`, `art-art-4.png` | 4 | `art(category,tier)` used by inventory and shared item frames. Wired, not visible in supplied captures. |
| `items/art-relic-1.png`, `art-relic-2.png`, `art-relic-3.png`, `art-relic-4.png` | 4 | Same dynamic path and status. |
| `items/art-tech-1.png`, `art-tech-2.png`, `art-tech-3.png`, `art-tech-4.png` | 4 | Same dynamic path and status. |
| `items/art-fashion-1.png`, `art-fashion-2.png`, `art-fashion-3.png`, `art-fashion-4.png` | 4 | Same dynamic path and status. |
| `items/art-oddity-1.png`, `art-oddity-2.png`, `art-oddity-3.png`, `art-oddity-4.png` | 4 | Same dynamic path and status. All 20 item images face `object-fit:cover` in constrained frames; cropping is a presentation risk, not screenshot-confirmed loss. |
| `sigils/sigil-base.svg` | 1 | `sigil()`; visibly black in `03` despite specialty parent color. BUG-01. |
| `sigils/glyph-anchor.svg`, `glyph-book.svg`, `glyph-coin.svg`, `glyph-comet.svg`, `glyph-crown.svg`, `glyph-flame.svg`, `glyph-gavel.svg`, `glyph-gem.svg`, `glyph-key.svg`, `glyph-mask.svg`, `glyph-moon.svg`, `glyph-star.svg` | 12 | Hash chooses two names from this exact list. All reachable; not all loaded by one house. Composed with base in `<img>` layers; tint inheritance broken. |
| `icons/logo.svg` | 1 | Favicon, topbar and auth. Visible but poorly presented on dark auth surface. |
| `icons/gavel.svg` | 1 | Auth glint, season and settle. Visible but nearly lost in `01`; other contexts unverified. |
| `icons/coin.svg`, `fame.svg`, `xp.svg` | 3 | Static wallet plus dynamic order rewards. Wired; external-currentColor rendering risk on dark panels. |
| `icons/box-basic.svg` | 1 | Open Box and reveal box. Wired in HTML; neither use visible in captures. |
| `icons/order.svg`, `featured.svg`, `skull.svg` | 3 | Board heading, featured badge, fake-allowed order requirement. Wired; hall appearance unverified. A black icon on the gold featured badge may be appropriate, so apply semantic context rather than recoloring every icon identically. |
| `icons/peek.svg`, `shield.svg`, `refund.svg`, `tax.svg`, `block.svg`, `appraise.svg`, `coin-ability.svg`, `cooldown.svg` | 8 | Dynamic ability kind mapping; `reveal → appraise`, `coin → coin-ability`. All eight supported kinds route to assets. 25px ability icons / 15px contextual icons; dark-stroke integration risk. |
| `frames/ribbon-fake-owner.svg`, `seal-appraised.svg` | 2 | Private inventory and private appraisal respectively. Wired conditionally; 38px ribbon and 58px seal. Appearance unverified; seal lacks a rendered visible result distinction/expiry. |
| `frames/t1.svg`, `t2.svg`, `t3.svg`, `t4.svg` | 4 | **Not wired.** Tier treatment is CSS borders/clip-path instead; T4 inventory has an inset gold shadow, while common item frames omit equivalent authored tier-frame treatment. |
| `icons/heat-1.svg`, `heat-2.svg`, `heat-3.svg`, `heat-4.svg`, `heat-5.svg` | 5 | **Not wired.** `heatMeter()` creates five CSS `<i>` bars. This can satisfy §3.2; unused alternatives are not automatically defects. |
| `icons/box-fine.svg`, `timer.svg`, `bid.svg`, `list.svg` | 4 | **Not wired.** Basic box only; countdown uses inline SVG; Bid/List are text buttons. Do not add decorative icons merely to exhaust the manifest. Wire fine box only if a corresponding product action exists. |
| `manifest.json` | — | Pipeline metadata, not referenced by runtime UI; excluded from art totals. |

**Reconciliation:** icons 17 wired / 9 unused; frames 2 wired / 4 unused; sigils 13 wired; PNGs 26 wired. Total: **58 wired + 13 unwired = 71**. No observed runtime-load count is asserted.

Asset craft acceptance is separate from wiring: this review does not re-certify alpha cleanup, dimensions, or all 26 PNGs at native resolution. The handoff reports prior asset verification; it does not substitute for populated screen inspection. No raster art was created or edited.

## Quick wins versus structural work

**Fix in about an hour each** (estimates, not a combined one-hour promise): correct primary hover contrast; add UTC and member-capacity copy; change success-toast accent to gold; scope minimum mobile target sizes; shorten mobile auth branding; cap sparse house-card widths; increase inactive-card text opacity; wire the existing bid-flip class and featured pulse selector. Each still needs focused visual checking.

**Needs a redesign or coordinated implementation pass:** selection/deployment state and carousel navigation; semantic SVG integration across contexts; populated hall hierarchy and input-preserving updates; device-safe mobile chrome and tab flows; portrait/item framing across the entire asset family; reward/settlement/ability choreography; private appraisal result presentation and expiry. Repair the screenshot harness as a dedicated QA task before these surfaces receive art sign-off.

## Review score and remaining evidence

Provisional expert judgments, not usability measurements: readability **5/10**, UX **4/10**, accessibility **4/10**. Commercial and retention scores are **not assessed** without the core loop; first-30-second continuation confidence is low because of repeated selection and weak ability explanations. Google Play risk is **not assessed** for this web-client review; no store-rating probability can be supported here.

Priority: P0 none proven by supplied evidence; P1 icon/CTA readability, selection navigation, and missing core-loop captures; P2 mobile target/safe-area and information access; P3 art framing/texture consistency; P4 ceremony after functional feedback is readable. Build/smoke/asset checks were not rerun because no implementation changed. Existing handoff remains untouched to honor document-only scope. Acceptance remains open for live hall, reveal, mobile tabs, interaction timing, focus, physical-device readability, and privacy payloads.


