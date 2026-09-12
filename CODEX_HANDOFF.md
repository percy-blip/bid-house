# Bid House handoff

- Goal: deliver the requested dependency-light multiplayer auction-house MVP.
- Phase/status: vertical slice complete; build and automated runtime verification pass.
- Owners: `src/server/game.ts` owns authoritative rules/state, `src/server/server.ts` owns transport/static hosting, `src/client/client.ts` owns presentation, `src/smoke/smoke.ts` owns the end-to-end proof.
- Verification: `npm install` (0 vulnerabilities), `npm run build` (pass), `npm run smoke` (pass: join/open/list/bid/ability/settle/receive/conditional fulfill/privacy).
- Risks: in-memory reconnect works only during one server process; random order supply can mean a smoke run legitimately skips fulfillment when no live order matches the acquired item. Browser UI visual inspection was unavailable because no browser surface was connected; responsive CSS and runtime static delivery were checked from source/server instead.
- Next safest task: manual multiplayer browser playtest at desktop and narrow mobile widths.
