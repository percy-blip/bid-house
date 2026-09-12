# Bid House

Bid House is a server-authoritative multiplayer auction game built with Node 20, strict TypeScript, and plain WebSockets. Accounts share one wallet and collection across a dynamic world of independent bid houses.

## Run

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000`. `npm run smoke` builds and verifies the multi-house lifecycle, deployment/cooldown rules, featured rewards, specialty orders, season reset, persistence, and privacy.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP and WebSocket port |
| `DATA_DIR` | `./data` | Directory containing durable `state.json` |
| `SEASON_LENGTH_HOURS` | `672` | Global season duration |
| `ADMIN_TOKEN` | unset | Bearer token for `POST /admin/end-season` |
| `HOUSE_CAP` | `8` | Unique deployed players at which a listing can spawn another house |
| `MAX_DEPLOYS` | `3` | Maximum simultaneous character deployments per player |
| `FEATURED_INTERVAL_MINUTES` | `30` | Per-house featured-auction interval |

Snapshots are debounced by about two seconds and atomically replaced. Schema version 2 persists accounts, tokens, global players/items, houses and their deployments/markets, private peeks, and the global season. Mount a persistent volume for `DATA_DIR` on ephemeral hosts such as Railway.

## House rules

- Grand Exchange always exists. A listing received by a capped house spawns a generated house when no spare-capacity house exists.
- House name, specialty, fee rate (3%-12%), and UTC prime hour are immutable. A house has its own auctions, six orders, deployments, and featured schedule.
- Coins, inventory, XP, and fame belong to the global player. Listings, bids, orders, and ability targets belong to the active house.
- A player may deploy distinct characters up to `MAX_DEPLOYS`. Redeploying moves a character and disables that character's abilities and XP earnings for 24 hours. Entering an already-deployed house is instant.
- A house listing charges its fee and its completed sale pays the seller net of that same rate.
- Each specialty house keeps at least three of its six generated orders tagged for its specialty.
- Featured selection prefers item tier, then listing fee paid, then earliest ending listing. A featured win grants bonus fame equal to 25% of the winning bid and the flag disappears with settlement.
- A season end settles listings, resets global progression/inventory, clears house auctions/orders, regenerates six orders per house, preserves deployments/houses, and clears redeploy cooldowns.

Seller identity and authenticity remain absent from live public auction projections. Coins and inventory remain owner-only.

## HTTP API

- `POST /api/register`: `{"username":"Ada_1","password":"correct horse"}`
- `POST /api/login`: the same shape
- `POST /admin/end-season`: requires `Authorization: Bearer <ADMIN_TOKEN>`

Usernames are case-insensitively unique, 3-20 ASCII letters/numbers/underscores. Passwords are 8-128 characters and stored as scrypt hashes with per-account salts.

## WebSocket protocol

Send `AUTH` first. The server replies with `AUTH_OK` and `HOUSE_LIST`. A new account has no player/deployment yet: send `DEPLOY`, then `JOIN` remains accepted for compatibility. Attempting `JOIN` without a deployment returns an `ERROR` directing the client to deploy first.

Client messages:

```json
{"type":"AUTH","token":"..."}
{"type":"DEPLOY","houseId":"house-1","characterId":"mara"}
{"type":"REDEPLOY","characterId":"mara","toHouseId":"house-2"}
{"type":"ENTER_HOUSE","houseId":"house-2"}
{"type":"HOUSE_LIST"}
{"type":"LIST_ITEM","itemId":"...","durationSec":30}
{"type":"BID","auctionId":"...","amount":50}
{"type":"FULFILL_ORDER","orderId":"...","itemIds":["..."]}
{"type":"USE_ABILITY","abilityId":"peek","auctionId":"..."}
```

Existing `OPEN_BOX`, `JOIN`, and `PING` messages remain supported. Game actions implicitly use the socket's active house.

Server messages include `AUTH_OK`, `WELCOME`, `HOUSE_LIST`, `STATE`, `PRIVATE`, `FEATURED`, `ANNOUNCEMENT`, `SEASON_END`, `ERROR`, and `PONG`. `STATE.publicState.houses` contains summaries for every house; `currentHouse` contains auctions, orders, and public deployments only for the active house.
