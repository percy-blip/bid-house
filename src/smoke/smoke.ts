import { spawn } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { GameState } from "../server/game.js";
import type { PrivateState, PublicState, ServerMessage } from "../shared/types.js";

const port=39001,httpBase=`http://127.0.0.1:${port}`,wsBase=`ws://127.0.0.1:${port}`;
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const dataDir=await mkdtemp(join(tmpdir(),"bid-house-smoke-")),statePath=join(dataDir,"state.json");
const server=spawn(process.execPath,["dist/server/server.js"],{env:{...process.env,PORT:String(port),DATA_DIR:dataDir,ADMIN_TOKEN:"smoke-admin",SEASON_LENGTH_HOURS:"1"},stdio:["ignore","pipe","pipe"]});
let serverLog="";server.stdout.on("data",d=>serverLog+=String(d));server.stderr.on("data",d=>serverLog+=String(d));

class Bot{
  ws=new WebSocket(wsBase);privateState?:PrivateState;state?:PublicState;errors:string[]=[];messages:string[]=[];seasonEnds:number[]=[];
  constructor(readonly token:string,readonly characterId:string){}
  listen(){this.ws.on("message",raw=>{const m=JSON.parse(String(raw)) as ServerMessage;if(m.type==="WELCOME"||m.type==="PRIVATE")this.privateState=m.privateState;if(m.type==="STATE")this.state=m.publicState;if(m.type==="ERROR")this.errors.push(m.message);if(m.type==="PRIVATE"&&m.message)this.messages.push(m.message);if(m.type==="SEASON_END")this.seasonEnds.push(m.number);});}
  async ready(){await new Promise<void>((resolve,reject)=>{this.ws.once("open",()=>{this.send({type:"AUTH",token:this.token});resolve();});this.ws.once("error",reject);});await this.until(()=>!!this.state);this.send({type:"JOIN",characterId:this.characterId});await this.until(()=>!!this.privateState);}
  send(m:object){this.ws.send(JSON.stringify(m));}
  async until(ok:()=>boolean,timeout=8000){const end=Date.now()+timeout;while(Date.now()<end){if(ok())return;await wait(50);}throw new Error("Timed out waiting for WebSocket state");}
}
async function post(path:string,body:object,token?:string){const response=await fetch(httpBase+path,{method:"POST",headers:{"content-type":"application/json",...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {status:response.status,body:await response.json() as Record<string,unknown>};}
async function stopServer(){if(server.exitCode===null){server.kill("SIGTERM");await Promise.race([new Promise<void>(resolve=>server.once("exit",()=>resolve())),wait(6000)]);}}

async function run(){
  let a:Bot|undefined,b:Bot|undefined;
  try{
    while(!serverLog.includes("listening")){if(server.exitCode!==null)throw new Error(`Server exited early: ${serverLog}`);await wait(30);}
    const regA=await post("/api/register",{username:"SmokeSeller",password:"correct-horse-a"});
    const regB=await post("/api/register",{username:"SmokeBuyer",password:"correct-horse-b"});
    if(regA.status!==200||regB.status!==200)throw new Error("Could not register two users");
    const wrong=await post("/api/login",{username:"SmokeSeller",password:"wrong-password"});
    if(wrong.status===200||typeof wrong.body.error!=="string")throw new Error("Wrong password was not rejected with JSON error");
    const seller=new Bot(String(regA.body.token),"mara"),buyer=new Bot(String(regB.body.token),"brick");a=seller;b=buyer;seller.listen();buyer.listen();await Promise.all([seller.ready(),buyer.ready()]);
    if(!seller.state?.season||seller.state.season.endsAt<=seller.state.serverTime)throw new Error("Season countdown missing from public state");
    seller.send({type:"OPEN_BOX"});buyer.send({type:"OPEN_BOX"});
    await Promise.all([seller.until(()=>seller.privateState?.items.length===1),buyer.until(()=>buyer.privateState?.items.length===1)]);
    seller.send({type:"USE_ABILITY",abilityId:"stipend"});await seller.until(()=>seller.privateState?.player.coins===520);
    await wait(2300);await access(statePath);
    const restored=await GameState.load(statePath);
    const restoredA=restored.players.get(String(regA.body.playerId)),restoredB=restored.players.get(String(regB.body.playerId));
    if(restoredA?.inventory.length!==1||restoredB?.inventory.length!==1||restoredA.coins!==520||restoredB.coins!==500)throw new Error("Restart simulation did not preserve both inventories and coin balances");
    const listedItem=seller.privateState!.items[0]!;seller.send({type:"LIST_ITEM",itemId:listedItem.id,durationSec:30});await buyer.until(()=>!!buyer.state?.auctions.some(x=>x.item.id===listedItem.id));
    const publicAuction=buyer.state!.auctions.find(x=>x.item.id===listedItem.id)!;if("fake" in publicAuction.item||"sellerId" in publicAuction)throw new Error("Public auction leaked authenticity or seller identity");
    const oldSeason=seller.state.season.number;
    const ended=await post("/admin/end-season",{},"smoke-admin");if(ended.status!==200)throw new Error("Admin season end failed");
    await Promise.all([seller.until(()=>seller.state?.season.number===oldSeason+1&&seller.privateState?.player.inventory.length===0),buyer.until(()=>buyer.state?.season.number===oldSeason+1&&buyer.privateState?.player.inventory.length===0)]);
    for(const bot of [seller,buyer]){const p=bot.privateState!.player;if(p.coins!==500||p.xp!==0||p.fame!==0||p.boxes!==2)throw new Error("Season reset did not restore stipend/progression/inventory/boxes");}
    if(!seller.seasonEnds.includes(oldSeason+1)||seller.errors.length||buyer.errors.length)throw new Error(`Protocol errors or missing SEASON_END: ${[...seller.errors,...buyer.errors].join(", ")}`);
    console.log("SMOKE PASS: registered 2 users; wrong password rejected; AUTH+JOIN succeeded; 2 boxes opened; debounced state.json created; fresh GameState reload preserved both users’ items and coins; public season countdown and auction privacy verified; admin end-season settled live lots, emitted SEASON_END, incremented season, and reset coins/xp/fame/inventory/boxes; 0 protocol errors.");
  }finally{a?.ws.close();b?.ws.close();await stopServer();await rm(dataDir,{recursive:true,force:true});}
}
run().catch(e=>{console.error("SMOKE FAIL:",e);console.error(serverLog);process.exitCode=1;});
