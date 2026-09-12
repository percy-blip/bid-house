# Bid House

Bid House is a server-authoritative multiplayer auction game MVP. Create an account, choose a bidder, open mystery boxes, list finds anonymously, compete in timed English auctions, and fulfill public collector orders during time-limited seasons.

## Run

Requires Node.js 20 or newer.

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000`. `npm run dev` runs TypeScript in watch mode beside the Node watcher. `npm run smoke` builds, starts an isolated server, and verifies accounts, WebSocket authentication, persistence/reload, privacy, season state, and an administrator-triggered season reset.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP and WebSocket port |
| `DATA_DIR` | `./data` | Directory containing the durable `state.json` snapshot |
| `SEASON_LENGTH_HOURS` | `672` | Season duration in hours (four weeks by default) |
| `ADMIN_TOKEN` | unset | Bearer token required by the force-end endpoint; the endpoint returns 403 when unset |

State changes are saved after an approximately two-second debounce and again during graceful `SIGINT`/`SIGTERM` shutdown. Writes use a temporary file followed by rename. The snapshot includes account password hashes/salts, server-side auth tokens, players, private item authenticity, auctions, orders, cooldowns, and season boundaries; do not publish it.

Railway's ordinary filesystem is ephemeral. Mount a persistent volume and set `DATA_DIR` to its mount path or progress will be lost when the deployment is replaced.

## HTTP API

All responses are JSON. Usernames are case-insensitively unique, 3–20 characters, and may contain letters, numbers, and underscores. Passwords are 8–128 characters and are stored as scrypt hashes with per-user salts.

- `POST /api/register` with `{"username":"Ada_1","password":"correct horse"}` returns `{"token":"…","playerId":"…"}`.
- `POST /api/login` with the same fields returns a fresh token and player ID.
- `POST /admin/end-season` with `Authorization: Bearer <ADMIN_TOKEN>` immediately settles live auctions and performs the normal season reset.

Authentication tokens are random 32-byte hex values. They expire after 30 days and slide forward whenever successfully used.

## Rules and seasons

- Each player begins each season with 500 coins and two free boxes; later boxes cost 100 coins.
- Boxes roll tiers 1–4 from common to rare. Fake chances are 10%, 25%, 50%, and 70% respectively. Only an item's owner (or a successful peek) sees authenticity.
- Listings run for the chosen duration. Bids rise by at least 10 coins or 5%, whichever is greater. A bid in the last five seconds resets the clock to five seconds.
- The winner pays the bid, receives the item and its authenticity, and the seller receives 95%. Item provenance is public.
- Orders atomically consume matching inventory and grant coins, XP, and fame. Fame milestones at 500, 1500, and 4000 add coin bonuses.
- Each of six characters equips one main ability and two traits. Cooldowns and limited uses are server-owned.
- Five minutes before a season ends, its phase changes to `ending` and clients receive a warning. At the boundary, all auctions settle before coins, XP, fame, inventory, boxes, orders, and cooldowns reset; the next season then begins.
- Every 15 minutes the highest-tier live lot is marked featured.

## WebSocket protocol

Connect to the same host and send `{"type":"AUTH","token":"…"}` first. The server responds with `AUTH_OK`. A new account then sends `{"type":"JOIN","characterId":"mara"}`; returning accounts receive `WELCOME` immediately after `AUTH`.

Authenticated game intents are `JOIN`, `OPEN_BOX`, `LIST_ITEM`, `BID`, `FULFILL_ORDER`, `USE_ABILITY`, and `PING`. The server replies with `AUTH_OK`, `WELCOME`, throttled `STATE` broadcasts, owner-only `PRIVATE` updates, `ANNOUNCEMENT`, `SEASON_END`, `ERROR`, and `PONG`.

`STATE.publicState.season` contains the public season number, start/end timestamps, and phase. Active public auction records contain a public item projection and never contain `fake` or `sellerId`.

Representative payloads:

```json
{"type":"AUTH","token":"0123456789abcdef…"}
{"type":"JOIN","characterId":"mara"}
{"type":"LIST_ITEM","itemId":"…","durationSec":30}
{"type":"BID","auctionId":"…","amount":50}
{"type":"USE_ABILITY","abilityId":"peek","auctionId":"…"}
```
