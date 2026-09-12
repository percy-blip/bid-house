# Brief: Bid House — Run C: Five-Tab Client Overhaul (BUILD)

Builder model: implement the five-tab client UI per `docs/TAB_DESIGN.md`, on top of the Run S server foundation (already merged — read `src/shared/types.ts` and `src/server/server.ts` for the new contracts: CONFIG, PULL_BIDDER, RECALL, MEMBER_ORDERS, MARKET_SUMMARY, MARKET_HISTORY, per-bidder xp/levels, roster). Owner decisions locked: 1A 2A 3B 4A 5B 6B 7A 8B. K3 spec decisions in `.hermes/codex-run-s-brief.md` (gacha 150, level curve 100*L cap 20, cooldown -2%/level, recall always allowed + 24h redeploy lock, box auto-buy 100).

## What to build

Replace the single-hall client with five top-level destinations (vanilla TS, hand-rolled CSS, strict TS, noir art-deco per `docs/UI_STRUCTURE_SPEC.md`). No new dependencies. Keep the WS connection + auth model.

1. **Bidder tab**: your roster — owned characters (portraits) and deployments. Per TAB_DESIGN §3.1: deployments list (portrait, house, per-bidder XP + LEVEL from deployment xp, equipped abilities with cooldown/uses, status), available-bidders grid (characters in roster not currently deployed), PULL_BIDDER button (150 coins, disabled when all owned), character detail. New accounts: first-pick flow lands here. XP shown per bidder with level; label "Season N".
2. **Inventory tab**: §3.2 — search + category/tier/tag filters, boxes strip with Open/Buy&open (100 coins), item grid with owner-only fake ribbon, item detail (List item with house selector among deployed houses, Find matching orders → links to Order tab, View market record → template in Market record tab).
3. **Order tab**: §3.3 — scope line "Orders from your deployed houses", house filter, Can-fulfill filter using private inventory matching, cards with requirement chips ("Genuine required"/"Fakes accepted"), reward coins/fame/XP (XP shows penalty-aware value), fulfillment sheet with exact-count item selection, server-confirmed result.
4. **Market record tab**: §3.4 — "Settled auction prices · Season N", template table (art, name, category, tier, average final price, sale count, last price), template detail with paginated anonymous sale rows. Zero-sales templates visible with "No sales this season". Current-season only (server guarantees).
5. **Trade house tab**: §3.5 — directory of all houses (summaries: name, specialty, fee, prime hour, member count, heat, live counts). Houses where you have a bidder: enter → the existing hall floor (3|6|3 at desktop, stacked at mobile — reuse current hall rendering). Houses without your bidder: locked, internals hidden. Per deployment: Move (redeploy, blocked with countdown while penalty active) and **Recall** (confirm dialog; after recall, character returns to Bidder tab idle, redeploy locked until penalty expires).

## Navigation (TAB_DESIGN §2)

- Desktop: top nav bar, five links, active state, browser-history friendly (hash routing is fine).
- Mobile (≤600px): persistent 5-item BOTTOM navigation, icon + label (two-line labels allowed), 48px touch height, safe-area inset BELOW buttons.
- Global chrome: coins + connection first, compact season indicator.
- Server pushes must NEVER force tab navigation; preserve per-tab scroll/filters/unsubmitted inputs across frames.
- Auth screens unchanged in behavior; after first-pick → Bidder tab (not house browser). Returning accounts: open Trade house tab at their last house floor.

## Hard requirements

- Strict TS compile clean; `npm run build` passes; `npm run smoke` passes (server untouched except if a contract bug is found — report, don't silently change server semantics).
- Update `qa-shots.mjs`: add assertions + screenshots for all five tabs (desktop 1440×900 + mobile 390×844), empty and populated states where feasible. Run it headless; report zero JS errors, no broken images, no horizontal overflow.
- Reuse existing assets; no asset production. No new frameworks.
- Report: files changed, per-tab notes, qa output, any server contract issues discovered.
