# Bid House handoff

- Goal: Iteration 3 dynamic multi-house world.
- Phase/status: production implementation complete; strict build and expanded automated smoke pass.
- Latest work: moved auctions, orders, featured schedules, fee rates, specialty tags, and deployments into persistent house state; added deploy/redeploy/enter-house protocol and per-socket active-house projections; added house browser/switcher, cooldown display, featured treatment, schema-v1 migration, and season-safe house resets.
- Owners: `src/server/game.ts` owns authoritative global/house rules and schema migration; `src/server/server.ts` owns active-house socket context and scoped broadcasts; `src/client/client.ts` owns browser/deployment/in-house presentation; `src/smoke/smoke.ts` owns the Iteration 3 proof.
- Verification: `npm.cmd run smoke` passes, including nested strict build, initial house, deploy/JOIN guard, HOUSE_CAP spawn, cross-house deployment, 24h redeploy cooldown and ability block, featured selection/reward, deterministic 50% specialty order floor, season preservation/reset, schema-v2 round trip, and public privacy projection.
- Design decisions: only one character per player may occupy a given house; listing fee is duration multiplied by house fee rate (rounded up), while sale proceeds also use the house rate; featured fame is 25% of winning bid (rounded up); a capped listing only spawns when no other house has spare capacity.
- Risks/unverified: browser interaction and responsive/device visual QA were not run. Existing schema-v1 snapshots migrate into Grand Exchange with each legacy player's selected character deployed and legacy auctions/orders preserved.
- Next safest task: manual desktop and narrow-mobile pass of first deployment, multi-house switch/redeploy controls, cooldown presentation, and featured card contrast.
