# Brief: Bid House — Run S: Server Foundation for Five-Tab Model (BUILD)

Builder model: implement, in strict TypeScript, the server-side foundation for the five-tab model. The full design contract is `docs/TAB_DESIGN.md` — read it first. Owner decisions are LOCKED:

1=A (hall inside Trade house — no server impact), 2=A (orders readable only from currently deployed houses), 3=B (**true recall to idle roster**), 4=A (**block any second move/redeploy until the 24h penalty expires**), 5=B (**owned bidder roster via gacha pulls**), 6=B (**independent per-bidder XP with levels**), 7=A (global anonymous price history, no house labels), 8=B (**records current season only, cleared at season reset**).

Where the design contract left a rule unspecified, these decisions are binding (owner delegated):

## Locked spec decisions (K3)

- **Bidder gacha**: `PULL_BIDDER` command, cost 150 coins. Grants one random character not yet in the player's roster. All 6 owned → reject with clear error. Roster persists across seasons. New accounts: first character choice is free (added to roster). Existing saved players (migration): roster = union of their deployed characterIds + their legacy primary characterId.
- **Ownership gate**: DEPLOY requires the character to be in the player's roster. Existing flows otherwise unchanged.
- **Per-bidder XP**: XP from a house action (order fulfillment, featured-auction fame-adjacent XP — i.e., every source that currently adds to `player.xp`) is credited to that house's deployment `xp` instead. `player.xp` is retired from gameplay (keep field for migration; no longer displayed/used). Redeploy XP-dilution is removed; deployments carry their own xp.
- **Level curve**: level 1 at 0 XP; advancing from level L to L+1 costs `100*L` XP (L1→2: 100, L2→3: 200, …). Cap level 20. Season reset clears deployment xp (levels reset each season — consistent with hard-reset pillar).
- **Level effect**: ability cooldown multiplied by `max(0.6, 1 - 0.02*(level-1))`. One effect only; keep it simple and server-tested.
- **Recall**: `RECALL` command (characterId) removes that deployment from its house; the character returns to idle roster. Recall is always allowed (even as last bidder — player just loses house access). Recall triggers the standard 24h move penalty on that character: abilities unavailable, XP gain paused, and **redeploy of that character is blocked until the penalty expires** (decision 4A). Existing REDEPLOY (house-to-house) is blocked entirely while its character's penalty is active.
- **Market ledger (season-scoped)**: on every paid settlement, append `{saleId, templateKey, price, tags, settledAt, season}` where templateKey = `category:tier`. No seller/buyer/house/item-instance identity. Aggregates (count, sum, last) rebuilt on load. Ledger cleared at season end (decision 8B); coverage label = current season. New reads: `MARKET_SUMMARY` (all templates incl. zero-sales, averages, counts, last price) and `MARKET_HISTORY` (template, cursor pagination, desc by settledAt, anonymous rows only). Only successful paid settlements are recorded; unsold/unpaid/creation/order-fulfillment excluded; dedupe by auction id so double-settle/reload never duplicates.
- **Box price**: `OPEN_BOX` with no boxes → auto-buy at 100 coins (server option `boxPrice`, default 100), instead of current reject. Config read exposes it.
- **Privacy fixes (Phase 1, mandatory)**:
  1. Public auction items: explicit allowlist DTO (id/name/category/tier/tags/art only) — strip `history` owner names and any provenance from public payloads. Keep internal provenance server-side only.
  2. Settlement announcements: "sold for X" notes go only to that house's current member sockets + the buyer/seller privately. Season/system warnings stay global.
  3. Global players projection: only `{id, name, fame}` (leaderboard need). Remove xp/characterId/rookie from the global list (members list inside a house keeps what it legitimately shows).
  4. Membership checks on every read/mutation: validate target auction/order belongs to a house where the player is deployed; errors must not oracle hidden targets.
- **Member orders read**: `MEMBER_ORDERS` frame: aggregated orders from all houses where the player has a deployment, each with houseId + order requirements/rewards; server pushes it (on join/deploy/redeploy/recall/order change) alongside private state. XP reward shown must reflect the penalty state of the bidder in that house ("0 XP now · normally N" can be derived client-side from penalty state — expose per-deployment `xpPaused`).
- **Multi-session refresh**: after any mutation affecting an account (box, fulfill, ability, settle receipt, move/recall), send fresh PRIVATE state to **all** sockets of that account, not just the initiator.
- **Config/catalog read**: authenticated frame exposing boxPrice, listing duration bounds, houseCap, maxDeploys, move penalty ms, level curve constants. Client will fetch once.

## Hard requirements

- Strict TS, no new dependencies, server-authoritative, schema v3 with working v1/v2 migrations. NEVER silently fall through a failed migration into fresh state — fail loudly.
- Keep the legacy client working through this run where feasible: existing messages keep functioning (session house scope defaults as today); new frames are additive. Client overhaul is a separate later run.
- Extend `src/smoke/smoke.ts`: new coverage for pull/roster/ownership gate, recall + redeploy block + last-bidder recall, per-bidder XP crediting + level curve + cooldown multiplier, ledger recording/aggregates/pagination/season-clear/dedupe, member-orders aggregation across two houses + outsider sees none, privacy assertions (no owner names in public frames, no hidden-house order ids in member orders, global players projection minimal, sale notes only to members). Keep ALL existing smoke assertions passing (adjust only where the locked decisions intentionally change behavior — roster gate, xp crediting, box auto-buy, announcement scoping; note each intentional change in your report).
- `npm run build` and `npm run smoke` must both pass. Report: files changed, contract additions, every intentional behavior change, and smoke output tail.
