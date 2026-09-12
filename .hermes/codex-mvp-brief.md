# Bid House — MVP Implementation Brief

You are building the MVP of **Bid House**, a multiplayer auction-house game, from scratch in this empty repository. Implement the full vertical slice described below. Work in small, complete steps. Do NOT git commit — the orchestrator verifies and commits afterwards.

## Stack (strict)

- **Node.js 20+, TypeScript**, plain `ws` WebSocket server (no socket.io).
- Static frontend: plain HTML + CSS + TS compiled to JS, served by the same Node server. No React/Vue — keep it dependency-light and readable.
- Server-authoritative: ALL game state lives server-side in memory (a single `GameState` object). Clients render state + send intents. No client-side game logic.
- Scripts: `npm run build` (tsc for server + client), `npm start` (runs compiled server), `npm run dev` (tsc watch + node). Add a `npm run smoke` script that starts the server, connects 2 WebSocket bot clients via a small script, has them open boxes, list an item, and place bids, asserts no errors, exits 0.

## MVP Scope (do exactly this, no more)

ONE bid house (no dynamic spawning), 6 characters, 20 abilities, the box → auction → order loop. NO shop, NO gacha UI, NO real-money anything, NO accounts system beyond a name + chosen character at join.

### Data model

- **Item**: `{ id, name, category, tier (1-4), tags[], fake (boolean), history: {owner, price, ts}[] }`. 5 categories × 4 tiers, item names generated from category+tier pools. 2-3 tags per item from a pool of ~12.
- **Fake rates by tier**: 10% / 25% / 50% / 70%.
- **Character**: `{ id, name, passive, mainAbility, traits[2] }`. 6 launch characters, each with 1 main ability + 2 minor traits. Abilities designed against verbs: peek, shield, refund, block, tax, force-appraisal-style reveal, etc. Implement a generic ability effect system; 20 abilities in a registry, characters reference them.
- **Order**: `{ id, template: {tag or category, tierMin, count, fakeAllowed}, reward: {fame, coins, xp}, fulfilledBy? }`. Generated from templates validated against circulating supply. Fulfilling spawns a replacement. ~6 orders live at a time.
- **Auction**: `{ id, itemId, sellerId (hidden from bidders until sold — seller anonymity), bids: {playerId, amount, ts}[], endsAt, featured: boolean }`. Timed English ascending. Anti-snipe: a bid in the last 5s extends endsAt to now+5s.
- **Player**: `{ id, name, characterId, coins, inventory: itemIds[], xp, fame, abilities: cooldown state }`. Everyone starts with a stipend (e.g. 500 coins) + 2 free starter boxes.

### Game rules

1. **Loot boxes**: server endpoint/action `OPEN_BOX` (cost e.g. 100 coins, tiers weighted cheap→rare). Items go to inventory. Authenticity (fake flag) is ONLY sent to the owner in private state; public item views omit it. History is public.
2. **Listing**: `LIST_ITEM {itemId, durationSec}` → creates auction, 5% listing fee deducted at sale. Seller identity hidden in the public auction view.
3. **Bidding**: `BID {auctionId, amount}` → must exceed current highest by ≥5% (or min increment 10 coins). On win: item transfers, coins move seller→buyer minus fee. Authenticity revealed to buyer on acquisition. History entry appended.
4. **Orders**: `FULFILL_ORDER {orderId, itemIds[]}` → validates items match template (tags/tier/fake-allowed), items consumed, rewards granted. First-come = server processes intents in order; mark order fulfilled atomically.
5. **Abilities**: `USE_ABILITY {abilityId, target...}`. Each ability = typed effect on auction/order/player state with a cooldown or per-match use limit. Implement at least these working end-to-end: peek (see an item's fake flag in an auction), bid-shield (your bid can't be exceeded for 10s once), refund (cancel your last bid), tax (winner of targeted auction pays 10% extra to the house), block (block one player from bidding on an auction).
6. **Featured auction**: server promotes the highest-tier live listing once every 15 minutes as featured (announce over WS). MVP uses 15-min seasons-free continuous play; featured is just a flag + broadcast.
7. **Fame ladder**: threshold rewards at fame milestones (500/1500/4000) that grant coin bonuses. Cosmetic only otherwise.

### Wire protocol

JSON messages over one WS connection per player:
- Client→Server: `{type: "JOIN", name, characterId}`, `{type: "OPEN_BOX"}`, `{type: "LIST_ITEM", ...}`, `{type: "BID", ...}`, `{type: "FULFILL_ORDER", ...}`, `{type: "USE_ABILITY", ...}`, `{type: "PING"}`.
- Server→Client: `{type: "WELCOME", playerId, privateState}`, `{type: "STATE", publicState}` (broadcast on every mutation, throttled to 4/s max), `{type: "PRIVATE", ...}` (owner-only info: fake flags of own items, ability results), `{type: "ERROR", message}`.
- Public state must NEVER leak fake flags or seller identity of active auctions.

### Frontend

- Single-page, dark theme, three-panel layout: (left) your inventory + character + coins/xp/fame, (center) live auctions with countdown timers + bid box, (right) public orders board + open box button.
- Reconnect: client reconnects with stored playerId (localStorage) and server re-attaches.
- Countdown timers tick client-side from endsAt; bids/listings/fulfills update via STATE broadcasts.
- Ability bar: buttons for your character's abilities with cooldown display.
- Make it genuinely usable, not a wireframe: clear hierarchy, readable tables/cards, toasts for errors/rewards. No external CSS frameworks, hand-rolled CSS is fine (and preferred).

## Quality bar

- `npm run build` must pass clean (strict TS, no `any` abuse).
- `npm run smoke` must pass (2 bots, full loop: join → open box → list → bid → win → fulfill order if matched → ability use).
- No secrets in code; config via env vars with sane defaults (PORT).
- README.md: how to run, protocol summary, rules summary.

## Verification before you finish

1. Run `npm install`, `npm run build`, `npm run smoke` yourself. Fix until green.
2. `git status` should show all new files, nothing committed.
3. Final message: list files created, any deviations from this brief, and exact output of the smoke test.
