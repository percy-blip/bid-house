# Bid House handoff

- Goal: Iteration 2 accounts, runnable seasons, and file-backed persistence.
- Phase/status: production iteration implemented; strict build and automated end-to-end smoke pass.
- Latest work: added scrypt-backed register/login and sliding tokens; AUTH-first WebSocket sessions; versioned atomic snapshots; five-minute season warning, settlement/reset, and admin force-end; account/character UI and season countdown; restart-aware smoke coverage and operational documentation.
- Owners: `src/server/game.ts` owns authoritative rules, accounts, season, and snapshot schema; `src/server/server.ts` owns HTTP/WS transport and debounced disk writes; `src/client/client.ts` owns account/character/game presentation; `src/smoke/smoke.ts` owns end-to-end proof.
- Verification: `npm.cmd run smoke` passes, including its nested strict TypeScript build, two registrations, wrong-password rejection, AUTH+JOIN, two box opens, on-disk save, fresh GameState reload, public privacy/countdown, and admin season reset.
- Risks/unverified: no browser surface was available for visual or responsive interaction inspection. Snapshot schema version 1 intentionally has no older production migration because the prior MVP had no durable save format. Railway requires a mounted volume at `DATA_DIR`.
- Next safest task: manual desktop and narrow-mobile browser pass of login/register toggle, character selection, reconnect, and season header.
