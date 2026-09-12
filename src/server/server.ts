import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer,WebSocket } from "ws";
import { GameError,GameState } from "./game.js";
import type { ClientMessage,ServerMessage } from "../shared/types.js";

const port=Number(process.env.PORT??3000);
const dataDir=resolve(process.env.DATA_DIR??"./data");
const statePath=join(dataDir,"state.json");
const root=fileURLToPath(new URL("../client/",import.meta.url));
const seasonHours=Number(process.env.SEASON_LENGTH_HOURS??672);
let saveTimer:ReturnType<typeof setTimeout>|undefined;
let game!:GameState;
const scheduleSave=()=>{if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(()=>void saveState(),2000);};
try{game=await GameState.load(statePath,scheduleSave,seasonHours);console.log(`Loaded state from ${statePath}`);}catch(e){console.warn(`Starting fresh: could not load ${statePath} (${e instanceof Error?e.message:"unknown error"})`);game=new GameState(scheduleSave,seasonHours);}
async function saveState():Promise<void>{if(saveTimer){clearTimeout(saveTimer);saveTimer=undefined;}await mkdir(dataDir,{recursive:true});const temp=`${statePath}.tmp`;await writeFile(temp,JSON.stringify(game.snapshot()),"utf8");await rename(temp,statePath);}

const sessions=new Map<WebSocket,string>();
const http=createServer(async(req,res)=>{try{
  const url=new URL(req.url??"/","http://localhost");
  if(req.method==="POST"&&(url.pathname==="/api/register"||url.pathname==="/api/login")){const body=await jsonBody(req),result=url.pathname.endsWith("register")?await game.register(stringField(body,"username"),stringField(body,"password")):await game.login(stringField(body,"username"),stringField(body,"password"));return json(res,200,result);}
  if(req.method==="POST"&&url.pathname==="/admin/end-season"){const configured=process.env.ADMIN_TOKEN,authorization=req.headers.authorization;if(!configured||authorization!==`Bearer ${configured}`)return json(res,403,{error:"Forbidden"});const result=game.forceEndSeason();announceSettlements(result.settlements);broadcastSeasonEnd(result.number);broadcast();await saveState();return json(res,200,{seasonNumber:result.number});}
  if(req.method!=="GET")return json(res,404,{error:"Not found"});
  const name=url.pathname==="/"?"index.html":url.pathname.slice(1);if(name.includes(".."))throw new Error("Invalid path");const data=await readFile(join(root,name));res.writeHead(200,{"content-type":extname(name)===".css"?"text/css":extname(name)===".js"?"text/javascript":"text/html"});res.end(data);
}catch(e){if(req.url?.startsWith("/api/")||req.url?.startsWith("/admin/"))json(res,e instanceof GameError?400:500,{error:e instanceof Error?e.message:"Invalid request"});else{res.writeHead(404);res.end("Not found");}}});
const wss=new WebSocketServer({server:http});
const send=(ws:WebSocket,m:ServerMessage)=>{if(ws.readyState===ws.OPEN)ws.send(JSON.stringify(m));};
let pending=false;
const broadcast=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;const publicState=game.publicState();for(const ws of wss.clients)send(ws,{type:"STATE",publicState});},100);};
const priv=(ws:WebSocket,pid:string,message?:string)=>send(ws,message?{type:"PRIVATE",privateState:game.privateState(pid),message}:{type:"PRIVATE",privateState:game.privateState(pid)});
const announcement=(message:string)=>{for(const ws of wss.clients)send(ws,{type:"ANNOUNCEMENT",message});};
const announceSettlements=(notes:string[])=>{for(const note of notes)announcement(note);};
const broadcastSeasonEnd=(number:number)=>{for(const ws of wss.clients){send(ws,{type:"SEASON_END",number});const pid=sessions.get(ws);if(pid&&game.players.has(pid))priv(ws,pid);}};
wss.on("connection",ws=>{send(ws,{type:"STATE",publicState:game.publicState()});ws.on("close",()=>sessions.delete(ws));ws.on("message",raw=>{try{
  const msg=JSON.parse(raw.toString()) as ClientMessage;
  if(msg.type==="AUTH"){const auth=game.authenticate(msg.token);sessions.set(ws,auth.account.id);send(ws,{type:"AUTH_OK",playerId:auth.account.id,needsCharacter:!auth.player});if(auth.player)send(ws,{type:"WELCOME",playerId:auth.player.id,privateState:game.privateState(auth.player.id)});return;}
  const pid=sessions.get(ws);if(!pid)throw new GameError("Authenticate first");
  if(msg.type==="JOIN"){const p=game.join(pid,msg.characterId);send(ws,{type:"WELCOME",playerId:p.id,privateState:game.privateState(p.id)});broadcast();return;}
  if(!game.players.has(pid))throw new GameError("Choose a character first");
  if(msg.type==="PING"){send(ws,{type:"PONG",ts:Date.now()});return;}
  let note:string|undefined;if(msg.type==="OPEN_BOX")note=`Opened ${game.openBox(pid).name}`;else if(msg.type==="LIST_ITEM")game.list(pid,msg.itemId,msg.durationSec);else if(msg.type==="BID")game.bid(pid,msg.auctionId,msg.amount);else if(msg.type==="FULFILL_ORDER"){game.fulfill(pid,msg.orderId,msg.itemIds);note="Order fulfilled";}else if(msg.type==="USE_ABILITY")note=game.useAbility(pid,msg);priv(ws,pid,note);broadcast();
}catch(e){send(ws,{type:"ERROR",message:e instanceof Error?e.message:"Invalid message"});}})});
setInterval(()=>{const notes=game.settle();if(notes.length){for(const ws of wss.clients){const pid=sessions.get(ws);if(pid&&game.players.has(pid))priv(ws,pid);}announceSettlements(notes);broadcast();}},250);
setInterval(()=>{const result=game.tickSeason();if(result.warning)announcement("Season ends in 5 minutes! Live auctions will be settled.");if(result.ended){announceSettlements(result.settlements);broadcastSeasonEnd(result.ended);broadcast();}},250);
setInterval(()=>{const n=game.promote();if(n){announcement(n);broadcast();}},15*60*1000);
http.listen(port,()=>console.log(`Bid House listening on http://localhost:${port}`));
let shuttingDown=false;async function shutdown(){if(shuttingDown)return;shuttingDown=true;try{await saveState();}catch(e){console.error("Failed to save state during shutdown",e);}http.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();}
process.on("SIGINT",()=>void shutdown());process.on("SIGTERM",()=>void shutdown());
export {http,game,saveState};

function json(res:ServerResponse,status:number,body:unknown):void{res.writeHead(status,{"content-type":"application/json"});res.end(JSON.stringify(body));}
async function jsonBody(req:IncomingMessage):Promise<Record<string,unknown>>{let raw="";for await(const chunk of req){raw+=String(chunk);if(raw.length>16_384)throw new GameError("Request body too large");}try{return JSON.parse(raw) as Record<string,unknown>;}catch{throw new GameError("Invalid JSON");}}
function stringField(body:Record<string,unknown>,key:string):string{const value=body[key];if(typeof value!=="string")throw new GameError(`${key} must be a string`);return value;}
