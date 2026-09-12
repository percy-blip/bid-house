# Bid House

Bid House is a server-authoritative multiplayer auction game MVP. Open mystery boxes, list finds anonymously, compete in timed English auctions, fulfill public collector orders, and bend the market with character abilities.

## Run

Requires Node.js 20 or newer.

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000`. Set `PORT` to use another port. `npm run dev` runs TypeScript in watch mode beside the Node watcher. `npm run smoke` builds, starts an isolated server, and exercises two WebSocket bots through the core loop.

## Rules

- Each player begins with 500 coins and two free boxes; later boxes cost 100 coins.
- Boxes roll tiers 1–4 from common to rare. Fake chances are 10%, 25%, 50%, and 70% respectively. Only an item's owner (or a successful peek) sees authenticity.
- Listings run for the chosen duration. Bids rise by at least 10 coins or 5%, whichever is greater. A bid in the last five seconds resets the clock to five seconds.
- The winner pays the bid, receives the item and its authenticity, and the seller receives 95%. Item provenance is public.
- Orders atomically consume matching inventory and grant coins, XP, and fame. Fame milestones at 500, 1500, and 4000 add coin bonuses.
- Each of six characters equips one main ability and two traits from a registry of 20. Cooldowns and limited uses are server-owned.
- Every 15 minutes the highest-tier live lot is marked featured.

All state is ephemeral and is lost when the server restarts.

## WebSocket protocol

Connect to the same host and send JSON. Client intents are `JOIN`, `OPEN_BOX`, `LIST_ITEM`, `BID`, `FULFILL_ORDER`, `USE_ABILITY`, and `PING`. `JOIN` accepts `name`, `characterId`, and an optional stored `playerId` for reconnection.

The server replies with `WELCOME`, throttled `STATE` broadcasts, owner-only `PRIVATE` updates, `ANNOUNCEMENT`, `ERROR`, and `PONG`. Active public auction records contain a public item projection and never contain `fake` or `sellerId`.

Representative payloads:

```json
{"type":"JOIN","name":"Ada","characterId":"mara"}
{"type":"LIST_ITEM","itemId":"…","durationSec":30}
{"type":"BID","auctionId":"…","amount":50}
{"type":"USE_ABILITY","abilityId":"peek","auctionId":"…"}
```
