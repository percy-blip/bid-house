# Brief: Bid House — 5-Tab Information Architecture Design Pass (THINK ONLY, NO CODE)

You are the senior game-UX architect. Produce a design/thinking document. DO NOT write or modify any application code, CSS, or assets. Output ONE markdown file: `docs/TAB_DESIGN.md`.

## Context

Bid House is a multiplayer auction-house bluffing game. Stack: strict TypeScript, hand-rolled Node `ws` server (server-authoritative), vanilla TS client, hand-rolled CSS, noir art-deco UI. Current UI is a single "hall" screen: 3|6|3 grid (identity/inventory | live auctions+orders | feed/abilities), plus auth, character-select, and house-browser screens. Full current UI contract: `docs/UI_STRUCTURE_SPEC.md`. Prior art-director review: `docs/UI_REVIEW.md` (enhancement list — treat as backlog, not blockers).

Core game model (server, `src/server/game.ts`, read for ground truth):
- Account → one Player (coins, xp, fame, inventory of Items, boxes, abilities per character).
- Player deploys characters (bidders) into Trade Houses (max concurrent deployments per player). Being deployed to a house = membership; you can only SEE a house's live auctions/orders/members if you have a bidder inside (peek privacy is a core pillar).
- Houses spawn dynamically when full; each has fee rate, specialty tag, prime hour, featured auction rotation.
- Items: looted from boxes, tiers 1–4, real/fake flag (fake known only to owner until appraisal/reveal). Auctions are the ONLY transfer mechanism. Seller identity hidden from bidders.
- Abilities: ~20 persistent per-character abilities (peek, reveal, shield, refund, tax, block, coin, haste).
- Seasons: hard reset (coins/xp/fame/inventory reset; houses+deployments persist).
- Existing privacy rules: public STATE frame must never leak `fake` or `sellerId` of auction items; house detail only for deployed members.

## The user's requested tab model (verbatim intent)

The game should have several tabs:

1. **Bidder** — check which bidders (characters) you own, their level/XP, their abilities, and which trade house each is currently in.
2. **Inventory** — your collection (items, boxes).
3. **Order** — all orders on the market; fulfill them if you have matching items.
4. **Market record** — all items in the game; shows average final (settled) price per item; clicking an item tracks all its historical sale records.
5. **Trade house** — list of all trade houses. You can only inspect inside a house if you have a bidder sent into it; otherwise locked/blind. Also allows recalling your bidder from a house.

## Your task — think through this properly

Analyze and specify, in `docs/TAB_DESIGN.md`:

1. **IA critique & proposal**: How do these 5 tabs map onto the current hall/3-column layout? Recommend: full tab navigation replacing the hall, or tabs as top-level views with the hall living inside one tab? Consider mobile (390px) seriously. Propose the nav pattern (top tab bar? bottom nav on mobile? how many tabs before it breaks?).
2. **Per-tab content spec**: for each of the 5 tabs — exact content blocks, data required, empty states, primary actions. Be concrete (what rows/cards/columns).
3. **Data & API gap analysis** (most important): what does the server NOT currently provide that these tabs need? Known suspects — verify against code:
   - Market record: does any global sale-history log exist? (Settle currently just transfers; item.history is per-item and items are deleted on order-fulfillment.) Specify the minimal server data structure for "average final price per item template + full history per item" and where it hooks in (settle path).
   - Bidder tab: does the client have everything needed for per-bidder XP/abilities/house location?
   - Trade house tab: house summaries already exist (HOUSE_LIST) — what's missing for "recall bidder" (does recall = redeploy elsewhere, or a true withdraw-to-idle state? Current model requires deployment to do anything — think through whether idle bidders are allowed, and what recall should mean; if idle is a bad idea, say so and design the alternative).
   - Order tab: orders are per-house — a global "all orders on the market" view changes information geography (currently you only see orders of houses you're in). Is global visibility acceptable, or should Order tab aggregate only houses where you have bidders? Argue both, recommend one, respecting the peek-privacy pillar.
4. **Privacy/consistency audit**: for each tab, state what must NEVER leak (fake flags of others' items, seller identity, house internals to non-members) and confirm the tab design respects it.
5. **Phased implementation plan**: order the work in buildable phases (server data first, then client tabs), each phase independently verifiable. Flag anything risky.
6. **Open questions for the owner (Percy)**: list every genuine decision you need from him (max ~8, crisp, multiple-choice where possible) — e.g., recall semantics, global vs member-only order visibility, whether Market record should show per-house or global averages, character gacha ownership vs deployments.

Constraints: keep the noir art-deco voice (docs/UI_STRUCTURE_SPEC.md), keep server-authoritative model, no new frameworks, respect existing privacy pillars. The document is the deliverable — it will be handed to a builder agent afterwards. Length: as long as it needs to be, but every section must be decision-ready, not exploratory fluff.
