# Bid House — Iteration 2 Brief: Seasons + Accounts + Persistence

You are extending the existing Bid House MVP (Node 20 + TypeScript, plain `ws`, server-authoritative, hand-rolled CSS SPA, strict TS). Read the current code first. Implement the three features below end-to-end. Do NOT git commit — the orchestrator verifies and commits afterwards.

## Feature 1: Accounts

- Replace the anonymous `JOIN {name, characterId}` flow with **register/login**:
  - HTTP endpoints on the same server (use plain `node:http` handlers or a tiny router — NO express dependency): `POST /api/register {username, password}` → `{token, playerId}`, `POST /api/login {username, password}` → `{token, playerId}`. Tokens: random 32-byte hex, stored server-side with expiry (30 days, sliding).
  - Password hashing: `node:crypto` scrypt with per-user salt. No plaintext, no new dependencies.
  - Usernames: 3–20 chars, alphanumeric + underscore, unique (case-insensitive). Errors are clear JSON `{error: "..."}`.
- WS join becomes: connect → client sends `{type:"AUTH", token}` → server attaches to the account's player (creating the in-game player row on first entry, with character selection at `{type:"JOIN", characterId}` after AUTH — character choice still happens post-login, stored on the account).
- Client UI: login/register screen (toggle), then character-select screen, then the game. Token in localStorage; auto-reconnect uses AUTH, not playerId.
- Keep the whole thing dependency-free; `ws` stays the only runtime dep besides TS build tooling.

## Feature 2: Runnable Seasons

- GameState gains a `season: {number, startedAt, endsAt, phase: "active" | "ending" | "break"}`.
- **Season length** from env `SEASON_LENGTH_HOURS` (default 672 = 4 weeks). Countdown visible in the UI header (d/h/m, client ticks from endsAt).
- **Season end sequence**: 5-minute "ending" warning broadcast → at endsAt: settle all live auctions (highest bid wins, fees apply) → **hard reset**: every player's coins back to stipend (500), xp 0, fame 0, inventory cleared, boxes restocked to 2 starter boxes; all auctions cleared; orders board regenerated fresh; cooldowns cleared. Season number increments, new startedAt/endsAt. Broadcast `SEASON_END {number}` + full STATE.
- **Admin force-end**: `POST /admin/end-season` with header `Authorization: Bearer $ADMIN_TOKEN` (env, no default — endpoint 403s if unset) → triggers the same sequence immediately. For playtesting.
- Season number + boundaries are part of public state; UI shows "Season N — ends in Xd Yh".

## Feature 3: Persistence (file-backed)

- All durable state (accounts, players, items in circulation, auctions, orders, season, wallet/coins/xp/fame, ability cooldowns) serializes to a JSON snapshot under `DATA_DIR` (env, default `./data`), file `state.json`.
- Save: debounced ~2s after any mutation (and on graceful shutdown). Load on boot; if file missing/corrupt, boot fresh with a warning log.
- In-Railway: ephemeral filesystem note belongs in README (orchestrator mounts a volume at DATA_DIR).
- IMPORTANT: private info discipline stays — the snapshot holds fake flags server-side (fine, it's the server), but nothing changes in what's sent to clients.

## Quality bar (same as before, all must pass)

- `npm run build` clean strict TS.
- **Extend `npm run smoke`**: cover (a) register two users, (b) login with wrong password rejected, (c) AUTH+JOIN over WS, (d) open box → persist file exists on disk → simulate restart by constructing a fresh GameState from the saved file → both users still have their items/coins, (e) admin end-season → coins reset to 500, xp/fame 0, inventory empty, season number incremented, (f) season countdown present in public state.
- Update README: account endpoints, admin endpoint, env vars (PORT, DATA_DIR, SEASON_LENGTH_HOURS, ADMIN_TOKEN), persistence note.
- Do NOT commit. Final message: files changed, deviations, exact smoke output.

## Constraints

- No new runtime dependencies.
- Don't break existing protocol messages other than the JOIN flow change (AUTH first).
- Keep seller anonymity + fake-flag privacy invariants intact.
