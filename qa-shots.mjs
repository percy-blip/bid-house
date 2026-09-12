import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const BASE=process.env.QA_BASE_URL??"http://localhost:3000",user="qa"+Date.now().toString(36),pass="qapassword123",opt={timeout:8000};
const shots="qa-shots";await mkdir(shots,{recursive:true});
const errors=[];
function watch(page,label){page.on("pageerror",e=>errors.push(`${label} pageerror: ${e.message}`));page.on("console",m=>{if(m.type()==="error")errors.push(`${label} console: ${m.text()}`);});}
async function visible(page,selector,label){await page.locator(selector).waitFor({state:"visible",...opt});console.log(`assert visible: ${label}`);}
async function integrity(page,label){
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  if(overflow)throw new Error(`${label}: horizontal overflow ${await page.evaluate(()=>document.documentElement.scrollWidth+" > "+document.documentElement.clientWidth)}`);
  const broken=await page.locator("img").evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute("src")));
  if(broken.length)throw new Error(`${label}: broken images ${broken.join(", ")}`);
  console.log(`assert integrity: ${label} (no overflow, no broken images)`);
}
async function shotTab(page,tab,size,index){
  const link=page.locator(`[data-nav="${tab}"]`);await (size==="mobile"?link.last():link.first()).click(opt);
  await visible(page,`#${tab}Tab`,`${size} ${tab} tab`);
  await page.waitForTimeout(150);
  await integrity(page,`${size} ${tab}`);
  await page.screenshot({path:`${shots}/${String(index).padStart(2,"0")}-${tab}-${size}.png`,fullPage:true});
}
const browser=await chromium.launch();
try{
  const desktopCtx=await browser.newContext({viewport:{width:1440,height:900}}),page=await desktopCtx.newPage();watch(page,"desktop");
  await page.goto(BASE,{waitUntil:"networkidle"});await visible(page,"#accountView","desktop auth");await page.screenshot({path:`${shots}/01-auth-desktop.png`});
  await page.click("#accountToggle",opt);await page.fill("#username",user);await page.fill("#password",pass);await page.click("#accountSubmit");
  await visible(page,"#characterView","first-pick carousel");await page.screenshot({path:`${shots}/02-first-pick-desktop.png`});
  await page.click("#confirmCharacter",opt);await visible(page,"[data-first-house]","first house choice");await page.locator("[data-first-house]").first().click(opt);
  await visible(page,"#bidderTab","post-pick Bidder landing");await page.waitForFunction(()=>document.querySelectorAll(".deployment-card").length===1,undefined,opt);
  for(const [i,tab] of ["bidder","inventory","order","market","house"].entries())await shotTab(page,tab,"desktop",3+i);
  await page.locator('[data-nav="inventory"]').first().click();await page.click("#openBox",opt);await visible(page,"#boxReveal","box reveal");await page.screenshot({path:`${shots}/08-box-reveal-desktop.png`});await page.click("#skipReveal");
  await visible(page,".item-card","populated inventory");await integrity(page,"populated inventory");await page.screenshot({path:`${shots}/09-inventory-populated-desktop.png`,fullPage:true});
  await page.locator('[data-nav="house"]').first().click();if(!await page.locator(".hall-layout").isVisible()){await page.locator("#houseTab [data-enter]").first().click();}await visible(page,".hall-layout","desktop house floor");await integrity(page,"desktop house floor");await page.screenshot({path:`${shots}/10-house-floor-desktop.png`,fullPage:true});
  await page.locator('[data-nav="market"]').first().click();await page.locator("[data-template]").first().click();await visible(page,".market-detail","market template detail");await page.screenshot({path:`${shots}/11-market-detail-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  for(const [i,tab] of ["bidder","inventory","order","market","house"].entries())await shotTab(page,tab,"mobile",12+i);
  await page.locator('[data-nav="house"]').last().click();const enter=page.locator("#houseTab [data-enter]").first();if(await enter.isVisible())await enter.click();await visible(page,".hall-layout","mobile house floor");await integrity(page,"mobile house floor");await page.screenshot({path:`${shots}/17-house-floor-mobile.png`,fullPage:true});
  const mobileCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),mobile=await mobileCtx.newPage();watch(mobile,"mobile-auth");await mobile.goto(BASE,{waitUntil:"networkidle"});await visible(mobile,"#accountView","mobile auth");await integrity(mobile,"mobile auth");await mobile.screenshot({path:`${shots}/18-auth-mobile.png`});await mobileCtx.close();
  await desktopCtx.close();
}finally{await browser.close();}
if(errors.length)throw new Error(`JavaScript errors:\n${errors.join("\n")}`);
console.log("QA PASS: 5 tabs desktop + mobile; empty/populated inventory; market detail; house floor");
console.log("JS errors: 0; broken images: 0; horizontal overflow: 0");
