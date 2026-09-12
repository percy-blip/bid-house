import { spawn } from "node:child_process";
import { mkdtemp,rm,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GameError,GameState } from "../server/game.js";
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms)),port=39001,dataDir=await mkdtemp(join(tmpdir(),"bid-house-smoke-")),statePath=join(dataDir,"state.json");
const server=spawn(process.execPath,["dist/server/server.js"],{env:{...process.env,PORT:String(port),DATA_DIR:dataDir,ADMIN_TOKEN:"smoke-admin",SEASON_LENGTH_HOURS:"1",HOUSE_CAP:"1",MAX_DEPLOYS:"3",FEATURED_INTERVAL_MINUTES:"0.001"},stdio:["ignore","pipe","pipe"]});
let log="";server.stdout.on("data",d=>log+=String(d));server.stderr.on("data",d=>log+=String(d));
const check=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
async function run(){try{
 while(!log.includes("listening")){if(server.exitCode!==null)throw new Error(`Server exited early: ${log}`);await wait(20);}
 const initial=await fetch(`http://127.0.0.1:${port}`);check(initial.ok,"Server boot failed");
 const game=new GameState(()=>{},1,undefined,{houseCap:1,maxDeploys:3,featuredIntervalMinutes:.001});check(game.houses.size===1&&game.houses.has("house-1"),"Boot did not create house 1");
 const a=await game.register("SmokeSeller","correct-horse-a"),b=await game.register("SmokeBuyer","correct-horse-b");
 let joinBlocked=false;try{game.join(a.playerId);}catch(e){joinBlocked=e instanceof GameError&&e.message.includes("Deploy");}check(joinBlocked,"JOIN did not require deployment");
 game.deploy(a.playerId,"house-1","mara");check(game.join(a.playerId).id===a.playerId,"Register/deploy/JOIN failed");
 const item=game.openBox(a.playerId),listed=game.list(a.playerId,"house-1",item.id,30);check(listed.spawned&&game.houses.size===2,"At-cap listing did not spawn house 2");
 game.deploy(a.playerId,"house-2","brick");check(game.deployments(a.playerId).length===2,"Different character could not deploy to house 2");
 game.deploy(b.playerId,"house-1","june");game.redeploy(b.playerId,"june","house-2");const cooldown=game.deployments(b.playerId)[0]!.redeployCooldownUntil;check(cooldown>=Date.now()+86390000,"Redeploy did not set a 24h cooldown");
 let abilityBlocked=false;try{game.useAbility(b.playerId,"house-2",{type:"USE_ABILITY",abilityId:"refund",auctionId:listed.auction.id});}catch(e){abilityBlocked=e instanceof GameError&&e.message.includes("cooldown");}check(abilityBlocked,"Ability was not blocked during redeploy cooldown");
 const h1=game.houses.get("house-1")!;const buyer=game.players.get(b.playerId)!;h1.deployments.push({playerId:b.playerId,characterId:"june",xp:0,redeployCooldownUntil:0});game.bid(b.playerId,"house-1",listed.auction.id,100);const promoted=game.promoteHouse("house-1");check(promoted?.id===listed.auction.id&&promoted.featured,"Featured tick did not promote auction");listed.auction.endsAt=Date.now()-1;game.settle();check(buyer.fame===25,"Featured win did not pay +25% fame bonus");
 const specialty=game.houses.get("house-2")!;specialty.specialtyTag="royal";specialty.orders=[];game.forceEndSeason();check(specialty.orders.filter(o=>o.template.tag==="royal").length>=3,"Specialty order bias missing");
 const beforeHouses=game.houses.size,beforeDeploys=game.deployments(a.playerId).length;specialty.deployments[0]!.redeployCooldownUntil=Date.now()+86400000;const oldSeason=game.season.number;game.forceEndSeason();check(game.houses.size===beforeHouses&&game.deployments(a.playerId).length===beforeDeploys&&game.season.number===oldSeason+1,"Season did not preserve houses/deployments");check([...game.houses.values()].every(h=>h.auctions.length===0&&h.orders.length===6&&h.deployments.every(d=>d.redeployCooldownUntil===0)),"Season house reset/regeneration failed");
 await writeFile(statePath,JSON.stringify(game.snapshot()),"utf8");const restored=await GameState.load(statePath,()=>{},1,{houseCap:1,maxDeploys:3,featuredIntervalMinutes:.001});check(restored.houses.size===game.houses.size&&restored.deployments(a.playerId).length===beforeDeploys,"Persistence lost houses or deployments");
 const pub=restored.publicState(a.playerId,"house-1");check(pub.houses.length===beforeHouses&&!!pub.currentHouse&&!pub.currentHouse.auctions.some(x=>"fake" in x.item||"sellerId" in x),"Public state shape/privacy failed");
 console.log("SMOKE PASS: house 1 booted; registration and deployment succeeded; JOIN-before-deploy rejected; HOUSE_CAP=1 listing spawned house 2; second character deployed cross-house; redeploy set a 24h cooldown and blocked abilities; featured promotion settled with +25 fame; specialty orders met 50% bias; season reset kept houses/deployments, cleared cooldowns, and regenerated 6 orders per house; schema-v2 persistence preserved houses/deployments; public house detail preserved seller/fake privacy.");
 }finally{if(server.exitCode===null){server.kill("SIGTERM");await Promise.race([new Promise<void>(r=>server.once("exit",()=>r())),wait(5000)]);}await rm(dataDir,{recursive:true,force:true});}}
run().catch(e=>{console.error("SMOKE FAIL:",e);console.error(log);process.exitCode=1;});
