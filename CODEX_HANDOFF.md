# Bid House handoff

- Goal: Run S server foundation for the locked five-tab model in `docs/TAB_DESIGN.md`.
- Phase/status: production server slice complete; strict build and model/WebSocket smoke pass.
- Latest work: added schema v3 with loud v1/v2 migration, owned bidder rosters and paid pulls, true recall/move lock, seasonal per-bidder XP/levels, configurable box auto-buy, season market ledger/read models, member-order aggregation, privacy projections, scoped settlement notes, and all-session account refresh.
- Owners: `src/shared/types.ts` owns protocol/persistence DTOs; `src/server/game.ts` owns authoritative rules and projections; `src/server/server.ts` owns socket scoping and refresh; `src/smoke/smoke.ts` owns contract coverage.
- Compatibility: legacy session-house commands remain valid; mutations additionally accept explicit `houseId`. Legacy account `xp` remains persisted but receives no gameplay XP. Global players now intentionally expose only id/name/fame.
- Verification: `npm.cmd run build` passes; `npm.cmd run smoke` passes with UI BUNDLE, MODEL, WS, and final SMOKE PASS lines.
- Privacy: public auction items use an explicit id/name/category/tier/tags/art allowlist; member orders include only deployed houses; settlement notes route only to current house members and participants; hidden-target failures use a non-oracular message.
- Persistence: rosters survive season reset; per-bidder XP and the anonymous ledger reset each season; recalled bidder XP survives idle/redeploy within the season; settlement IDs dedupe ledger writes.
- Next safest task: implement the five-tab client against the additive CONFIG, MEMBER_ORDERS, MARKET_SUMMARY, MARKET_HISTORY, PULL_BIDDER, and RECALL contracts.
