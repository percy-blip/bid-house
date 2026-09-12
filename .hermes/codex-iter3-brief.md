# Bid House — Iteration 3 Brief: Dynamic Multi-House World

You are extending Bid House (Node 20 + TypeScript, plain `ws`, server-authoritative, strict TS, file persistence, accounts, seasons — all already working). Read the current code first. Implement dynamic bid houses as described below. Do NOT git commit — the orchestrator verifies and commits afterwards.

## Current architecture (summary)

Single global market: players, items, auctions, orders all in one GameState. Accounts exist (register/login, AUTH then JOIN over WS). Seasons reset everything. Persistence: debounced JSON snapshot under DATA_DIR.

## Target architecture

`GameState` becomes global (players, items, accounts, season) + `houses: Map<houseId, HouseState>`. Each HouseState owns its own auctions, orders, featured scheduling, fee rate, specialty tag, prime-time hour, and member deployments. Coins/inventory/xp/fame are **global per player** (one wallet, one collection); auctions and orders are **house-local**; season is **global** and resets all houses.

## House lifecycle

- House 1 exists from boot (name it e.g. "Grand Exchange"). Config: `{name, specialtyTag (one of TAGS or null), feeRate (0.03–0.12), primeHour (0–23 UTC)}`.
- **Spawning**: when a house has ≥ `HOUSE_CAP` deployed players (env, default 8) AND receives a new listing while at cap, spawn a new house. New house: generated name (adjective + noun, e.g. "Velvet Harbor"), random specialtyTag/feeRate/primeHour. Minimum 1 house always.
- House properties are public and immutable.
- Houses never despawn in this iteration.

## Deployments (character ↔ house binding)

- A player **deploys a character to a house** to participate there (`{type:"DEPLOY", houseId, characterId}`): requires the character not already deployed to that same house; a player MAY deploy different characters to different houses simultaneously (up to `MAX_DEPLOYS` = 3, env-overridable).
- **Redeploy** = moving a character from house A to house B: allowed anytime but sets a **24h cooldown on that character** during which it earns no xp and its abilities are unavailable (store `redeployCooldownUntil` on the deployment).
- While in a house you can: list items (pinned to that house), bid (on that house's auctions), fulfill that house's orders, use abilities. Cross-house: your items/wallet are shared, but an item listed in house A is only auctionable/visible there.
- `JOIN` flow after AUTH: if the account has no deployments, client must DEPLOY first (pick house from the public house list + pick character). UI: house browser screen.
- Deployments are public state (house → members with characterId + xp), but NOT coins/inventory (those stay private).

## Featured auctions (per house)

- Each house schedules its featured auction every `FEATURED_INTERVAL_MINUTES` (env, default 30) anchored to its primeHour when possible.
- At the tick: pick the highest-tier live listing in that house (tiebreak: highest listing fee paid, then earliest listing) → mark featured, broadcast `FEATURED {houseId, auctionId}` to that house's members. Featured flag expires when the auction settles.
- Featured wins grant the winner +25% bonus fame (applies on settle).

## Order generation per house

- Each house keeps ~6 live orders, generated as today BUT: 50% of a house's orders incorporate its specialtyTag (tag-matching), rest random. Reward scaling unchanged.
- Fulfilling consumes items from the player's global inventory; order is house-local.

## Economy rules that change

- **Listing fee is per-house**: `feeRate` of the house applies (replace the global 5%).
- Season end resets all houses (clear auctions/orders/deployments? — NO: keep deployments across seasons, just clear house auctions/orders and regenerate; players keep their house memberships, characters redeploy fresh with no cooldown).

## Public state shape

`publicState.houses`: `[{id, name, specialtyTag, feeRate, primeHour, memberCount, heat, liveAuctions, liveOrders}]` where `heat = memberCount / HOUSE_CAP` (1 decimal). Full per-house detail (auctions, orders, members) only for the house the requesting player is deployed to — simplest correct approach: `STATE` message includes the full house state for the player's **current house** (client sends `{type:"ENTER_HOUSE", houseId}` to switch which house's detail it receives; membership required).
Privacy invariants unchanged: no fake flags in public items, seller identity hidden on live auctions, coins/inventory private.

## Client UI

- **House browser** (before/at any time via top bar): cards for each house showing name, specialty, fee, prime hour, member count, heat meter; "Deploy" button (opens character picker) if you have deploy slots; your deployments shown with cooldown timers.
- **In-house view**: current three-panel layout, but scoped to the active house; house name + fee in the header; featured auction visually distinct (badge + highlight).
- **House switcher**: switch active house among your deployments (instant, no cooldown — cooldown only applies to moving a character).
- Season countdown stays global in the header.

## Protocol changes

- Client→Server: `{type:"DEPLOY", houseId, characterId}`, `{type:"REDEPLOY", characterId, toHouseId}`, `{type:"ENTER_HOUSE", houseId}`, plus existing game actions now implicitly target the player's current house.
- Server→Client: `HOUSE_LIST` on request or on change; `STATE` now carries `currentHouse` detail + global `houses` summary; `FEATURED` broadcast; `ERROR` unchanged.
- Keep AUTH+JOIN and all existing messages working (join → if no deployments, server replies with an error message telling client to DEPLOY first; client shows house browser).

## Quality bar

- `npm run build` clean strict TS.
- **Extend `npm run smoke`**: (a) boot → house 1 exists; (b) register user, deploy character to house 1; (c) set HOUSE_CAP=1 via env in the smoke harness → list an item → new house spawns; (d) deploy second character to house 2 (different house, allowed); (e) redeploy a character → 24h cooldown set, abilities blocked during cooldown; (f) featured tick promotes an auction and featured win pays +25% fame; (g) house-local orders include specialty tag bias; (h) season end → houses kept, auctions/orders regenerated, deployments kept, cooldowns cleared; (i) persistence round-trip preserves houses + deployments.
- README: update protocol + env vars (HOUSE_CAP, MAX_DEPLOYS, FEATURED_INTERVAL_MINUTES).
- No new runtime dependencies. Do NOT commit.

## Constraints

- Don't break accounts/seasons/persistence. Keep seller anonymity + fake-flag privacy invariants.
- The smoke test must run in well under 60s: use short FEATURED_INTERVAL_MINUTES and direct method calls where waiting isn't the point.
- Final message: files changed, design decisions made, exact smoke output, any deviations.
