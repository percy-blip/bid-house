import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { ABILITIES, CATEGORIES, CHARACTERS, NAMES, TAGS } from "./content.js";
import type { Account, Auction, AuthToken, ClientMessage, GameSnapshot, Item, Order, Player, PrivateState, PublicState, Season } from "../shared/types.js";

const scrypt = promisify(scryptCallback);
const fakeRates = [0, .1, .25, .5, .7];
const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const ENDING_WARNING_MS = 5 * 60 * 1000;
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!;
const abilityIds = (p: Player): string[] => { const c=CHARACTERS.find(x=>x.id===p.characterId)!; return [c.mainAbility,...c.traits]; };

export class GameError extends Error {}
export class GameState {
  readonly accounts = new Map<string, Account>();
  readonly tokens = new Map<string, AuthToken>();
  readonly players = new Map<string, Player>();
  readonly items = new Map<string, Item>();
  readonly auctions = new Map<string, Auction>();
  readonly orders = new Map<string, Order>();
  readonly peeks = new Map<string, Map<string, boolean>>();
  season: Season;
  private readonly seasonLengthMs: number;

  constructor(private readonly onMutation: () => void = () => {}, seasonLengthHours=672, snapshot?: GameSnapshot) {
    this.seasonLengthMs = Math.max(1 / 3600, seasonLengthHours) * 60 * 60 * 1000;
    const now=Date.now();
    this.season={number:1,startedAt:now,endsAt:now+this.seasonLengthMs,phase:"active"};
    if(snapshot)this.restore(snapshot);else for(let i=0;i<6;i++)this.addOrder();
  }
  static async load(path:string,onMutation:()=>void=()=>{},seasonLengthHours=672):Promise<GameState>{
    const parsed=JSON.parse(await readFile(path,"utf8")) as GameSnapshot;
    if(parsed.schemaVersion!==1)throw new Error("Unsupported state schema");
    return new GameState(onMutation,seasonLengthHours,parsed);
  }
  private restore(s:GameSnapshot):void {
    for(const x of s.accounts)this.accounts.set(x.id,x);
    for(const x of s.tokens)if(x.expiresAt>Date.now())this.tokens.set(x.token,x);
    for(const x of s.players)this.players.set(x.id,x);
    for(const x of s.items)this.items.set(x.id,x);
    for(const x of s.auctions)this.auctions.set(x.id,x);
    for(const x of s.orders)this.orders.set(x.id,x);
    for(const [pid,entries] of s.peeks)this.peeks.set(pid,new Map(entries));
    this.season=s.season;
    if(!this.orders.size)for(let i=0;i<6;i++)this.addOrder();
  }
  snapshot():GameSnapshot{return {schemaVersion:1,accounts:[...this.accounts.values()],tokens:[...this.tokens.values()],players:[...this.players.values()],items:[...this.items.values()],auctions:[...this.auctions.values()],orders:[...this.orders.values()],peeks:[...this.peeks].map(([id,p])=>[id,[...p]]),season:this.season};}
  private changed():void{this.onMutation();}
  private tier(): 1|2|3|4 { const r=Math.random(); return r<.55?1:r<.82?2:r<.96?3:4; }
  private makeItem(owner: string): Item { const tier=this.tier(), category=pick(CATEGORIES), tagCount=Math.random()<.5?2:3; const tags=[...TAGS].sort(()=>Math.random()-.5).slice(0,tagCount); return {id:randomUUID(),name:`${["Plain","Fine","Exquisite","Legendary"][tier-1]} ${NAMES[category][tier-1]}`,category,tier,tags,fake:Math.random()<fakeRates[tier]!,history:[{owner,price:0,ts:Date.now()}]}; }
  private addOrder(): void { const category=pick(CATEGORIES), tierMin=(Math.random()<.75?1:2), fakeAllowed=Math.random()<.65; const template=Math.random()<.5?{category,tierMin,count:1,fakeAllowed}:{tag:pick(TAGS),tierMin,count:1,fakeAllowed}; const mult=tierMin+(fakeAllowed?0:1); const o:Order={id:randomUUID(),template,reward:{coins:80*mult,fame:100*mult,xp:50*mult}}; this.orders.set(o.id,o); }
  async register(username:string,password:string):Promise<{token:string;playerId:string}>{
    const clean=validateCredentials(username,password),key=clean.toLowerCase();
    if([...this.accounts.values()].some(a=>a.usernameKey===key))throw new GameError("Username is already registered");
    const salt=randomBytes(16).toString("hex"),hash=await passwordHash(password,salt),id=randomUUID();
    this.accounts.set(id,{id,username:clean,usernameKey:key,passwordHash:hash,salt});
    const token=this.issueToken(id);this.changed();return {token,playerId:id};
  }
  async login(username:string,password:string):Promise<{token:string;playerId:string}>{
    const key=username.trim().toLowerCase(),account=[...this.accounts.values()].find(a=>a.usernameKey===key);
    if(!account)throw new GameError("Invalid username or password");
    const candidate=Buffer.from(await passwordHash(password,account.salt),"hex"),stored=Buffer.from(account.passwordHash,"hex");
    if(candidate.length!==stored.length||!timingSafeEqual(candidate,stored))throw new GameError("Invalid username or password");
    const token=this.issueToken(account.id);this.changed();return {token,playerId:account.id};
  }
  private issueToken(playerId:string):string{const token=randomBytes(32).toString("hex");this.tokens.set(token,{token,playerId,expiresAt:Date.now()+TOKEN_LIFETIME_MS});return token;}
  authenticate(token:string):{account:Account;player?:Player}{
    const session=this.tokens.get(token);
    if(!session||session.expiresAt<=Date.now()){if(session){this.tokens.delete(token);this.changed();}throw new GameError("Invalid or expired token");}
    session.expiresAt=Date.now()+TOKEN_LIFETIME_MS;const account=this.accounts.get(session.playerId);
    if(!account)throw new GameError("Account not found");this.changed();const player=this.players.get(account.id);return player?{account,player}:{account};
  }
  join(playerId:string,characterId:string):Player{
    const account=this.accounts.get(playerId);if(!account)throw new GameError("Authenticate first");
    const old=this.players.get(playerId);if(old)return old;
    if(!CHARACTERS.some(c=>c.id===characterId))throw new GameError("Unknown character");
    account.characterId=characterId;const p:Player={id:account.id,name:account.username,characterId,coins:500,inventory:[],xp:0,fame:0,abilities:{},boxes:2,fameMilestones:[]};
    for(const id of abilityIds(p))p.abilities[id]={readyAt:0,uses:0};this.players.set(p.id,p);this.peeks.set(p.id,new Map());this.changed();return p;
  }
  private player(id:string):Player { const p=this.players.get(id);if(!p)throw new GameError("Choose a character first");return p; }
  openBox(pid:string):Item { const p=this.player(pid);if(p.boxes>0)p.boxes--;else {if(p.coins<100)throw new GameError("Not enough coins");p.coins-=100;} const item=this.makeItem(p.name);this.items.set(item.id,item);p.inventory.push(item.id);this.changed();return item; }
  list(pid:string,itemId:string,durationSec:number):Auction { const p=this.player(pid);if(!p.inventory.includes(itemId))throw new GameError("Item is not in your inventory"); if(!Number.isFinite(durationSec))throw new GameError("Invalid duration"); p.inventory=p.inventory.filter(x=>x!==itemId);const a:Auction={id:randomUUID(),itemId,sellerId:pid,bids:[],endsAt:Date.now()+Math.min(3600,Math.max(2,durationSec))*1000,featured:false,blocked:[]};this.auctions.set(a.id,a);this.changed();return a; }
  bid(pid:string,auctionId:string,amount:number):void { const p=this.player(pid),a=this.auctions.get(auctionId);if(!a||a.endsAt<=Date.now())throw new GameError("Auction is closed");if(a.sellerId===pid)throw new GameError("You cannot bid on your own item");if(a.blocked?.includes(pid))throw new GameError("You are blocked from this auction"); const top=a.bids.at(-1);if(a.shield&&a.shield.until>Date.now()&&a.shield.playerId!==pid)throw new GameError("Leading bid is shielded");const min=top?Math.max(top.amount+10,Math.ceil(top.amount*1.05)):10;if(!Number.isInteger(amount)||amount<min)throw new GameError(`Minimum bid is ${min}`);if(p.coins<amount)throw new GameError("Not enough coins");a.bids.push({playerId:pid,amount,ts:Date.now()});if(a.endsAt-Date.now()<=5000)a.endsAt=Date.now()+5000;this.changed(); }
  fulfill(pid:string,orderId:string,itemIds:string[]):void { const p=this.player(pid),o=this.orders.get(orderId);if(!o||o.fulfilledBy)throw new GameError("Order is no longer available");if(itemIds.length!==o.template.count||new Set(itemIds).size!==itemIds.length)throw new GameError("Wrong item count");const chosen=itemIds.map(id=>{if(!p.inventory.includes(id))throw new GameError("Item is not in your inventory");return this.items.get(id)!;});if(!chosen.every(i=>(!o.template.category||i.category===o.template.category)&&(!o.template.tag||i.tags.includes(o.template.tag))&&i.tier>=o.template.tierMin&&(o.template.fakeAllowed||!i.fake)))throw new GameError("Items do not match order");o.fulfilledBy=pid;for(const i of chosen){p.inventory=p.inventory.filter(id=>id!==i.id);this.items.delete(i.id);}p.coins+=o.reward.coins;p.fame+=o.reward.fame;p.xp+=o.reward.xp;for(const m of [500,1500,4000])if(p.fame>=m&&!p.fameMilestones.includes(m)){p.fameMilestones.push(m);p.coins+=m===500?100:m===1500?300:800;}this.orders.delete(orderId);this.addOrder();this.changed(); }
  useAbility(pid:string,msg:Extract<ClientMessage,{type:"USE_ABILITY"}>):string { const p=this.player(pid),def=ABILITIES.find(a=>a.id===msg.abilityId);if(!def||!abilityIds(p).includes(def.id))throw new GameError("Ability is not equipped");const cd=p.abilities[def.id]!;if(cd.readyAt>Date.now())throw new GameError("Ability is cooling down");if(def.maxUses!==undefined&&cd.uses>=def.maxUses)throw new GameError("No uses remaining");const a=msg.auctionId?this.auctions.get(msg.auctionId):undefined; if(["peek","reveal","shield","refund","tax","block"].includes(def.kind)&&!a)throw new GameError("Choose a live auction");
    if(def.kind==="peek"||def.kind==="reveal"){this.peeks.get(pid)!.set(a!.itemId,this.items.get(a!.itemId)!.fake);} else if(def.kind==="shield"){const top=a!.bids.at(-1);if(!top||top.playerId!==pid)throw new GameError("You must lead this auction");a!.shield={playerId:pid,until:Date.now()+10000};} else if(def.kind==="refund"){const top=a!.bids.at(-1);if(!top||top.playerId!==pid)throw new GameError("You have no leading bid to refund");a!.bids.pop();} else if(def.kind==="tax")a!.taxRate=.1; else if(def.kind==="block"){if(!msg.targetPlayerId||msg.targetPlayerId===pid||msg.targetPlayerId===a!.sellerId)throw new GameError("Choose another bidder");a!.blocked=[...(a!.blocked??[]),msg.targetPlayerId];} else if(def.kind==="coin")p.coins+=20;else if(def.kind==="cooldown")for(const state of Object.values(p.abilities))state.readyAt=Math.max(Date.now(),state.readyAt-30000);
    cd.readyAt=Date.now()+def.cooldownMs;cd.uses++;this.changed();return `${def.name} used`;
  }
  settle(cutoff=Date.now(),settledAt=cutoff):string[] { const notes:string[]=[];for(const a of [...this.auctions.values()])if(a.endsAt<=cutoff){const seller=this.player(a.sellerId),item=this.items.get(a.itemId)!;const top=a.bids.at(-1);if(top){const buyer=this.player(top.playerId),extra=Math.ceil(top.amount*(a.taxRate??0));if(buyer.coins>=top.amount+extra){buyer.coins-=top.amount+extra;seller.coins+=Math.floor(top.amount*.95);buyer.inventory.push(item.id);item.history.push({owner:buyer.name,price:top.amount,ts:settledAt});notes.push(`${item.name} sold for ${top.amount}`);}else{seller.inventory.push(item.id);notes.push(`${item.name} returned: winner lacked funds`);}}else seller.inventory.push(item.id);this.auctions.delete(a.id);}if(notes.length)this.changed();return notes; }
  promote():string|undefined { let best:Auction|undefined;for(const a of this.auctions.values()){a.featured=false;if(!best||this.items.get(a.itemId)!.tier>this.items.get(best.itemId)!.tier)best=a;}if(best){best.featured=true;this.changed();return `${this.items.get(best.itemId)!.name} is now featured!`;}return undefined; }
  tickSeason(now=Date.now()):{warning:boolean;ended?:number;settlements:string[]}{
    let warning=false;if(this.season.phase==="active"&&now>=this.season.endsAt-ENDING_WARNING_MS){this.season.phase="ending";warning=true;this.changed();}
    if(now<this.season.endsAt)return {warning,settlements:[]};const settlements=this.endSeason(now);return {warning,ended:this.season.number,settlements};
  }
  forceEndSeason(now=Date.now()):{number:number;settlements:string[]}{const settlements=this.endSeason(now);return {number:this.season.number,settlements};}
  private endSeason(now:number):string[]{const settlements=this.settle(Number.POSITIVE_INFINITY,now);this.items.clear();this.auctions.clear();this.orders.clear();this.peeks.clear();for(const p of this.players.values()){p.coins=500;p.xp=0;p.fame=0;p.inventory=[];p.boxes=2;p.fameMilestones=[];p.abilities={};for(const id of abilityIds(p))p.abilities[id]={readyAt:0,uses:0};this.peeks.set(p.id,new Map());}for(let i=0;i<6;i++)this.addOrder();this.season={number:this.season.number+1,startedAt:now,endsAt:now+this.seasonLengthMs,phase:"active"};this.changed();return settlements;}
  privateState(pid:string):PrivateState { const p=this.player(pid);return {player:p,items:p.inventory.map(id=>this.items.get(id)!).filter(Boolean),peeked:Object.fromEntries(this.peeks.get(pid)??[])}; }
  publicState():PublicState { return {players:[...this.players.values()].map(({id,name,characterId,xp,fame})=>({id,name,characterId,xp,fame})),auctions:[...this.auctions.values()].map(a=>{const {fake:_,...item}=this.items.get(a.itemId)!;const currentBid=a.bids.at(-1)?.amount??0;return {id:a.id,item,bids:a.bids,endsAt:a.endsAt,featured:a.featured,currentBid,minBid:currentBid?Math.max(currentBid+10,Math.ceil(currentBid*1.05)):10};}),orders:[...this.orders.values()],characters:CHARACTERS,abilities:ABILITIES,season:this.season,serverTime:Date.now()}; }
}

function validateCredentials(username:string,password:string):string{const clean=typeof username==="string"?username.trim():"";if(!/^[A-Za-z0-9_]{3,20}$/.test(clean))throw new GameError("Username must be 3-20 characters using letters, numbers, or underscores");if(typeof password!=="string"||password.length<8||password.length>128)throw new GameError("Password must be 8-128 characters");return clean;}
async function passwordHash(password:string,salt:string):Promise<string>{return Buffer.from(await scrypt(password,salt,64) as Buffer).toString("hex");}
