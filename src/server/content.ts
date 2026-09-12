import type { AbilityDefinition, Category, Character } from "../shared/types.js";

export const CATEGORIES: Category[] = ["Art", "Relic", "Tech", "Fashion", "Oddity"];
export const TAGS = ["vintage", "royal", "cursed", "signed", "neon", "tiny", "space", "handmade", "rare", "lucky", "mysterious", "pristine"];
export const NAMES: Record<Category, string[]> = {
  Art: ["Sketch", "Portrait", "Canvas", "Masterpiece"], Relic: ["Coin", "Idol", "Crown", "Ark"],
  Tech: ["Pager", "Drone", "Android", "Quantum Core"], Fashion: ["Scarf", "Jacket", "Gown", "Regalia"],
  Oddity: ["Spoon", "Orb", "Meteor", "Impossible Egg"]
};
const defs: Array<[string, string, string, AbilityDefinition["kind"], number, number?]> = [
  ["peek","Insider Peek","Reveal authenticity of one auction item to you.","peek",30000],
  ["bid-shield","Bid Shield","Protect your leading bid from being exceeded for 10 seconds.","shield",45000],
  ["refund","Clean Exit","Cancel and release your latest leading bid.","refund",60000,2],
  ["tax","House Tax","Winner pays an extra 10% to the house.","tax",60000,2],
  ["block","Velvet Rope","Block one player from bidding on an auction.","block",60000,2],
  ["appraise","Appraise","Reveal authenticity like an appraisal.","reveal",40000],
  ["stipend","Pocket Change","Gain 20 coins.","coin",60000], ["refresh","Second Wind","Reduce your cooldowns.","cooldown",90000,1],
  ["hunch","Collector's Hunch","Peek at an auction.","peek",45000], ["bulwark","Iron Paddle","Shield your bid.","shield",55000],
  ["retract","Take It Back","Refund your leading bid.","refund",70000], ["surtax","Fine Print","Tax an auction.","tax",70000],
  ["ban","Black Book","Block a rival.","block",70000], ["inspect","White Gloves","Appraise an auction.","reveal",50000],
  ["allowance","Rainy Day Fund","Gain 20 coins.","coin",75000], ["tempo","Quick Study","Reduce cooldowns.","cooldown",100000,1],
  ["xray","X-Ray Eye","Peek at an auction.","peek",50000], ["fortify","Fortified Offer","Shield your bid.","shield",65000],
  ["void","Void Clause","Refund your bid.","refund",80000,1], ["levy","Luxury Levy","Tax an auction.","tax",80000,1]
];
export const ABILITIES: AbilityDefinition[] = defs.map(([id,name,description,kind,cooldownMs,maxUses]) => maxUses === undefined ? {id,name,description,kind,cooldownMs} : {id,name,description,kind,cooldownMs,maxUses});
export const CHARACTERS: Character[] = [
  {id:"mara",name:"Mara Voss",passive:"Reads every room.",mainAbility:"peek",traits:["stipend","refresh"]},
  {id:"brick",name:"Brick Sterling",passive:"Never folds early.",mainAbility:"bid-shield",traits:["hunch","allowance"]},
  {id:"june",name:"June Ledger",passive:"Knows every clause.",mainAbility:"refund",traits:["inspect","tempo"]},
  {id:"rex",name:"Rex Gavel",passive:"The house remembers.",mainAbility:"tax",traits:["bulwark","xray"]},
  {id:"nia",name:"Nia Noir",passive:"Keeps a private list.",mainAbility:"block",traits:["retract","fortify"]},
  {id:"sol",name:"Sol Provenance",passive:"Trust, but verify.",mainAbility:"appraise",traits:["surtax","void"]}
];
