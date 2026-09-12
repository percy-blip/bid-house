# Bid House handoff

- Goal: Iteration 4 catch-up stipend, rookie marker, and slip-claim collusion limits.
- Phase/status: maintenance implementation complete; strict build and expanded automated smoke pass.
- Latest work: added idempotent per-season join stipends, late-season rookie state/public chips, rolling 24-hour cheap-win counters with pending-lead reservation and settlement logging, snapshot normalization, configuration docs, and focused smoke coverage.
- Owners: `src/server/game.ts` owns authoritative join grants, rookie classification, slip qualification/counters, settlement, resets, and snapshot compatibility; `src/server/server.ts` carries one-time stipend metadata; `src/client/client.ts` renders stipend feedback and member chips; `src/smoke/smoke.ts` owns the Iteration 4 proof.
- Verification: `npm.cmd run smoke` passes, including nested strict build, 30-hour/750-coin one-time stipend, public rookie flag and reset, ten qualifying wins, exact 11th-bid rejection, above-ceiling acceptance, `[slip]` logs, and schema-v2 round-trip of all new player fields.
- Design decisions: existing schema-v1/v2 players missing Iteration 4 fields normalize as already-stipended/non-rookie/no claims to prevent migration grants; tier bases are 40/120/400/1500 and `SLIP_PRICE_CEILING` is a multiplier; currently led qualifying auctions reserve claim capacity so parallel auctions cannot bypass the win cap; established players receive the normal 500 during hard reset and are marked already-stipended for the new season.
- Risks/unverified: browser interaction and responsive/device visual QA were not run; environment values are bounded but malformed numeric strings follow the project's existing numeric-env behavior.
- Next safest task: manual desktop and narrow-mobile pass for the stipend toast and crowded house-member rookie chips.
