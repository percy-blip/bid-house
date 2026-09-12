# Bid House handoff

- Goal: Run C five-tab client per `docs/TAB_DESIGN.md`, backed by the Run S contracts.
- Phase/status: production client overhaul complete; strict build, server smoke, and desktop/mobile browser QA pass.
- Latest work: replaced the hall shell with hash-routed Bidder, Inventory, Order, Market record, and Trade house destinations; retained the hall as a staffed-house detail; added roster/deployment management, filters and selection sheets, market pagination, responsive bottom navigation, and input/filter/scroll state that is not reset by server frames.
- Owners: `src/client/client.ts` owns client read models, routing, actions, and transient state; `src/client/styles.css` owns responsive noir art-deco presentation; `qa-shots.mjs` owns browser acceptance evidence. Run S server files remain unchanged.
- Verification: `npm.cmd run build` passes; `npm.cmd run smoke` passes (UI BUNDLE, MODEL, WS, SMOKE); `node qa-shots.mjs` passes at 1440x900 and 390x844 with all five tabs, inventory empty/populated state, box reveal, market detail, and house floor.
- QA result: 0 JavaScript errors, 0 broken images, and 0 horizontal-overflow failures.
- Contract note: the declared `JOIN { characterId }` is ignored by the server and idle accounts cannot be created before deployment. Onboarding therefore keeps the existing first-bidder + first-house deployment transaction, then lands on Bidder as required.
- Next safest task: review generated screenshots in `qa-shots/` and run a human interaction pass for recall confirmation, redeploy lock expiry, exact-count multi-item orders, and market histories with real sales.
