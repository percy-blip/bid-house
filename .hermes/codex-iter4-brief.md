# Bid House — Iteration 4 Brief: Catch-up, Rookie Bracket, Collusion Limits

You are extending Bid House (Node 20 + TypeScript, plain `ws`, multi-house world, accounts, seasons, persistence — all working). Read the current code first. Implement the three features below. Do NOT git commit — the orchestrator verifies and commits afterwards.

## 1. Late-joiner catch-up stipend

- When a player registers `JOIN_STIPEND_AFTER_HOURS` (env, default 24) after the season started, they receive a **catch-up stipend** instead of the flat 500 coins: `500 + 250 * floor(hoursLate / 24)` capped at `JOIN_STIPEND_MAX` (env, default 2000). XP/fame/inventory/boxes unchanged (2 starter boxes).
- The stipend is computed from `season.startedAt` at first JOIN of the season (persist a flag `stipendAwardedThisSeason` per player; do not re-award on reconnect).
- Toast + private-state field `stipendAwarded` so the client can flash "Catch-up stipend: +N coins".

## 2. Rookie bracket

- If a player joins (first JOIN of the season) while less than `ROOKIE_WINDOW_HOURS` (env, default 336 = 2 weeks) of the season remains, they are flagged `rookie` for that season.
- Rookies appear on the public players list with a 🌱 `rookie: true` flag (this is the ONLY public difference — no separate ladder, no special rewards; fame is global).
- At season end the flag clears (hard reset already zeroes fame).
- Client: rookie chip on player entries in the house member list.

## 3. Slip-deal claim limits (collusion design-out)

To blunt coordinated seller-buyer collusion on ultra-cheap "slip" listings:

- Per player per rolling 24h window: at most `SLIP_CLAIM_MAX` (env, default 10) auction **wins** where the final price ≤ `SLIP_PRICE_CEILING` (env, default 15% of the item's tier base value — define base value as the same table the listing-fee uses; if none exists, use 40/120/400/1500 for tiers 1–4).
- Wins above the ceiling are unlimited. Attempting a bid that would be your 11th slip win is rejected with a clear GameError: "Slip-claim limit reached — try higher-value auctions."
- Track counters per player; reset at season end. Persist them.
- Server logs each slip win (`console.log` with `[slip]` prefix: player, auction, price, count).

## Quality bar

- `npm run build` clean strict TS.
- Extend smoke: (a) player joining 30h into a season gets 750 stipend once, not on reconnect; (b) player joining in the final rookie window gets `rookie: true` in public state and loses it after season end; (c) 11th sub-ceiling win is rejected, 10th allowed, above-ceiling unlimited; (d) persistence round-trip keeps stipend flag, rookie flag, slip counters.
- README: new env vars (JOIN_STIPEND_AFTER_HOURS, JOIN_STIPEND_MAX, ROOKIE_WINDOW_HOURS, SLIP_CLAIM_MAX, SLIP_PRICE_CEILING).
- No new runtime dependencies. Do NOT commit.
- Final message: files changed, design decisions, exact smoke output, deviations.
