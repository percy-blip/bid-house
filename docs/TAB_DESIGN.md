# Bid House — five-tab design contract

Design pass: 2026-09-12. Phase: concept and implementation planning. Owner decisions are collected in §8; recommendations below are the proposed baseline, not approved rule changes. Deliverable scope is this document only.

Player outcome: manage bidders and possessions without losing the auction floor, understand where an action will happen, and gain market knowledge without looking inside an unstaffed house.

Evidence: source inspection of [game.ts](../src/server/game.ts), [server.ts](../src/server/server.ts), [types.ts](../src/shared/types.ts), [content.ts](../src/server/content.ts), [client.ts](../src/client/client.ts), and [smoke.ts](../src/smoke/smoke.ts). Visual language follows [UI_STRUCTURE_SPEC.md](UI_STRUCTURE_SPEC.md). [UI_REVIEW.md](UI_REVIEW.md) remains an enhancement backlog, not an acceptance prerequisite for this design. Some review findings have already changed in current source; do not implement that review mechanically. No runtime, browser, device, or new automated testing was performed for this thinking pass.

## 1. Decisions recommended

| Decision | Recommendation | Consequence |
|---|---|---|
| Five tabs versus hall | Five top-level views; the live hall is a detail view inside **Trade house**. | Auctions retain a clear home. The hall is no longer the container for every management task. |
| Orders geography | Aggregate orders from **all currently deployed houses only**. | Label the scope explicitly; do not promise literal global visibility. |
| Recall | For the first release, use **Move bidder**: atomic house-to-house redeployment. Do not label it Recall. | True withdrawal is deferred; this is a deliberate departure from the requested recall action, requiring owner choice. |
| Bidder ownership | All six current characters are available; deployment is not ownership. | No invented collection, acquisition, rarity, duplicates, or gacha. |
| Bidder progression | Initially show account XP once and disclose shared progression. | Independent bidder XP and level require a separate server rule decision; never dress stale deployment XP as personal progress. |
| Market record | Global, anonymized settled-sale archive by item template; current-season average by default. | Explicit public information exception for completed commerce, with no live house drill-through or participant identities. |
| Historical continuity | Retain newly recorded sales across season resets, beginning at ledger launch. | No claim of reconstructing the game's missing past. |

The first buildable release can support all five destinations, but it must label unavailable records and shared XP truthfully. If Percy requires literal owned bidders, per-bidder levels, or true recall, those server slices precede the corresponding UI promises.

## 2. Information architecture and navigation

### Top-level structure

Keep authentication outside the game shell. After authentication, expose Bidder, Inventory, Order, Market record, and Trade house. New accounts land in Bidder with “Choose your first bidder”; selecting a character continues to the Trade house directory with that selection preserved. Confirming deployment opens that house's floor. Returning accounts open their last valid house floor, or the directory when that location is unavailable. Do not create an extra Hall tab.

Each tab owns a distinct question:

- **Bidder:** Who can I send, what can they do, and where are they?
- **Inventory:** What do I possess, and what can I do with it?
- **Order:** Which accessible commissions can I fulfill?
- **Market record:** What has this kind of item actually sold for?
- **Trade house:** Where can I operate, and what is happening inside my selected house?

Use ordinary navigation links with an active-page state and browser history, implemented with existing vanilla TypeScript. Tab names remain the requested singular labels. Detail navigation stays within its owning destination: Trade house → house floor → auction; Market record → template → optional specimen history. Browser Back closes a detail step before leaving the destination. Preserve scroll, filters, and unsubmitted amounts by destination and house; server pushes must not erase focused inputs. Changing destinations never deploys, moves, bids, or fulfills anything.

### Mapping the current 3 | 6 | 3 hall

| Existing block | New primary home | What stays on the house floor |
|---|---|---|
| Identity, XP ring, deployment controls | Bidder | Compact active bidder name, portrait, and operational cooldown. |
| Inventory grid and boxes | Inventory | “List an item here” opens an owned-item picker; no permanent collection grid. |
| Featured auction and live auctions | Trade house → floor | Remain the visual and interaction center. |
| Six-order board | Order | A small “Orders in this house” link with known count, filtered to this house. |
| Ability bar | Bidder for explanation; floor for use | Three equipped abilities and contextual auction targeting remain within bidding reach. |
| House ledger and member list | Trade house → floor | Compact house facts; members expand on demand. |
| Settlement/activity feedback | Shared feedback plus house-local trail | Scope events to eligible recipients; never use a global live feed to bypass membership. |
| House browser | Trade house directory | “All houses” returns from floor without withdrawing anyone. |
| Character selection screen | Bidder deployment subflow | Reuse character presentation, with choice retained through house selection. |

At wide desktop widths, retain the familiar 12-column grid as **3 bidder/actions | 6 auction floor | 3 house facts/activity**. The side rails are compact context, not duplicated management screens. At intermediate widths, use floor plus one combined context rail, then a single column when content no longer fits. Do not preserve ratios by squeezing bid controls into unreadable cards.

### Navigation at 390px

Use a horizontal top navigation on desktop and a persistent five-item bottom navigation on narrow screens. At 390px with 8px side gutters, each destination has roughly 75px of width. Give each a minimum 48px touch height, icon plus readable text; allow **Market record** and **Trade house** to wrap to two lines with equal-height cells. Keep a consistent order across devices. Five is the maximum for this pattern; a sixth destination belongs in an existing view or requires an IA revision. No horizontally scrolling primary tabs and no icon-only labels.

The mobile house floor is one scrolling view: house/title → compact bidder/ability controls → featured lot → live lots → collapsed house details. Orders and inventory are reached through contextual links or sheets, not a second bottom navigation. A bid sheet occupies the content area above navigation and moves clear of the keyboard. Opening an item or order picker must keep the destination house visible.

Global chrome shows coins and connection state first, a compact season indicator second. Fame and account XP expand from the account summary rather than consuming a second dense permanent row. A house badge appears on house-scoped actions, not as a misleading global scope for Inventory or Market record. If the player leaves the floor while bidding, a compact link can show “Your bid in Grand Exchange”; only private/member-authorized state may power it. Until cross-house personal bid tracking exists, do not promise an all-house bid monitor.

Reserve the actual bottom-nav height plus the bottom safe-area inset in content; inset padding belongs below buttons. At 390×844 and 390px width with text enlarged to 200%, no horizontal page scrolling or covered final action is acceptable. Start body/action text at 16px, secondary labels at 14px; short nav labels may use 12–13px with verified legibility. Keep 48px targets, visible focus, semantic headings, labeled fields, dialog focus return, and non-color status labels. Do not announce every countdown tick to screen readers.

Noir art-deco comes from the existing plum surfaces, brass rules, restrained gold primary actions, gem ability accents, system typography, and tabular prices. Use restrained copy (“The floor is quiet”, “No settled sales recorded”), but direct verbs for consequential actions. Respect reduced motion. Reuse existing assets; this pass authorizes no asset production.

## 3. Per-tab content and actions

### 3.1 Bidder

**Content order**

1. Header: “Bidder”, active deployment count/max, account XP labeled **Shared account XP** in the baseline release.
2. “Your deployments” list. Desktop columns: portrait/name; house name; progression model; equipped abilities; status; actions. Mobile: one card per deployment, name and house first, then three ability names and status, followed by actions.
3. “Available bidders” grid containing the remaining catalog characters. Show portrait, name, passive flavor text, signature ability summary, two traits, and “Choose house”. Do not call these unowned or invent a purchase action.
4. Bidder detail: three equipped abilities with effect text, base cooldown, current remaining cooldown, uses remaining or **Unlimited uses**, and operational restriction. Passive text is flavor unless an actual mechanic exists. No upgrade CTA without a server upgrade rule.

Primary action is **Enter house** on a deployed bidder and **Choose house** on an available one; secondary action **Move bidder**. Ability use stays on the floor to avoid casting with an ambiguous bidder or target. Catalog ability definitions include abilities not currently equipped by any character; these are not extra player slots.

**Data:** `characters`, `abilities`, own `deployments`, house summaries, `player.xp`, and `player.abilities` already support most baseline content. Need server-configured `maxDeploys` and authoritative per-bidder progression if approved (§4.2). Derive loadout from each deployment's `characterId`, never from the player's legacy primary `characterId`.

**States:** No deployments → “Send your first bidder to open a house” with Choose bidder. All slots used → available characters remain inspectable, with “All deployment slots occupied”; do not imply moving frees a slot. Cooldown → “Abilities unavailable; order XP paused until [time]”, while entry, bidding, listing, and fulfillment remain available under current rules. Unknown/missing state → loading/retry, not zero XP. Shared XP must not be repeated as six independent level bars.

### 3.2 Inventory

**Content order**

1. Collection header with item count and search; category, tier, and tag filters.
2. Boxes strip: owned box count; **Open box** while count > 0, otherwise **Buy & open — 100 coins** using a server-provided price in the new contract. The present model has one box counter, not separate basic/fine box balances.
3. Item grid (two readable columns on 390px; wider grid on desktop). Each tile: existing category/tier art, name, tier, brief tags, owner-only authenticity ribbon, and selection affordance. No numeric market estimate until the ledger supplies it.
4. Item detail: name/category/tier/all tags, clear private authenticity note, **List item**, **Find matching orders**, and **View market record** for its template. If provenance is shown, it uses a sanitized price/date trail without former-owner names.
5. Optional “Your listed lots” section only after a private own-listings projection exists; listed items are not in current private inventory. Do not claim items have vanished or manufacture listings from seller inference.

Listing opens a sheet with item, eligible deployed house selector, duration, listing fee, and final **List in [house]** action. Fee follows the server's duration clamp and ceiling rule, not an approximate percentage of sale value. Match links take the selected item into Order's eligible-house scope; opening a match does not consume it. Box reveal remains the existing overlay and is announced only after server success.

**Data:** `PrivateState.items`, `player.boxes`, `coins`, own deployments, summaries; new config for box price/listing duration bounds; template IDs and record summaries later. Multi-house listing needs explicit action scope (§5). Full inventory contains only presently owned, unlisted instances.

**States:** Empty + boxes → Open your first box. Empty + affordable → Buy & open. Empty + insufficient funds → explain amount needed and link to bidder/floor opportunities without promising a reward. Filters empty → Clear filters. Stale item → “This item is no longer available” and refresh. Mutation pending → disable duplicate submit; keep the selected item until acknowledgement. Private item flags never leave this surface in a public payload or shared cache.

### 3.3 Order

Title **Order**, with persistent scope line **Orders from your deployed houses** and “N houses accessible”. Filters: All my houses / a deployed house; Can fulfill; category/tag; minimum tier. Default to eligible matches first, then house/name in a stable order. No global locked-house requirement teaser.

Desktop columns: house; requirements; quantity; reward coins/fame/XP; matching owned count; action. Mobile cards show house and assigned bidder, requirement chips with words (“Genuine required” or “Fakes accepted”), quantity, three labeled rewards, match count, and **Choose items**. For a recovering bidder, show actual XP eligibility: “0 XP now · normally 50”, preserving coin/fame rewards. Never display the nominal XP reward as guaranteed during the move penalty.

Fulfillment sheet: exact house/order requirements; eligible private item cards; choose exactly `count` distinct items; reward summary; “Selected items are consumed”; **Fulfill in [house]**. With one match, preselect it but still require this explicit confirmation. Matching is advisory; server revalidates inventory, authenticity, membership, count, and order existence at commit. Fulfillment is an item sink and reward grant, not an auction transfer or a sale-price observation.

**Data:** current orders provide requirements/rewards, but only the current house is sent. New member-order projection supplies `houseId`, order ID, eligible bidder, effective XP eligibility, and revision. Local matching can use private items with all server predicates; no need to send another player's inventory or matching counts.

**States:** No deployments → “Send a bidder to see a house's orders”. No matches → show accessible orders and clear Can fulfill filter; offer Inventory. No accessible orders → refreshing/quiet board, not a fabricated six-card placeholder. Order already fulfilled → retain selection, explain failure, refresh board; do not automatically spend those items on a replacement order. Membership lost → remove that house's rows and close its confirmation.

### 3.4 Market record

Define **item** at the catalog level as an item template (currently category × tier: 20 templates). Random tags and authenticity are instance properties. Clicking a template shows every recorded successful sale of that template, including repeat sales of a specimen. Optional specimen drill-down groups just that physical item's recorded transfers; it does not list current holdings.

**Content order**

1. Header: “Market record”; explicit “Settled auction prices · all houses · Season N”; scope selector Current season / a historical season / All recorded seasons; coverage start date and “Updated through [time]”.
2. Search/name, category and tier filters. Desktop table: art/name, category, tier, average final price, sale count, last settled price/date. Mobile rows: art/name/tier on left; average and sample count on right, date below. Default catalog order; sort by price or sale count when requested.
3. Template detail: title/art/category/tier; average, sample count, last price; explanation of the exact average; paginated sale table. Each sale row: settled date/time, final price, historical tag snapshot, season, anonymous record reference. No seller, buyer, house, authenticity, live auction link, or bid ladder.
4. “Specimen history” on a sale row may open that specimen's recorded sale timeline using an archive-only opaque grouping key. Keep that key out of live auction DTOs and private owner provenance. Back restores template filters and page. This is inspectable history, not a watchlist; persistent tracking/notifications are outside scope.

**States:** Templates with zero sales remain in the catalog with **No recorded sales**, not price 0. One observation → “1 sale · limited sample”. Initial rollout → “Records begin [date]; earlier sales unavailable”. Empty season → switch scope; failed page → retry without clearing existing rows. Consumed/reset items still have archive entries. Do not imply average price predicts authenticity or guarantees resale value.

**Data:** all catalog rows, stable template IDs, aggregate counts/sums, and paginated immutable sale records are new. No client reconstruction from `item.history`, announcements, or current inventory. The public archive policy is a conscious, limited exception to information geography (§4.4), not permission to expose house details.

### 3.5 Trade house

Directory header shows deployment slots and **Your houses** pinned above **All houses**. House cards have sigil/name, specialty, fee rate, prime hour explicitly UTC, member count/capacity, occupancy heat with numeric label, live auction/order counts, and the player's bidder if present. Cap desktop card width rather than stretching a lone card across the page.

- Deployed: **Enter house**, secondary **Move bidder**.
- Undeployed with slot/available character: lock label “Send a bidder to inspect”, **Choose bidder**. Preserve any bidder selected in Bidder.
- At capacity: **Full** based on authoritative admission policy, with refreshing state during a race.
- Player slots exhausted: **Move a bidder here** opens the source selection; never imply free deployment.

Locked cards show only the approved public summary. No item names, order requirements, member identities, featured preview, or skeleton that embeds hidden internals. Heat is occupancy, not trading volume. The existing summary's auction/order counts are permitted coarse exceptions.

Floor header: house name, active bidder, All houses/back, compact fee/specialty/prime details. Center: featured auction once (not duplicated in ordinary list), ordinary auctions by end time, visible current/minimum bid, timer, amount entry, and contextual abilities. Bidder count can be computed from unique public bid player IDs, not number of bids. Ability descriptions/target choices use only this house. Members are an expandable local section. Auction-empty state links to **List an item here** or Inventory → Open box.

**Data:** `HOUSE_LIST`/`publicState.houses` cover summary facts; `currentHouse` covers one authorized floor. Missing authoritative capacity/config, robust move validation, and recall command. Exact `nextFeaturedAt` is internal; request a member-only field only if showing “Next featured rotation”. Prime hour alone does not provide that timestamp.

**Move flow:** choose destination from summaries → review source, destination, bidder, 24-hour ability/XP penalty, and treatment of outstanding lots/bids → confirm atomic move → destination floor. Cancel does nothing. If admission fails, retain the source deployment and show the reason. Never implement a move as sequential delete and deploy commands.

## 4. Verified model gaps and proposed server contracts

### 4.1 Ground-truth register

| Need | Current source behavior | Builder consequence |
|---|---|---|
| Durable sale ledger | `settle()` appends buyer name/price/time to `item.history`; no global sale collection, query, or aggregate exists. `fulfill()` deletes items; `endSeason()` clears all items. | Introduce a separate persisted ledger. Announcements are not history storage. |
| Complete item catalog | `NAMES`, `CATEGORIES`, tier prefixes in `makeItem()` define 20 names; item has no template ID and client receives no full item catalog. Tags are random. | Assign stable explicit template IDs; publish catalog including zero-sale templates. |
| Owned bidder roster | `Account.characterId` and `Player.characterId` store one primary choice; deployments select from `CHARACTERS`. No owned-character inventory exists. | Available catalog ≠ owned gacha collection. |
| Bidder XP/level | `deploy()` copies `player.xp` into deployment once. `fulfill()` increments only `player.xp`. Public members overwrite deployment XP with player XP; private deployments return stored XP. There is no level curve. | Private deployment XP is stale, not independent XP. Client's `% 100` ring is not a server level system. |
| Ability state | Definitions/loadouts public; runtime cooldown/uses in player-wide map keyed by ability ID. Current characters have distinct equipped IDs, so it can be joined per deployment today. `cooldown` kind reduces all entries in that player map. | Presentation is possible, but claiming independently persisted per-character runtime state is false. Explicitly disclose account-wide cooldown reduction. Uses reset with season. |
| Withdrawal | Only DEPLOY, REDEPLOY, ENTER_HOUSE; no RECALL. Deployment storage is nested in houses, despite optional `houseId` in the transport type. JOIN requires a deployment. | Optional field does not establish an idle state. |
| House limits | `deploy()` checks max player slots, duplicate house, duplicate character, but not house capacity. `redeploy()` checks source/destination existence and different house, but not target capacity, existing player membership, or cooldown before moving. | Displaying Full or a blocked move needs matching server enforcement. |
| Dynamic houses | A qualifying **listing** triggers new-house creation when all houses are occupied to cap; arrival itself does not spawn one. | Capacity enforcement must also guarantee a reachable destination when the final house fills. |
| Cross-house reads | `publicState()` supplies only selected member house; session has one `houseId`. | Do not sweep ENTER_HOUSE repeatedly to simulate an aggregate. |
| Action scope | LIST_ITEM, BID, FULFILL_ORDER, USE_ABILITY rely on session house. | Add explicit house scope for cross-tab mutations and validate it server-side. |
| Global leaks | Public item spread removes `fake` but retains history owner names. Global ANNOUNCEMENT broadcasts include settled item names/prices; `players` is a global roster. | Privacy requires payload allowlists and scoped events, not only hiding UI fields. |

### 4.2 Bidder progression choices

Minimal truthful release: all six characters available, shared account XP, current loadouts and ability state joined by ID, deployment-specific operational penalty. Do not invent a level number. This is usable, but does not fulfill literal per-bidder level/XP semantics.

If independent progression is selected, add a persisted account-owned bidder record keyed by character ID, separate from location, with season XP and server-derived level/progress/next threshold. Deployment references that record. Fulfillment credits the acting house's bidder when eligible; keep or replace account XP according to a single defined rule, never double-credit by accident. Bids, sales and box opening currently award no normal XP; do not invent extra sources. Define level thresholds and whether levels have effects before UI labels are implemented. Default migration recommendation: keep existing account XP and start bidder XP at zero at the next season boundary, rather than duplicating all past XP across bidders. Season reset must mutate stored bidder records.

The present `endSeason()` resets `d.xp` on copies returned by `deployments()`, not the housed records. Shared public XP still resets, but stale private deployment XP can persist. Correct this if retaining that field; preferably remove its ambiguity through the chosen progression projection.

Separate per-bidder ability maps are only required if acquisition/duplicates/loadout sharing is introduced or the current account-wide effects change. In that case, migrate cooldowns/uses once, preserve spent uses, and define whether Second Wind affects one bidder or the account. No free refresh through moving or roster replacement.

### 4.3 Move versus true recall

**Recommended first release: no deployed-to-idle withdrawal.** Moving preserves today's requirement to have a presence somewhere and avoids a new authenticated-but-unjoined operating state. Use “Move bidder”, not misleading “Recall”. Its cost is real: it cannot free a slot or let a three-bidder player substitute a fourth character. Make that limitation visible and ask Percy to choose in §8.

Current 24-hour cooldown blocks abilities and XP earning in the destination; it does **not** block another move, bidding, listing, fulfillment, or seeing a house. Unlimited moves therefore permit rapid scouting. Proposed privacy-preserving rule: reject additional moves while this operational cooldown is active; validate destination capacity and one bidder per player per house before any mutation. This is an explicit gameplay tightening, not current behavior.

Outstanding auctions and bids remain in their original houses and settle normally after a move; movement is not cancellation or refund. Once membership ends, no further live detail from the old house is delivered. Add private participant receipts for final win/return/proceeds so the player learns outcomes without regaining room access. Before moving, show the player's own outstanding commitments, using a private server projection, not public seller inference.

If **true recall** is chosen instead, it must mean withdrawal to an explicit idle roster record, releasing the slot and membership while preserving ability uses/cooldowns/progression. Permit recalling the last bidder: authenticated players should still browse their inventory, bidder roster, catalog and house summaries. JOIN/auth/private delivery must be decoupled from deployment; the current blanket session-house guard must allow account-only box opening and record reads. House actions still require membership. Record a persistent next-deployment time on the bidder so recall/redeploy cannot erase the movement penalty. Existing auction obligations survive; idle players receive private settlement receipts. First-join stipend remains once per season, never paid again for rejoining after recall. This is a complete server feature, not removal of a deployment row.

Any membership change must invalidate all sessions for that account. Today another socket can retain an obsolete house ID and make `publicState()` throw during broadcast. Select a valid fallback or clear the session selection, send revised private membership, revoke old detail, and prevent one stale session from interrupting the broadcast loop.

### 4.4 Order geography and the public market archive

**Global orders argument:** easiest market browsing, more matching opportunities, helps select a destination, and directly follows “all orders on the market”. However requirements and rewards are house internals. Broadcasting them gives free scouting and weakens the value of deploying, even if fulfillment is member-only. A separate global order pool would be a new economy/geography system. Neither is a cosmetic aggregation change.

**Member-only argument:** the player can compare every house they have invested a slot in, without tab-switching surveillance or violating the pillar. The cost is reduced reach; use explicit scope copy. Recommendation: all accessible houses, with the current house as an optional filter. Locked-house summaries may continue reporting live order counts, but not match counts computed against hidden requirements.

**Market archive distinction:** recommend an explicitly public record of completed auction prices across houses, with no house/party identity and no linkage to a live instance. It conveys market value but no current membership, inventory, order, or auction state. Publish after settlement only; archive reads must not imply permission to inspect the originating room. Global history still reveals coarse economic activity through item/price/timing correlations; anonymization is not a promise of zero inference. If the pillar forbids even historical cross-house price knowledge, global Market record must be rejected or delayed/scoped by owner decision. Do not silently call it fully private.

No public authenticity breakdown, even for settled items. Current `reveal`/appraise is a private peek, not a global authenticity reveal. Nor should the record expose winner identity: identifying a previous buyer plus a live item link would reveal a later seller. Per-house averages are deferred; simply hiding a house name in the UI is insufficient if IDs remain in the response.

## 5. Minimal data/API design

Names below specify contracts for the builder; they are proposals, not existing endpoints. Extend the current strict shared types and Node WebSocket handling, with no framework or database requirement.

### 5.1 Catalog and settled sales

| Record | Minimum fields and rules |
|---|---|
| Item template | Stable `templateId`, display name, category, tier. Explicit IDs survive display-name changes. Random tags do not create new templates. Add template ID to new items and deterministically migrate the 20 existing category/tier combinations. Unknown legacy content must be preserved and assigned an explicit legacy template, never silently dropped. |
| Internal settled sale | Unique `saleId` (auction ID is a suitable internal dedupe key), `itemId`, `templateId`, `seasonNumber`, `settledAt`, `finalPrice`, `houseId`, and snapshot of name/category/tier/tags. No need for authenticity or party IDs in this analytics record. Item snapshot survives consumption or catalog renaming. |
| Public sale row | Opaque archive record ID, template ID, archive-only specimen key if drill-down enabled, season, settled time, final price, tag snapshot. Never expose internal item/auction/house IDs, owner history, buyer, seller, fake, or bid ladder. Archive IDs must not be usable to look up a live lot. |
| Aggregate | Per template/per season: `saleCount`, `sumFinalPrice`; last price/time derived or cached. All-seasons totals combine these same counts and sums. Averages are server-calculated; caches rebuild from the ledger. |
| Persistence metadata | New schema version, `recordingStartedAt`, immutable ledger entries; optional stable archive-key mapping. Preserve ledger across season reset. |

Hook precisely inside `settle()`, after confirming the item exists, a top bid exists, and the buyer can pay price plus tax, in the same authoritative mutation as debit, seller credit, inventory transfer, and item history append. Record only successful settlement. Use `top.amount` as hammer/final price: exclude buyer tax, listing fee, and seller commission. Thus a sale at 100 with 10 tax and 5% fee records 100, not 110 or 95. `average = sumFinalPrice / saleCount`; display at most one decimal, with count. No sales yields null/“No recorded sales”. Count repeat resales as separate successful sales. Mixing tag variants is disclosed as “All tag variants”; never split genuine/fake.

Exclude box creation's price-zero provenance, unsold returns, failed buyer-payment settlements, order rewards, cancelled/removed records and unexecuted bids. Current `bid()` does not reject a seller's own bid: recommend rejecting self-bidding server-side and excluding any legacy self-sale from the new price series using settlement-time party comparison. Do not imply this prevents coordinated price manipulation; display sample counts and call these observations, not valuations.

Season boundary calls `settle(Infinity, now)` before incrementing season. These successful forced settlements belong to the ending season with that actual settlement timestamp. Append records before clearing items; do not delete the ledger with inventory. Historical order consumption must not remove existing sale entries.

Upgrade schema v2 to a new version; maintain the supported v1 migration path. Initialize an empty ledger and coverage start on old saves. Do not backfill from surviving histories: they have missing destroyed items, no reliable auction/house/season identity, and creation entries. Rebuild aggregates after load. An auction settlement must never produce two ledger entries on repeated ticks/reload; dedupe by auction transaction identity and persist ledger and economy in the same snapshot.

The current 2-second debounced temp-file/rename save is not crash-durable per acknowledged transaction. Preserve its known semantics for an initial release, document possible recent rollback, serialize overlapping saves, and avoid claiming exactly-once durability across crashes. If durable receipts are required, await a serialized durable commit or journal before acknowledging economic completion. Failed migrations must not fall through the current generic load catch into silent fresh-state creation. Restore/backup handling is part of the schema phase.

### 5.2 Reads, commands, and consistency

| Proposed contract | Contents / checks |
|---|---|
| Catalog/config read | Authenticated catalog, box price, listing bounds, house capacity, max deployments, movement penalty and policy. Config values come from actual server options. |
| Member orders read/push | Own deployed-house order lists with house IDs, eligibility status, server time, revision and membership revision. Filter memberships server-side on every projection; no all-house list in a public broadcast. |
| Market summary read | Scope/season/filter, template aggregates including zero-sales, coverage and as-of watermark. No active prices. |
| Market history read | Template, season scope, optional archive specimen key, opaque cursor, page size default 50/max 100. Descending `(settledAt, saleId)` order; stable as-of watermark/cursor prevents duplicate or skipped rows when new sales arrive. Validate identifiers, scope and bounds. |
| House mutations | Include `houseId` on LIST_ITEM, BID, FULFILL_ORDER, USE_ABILITY; require deployment and validate target belongs to that house at execution. ENTER_HOUSE changes selected view only. |
| Private account activity | Own listed-lot summary and settlement receipts if the move/background UI promises them; no other sellers or forbidden old-house internals. |
| Mutation response | Request ID, success/error code and human message, relevant authoritative revisions/updated private state. Pending buttons resolve from this response, not guessed text in a toast. |

Avoid putting all history or all member-house auctions in the once-per-second STATE frame. Catalog can be fetched once per version; order snapshots are small and update on order/membership changes; market pages are on demand. Use a revision/invalidation notification to refresh changed summary data rather than resending the archive. Paginate client rendering as well as transport. Full-history retention grows indefinitely: measure serialized-save size/time, then move the immutable ledger to append-only storage if necessary without changing the public contract. Do not silently truncate history while continuing to advertise “all records”.

Snapshot coherence matters: order matching joins private inventory and member orders, while mutations consume shared resources. Supply monotonic game/membership revisions; display stale data as refreshing and always revalidate. Refresh private state on **all sockets of affected accounts**, including another session's box opening, fulfillment, ability use, or move; current command handling usually updates only the initiating socket. Do not automatically retry a BID, OPEN_BOX or FULFILL_ORDER after reconnect without server idempotency. Use request IDs with dedupe for retryable mutations, or require explicit resubmission after refreshed state.

On disconnect, freeze consequential actions and label cached values. Reconnect/auth clears unauthorized caches before fetching a valid selection. On season change, discard pending order/item/bid selections and all old private peeks, refresh inventory/cooldowns/orders, and switch default Market record scope to the new season while retaining historical pages under their explicit scope. Never route WELCOME or an ordinary STATE push back to the hall if the user is browsing another destination.

## 6. Privacy and consistency audit

**Design verdict:** the proposed tabs respect the intended live-house boundaries when the projection changes below are implemented. The current server does not yet satisfy a stronger “no seller identity” audit; do not certify it based only on the absence of literal keys `fake` and `sellerId`.

| Surface | Allowed | Must never leak / consistency requirement |
|---|---|---|
| Bidder | Own locations, ability state, XP; public character definitions and coarse house summaries. | No rivals' private abilities/inventory or inferred location list from global players. Do not present stale deployment XP as independent progression. |
| Inventory | Own item authenticity, boxes and items; own appraisal result where authorized. | Private item objects cannot be reused as public auction/record DTOs. Provenance cannot identify a former seller. Clear account-scoped caches at logout. |
| Order | Requirements and rewards from currently staffed houses, local own-inventory matching. | No hidden-house requirements, reward rows, fulfillability badges, or names through search/counts. Revoke rows on membership loss; authorization checked again on fulfillment. |
| Market record | Catalog and approved anonymous completed-sale observations. | No fake, seller/buyer identity, house ID, live item linkage, owner history, or live bid stream. Consumption and reset cannot erase promised historical rows. |
| Trade house | Public summary for anyone; live internals only for a currently deployed member. | No blind-house auctions/orders/members/featured details. Move success must revoke old-house access on every connection. Private peeks render only for the requester and a currently authorized item context. |

Required corrections and safeguards:

1. Replace `PublicItem extends Omit<Item, "fake">` and object spreading with an explicit public allowlist. `history[].owner` currently includes the creator and subsequent buyer names; the last entry can name the current seller. Strip owner provenance from public auctions **and from buyer-facing item detail if seller anonymity is intended to survive transfer**. Store any required internal provenance server-side only. Price/date archive replaces public identity provenance.
2. Public auction bids currently contain bidder IDs, and global `players` maps these to names. Do not join these identities into the public market archive. Tighten global player publication to authorized house members unless a separately approved leaderboard requires a minimal projection. Global player XP/primary character is not a house membership endpoint.
3. Global settlement ANNOUNCEMENT currently reveals item name/price to all sockets, even outside the house. Route floor events to current members and outcomes privately to participants; public market reads deliver only the approved historical projection. Keep season/system announcements global. An existing leak does not authorize expanded scouting.
4. Apply membership checks to every read and mutation; targeting an arbitrary order/auction ID cannot bypass the house boundary. Error messages should not disclose whether a forbidden target exists or who owns it. In particular, block-target validation must not become an oracle for identifying the hidden seller.
5. Separate private appraisal knowledge from public cache data. Current peeks persist per item until season reset; the UI contract's temporary seal is presentation, not a server expiry rule. Hiding or moving the seal must not invent knowledge expiry or publish the result. If TTL is desired, specify it separately.
6. A client can remember details it legitimately saw before moving. Cache clearing prevents accidental UI display but cannot erase a player's memory or a modified client's records. The enforceable promise is **no new unauthorized detail after membership loss**, supported by movement limits, not retroactive secrecy.

Acceptance tests must assert forbidden **values and relationships** as well as field names: a seller username must not appear through item history, hidden-house order IDs must not appear in aggregates, and archive keys must not match live item identifiers. Owner-only `fake` in PRIVATE is intentional; a global search for that word across all frames would be an invalid test.

## 7. Buildable phases and verification

| Phase | Bounded deliverable | Independently verifiable exit |
|---|---|---|
| 0 — Decision contract | Record Percy's choices from §8; pin scope, market visibility, XP/ownership and movement semantics. | Builder can state exactly what “item”, “bidder”, “average” and “move/recall” mean without inventing rules. Existing game unchanged. |
| 1 — Privacy and membership foundation | Public allowlists, safe provenance, event scope, multi-session revocation; explicit mutation house scope; config projection. Tighten admission/movement only to approved rules; ensure dynamic-house creation avoids capacity dead ends. | Outsider cannot read or act in a room; two sockets survive a move without stale access or broadcast failure; full-house rejection leaves source intact; last-slot admission still yields a viable future destination. Existing client works through a temporary legacy scope adapter. |
| 2 — Ledger and catalog | Schema migration, stable templates, settlement ledger and aggregates, anonymous paginated reads. UI need not change. | Known-price sales produce exact counts/sums; tax/fees excluded; unsold/unpaid/creation/order events excluded; repeat settlement deduped; resales retained; consumed items remain; season forced sales assigned correctly; v1/v2 load and restart preserve balances and records. Coverage is honest, including zero-sale templates. |
| 3 — Account read models | Member-order aggregation; private runtime joins/config; own activity/receipts where promised. If independent XP or recall is approved, implement and verify those server slices here before labels depend on them. | Two-house member sees exactly those orders; outsider sees none; stale fulfillment cannot consume items; all account sockets refresh; cooldown XP is accurate. True recall, if selected, survives last-bidder withdrawal/relogin/redeploy without free stipend or ability reset. |
| 4 — Five-view shell and floor | Top-level desktop/mobile nav; existing hall and directory under Trade house; bidder flow; shared chrome; input-preserving view state. | Auth → choose non-first character → choose house → deploy once → bid → leave/return; each of five views reachable with Back/focus preserved. No server event forces unwanted tab navigation. Feature-disabled destinations show truthful unavailability. |
| 5 — Inventory and Order | Global owned collection/boxes, explicit-house listing, member-order cards and deliberate item selection. | Box updates once; choose between two matching items; listing fee shown correctly; concurrent fulfillment has one winner; move/season/reconnect invalidates stale confirmation without spending a different item. |
| 6 — Market record and acceptance | Catalog/aggregate view, template sale pages, optional anonymous specimen timeline; finish five-tab states and visual QA. | New template with no sales visible; page through more than 100 sales without duplication; filter scopes agree with arithmetic; inspect consumed specimen history; frame/DOM audit finds no identities or blind-house internals. |

For implemented phases, run the existing strict build and relevant smoke coverage (`npm.cmd run build`, `npm.cmd run smoke`), extending gameplay/privacy checks around changed rules rather than treating old “WS PRIVACY PASS” as sufficient. Add migration/settlement tests before the ledger rollout. No build or application tests are needed for this Markdown-only pass.

Final UI evidence: populated and empty views at 1440×900 and 390×844, all five mobile destinations, keyboard-open amount entry, 200% text, reduced motion, focus navigation, long names/tags, disconnected/reconnecting states, and actual gesture-safe-area behavior. Test bid input surviving incoming updates and navigation. Readability/touch acceptance remains untested here; no numerical UX/store-risk score is justified by a design document.

Highest risks are seller inference through provenance, archive-to-live correlation, replayed economic mutations, season/save migration errors, and rapid scouting through permissive redeploy. Keep old-client compatibility only during rollout, with server authorization equally strict for legacy messages. Introduce read features behind server capability flags; retain the ledger when hiding the tab. Back up before schema upgrade; rollback must understand the new schema or restore the whole corresponding snapshot, never discard new sales while retaining their economic transfers.

## 8. Decisions for Percy

Choose one option per row. Recommended options define this document's baseline; alternatives require the listed scope adjustment. These are genuine product choices, not requests for permission to write this document.

| # | Decision | Options and consequence |
|---|---|---|
| 1 | Where does live bidding live? | **A: Hall inside Trade house (recommended).** B: dedicated sixth Live floor destination, requiring a new mobile navigation design. |
| 2 | Which orders may be read? | **A: All deployed houses only (recommended).** B: global house orders, explicitly relaxing the privacy pillar. C: a new global order pool, separate from private house orders and requiring economy design. |
| 3 | What does recall mean? | **A: Move only; no idle state (recommended first release).** B: true recall to idle, including last bidder, with roster/auth/activity work. A cannot free slots or replace a deployed character. |
| 4 | Can bidders move repeatedly during recovery? | **A: No; keep the 24h ability/XP penalty and also block another move until it expires (recommended).** B: preserve current immediate repeated moves, accepting rapid house scouting. This determines anti-scouting enforcement and confirmation copy. |
| 5 | What is bidder ownership? | **A: All six freely available, deployment limits only (recommended).** B: an earned/purchased owned roster, requiring acquisition and persistence rules before collection UI. Neither option implies duplicates by default. |
| 6 | What does level/XP mean? | **A: Shared account XP, no invented bidder level (recommended first release).** B: independent seasonal bidder XP/level, with a level curve supplied before implementation and migration at next season. C: account level mirrored on all bidders, explicitly labeled shared, still requiring a server level curve. |
| 7 | How public are historical prices? | **A: Global anonymous post-settlement template averages and rows, no house labels (recommended).** B: records filtered to currently deployed houses, with membership-sensitive history/cache rules. C: public per-house records/averages, accepting increased historical scouting. |
| 8 | How long are market records retained? | **A: Keep all sales recorded from launch across seasons; default current season (recommended).** B: current season only, with an explicit deletion/coverage policy and no promise of full historical records. Both exclude unreconstructable pre-launch history. |

Handoff: this file is the builder's design input. No application code, CSS, assets, CODEX_HANDOFF.md, or DEBUG_HANDOFF.md was changed, honoring the one-file scope. Next safest action is to resolve §8, then implement and verify the privacy/membership foundation before adding broader reads.
