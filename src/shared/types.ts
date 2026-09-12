export type Category = "Art" | "Relic" | "Tech" | "Fashion" | "Oddity";
export interface HistoryEntry { owner: string; price: number; ts: number }
export interface Item { id: string; name: string; category: Category; tier: 1 | 2 | 3 | 4; tags: string[]; fake: boolean; history: HistoryEntry[] }
export interface PublicItem extends Omit<Item, "fake"> {}
export interface Character { id: string; name: string; passive: string; mainAbility: string; traits: [string, string] }
export type AbilityKind = "peek" | "shield" | "refund" | "tax" | "block" | "reveal" | "coin" | "cooldown";
export interface AbilityDefinition { id: string; name: string; description: string; kind: AbilityKind; cooldownMs: number; maxUses?: number }
export interface OrderTemplate { tag?: string; category?: Category; tierMin: number; count: number; fakeAllowed: boolean }
export interface Order { id: string; template: OrderTemplate; reward: { fame: number; coins: number; xp: number }; fulfilledBy?: string }
export interface Bid { playerId: string; amount: number; ts: number }
export interface Auction { id: string; itemId: string; sellerId: string; bids: Bid[]; endsAt: number; featured: boolean; shield?: { playerId: string; until: number }; taxRate?: number; blocked?: string[] }
export interface Player { id: string; name: string; characterId: string; coins: number; inventory: string[]; xp: number; fame: number; abilities: Record<string, { readyAt: number; uses: number }>; boxes: number; fameMilestones: number[] }
export interface Account { id: string; username: string; usernameKey: string; passwordHash: string; salt: string; characterId?: string }
export interface AuthToken { token: string; playerId: string; expiresAt: number }
export interface Season { number: number; startedAt: number; endsAt: number; phase: "active" | "ending" | "break" }
export interface PublicPlayer { id: string; name: string; characterId: string; xp: number; fame: number }
export interface PublicAuction { id: string; item: PublicItem; bids: Bid[]; endsAt: number; featured: boolean; currentBid: number; minBid: number }
export interface PublicState { players: PublicPlayer[]; auctions: PublicAuction[]; orders: Order[]; characters: Character[]; abilities: AbilityDefinition[]; season: Season; serverTime: number }
export interface PrivateState { player: Player; items: Item[]; peeked: Record<string, boolean> }
export interface GameSnapshot { schemaVersion: 1; accounts: Account[]; tokens: AuthToken[]; players: Player[]; items: Item[]; auctions: Auction[]; orders: Order[]; peeks: Array<[string, Array<[string, boolean]>]>; season: Season }
export type ClientMessage =
  | { type: "AUTH"; token: string }
  | { type: "JOIN"; characterId: string }
  | { type: "OPEN_BOX" }
  | { type: "LIST_ITEM"; itemId: string; durationSec: number }
  | { type: "BID"; auctionId: string; amount: number }
  | { type: "FULFILL_ORDER"; orderId: string; itemIds: string[] }
  | { type: "USE_ABILITY"; abilityId: string; auctionId?: string; targetPlayerId?: string }
  | { type: "PING" };
export type ServerMessage =
  | { type: "AUTH_OK"; playerId: string; needsCharacter: boolean }
  | { type: "WELCOME"; playerId: string; privateState: PrivateState }
  | { type: "STATE"; publicState: PublicState }
  | { type: "PRIVATE"; privateState: PrivateState; message?: string }
  | { type: "ANNOUNCEMENT"; message: string }
  | { type: "SEASON_END"; number: number }
  | { type: "PONG"; ts: number }
  | { type: "ERROR"; message: string };
