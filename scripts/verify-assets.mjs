import { readFile, readdir, writeFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { resolve, relative, sep } from 'node:path';

const root=resolve('client-assets');
const expectedIcons=['logo','coin','fame','xp','box-basic','box-fine','order','gavel','featured','peek','shield','refund','tax','block','appraise','coin-ability','cooldown','skull','heat-1','heat-2','heat-3','heat-4','heat-5','timer','bid','list'].map(x=>`icons/${x}.svg`);
const expectedSigils=['sigil-base','glyph-gavel','glyph-gem','glyph-coin','glyph-star','glyph-mask','glyph-key','glyph-flame','glyph-book','glyph-crown','glyph-anchor','glyph-moon','glyph-comet'].map(x=>`sigils/${x}.svg`);
const expectedFrames=['t1','t2','t3','t4','ribbon-fake-owner','seal-appraised'].map(x=>`frames/${x}.svg`);
const expectedItems=['art','relic','tech','fashion','oddity'].flatMap(c=>[1,2,3,4].map(t=>`items/art-${c}-${t}.png`));
const expectedCharacters=['mara','brick','june','rex','nia','sol'].map(x=>`characters/${x}.png`);
const expected=[...expectedIcons,...expectedSigils,...expectedFrames,...expectedItems,...expectedCharacters];

const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
function decodePng(buf){
  if(buf.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw Error('not a PNG');
  let p=8,w,h,depth,type,interlace,idats=[];
  while(p<buf.length){const n=buf.readUInt32BE(p),name=buf.toString('ascii',p+4,p+8),data=buf.subarray(p+8,p+8+n);p+=12+n;if(name==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];type=data[9];interlace=data[12]}if(name==='IDAT')idats.push(data);if(name==='IEND')break}
  if(depth!==8||![2,6].includes(type)||interlace!==0) throw Error(`unsupported PNG format depth=${depth} type=${type} interlace=${interlace}`);
  const channels=type===6?4:3,stride=w*channels,raw=inflateSync(Buffer.concat(idats)),pixels=Buffer.alloc(w*h*4);let prev=Buffer.alloc(stride),off=0;
  for(let y=0;y<h;y++){const filter=raw[off++],row=Buffer.from(raw.subarray(off,off+stride));off+=stride;for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=prev[x],c=x>=channels?prev[x-channels]:0;row[x]=(row[x]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):(()=>{throw Error(`bad PNG filter ${filter}`)})()))&255}for(let x=0;x<w;x++){const s=x*channels,d=(y*w+x)*4;pixels[d]=row[s];pixels[d+1]=row[s+1];pixels[d+2]=row[s+2];pixels[d+3]=channels===4?row[s+3]:255}prev=row}
  return {w,h,pixels};
}
function pngMetrics(buf,file){
  const {w,h,pixels}=decodePng(buf);let opaque=0,magenta=0,min=255,max=0,edgeOpaque=0;
  for(let i=0;i<w*h;i++){const o=i*4,r=pixels[o],g=pixels[o+1],b=pixels[o+2],a=pixels[o+3];if(a>8){opaque++;min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);if(r>220&&g<45&&b>220)magenta++;const x=i%w,y=Math.floor(i/w);if(x<2||y<2||x>=w-2||y>=h-2)edgeOpaque++}}
  const alphaCoverage=opaque/(w*h),magentaResidual=opaque?magenta/opaque:0,colorSpread=max-min,target=file.startsWith('items/')?256:512;
  return {dims:`${w}x${h}`,alphaCoverage:+alphaCoverage.toFixed(6),magentaResidual:+magentaResidual.toFixed(8),colorSpread,ok:w===target&&h===target&&alphaCoverage>.10&&alphaCoverage<.90&&magentaResidual<=.0001&&colorSpread>30&&edgeOpaque===0};
}
async function inspect(file){
  const buf=await readFile(resolve(root,...file.split('/')));
  if(file.endsWith('.png')) return {file,track:'imagegen',...pngMetrics(buf,file)};
  const s=buf.toString('utf8'),view=s.match(/viewBox="([^"]+)"/)?.[1],valid=/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(s)&&s.trim().endsWith('</svg>')&&view;
  const dims=view==='0 0 96 120'?'96x120':view==='0 0 24 24'?'24x24':'invalid';
  return {file,track:'svg',dims,alphaCoverage:0,magentaResidual:0,colorSpread:0,ok:Boolean(valid&&dims!=='invalid'&&/stroke-width="1\.5"/.test(s))};
}
const actual=[];for(const top of ['icons','sigils','frames','items','characters'])for(const name of await readdir(resolve(root,top)))if(/\.(svg|png)$/.test(name))actual.push(`${top}/${name}`);
const missing=expected.filter(x=>!actual.includes(x)),unexpected=actual.filter(x=>!expected.includes(x));
const rows=[];for(const file of expected.filter(x=>actual.includes(x)))try{rows.push(await inspect(file))}catch(e){rows.push({file,track:file.endsWith('.svg')?'svg':'imagegen',dims:'error',alphaCoverage:0,magentaResidual:1,colorSpread:0,ok:false,error:e.message})}
if(process.argv.includes('--write'))await writeFile(resolve(root,'manifest.json'),JSON.stringify(rows,null,2)+'\n');
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const mismatch=JSON.stringify(manifest)!==JSON.stringify(rows);
const failed=rows.filter(x=>!x.ok);
console.log(JSON.stringify({expected:expected.length,svg:rows.filter(x=>x.track==='svg').length,imagegen:rows.filter(x=>x.track==='imagegen').length,missing,unexpected,failed:failed.map(x=>x.file),manifestMatches:!mismatch},null,2));
if(missing.length||unexpected.length||failed.length||mismatch)process.exitCode=1;

