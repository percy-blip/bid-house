export type Category = "Art" | "Relic" | "Tech" | "Fashion" | "Oddity";
export interface HistoryEntry { owner: string; price: number; ts: number }
export interface Item { id: string; name: string; category: Category; tier: 1 | 2 | 3 | 4; tags: string[]; fake: boolean; history: HistoryEntry[] }
export interface PublicItem { id: string; name: string; category: Category; tier: 1 | 2 | 3 | 4; tags: string[]; art: string }
export interface Character { id: string; name: string; passive: string; mainAbility: string; traits: [string, string] }
export type AbilityKind = "peek" | "shield" | "refund" | "tax" | "block" | "reveal" | "coin" | "cooldown";
export interface AbilityDefinition { id: string; name: string; description: string; kind: AbilityKind; cooldownMs: number; maxUses?: number }
export interface OrderTemplate { tag?: string; category?: Category; tierMin: number; count: number; fakeAllowed: boolean }
export interface Order { id: string; template: OrderTemplate; reward: { fame: number; coins: number; xp: number }; fulfilledBy?: string }
export interface Bid { playerId: string; amount: number; ts: number }
export interface Auction { id: string; itemId: string; sellerId: string; bids: Bid[]; endsAt: number; featured: boolean; listingFeePaid: number; shield?: { playerId: string; until: number }; taxRate?: number; blocked?: string[] }
export interface Player { id: string; name: string; characterId: string; roster: string[]; bidderXp: Record<string, number>; movePenaltyUntil: Record<string, number>; coins: number; inventory: string[]; xp: number; fame: number; abilities: Record<string, { readyAt: number; uses: number }>; boxes: number; fameMilestones: number[]; stipendAwardedThisSeason: boolean; rookie: boolean; slipClaims: number[] }
export interface Account { id: string; username: string; usernameKey: string; passwordHash: string; salt: string; characterId?: string }
export interface AuthToken { token: string; playerId: string; expiresAt: number }
export interface Season { number: number; startedAt: number; endsAt: number; phase: "active" | "ending" | "break" }
export interface Deployment { playerId: string; characterId: string; xp: number; redeployCooldownUntil: number; houseId?: string }
export interface DeploymentView extends Deployment { houseId: string; level: number; xpPaused: boolean; cooldownMultiplier: number }
export interface HouseState { id: string; name: string; specialtyTag: string | null; feeRate: number; primeHour: number; auctions: Auction[]; orders: Order[]; deployments: Deployment[]; nextFeaturedAt: number }
export interface PublicPlayer { id: string; name: string; fame: number }
export interface PublicAuction { id: string; item: PublicItem; bids: Bid[]; endsAt: number; featured: boolean; currentBid: number; minBid: number }
export interface PublicDeployment extends DeploymentView { playerName: string; rookie: boolean }
export interface HouseSummary { id: string; name: string; specialtyTag: string | null; feeRate: number; primeHour: number; memberCount: number; heat: number; liveAuctions: number; liveOrders: number }
export interface PublicHouseDetail extends HouseSummary { auctions: PublicAuction[]; orders: Order[]; members: PublicDeployment[] }
export interface PublicState { houses: HouseSummary[]; currentHouse?: PublicHouseDetail; players: PublicPlayer[]; characters: Character[]; abilities: AbilityDefinition[]; season: Season; serverTime: number }
export interface PrivateState { player: Player; items: Item[]; peeked: Record<string, boolean>; deployments: DeploymentView[]; currentHouseId?: string; stipendAwarded?: number }
export interface MemberOrder { houseId: string; characterId: string; xpPaused: boolean; order: Order }
export interface MarketSale { saleId: string; templateKey: string; price: number; tags: string[]; settledAt: number; season: number }
export interface MarketTemplateSummary { templateKey: string; name: string; category: Category; tier: 1 | 2 | 3 | 4; count: number; averagePrice: number | null; lastPrice: number | null; lastSettledAt: number | null }
export interface MarketSummary { coverage: "current-season"; season: number; templates: MarketTemplateSummary[]; asOf: number }
export interface MarketHistory { coverage: "current-season"; season: number; templateKey: string; rows: MarketSale[]; nextCursor?: string; asOf: number }
export interface ServerConfig { boxPrice: number; listingDurationMinSec: number; listingDurationMaxSec: number; houseCap: number; maxDeploys: number; movePenaltyMs: number; bidderPullCost: number; levelCap: number; levelXpFactor: number; cooldownMinMultiplier: number; cooldownReductionPerLevel: number }
export interface GameSnapshot { schemaVersion: 3; accounts: Account[]; tokens: AuthToken[]; players: Player[]; items: Item[]; houses: HouseState[]; peeks: Array<[string, Array<[string, boolean]>]>; season: Season; marketLedger: MarketSale[]; settledAuctionIds: string[] }
export type ClientMessage =
  | { type: "AUTH"; token: string } | { type: "JOIN"; characterId?: string }
  | { type: "DEPLOY"; houseId: string; characterId: string } | { type: "REDEPLOY"; characterId: string; toHouseId: string } | { type: "RECALL"; characterId: string }
  | { type: "PULL_BIDDER" } | { type: "ENTER_HOUSE"; houseId: string } | { type: "HOUSE_LIST" } | { type: "OPEN_BOX" }
  | { type: "LIST_ITEM"; houseId?: string; itemId: string; durationSec: number } | { type: "BID"; houseId?: string; auctionId: string; amount: number }
  | { type: "FULFILL_ORDER"; houseId?: string; orderId: string; itemIds: string[] }
  | { type: "USE_ABILITY"; houseId?: string; abilityId: string; auctionId?: string; targetPlayerId?: string }
  | { type: "MEMBER_ORDERS" } | { type: "MARKET_SUMMARY" } | { type: "MARKET_HISTORY"; templateKey: string; cursor?: string; limit?: number } | { type: "CONFIG" } | { type: "PING" };
export type ServerMessage =
  | { type: "AUTH_OK"; playerId: string; needsCharacter: boolean } | { type: "WELCOME"; playerId: string; privateState: PrivateState }
  | { type: "HOUSE_LIST"; houses: HouseSummary[] } | { type: "STATE"; publicState: PublicState }
  | { type: "PRIVATE"; privateState: PrivateState; message?: string } | { type: "MEMBER_ORDERS"; orders: MemberOrder[] }
  | { type: "MARKET_SUMMARY"; summary: MarketSummary } | { type: "MARKET_HISTORY"; history: MarketHistory } | { type: "CONFIG"; config: ServerConfig }
  | { type: "FEATURED"; houseId: string; auctionId: string } | { type: "ANNOUNCEMENT"; message: string } | { type: "SEASON_END"; number: number }
  | { type: "PONG"; ts: number } | { type: "ERROR"; message: string };
