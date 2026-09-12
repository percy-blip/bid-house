# Bid House handoff

- Goal: Run B client overhaul to the noir-gold UI contract in `docs/UI_STRUCTURE_SPEC.md`.
- Phase/status: production implementation complete; strict build, asset verification, and automated smoke pass. Manual browser/device art-direction sweep remains.
- Latest work: replaced the client shell, presentation layer, and rendering code with Auth, Character Select, House Browser, Auction Hall, modal/overlay, motion, and narrow-mobile surfaces; added static-bundle and public-auction-frame privacy smoke assertions.
- Owners: `src/client/index.html` owns screen/modal structure; `src/client/styles.css` owns exact palette, responsive layout, tier treatment, and motion; `src/client/client.ts` maps the unchanged protocol into UI and keeps authenticity rendering private; `src/smoke/smoke.ts` owns the new bundle/privacy regression checks.
- Privacy: owner fake ribbons read only `PrivateState.items[].fake`; appraisal seals read only `PrivateState.peeked`; `PublicAuction` rendering never derives authenticity or seller identity.
- Verification: `npm.cmd run build` passes; `npm.cmd run verify-assets` reports expected 71, missing/unexpected/failed all empty, manifestMatches true; `npm.cmd run smoke` passes with `UI BUNDLE PASS` and `WS PRIVACY PASS` lines plus all prior gameplay assertions.
- Intentional protocol-bound limitations: box price is presented as 100 coins based on current server behavior rather than a public config field; ability target validity and order fulfillment remain server-authoritative because no explicit valid-target/match payload exists; season end provides current private fame/milestone totals because the event has no final-results payload.
- Runtime QA: local server launched successfully, but no browser surface was exposed by the computer-use runtime, so 1440x900 and 390x844 visual/touch checks were not captured. Verify carousel centering, dense live-lot wrapping, modal target flows, reveal timing, and bottom safe-area/tab usability manually.
- Next safest task: Run C screenshot sweep at 1440x900 and 390x844, then fix visual issues without changing protocol.
